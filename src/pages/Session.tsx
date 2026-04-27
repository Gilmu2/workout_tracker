import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, Entry, Exercise, SetLog } from '../db/dexie'
import { dayTypeLabel, formatDate } from '../lib/dayType'
import { formatDurationSeconds } from '../lib/formatDuration'
import { isTimeExercise, setIsTimeHold } from '../lib/exerciseLog'
import SetLogger from '../components/SetLogger'
import ExercisePicker from '../components/ExercisePicker'

export default function Session() {
  const { id } = useParams()
  const workoutId = Number(id)
  const navigate = useNavigate()

  const workout = useLiveQuery(() => db.workouts.get(workoutId), [workoutId])
  const allExercises = useLiveQuery(() => db.exercises.toArray(), [])
  const entries = useLiveQuery(
    () =>
      db.entries
        .where('workoutId')
        .equals(workoutId)
        .toArray()
        .then((arr) => arr.sort((a, b) => a.position - b.position)),
    [workoutId]
  )
  const sets = useLiveQuery(async () => {
    if (!entries || entries.length === 0) return [] as SetLog[]
    return db.sets.where('entryId').anyOf(entries.map((e) => e.id!)).toArray()
  }, [entries])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [swapTarget, setSwapTarget] = useState<Entry | null>(null)
  /** entry ids whose card body is collapsed (header + expand stays visible) */
  const [collapsedEntryIds, setCollapsedEntryIds] = useState<Set<number>>(() => new Set())

  const exerciseById = useMemo(() => {
    const m = new Map<number, Exercise>()
    if (allExercises) for (const e of allExercises) if (e.id !== undefined) m.set(e.id, e)
    return m
  }, [allExercises])

  // Suggest seeded exercises for this day type that aren't yet in the session
  const suggestedDefaults = useMemo(() => {
    if (!workout || !allExercises) return [] as Exercise[]
    const usedIds = new Set((entries ?? []).map((e) => e.exerciseId))
    return allExercises
      .filter((e) => !e.archived && e.defaultForDays.includes(workout.dayType))
      .filter((e) => e.id !== undefined && !usedIds.has(e.id))
      .sort((a, b) => (a.defaultOrder ?? 99) - (b.defaultOrder ?? 99))
  }, [workout, allExercises, entries])

  function toggleCollapsed(entryId: number) {
    setCollapsedEntryIds((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  if (!workout) {
    return <p className="text-slate-400">Loading…</p>
  }

  async function addExerciseToSession(exercise: Exercise) {
    if (exercise.id === undefined) return
    const nextPosition = (entries?.length ?? 0) + 1
    await db.entries.add({
      workoutId,
      exerciseId: exercise.id,
      position: nextPosition,
      createdAt: Date.now()
    })
  }

  async function swapExercise(entry: Entry, replacement: Exercise) {
    if (replacement.id === undefined) return
    await db.entries.update(entry.id!, { exerciseId: replacement.id })
  }

  async function deleteEntry(entry: Entry) {
    if (!confirm(`Remove ${exerciseById.get(entry.exerciseId)?.name ?? 'exercise'} from this session?`)) return
    await db.transaction('rw', db.entries, db.sets, async () => {
      await db.sets.where('entryId').equals(entry.id!).delete()
      await db.entries.delete(entry.id!)
      // Re-pack positions
      const remaining = await db.entries
        .where('workoutId')
        .equals(workoutId)
        .toArray()
        .then((arr) => arr.sort((a, b) => a.position - b.position))
      for (let i = 0; i < remaining.length; i++) {
        await db.entries.update(remaining[i].id!, { position: i + 1 })
      }
    })
    setCollapsedEntryIds((prev) => {
      const next = new Set(prev)
      next.delete(entry.id!)
      return next
    })
  }

  async function moveEntry(entry: Entry, direction: -1 | 1) {
    if (!entries) return
    const idx = entries.findIndex((e) => e.id === entry.id)
    const swapWith = entries[idx + direction]
    if (!swapWith) return
    await db.transaction('rw', db.entries, async () => {
      await db.entries.update(entry.id!, { position: swapWith.position })
      await db.entries.update(swapWith.id!, { position: entry.position })
    })
  }

  async function addSetWeightReps(entry: Entry, weight: number, reps: number) {
    const existing = (sets ?? []).filter((s) => s.entryId === entry.id)
    await db.sets.add({
      entryId: entry.id!,
      setNumber: existing.length + 1,
      weight,
      reps,
      createdAt: Date.now()
    })
  }

  async function addSetTime(entry: Entry, durationSeconds: number) {
    const existing = (sets ?? []).filter((s) => s.entryId === entry.id)
    await db.sets.add({
      entryId: entry.id!,
      setNumber: existing.length + 1,
      weight: 0,
      reps: 0,
      durationSeconds: Math.max(1, Math.round(durationSeconds)),
      createdAt: Date.now()
    })
  }

  async function deleteSet(setId: number) {
    const target = (sets ?? []).find((s) => s.id === setId)
    if (!target) return
    await db.transaction('rw', db.sets, async () => {
      await db.sets.delete(setId)
      const siblings = await db.sets
        .where('entryId')
        .equals(target.entryId)
        .toArray()
        .then((arr) => arr.sort((a, b) => a.setNumber - b.setNumber))
      for (let i = 0; i < siblings.length; i++) {
        await db.sets.update(siblings[i].id!, { setNumber: i + 1 })
      }
    })
  }

  async function finishSession() {
    await db.workouts.update(workoutId, { finishedAt: Date.now() })
    navigate('/history')
  }

  async function deleteSession() {
    if (!confirm('Delete this entire session and all its sets? This cannot be undone.')) return
    await db.transaction('rw', db.workouts, db.entries, db.sets, async () => {
      const entryIds = (await db.entries.where('workoutId').equals(workoutId).toArray()).map(
        (e) => e.id!
      )
      if (entryIds.length > 0) await db.sets.where('entryId').anyOf(entryIds).delete()
      await db.entries.where('workoutId').equals(workoutId).delete()
      await db.workouts.delete(workoutId)
    })
    navigate('/')
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3 pt-2">
        <div>
          <Link to="/" className="text-sm text-accent">
            ← Home
          </Link>
          <h1 className="text-xl font-bold mt-1">{dayTypeLabel(workout.dayType)}</h1>
          <p className="text-xs text-slate-400">{formatDate(workout.date)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {!workout.finishedAt ? (
            <button onClick={finishSession} className="btn-primary text-sm py-2">
              Finish
            </button>
          ) : (
            <span className="chip-accent">Finished</span>
          )}
          <button onClick={deleteSession} className="text-xs text-danger">
            Delete session
          </button>
        </div>
      </header>

      {entries && entries.length === 0 && (
        <div className="card text-sm text-slate-400">
          {suggestedDefaults.length > 0
            ? 'Tap a suggested exercise below to start, or use "+ Add exercise".'
            : 'Use "+ Add exercise" to start logging sets.'}
        </div>
      )}

      <ul className="space-y-3">
        {entries?.map((entry, idx) => {
          const exercise = exerciseById.get(entry.exerciseId)
          if (!exercise) return null
          const entrySets = (sets ?? [])
            .filter((s) => s.entryId === entry.id)
            .sort((a, b) => a.setNumber - b.setNumber)
          const lastSet = entrySets[entrySets.length - 1]
          const timeMode = isTimeExercise(exercise)
          const collapsed = collapsedEntryIds.has(entry.id!)

          let summary = ''
          if (entrySets.length === 0) summary = 'No sets yet'
          else if (timeMode) {
            const bestSec = entrySets.reduce(
              (m, s) => Math.max(m, s.durationSeconds ?? 0),
              0
            )
            summary = `${entrySets.length} hold${entrySets.length !== 1 ? 's' : ''}${
              bestSec > 0 ? ` · best ${formatDurationSeconds(bestSec)}` : ''
            }`
          } else {
            const topKg = entrySets.reduce((m, s) => Math.max(m, s.weight), 0)
            summary = `${entrySets.length} set${entrySets.length !== 1 ? 's' : ''}${
              topKg > 0 ? ` · top ${topKg} kg` : ''
            }`
          }

          return (
            <li key={entry.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => entry.id !== undefined && toggleCollapsed(entry.id)}
                  className="flex-1 text-left min-w-0"
                  aria-expanded={!collapsed}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="chip-accent">#{entry.position}</span>
                    <h3 className="font-semibold text-base">{exercise.name}</h3>
                    {timeMode && <span className="chip text-[10px]">time</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{exercise.muscleGroup}</p>
                  {collapsed && (
                    <p className="text-xs text-slate-500 mt-2 truncate">{summary}</p>
                  )}
                </button>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => entry.id !== undefined && toggleCollapsed(entry.id)}
                    className="text-xs text-accent px-2 py-1 rounded-lg border border-accent/30"
                  >
                    {collapsed ? 'Expand' : 'Minimize'}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveEntry(entry, -1)}
                      disabled={idx === 0}
                      className="stepper-btn !w-9 !h-9 !text-base disabled:opacity-30"
                      aria-label="move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveEntry(entry, 1)}
                      disabled={idx === (entries?.length ?? 0) - 1}
                      className="stepper-btn !w-9 !h-9 !text-base disabled:opacity-30"
                      aria-label="move down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>

              {!collapsed && (
                <>
                  {entrySets.length > 0 && (
                    <ul className="space-y-1.5">
                      {entrySets.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between bg-bg border border-border rounded-lg px-3 py-2"
                        >
                          <div className="text-sm">
                            <span className="text-slate-400 mr-2">
                              {timeMode ? 'Hold' : 'Set'} {s.setNumber}
                            </span>
                            {setIsTimeHold(s) ? (
                              <span className="font-semibold">{formatDurationSeconds(s.durationSeconds!)}</span>
                            ) : (
                              <>
                                <span className="font-semibold">{s.weight}</span>
                                <span className="text-slate-400"> kg × </span>
                                <span className="font-semibold">{s.reps}</span>
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => deleteSet(s.id!)}
                            className="text-xs text-danger px-2 py-1"
                            aria-label="delete set"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {timeMode ? (
                    <SetLogger
                      key={`logger-t-${entry.id}-${entrySets.length}`}
                      mode="time"
                      initialSeconds={lastSet?.durationSeconds && lastSet.durationSeconds > 0 ? lastSet.durationSeconds : 60}
                      onAdd={(sec) => addSetTime(entry, sec)}
                    />
                  ) : (
                    <SetLogger
                      key={`logger-w-${entry.id}-${entrySets.length}`}
                      mode="weight_reps"
                      initialWeight={lastSet?.weight ?? 0}
                      initialReps={lastSet?.reps ?? 8}
                      onAdd={(w, r) => addSetWeightReps(entry, w, r)}
                    />
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => setSwapTarget(entry)}
                      className="text-accent"
                    >
                      Swap exercise…
                    </button>
                    <button onClick={() => deleteEntry(entry)} className="text-danger">
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>

      {suggestedDefaults.length > 0 && (
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Suggested for {dayTypeLabel(workout.dayType)}
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedDefaults.map((e) => (
              <button
                key={e.id}
                onClick={() => addExerciseToSession(e)}
                className="chip hover:border-accent hover:text-accent"
              >
                + {e.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setPickerOpen(true)}
        className="btn-secondary w-full"
      >
        + Add exercise
      </button>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        exercises={allExercises ?? []}
        excludeIds={(entries ?? []).map((e) => e.exerciseId)}
        onPick={addExerciseToSession}
      />

      <ExercisePicker
        open={swapTarget !== null}
        onClose={() => setSwapTarget(null)}
        exercises={allExercises ?? []}
        highlightAlternatesOf={
          swapTarget ? exerciseById.get(swapTarget.exerciseId) : undefined
        }
        excludeIds={(entries ?? [])
          .filter((e) => e.id !== swapTarget?.id)
          .map((e) => e.exerciseId)}
        onPick={(replacement) => {
          if (swapTarget) swapExercise(swapTarget, replacement)
        }}
        title="Swap to alternate"
      />
    </div>
  )
}
