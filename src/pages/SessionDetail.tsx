import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import { db } from '../db/dexie'
import { dayTypeLabel, formatDate, formatTime } from '../lib/dayType'
import { formatDurationSeconds } from '../lib/formatDuration'
import { isTimeExercise, setIsTimeHold } from '../lib/exerciseLog'

export default function SessionDetail() {
  const { id } = useParams()
  const workoutId = Number(id)

  const workout = useLiveQuery(() => db.workouts.get(workoutId), [workoutId])
  const entries = useLiveQuery(
    () =>
      db.entries
        .where('workoutId')
        .equals(workoutId)
        .toArray()
        .then((arr) => arr.sort((a, b) => a.position - b.position)),
    [workoutId]
  )
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const sets = useLiveQuery(async () => {
    if (!entries || entries.length === 0) return []
    return db.sets.where('entryId').anyOf(entries.map((e) => e.id!)).toArray()
  }, [entries])

  if (!workout) {
    return <p className="text-slate-400">Loading…</p>
  }

  const exerciseById = new Map(exercises?.map((e) => [e.id!, e]) ?? [])

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <Link to="/history" className="text-sm text-accent">
          ← History
        </Link>
        <h1 className="text-xl font-bold mt-1">{dayTypeLabel(workout.dayType)}</h1>
        <p className="text-xs text-slate-400">
          {formatDate(workout.date)} · {formatTime(workout.startedAt)}
          {workout.finishedAt && <> – {formatTime(workout.finishedAt)}</>}
        </p>
        {!workout.finishedAt && (
          <Link to={`/session/${workout.id}`} className="btn-primary mt-3 inline-flex">
            Resume session
          </Link>
        )}
      </header>

      {entries && entries.length === 0 ? (
        <div className="card text-slate-400 text-sm">No exercises logged.</div>
      ) : (
        <ul className="space-y-3">
          {entries?.map((entry) => {
            const exercise = exerciseById.get(entry.exerciseId)
            const timeMode = isTimeExercise(exercise)
            const entrySets = (sets ?? [])
              .filter((s) => s.entryId === entry.id)
              .sort((a, b) => a.setNumber - b.setNumber)
            const topKg = entrySets.reduce((m, s) => Math.max(m, s.weight), 0)
            const topSec = entrySets.reduce((m, s) => Math.max(m, s.durationSeconds ?? 0), 0)
            return (
              <li key={entry.id} className="card">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="chip-accent">#{entry.position}</span>
                  <h3 className="font-semibold">{exercise?.name ?? 'Unknown'}</h3>
                  {timeMode && topSec > 0 && (
                    <span className="chip">Best hold: {formatDurationSeconds(topSec)}</span>
                  )}
                  {!timeMode && topKg > 0 && <span className="chip">Top: {topKg} kg</span>}
                </div>
                {entrySets.length === 0 ? (
                  <p className="text-slate-400 text-sm">No sets logged.</p>
                ) : (
                  <ul className="space-y-1">
                    {entrySets.map((s) => (
                      <li key={s.id} className="text-sm flex justify-between">
                        <span className="text-slate-400">
                          {timeMode ? 'Hold' : 'Set'} {s.setNumber}
                        </span>
                        <span>
                          {setIsTimeHold(s) ? (
                            <span className="font-semibold">{formatDurationSeconds(s.durationSeconds!)}</span>
                          ) : (
                            <>
                              <span className="font-semibold">{s.weight}</span>
                              <span className="text-slate-400"> kg × </span>
                              <span className="font-semibold">{s.reps}</span>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
