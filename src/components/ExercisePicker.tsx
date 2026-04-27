import { useMemo, useState } from 'react'
import type { Exercise } from '../db/dexie'

interface Props {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  /** when set, picker shows alternates for this exercise on top */
  highlightAlternatesOf?: Exercise
  /** ids already in the session (shown as "added") */
  excludeIds?: number[]
  onPick: (exercise: Exercise) => void
  title?: string
}

export default function ExercisePicker({
  open,
  onClose,
  exercises,
  highlightAlternatesOf,
  excludeIds = [],
  onPick,
  title = 'Pick exercise'
}: Props) {
  const [query, setQuery] = useState('')

  const { suggested, others } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filterFn = (e: Exercise) =>
      !e.archived && (q === '' || e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q))

    const suggestedNames = highlightAlternatesOf?.alternates ?? []
    const suggestedSet = new Set(suggestedNames)
    const matched = exercises.filter(filterFn)

    const suggested = matched.filter((e) => suggestedSet.has(e.name))
    const others = matched
      .filter((e) => !suggestedSet.has(e.name))
      .sort((a, b) => {
        if (a.muscleGroup === b.muscleGroup) return a.name.localeCompare(b.name)
        return a.muscleGroup.localeCompare(b.muscleGroup)
      })

    return { suggested, others }
  }, [exercises, query, highlightAlternatesOf])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 px-2 py-1">
            Close
          </button>
        </div>
        <div className="p-3 border-b border-border">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or muscle group"
            className="input w-full"
          />
        </div>
        <div className="overflow-y-auto p-2 space-y-3">
          {suggested.length > 0 && (
            <Section
              title={`Alternates for ${highlightAlternatesOf?.name}`}
              items={suggested}
              excludeIds={excludeIds}
              onPick={(ex) => {
                onPick(ex)
                onClose()
              }}
            />
          )}
          <Section
            title={suggested.length > 0 ? 'All exercises' : ''}
            items={others}
            excludeIds={excludeIds}
            onPick={(ex) => {
              onPick(ex)
              onClose()
            }}
          />
          {suggested.length === 0 && others.length === 0 && (
            <p className="text-slate-400 text-sm p-4 text-center">No matches.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  items,
  excludeIds,
  onPick
}: {
  title: string
  items: Exercise[]
  excludeIds: number[]
  onPick: (e: Exercise) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      {title && (
        <div className="text-xs uppercase tracking-wide text-slate-400 px-2 mb-1">{title}</div>
      )}
      <ul className="divide-y divide-border">
        {items.map((e) => {
          const already = e.id !== undefined && excludeIds.includes(e.id)
          return (
            <li key={e.id}>
              <button
                onClick={() => !already && onPick(e)}
                disabled={already}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between ${
                  already ? 'opacity-40' : 'active:bg-bg'
                }`}
              >
                <div>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-slate-400">{e.muscleGroup}</div>
                </div>
                {already && <span className="chip">added</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
