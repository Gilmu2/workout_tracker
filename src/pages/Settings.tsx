import { useRef, useState } from 'react'
import { clearAllData, db } from '../db/dexie'

interface BackupPayload {
  version: 1
  exportedAt: string
  exercises: unknown[]
  workouts: unknown[]
  entries: unknown[]
  sets: unknown[]
}

export default function Settings() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string>('')

  async function exportJson() {
    const [exercises, workouts, entries, sets] = await Promise.all([
      db.exercises.toArray(),
      db.workouts.toArray(),
      db.entries.toArray(),
      db.sets.toArray()
    ])
    const payload: BackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      exercises,
      workouts,
      entries,
      sets
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    a.href = url
    a.download = `workout-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Backup downloaded.')
  }

  async function importJson(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as BackupPayload
      if (data.version !== 1) {
        setStatus('Unsupported backup version.')
        return
      }
      if (
        !confirm(
          'Importing will REPLACE all current data with the contents of this backup. Continue?'
        )
      ) {
        return
      }
      await db.transaction('rw', db.exercises, db.workouts, db.entries, db.sets, async () => {
        await db.sets.clear()
        await db.entries.clear()
        await db.workouts.clear()
        await db.exercises.clear()
        if (data.exercises?.length) await db.exercises.bulkAdd(data.exercises as never[])
        if (data.workouts?.length) await db.workouts.bulkAdd(data.workouts as never[])
        if (data.entries?.length) await db.entries.bulkAdd(data.entries as never[])
        if (data.sets?.length) await db.sets.bulkAdd(data.sets as never[])
      })
      setStatus(
        `Imported ${data.workouts?.length ?? 0} workouts, ${data.sets?.length ?? 0} sets.`
      )
    } catch (err) {
      console.error(err)
      setStatus('Import failed: ' + (err as Error).message)
    }
  }

  async function resetAll() {
    if (
      !confirm(
        'This will delete ALL workouts, entries, sets, and reset the exercise library to defaults. Continue?'
      )
    )
      return
    await clearAllData()
    setStatus('All data cleared and library re-seeded.')
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm">
          Your data lives in this browser only. Back it up regularly.
        </p>
      </header>

      <div className="card space-y-3">
        <h2 className="font-semibold">Backup</h2>
        <p className="text-sm text-slate-400">
          Download all your data as a JSON file you can save to Google Drive / email to yourself.
        </p>
        <button onClick={exportJson} className="btn-primary w-full">
          Export JSON backup
        </button>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Restore</h2>
        <p className="text-sm text-slate-400">
          Replace current data with a previously exported backup file.
        </p>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importJson(f)
            e.target.value = ''
          }}
        />
        <button onClick={() => fileInput.current?.click()} className="btn-secondary w-full">
          Choose backup file…
        </button>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-danger">Danger zone</h2>
        <p className="text-sm text-slate-400">
          Wipes everything and re-seeds the default exercise library.
        </p>
        <button onClick={resetAll} className="btn-danger w-full">
          Reset all data
        </button>
      </div>

      {status && (
        <div className="card text-sm text-slate-300">
          {status}
        </div>
      )}

      <div className="text-center text-xs text-slate-500 py-4">
        Workout Tracker · v0.1.0
      </div>
    </div>
  )
}
