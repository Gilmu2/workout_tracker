import type { Exercise, SetLog } from '../db/dexie'

export function isTimeExercise(ex: Exercise | undefined): boolean {
  return ex?.logType === 'time'
}

export function setIsTimeHold(s: SetLog): boolean {
  return s.durationSeconds != null && s.durationSeconds > 0
}
