import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { ALL_DAY_TYPES, db, DayType } from '../db/dexie'
import { dayTypeForWeekday, dayTypeLabel, formatDate, todayIsoDate } from '../lib/dayType'

export default function Home() {
  const navigate = useNavigate()
  const today = new Date()
  const detected = dayTypeForWeekday(today.getDay())
  const [selectedDay, setSelectedDay] = useState<DayType>(detected ?? 'Chest+Biceps+Abs')

  const recent = useLiveQuery(
    () => db.workouts.orderBy('startedAt').reverse().limit(5).toArray(),
    []
  )

  const ongoing = useLiveQuery(
    () => db.workouts.filter((w) => !w.finishedAt).first(),
    []
  )

  async function startSession() {
    const id = await db.workouts.add({
      date: todayIsoDate(),
      dayType: selectedDay,
      startedAt: Date.now()
    })
    navigate(`/session/${id}`)
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">
          {today.toLocaleDateString(undefined, { weekday: 'long' })}
        </h1>
        <p className="text-slate-400 text-sm">
          {today.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </header>

      {ongoing && (
        <div className="card border-accent/40 bg-accent/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-accent uppercase tracking-wide font-semibold">
                Ongoing session
              </div>
              <div className="font-medium">{dayTypeLabel(ongoing.dayType)}</div>
              <div className="text-xs text-slate-400">{formatDate(ongoing.date)}</div>
            </div>
            <Link to={`/session/${ongoing.id}`} className="btn-primary">
              Resume
            </Link>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Today's workout</h2>
          {detected ? (
            <span className="chip-accent">Auto-detected</span>
          ) : (
            <span className="chip">No default for today</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_DAY_TYPES.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`p-3 rounded-xl text-sm text-left border transition ${
                selectedDay === d
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-bg border-border text-slate-200'
              }`}
            >
              {dayTypeLabel(d)}
            </button>
          ))}
        </div>
        <button onClick={startSession} className="btn-primary w-full text-base">
          Start session
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent sessions</h2>
          <Link to="/history" className="text-sm text-accent">
            See all
          </Link>
        </div>
        {!recent || recent.length === 0 ? (
          <p className="text-slate-400 text-sm">No workouts yet — start your first session above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((w) => (
              <li key={w.id}>
                <Link
                  to={`/history/${w.id}`}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="font-medium">{dayTypeLabel(w.dayType)}</div>
                    <div className="text-xs text-slate-400">{formatDate(w.date)}</div>
                  </div>
                  <span className="text-slate-500">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
