import type { DayType } from '../db/dexie'

/** Map JS Date.getDay() (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat) to a day type. */
export function dayTypeForWeekday(weekday: number): DayType | null {
  switch (weekday) {
    case 0: // Sunday
      return 'Chest+Biceps+Abs'
    case 2: // Tuesday
      return 'Back+Shoulders+Forearms+Abs'
    case 4: // Thursday
      return 'Legs+Triceps+Abs'
    default:
      return null
  }
}

export function dayTypeLabel(d: DayType): string {
  switch (d) {
    case 'Chest+Biceps+Abs':
      return 'Chest + Biceps + Abs'
    case 'Back+Shoulders+Forearms+Abs':
      return 'Back + Shoulders + Forearms + Abs'
    case 'Legs+Triceps+Abs':
      return 'Legs + Triceps + Abs'
    case 'Custom':
      return 'Custom'
  }
}

export function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
}
