import Dexie, { Table } from 'dexie'
import { seedData } from './seed'

export type DayType =
  | 'Chest+Biceps+Abs'
  | 'Back+Shoulders+Forearms+Abs'
  | 'Legs+Triceps+Abs'
  | 'Custom'

export const ALL_DAY_TYPES: DayType[] = [
  'Chest+Biceps+Abs',
  'Back+Shoulders+Forearms+Abs',
  'Legs+Triceps+Abs',
  'Custom'
]

export type ExerciseLogType = 'weight_reps' | 'time'

export interface Exercise {
  id?: number
  name: string
  muscleGroup: string
  /** names of exercises that can substitute for this one */
  alternates: string[]
  /** day types where this exercise is part of the default routine */
  defaultForDays: DayType[]
  /** order in the default routine (lower = earlier) */
  defaultOrder?: number
  archived?: boolean
  /** `time` = log holds as duration (e.g. Plank). Defaults to weight + reps. */
  logType?: ExerciseLogType
}

export interface Workout {
  id?: number
  /** ISO date string (e.g., 2026-04-27) */
  date: string
  dayType: DayType
  notes?: string
  /** epoch ms when started */
  startedAt: number
  /** epoch ms when finished, undefined if still ongoing */
  finishedAt?: number
}

export interface Entry {
  id?: number
  workoutId: number
  exerciseId: number
  /** 1-indexed position in the workout: 1 = first exercise done */
  position: number
  createdAt: number
  notes?: string
}

export interface SetLog {
  id?: number
  entryId: number
  setNumber: number
  weight: number
  reps: number
  /** When set, this set is a time hold (weight/reps should be 0). */
  durationSeconds?: number
  rpe?: number
  createdAt: number
}

class WorkoutDB extends Dexie {
  exercises!: Table<Exercise, number>
  workouts!: Table<Workout, number>
  entries!: Table<Entry, number>
  sets!: Table<SetLog, number>

  constructor() {
    super('workout-tracker')
    this.version(1).stores({
      exercises: '++id, name, muscleGroup, archived',
      workouts: '++id, date, dayType, startedAt, finishedAt',
      entries: '++id, workoutId, exerciseId, position, createdAt',
      sets: '++id, entryId, setNumber, createdAt'
    })
    this.version(2)
      .stores({
        exercises: '++id, name, muscleGroup, archived, logType',
        workouts: '++id, date, dayType, startedAt, finishedAt',
        entries: '++id, workoutId, exerciseId, position, createdAt',
        sets: '++id, entryId, setNumber, createdAt'
      })
      .upgrade(async (tx) => {
        await tx
          .table('exercises')
          .toCollection()
          .modify((ex: Exercise) => {
            if (ex.name === 'Plank' && ex.logType === undefined) {
              ex.logType = 'time'
            }
          })
      })
  }
}

export const db = new WorkoutDB()

export async function initDb() {
  const count = await db.exercises.count()
  if (count === 0) {
    await db.exercises.bulkAdd(seedData)
  }
}

export async function clearAllData() {
  await db.transaction('rw', db.exercises, db.workouts, db.entries, db.sets, async () => {
    await db.sets.clear()
    await db.entries.clear()
    await db.workouts.clear()
    await db.exercises.clear()
  })
  await db.exercises.bulkAdd(seedData)
}
