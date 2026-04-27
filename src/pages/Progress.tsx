import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { db } from '../db/dexie'
import { formatDurationSeconds } from '../lib/formatDuration'
import { isTimeExercise, setIsTimeHold } from '../lib/exerciseLog'

type FilterMode = 'any' | 'first'

interface WeightChartPoint {
  date: string
  topWeight: number
  estimated1RM: number
  position: number
  reps: number
}

interface TimeChartPoint {
  date: string
  topSeconds: number
  position: number
}

export default function Progress() {
  const exercises = useLiveQuery(
    () => db.exercises.filter((e) => !e.archived).toArray(),
    []
  )
  const workouts = useLiveQuery(() => db.workouts.toArray(), [])
  const entries = useLiveQuery(() => db.entries.toArray(), [])
  const sets = useLiveQuery(() => db.sets.toArray(), [])

  const [exerciseId, setExerciseId] = useState<number | ''>('')
  const [filterMode, setFilterMode] = useState<FilterMode>('any')

  const selectedExercise = useMemo(() => {
    if (!exerciseId || !exercises) return undefined
    return exercises.find((e) => e.id === exerciseId)
  }, [exerciseId, exercises])

  const timeMode = isTimeExercise(selectedExercise)

  const weightData: WeightChartPoint[] = useMemo(() => {
    if (!exerciseId || timeMode || !workouts || !entries || !sets) return []
    const workoutById = new Map(workouts.map((w) => [w.id!, w]))
    const relevantEntries = entries.filter((e) => e.exerciseId === exerciseId)
    const points: WeightChartPoint[] = []
    for (const entry of relevantEntries) {
      if (filterMode === 'first' && entry.position !== 1) continue
      const w = workoutById.get(entry.workoutId)
      if (!w) continue
      const entrySets = sets.filter((s) => s.entryId === entry.id && !setIsTimeHold(s))
      if (entrySets.length === 0) continue
      const top = entrySets.reduce(
        (best, s) =>
          s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best,
        entrySets[0]
      )
      const est1rm = top.weight * (1 + top.reps / 30)
      points.push({
        date: w.date,
        topWeight: top.weight,
        estimated1RM: Math.round(est1rm * 10) / 10,
        position: entry.position,
        reps: top.reps
      })
    }
    return points.sort((a, b) => a.date.localeCompare(b.date))
  }, [exerciseId, timeMode, filterMode, workouts, entries, sets])

  const timeData: TimeChartPoint[] = useMemo(() => {
    if (!exerciseId || !timeMode || !workouts || !entries || !sets) return []
    const workoutById = new Map(workouts.map((w) => [w.id!, w]))
    const relevantEntries = entries.filter((e) => e.exerciseId === exerciseId)
    const points: TimeChartPoint[] = []
    for (const entry of relevantEntries) {
      if (filterMode === 'first' && entry.position !== 1) continue
      const w = workoutById.get(entry.workoutId)
      if (!w) continue
      const entrySets = sets.filter((s) => s.entryId === entry.id && setIsTimeHold(s))
      if (entrySets.length === 0) continue
      const topSec = entrySets.reduce(
        (m, s) => Math.max(m, s.durationSeconds ?? 0),
        0
      )
      points.push({
        date: w.date,
        topSeconds: topSec,
        position: entry.position
      })
    }
    return points.sort((a, b) => a.date.localeCompare(b.date))
  }, [exerciseId, timeMode, filterMode, workouts, entries, sets])

  const prWeight = useMemo(() => {
    if (!exerciseId || timeMode || !sets || !entries) return null
    const entryIds = new Set(entries.filter((e) => e.exerciseId === exerciseId).map((e) => e.id!))
    const candidates = sets.filter((s) => entryIds.has(s.entryId) && !setIsTimeHold(s))
    if (candidates.length === 0) return null
    return candidates.reduce(
      (best, s) =>
        s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best,
      candidates[0]
    )
  }, [exerciseId, timeMode, sets, entries])

  const prTimeSeconds = useMemo(() => {
    if (!exerciseId || !timeMode || !sets || !entries) return null
    const entryIds = new Set(entries.filter((e) => e.exerciseId === exerciseId).map((e) => e.id!))
    const candidates = sets.filter((s) => entryIds.has(s.entryId) && setIsTimeHold(s))
    if (candidates.length === 0) return null
    return candidates.reduce(
      (best, s) => Math.max(best, s.durationSeconds ?? 0),
      0
    )
  }, [exerciseId, timeMode, sets, entries])

  const exercisesWithData = useMemo(() => {
    if (!exercises || !entries) return exercises ?? []
    const idsWithData = new Set(entries.map((e) => e.exerciseId))
    const withData = exercises.filter((e) => e.id !== undefined && idsWithData.has(e.id))
    const withoutData = exercises.filter((e) => e.id !== undefined && !idsWithData.has(e.id))
    return [...withData, ...withoutData]
  }, [exercises, entries])

  const activeData = timeMode ? timeData : weightData

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-slate-400 text-sm">Pick an exercise to see your trend.</p>
      </header>

      <div className="card space-y-3">
        <select
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value ? Number(e.target.value) : '')}
          className="input w-full"
        >
          <option value="">Choose an exercise…</option>
          {exercisesWithData.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.muscleGroup})
              {isTimeExercise(e) ? ' · time' : ''}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            className={`flex-1 btn ${
              filterMode === 'any'
                ? 'bg-accent/15 border border-accent/40 text-accent'
                : 'bg-bg border border-border text-slate-300'
            }`}
            onClick={() => setFilterMode('any')}
          >
            Any position
          </button>
          <button
            className={`flex-1 btn ${
              filterMode === 'first'
                ? 'bg-accent/15 border border-accent/40 text-accent'
                : 'bg-bg border border-border text-slate-300'
            }`}
            onClick={() => setFilterMode('first')}
          >
            Only when 1st
          </button>
        </div>
      </div>

      {!exerciseId ? (
        <div className="card text-slate-400 text-sm text-center py-8">
          Select an exercise above to view your progress.
        </div>
      ) : activeData.length === 0 ? (
        <div className="card text-slate-400 text-sm text-center py-8">
          No data points yet for this filter.
        </div>
      ) : timeMode ? (
        <>
          {prTimeSeconds != null && prTimeSeconds > 0 && (
            <div className="card">
              <div className="text-xs uppercase tracking-wide text-slate-400">Personal record</div>
              <div className="text-2xl font-bold mt-1">{formatDurationSeconds(prTimeSeconds)}</div>
              <div className="text-xs text-slate-400 mt-0.5">Longest hold in one set</div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold mb-2">Best hold per session</h3>
            <TimeChartView data={timeData} />
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Sessions ({timeData.length})</h3>
            <ul className="text-sm divide-y divide-border">
              {timeData.slice().reverse().map((p, i) => (
                <li key={i} className="py-2 flex justify-between">
                  <span className="text-slate-400">{p.date}</span>
                  <span>
                    <span className="font-semibold">{formatDurationSeconds(p.topSeconds)}</span>
                    <span className="chip ml-2">#{p.position}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          {prWeight && (
            <div className="card">
              <div className="text-xs uppercase tracking-wide text-slate-400">Personal record</div>
              <div className="text-2xl font-bold mt-1">
                {prWeight.weight} kg × {prWeight.reps}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Estimated 1RM: {Math.round(prWeight.weight * (1 + prWeight.reps / 30) * 10) / 10} kg
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold mb-2">Top set weight over time</h3>
            <WeightChartView data={weightData} dataKey="topWeight" label="Weight" unit="kg" />
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Estimated 1RM (Epley)</h3>
            <WeightChartView data={weightData} dataKey="estimated1RM" label="Est. 1RM" unit="kg" />
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Sessions ({weightData.length})</h3>
            <ul className="text-sm divide-y divide-border">
              {weightData.slice().reverse().map((p, i) => (
                <li key={i} className="py-2 flex justify-between">
                  <span className="text-slate-400">{p.date}</span>
                  <span>
                    <span className="font-semibold">{p.topWeight}</span>
                    <span className="text-slate-400"> kg × </span>
                    <span className="font-semibold">{p.reps}</span>
                    <span className="chip ml-2">#{p.position}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function WeightChartView({
  data,
  dataKey,
  label,
  unit
}: {
  data: WeightChartPoint[]
  dataKey: 'topWeight' | 'estimated1RM'
  label: string
  unit: string
}) {
  return (
    <div className="h-56 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2a44" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(s: string) => s.slice(5)}
            stroke="#1f2a44"
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            stroke="#1f2a44"
            width={36}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              background: '#111a2e',
              border: '1px solid #1f2a44',
              borderRadius: 8,
              color: '#e2e8f0'
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number) => [`${value} ${unit}`, label]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: '#22d3ee', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function TimeChartView({ data }: { data: TimeChartPoint[] }) {
  return (
    <div className="h-56 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2a44" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(s: string) => s.slice(5)}
            stroke="#1f2a44"
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            stroke="#1f2a44"
            width={40}
            tickFormatter={(v: number) => formatDurationSeconds(v)}
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <Tooltip
            contentStyle={{
              background: '#111a2e',
              border: '1px solid #1f2a44',
              borderRadius: 8,
              color: '#e2e8f0'
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number) => [formatDurationSeconds(value), 'Best hold']}
          />
          <Line
            type="monotone"
            dataKey="topSeconds"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: '#22d3ee', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
