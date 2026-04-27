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
    <div className="bg-bg border border-border rounded-xl p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
            Weight (kg)
          </label>
          <div className="flex items-center gap-1.5">
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
              className="input flex-1 text-center text-lg font-semibold"
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
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
            Reps
          </label>
          <div className="flex items-center gap-1.5">
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
              className="input flex-1 text-center text-lg font-semibold"
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
    <div className="bg-bg border border-border rounded-xl p-3 space-y-3">
      <div>
        <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
          Hold time
        </label>
        <div className="text-center text-lg font-semibold text-accent mb-2 tabular-nums">
          {formatDurationSeconds(seconds)}
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" className="stepper-btn" onClick={() => bump(-30)} aria-label="minus 30 seconds">
            −30
          </button>
          <button type="button" className="stepper-btn" onClick={() => bump(-5)} aria-label="minus 5 seconds">
            −5
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={seconds}
            onChange={(e) => setSeconds(Math.max(1, parseInt(e.target.value, 10) || 1))}
            onFocus={(e) => e.currentTarget.select()}
            className="input flex-1 text-center text-lg font-semibold"
          />
          <button type="button" className="stepper-btn" onClick={() => bump(5)} aria-label="plus 5 seconds">
            +5
          </button>
          <button type="button" className="stepper-btn" onClick={() => bump(30)} aria-label="plus 30 seconds">
            +30
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">Seconds — e.g. 90 for 1:30</p>
      </div>
      <button onClick={() => onAdd(seconds)} className="btn-primary w-full">
        Add hold
      </button>
    </div>
  )
}
