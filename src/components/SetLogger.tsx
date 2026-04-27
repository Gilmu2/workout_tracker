import { useEffect, useState } from 'react'
import { formatDurationSeconds } from '../lib/formatDuration'

type WeightRepsProps = {
  mode: 'weight_reps'
  initialWeight: number
  initialReps: number
  weightStep?: number
  onAdd: (weight: number, reps: number) => void
}

type TimeProps = {
  mode: 'time'
  initialSeconds: number
  onAdd: (durationSeconds: number) => void
}

export type SetLoggerProps = WeightRepsProps | TimeProps

export default function SetLogger(props: SetLoggerProps) {
  if (props.mode === 'time') {
    return <TimeSetLogger initialSeconds={props.initialSeconds} onAdd={props.onAdd} />
  }
  return (
    <WeightSetLogger
      initialWeight={props.initialWeight}
      initialReps={props.initialReps}
      weightStep={props.weightStep}
      onAdd={props.onAdd}
    />
  )
}

function WeightSetLogger({
  initialWeight,
  initialReps,
  weightStep = 2.5,
  onAdd
}: Omit<WeightRepsProps, 'mode'>) {
  const [weight, setWeight] = useState(initialWeight)
  const [reps, setReps] = useState(initialReps)

  useEffect(() => {
    setWeight(initialWeight)
  }, [initialWeight])
  useEffect(() => {
    setReps(initialReps)
  }, [initialReps])

  function bumpWeight(delta: number) {
    setWeight((w) => Math.max(0, Math.round((w + delta) * 10) / 10))
  }
  function bumpReps(delta: number) {
    setReps((r) => Math.max(0, r + delta))
  }

  return (
    <div className="bg-bg border border-border rounded-xl p-3 space-y-3 min-w-0 max-w-full">
      {/* Stacked on narrow screens so [−][input][+] never shares half-width with another column */}
      <div className="flex flex-col gap-4 min-w-0">
        <div className="min-w-0 w-full">
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
            Weight (kg)
          </label>
          <div className="flex items-center gap-1 min-w-0 w-full">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => bumpWeight(-weightStep)}
              aria-label="decrease weight"
            >
              −
            </button>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={Number.isFinite(weight) ? weight : 0}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.currentTarget.select()}
              className="input flex-1 min-w-0 text-center text-base sm:text-lg font-semibold px-2 py-2"
            />
            <button
              type="button"
              className="stepper-btn"
              onClick={() => bumpWeight(weightStep)}
              aria-label="increase weight"
            >
              +
            </button>
          </div>
        </div>
        <div className="min-w-0 w-full">
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
            Reps
          </label>
          <div className="flex items-center gap-1 min-w-0 w-full">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => bumpReps(-1)}
              aria-label="decrease reps"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={Number.isFinite(reps) ? reps : 0}
              onChange={(e) => setReps(parseInt(e.target.value, 10) || 0)}
              onFocus={(e) => e.currentTarget.select()}
              className="input flex-1 min-w-0 text-center text-base sm:text-lg font-semibold px-2 py-2"
            />
            <button
              type="button"
              className="stepper-btn"
              onClick={() => bumpReps(1)}
              aria-label="increase reps"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <button onClick={() => onAdd(weight, reps)} className="btn-primary w-full">
        Add set
      </button>
    </div>
  )
}

function TimeSetLogger({
  initialSeconds,
  onAdd
}: Omit<TimeProps, 'mode'>) {
  const [seconds, setSeconds] = useState(Math.max(1, Math.round(initialSeconds)))

  useEffect(() => {
    setSeconds(Math.max(1, Math.round(initialSeconds)))
  }, [initialSeconds])

  function bump(delta: number) {
    setSeconds((s) => Math.max(1, s + delta))
  }

  return (
    <div className="bg-bg border border-border rounded-xl p-3 space-y-3 min-w-0 max-w-full">
      <div className="min-w-0">
        <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
          Hold time
        </label>
        <div className="text-center text-lg font-semibold text-accent mb-2 tabular-nums">
          {formatDurationSeconds(seconds)}
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex justify-center gap-2 flex-wrap">
            <button type="button" className="stepper-btn px-1 w-auto min-w-[2.5rem]" onClick={() => bump(-30)} aria-label="minus 30 seconds">
              −30
            </button>
            <button type="button" className="stepper-btn px-1 w-auto min-w-[2.5rem]" onClick={() => bump(-5)} aria-label="minus 5 seconds">
              −5
            </button>
          </div>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={seconds}
            onChange={(e) => setSeconds(Math.max(1, parseInt(e.target.value, 10) || 1))}
            onFocus={(e) => e.currentTarget.select()}
            className="input w-full min-w-0 text-center text-base sm:text-lg font-semibold px-2 py-2"
          />
          <div className="flex justify-center gap-2 flex-wrap">
            <button type="button" className="stepper-btn px-1 w-auto min-w-[2.5rem]" onClick={() => bump(5)} aria-label="plus 5 seconds">
              +5
            </button>
            <button type="button" className="stepper-btn px-1 w-auto min-w-[2.5rem]" onClick={() => bump(30)} aria-label="plus 30 seconds">
              +30
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">Seconds — e.g. 90 for 1:30</p>
      </div>
      <button onClick={() => onAdd(seconds)} className="btn-primary w-full">
        Add hold
      </button>
    </div>
  )
}
