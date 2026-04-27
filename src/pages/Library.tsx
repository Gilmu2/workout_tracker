import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ALL_DAY_TYPES, db, DayType, Exercise, ExerciseLogType } from '../db/dexie'
import { dayTypeLabel } from '../lib/dayType'

export default function Library() {
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<string>('All')

  const grouped = useMemo(() => {
    const groups = new Map<string, Exercise[]>()
    for (const e of exercises ?? []) {
      if (e.archived) continue
      if (filter !== 'All' && e.muscleGroup !== filter) continue
      if (!groups.has(e.muscleGroup)) groups.set(e.muscleGroup, [])
      groups.get(e.muscleGroup)!.push(e)
    }
    for (const list of groups.values()) list.sort((a, b) => a.name.localeCompare(b.name))
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [exercises, filter])

  const muscleGroups = useMemo(() => {
    const set = new Set<string>()
    for (const e of exercises ?? []) if (!e.archived) set.add(e.muscleGroup)
    return ['All', ...Array.from(set).sort()]
  }, [exercises])

  return (
    <div className="space-y-4">
      <header className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-slate-400 text-sm">Add new exercises or edit alternates.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary text-sm">
          + New
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {muscleGroups.map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border ${
              filter === g
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-card border-border text-slate-300'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="card text-slate-400 text-sm text-center py-6">No exercises.</div>
      ) : (
        grouped.map(([group, items]) => (
          <div key={group} className="card">
            <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-2">{group}</h2>
            <ul className="divide-y divide-border">
              {items.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setEditing(e)}
                    className="w-full text-left py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        {e.name}
                        {e.logType === 'time' && (
                          <span className="chip text-[10px] py-0">time</span>
                        )}
                      </div>
                      {e.alternates.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          alts: {e.alternates.join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="text-slate-500">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {(editing || adding) && (
        <ExerciseEditor
          exercise={editing}
          onClose={() => {
            setEditing(null)
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function ExerciseEditor({
  exercise,
  onClose
}: {
  exercise: Exercise | null
  onClose: () => void
}) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscleGroup ?? 'Chest')
  const [alternates, setAlternates] = useState((exercise?.alternates ?? []).join(', '))
  const [defaultForDays, setDefaultForDays] = useState<DayType[]>(
    exercise?.defaultForDays ?? []
  )
  const [logType, setLogType] = useState<ExerciseLogType>(exercise?.logType ?? 'weight_reps')

  function toggleDay(d: DayType) {
    setDefaultForDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  async function save() {
    const altList = alternates
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!name.trim()) return
    if (exercise?.id !== undefined) {
      await db.exercises.update(exercise.id, {
        name: name.trim(),
        muscleGroup: muscleGroup.trim(),
        alternates: altList,
        defaultForDays,
        logType
      })
    } else {
      await db.exercises.add({
        name: name.trim(),
        muscleGroup: muscleGroup.trim(),
        alternates: altList,
        defaultForDays,
        logType
      })
    }
    onClose()
  }

  async function archive() {
    if (!exercise?.id) return
    if (!confirm(`Archive ${exercise.name}? It will be hidden but past data is preserved.`)) return
    await db.exercises.update(exercise.id, { archived: true })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {exercise ? 'Edit exercise' : 'New exercise'}
          </h2>
          <button onClick={onClose} className="text-slate-400 px-2 py-1">
            Cancel
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
              Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
              Muscle group
            </label>
            <input
              type="text"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
              Log type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLogType('weight_reps')}
                className={`p-3 rounded-xl text-sm border ${
                  logType === 'weight_reps'
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-bg border-border text-slate-200'
                }`}
              >
                Weight + reps
              </button>
              <button
                type="button"
                onClick={() => setLogType('time')}
                className={`p-3 rounded-xl text-sm border ${
                  logType === 'time'
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-bg border-border text-slate-200'
                }`}
              >
                Time (hold)
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Use time for planks and other holds — no weight or rep count.
            </p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
              Alternates (comma-separated names)
            </label>
            <textarea
              value={alternates}
              onChange={(e) => setAlternates(e.target.value)}
              rows={2}
              className="input w-full"
              placeholder="Dips, Machine Chest Press"
            />
            <p className="text-xs text-slate-500 mt-1">
              These show as quick suggestions in the swap menu.
            </p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
              Default for day types
            </label>
            <div className="space-y-1.5">
              {ALL_DAY_TYPES.filter((d) => d !== 'Custom').map((d) => (
                <label
                  key={d}
                  className="flex items-center gap-2 p-2 rounded-lg bg-bg border border-border"
                >
                  <input
                    type="checkbox"
                    checked={defaultForDays.includes(d)}
                    onChange={() => toggleDay(d)}
                    className="accent-cyan-400"
                  />
                  <span className="text-sm">{dayTypeLabel(d)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary flex-1">
              Save
            </button>
            {exercise && (
              <button onClick={archive} className="btn-danger">
                Archive
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
