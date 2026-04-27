import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/dexie'
import { dayTypeLabel, formatDate, formatTime } from '../lib/dayType'

export default function History() {
  const workouts = useLiveQuery(
    () => db.workouts.orderBy('startedAt').reverse().toArray(),
    []
  )
  const allEntries = useLiveQuery(() => db.entries.toArray(), [])
  const allSets = useLiveQuery(() => db.sets.toArray(), [])

  const setsByEntry = (() => {
    const m = new Map<number, number>()
    for (const s of allSets ?? []) m.set(s.entryId, (m.get(s.entryId) ?? 0) + 1)
    return m
  })()
  const entriesByWorkout = (() => {
    const m = new Map<number, number[]>()
    for (const e of allEntries ?? []) {
      if (!m.has(e.workoutId)) m.set(e.workoutId, [])
      m.get(e.workoutId)!.push(e.id!)
    }
    return m
  })()

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-slate-400 text-sm">All your sessions, newest first.</p>
      </header>

      {!workouts || workouts.length === 0 ? (
        <div className="card text-center text-slate-400 text-sm py-8">
          No sessions yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {workouts.map((w) => {
            const entryIds = entriesByWorkout.get(w.id!) ?? []
            const totalSets = entryIds.reduce((sum, id) => sum + (setsByEntry.get(id) ?? 0), 0)
            return (
              <li key={w.id}>
                <Link to={`/history/${w.id}`} className="card flex items-center justify-between">
                  <div>
                    <div className="font-medium">{dayTypeLabel(w.dayType)}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {formatDate(w.date)} · {formatTime(w.startedAt)}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {entryIds.length} exercises · {totalSets} sets
                      {!w.finishedAt && <span className="text-accent ml-2">(ongoing)</span>}
                    </div>
                  </div>
                  <span className="text-slate-500">›</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
