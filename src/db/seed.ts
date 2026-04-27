import type { Exercise } from './dexie'

export const seedData: Exercise[] = [
  // ---------------- Sunday: Chest + Biceps + Abs ----------------
  {
    name: 'Bench Press',
    muscleGroup: 'Chest',
    alternates: ['Dumbbell Chest Press', 'Machine Chest Press'],
    defaultForDays: ['Chest+Biceps+Abs'],
    defaultOrder: 1
  },
  {
    name: 'Dumbbell Chest Press',
    muscleGroup: 'Chest',
    alternates: ['Bench Press', 'Dips', 'Machine Chest Press'],
    defaultForDays: ['Chest+Biceps+Abs'],
    defaultOrder: 2
  },
  {
    name: 'Cable Fly',
    muscleGroup: 'Chest',
    alternates: ['Pec Deck', 'Dumbbell Fly'],
    defaultForDays: ['Chest+Biceps+Abs'],
    defaultOrder: 3
  },
  {
    name: 'Barbell Curl',
    muscleGroup: 'Biceps',
    alternates: ['EZ-Bar Curl', 'Cable Curl'],
    defaultForDays: ['Chest+Biceps+Abs'],
    defaultOrder: 4
  },
  {
    name: 'Hammer Curl',
    muscleGroup: 'Biceps',
    alternates: ['Cable Hammer Curl', 'Rope Hammer Curl'],
    defaultForDays: ['Chest+Biceps+Abs'],
    defaultOrder: 5
  },
  {
    name: 'Dips',
    muscleGroup: 'Chest',
    alternates: ['Dumbbell Chest Press', 'Bench Press'],
    defaultForDays: [],
    defaultOrder: undefined
  },

  // ---------------- Tuesday: Back + Shoulders + Forearms + Abs ----------------
  {
    name: 'Pull-ups',
    muscleGroup: 'Back',
    alternates: ['Lat Pulldown', 'Assisted Pull-ups'],
    defaultForDays: ['Back+Shoulders+Forearms+Abs'],
    defaultOrder: 1
  },
  {
    name: 'Seated Cable Row',
    muscleGroup: 'Back',
    alternates: ['T-Bar Row', 'Machine Row'],
    defaultForDays: ['Back+Shoulders+Forearms+Abs'],
    defaultOrder: 2
  },
  {
    name: 'Dumbbell Row',
    muscleGroup: 'Back',
    alternates: ['Barbell Row', 'Chest-Supported Row'],
    defaultForDays: ['Back+Shoulders+Forearms+Abs'],
    defaultOrder: 3
  },
  {
    name: 'Dumbbell Shoulder Press',
    muscleGroup: 'Shoulders',
    alternates: ['Machine Shoulder Press', 'Barbell Overhead Press'],
    defaultForDays: ['Back+Shoulders+Forearms+Abs'],
    defaultOrder: 4
  },
  {
    name: 'Dumbbell Lateral Raise',
    muscleGroup: 'Shoulders',
    alternates: ['Cable Lateral Raise', 'Machine Lateral Raise'],
    defaultForDays: ['Back+Shoulders+Forearms+Abs'],
    defaultOrder: 5
  },
  {
    name: 'Face Pull',
    muscleGroup: 'Shoulders',
    alternates: ['Reverse Pec Deck', 'Band Pull-Apart'],
    defaultForDays: ['Back+Shoulders+Forearms+Abs'],
    defaultOrder: 6
  },
  {
    name: 'Wrist Curl',
    muscleGroup: 'Forearms',
    alternates: ['Reverse Wrist Curl', 'Farmer Carry'],
    defaultForDays: ['Back+Shoulders+Forearms+Abs'],
    defaultOrder: 7
  },

  // ---------------- Thursday: Legs + Triceps + Abs ----------------
  {
    name: 'Dumbbell Squat',
    muscleGroup: 'Legs',
    alternates: ['Barbell Squat', 'Goblet Squat', 'Hack Squat'],
    defaultForDays: ['Legs+Triceps+Abs'],
    defaultOrder: 1
  },
  {
    name: 'Leg Curl',
    muscleGroup: 'Legs',
    alternates: ['Romanian Deadlift', 'Seated Leg Curl'],
    defaultForDays: ['Legs+Triceps+Abs'],
    defaultOrder: 2
  },
  {
    name: 'Leg Extension',
    muscleGroup: 'Legs',
    alternates: ['Bulgarian Split Squat'],
    defaultForDays: ['Legs+Triceps+Abs'],
    defaultOrder: 3
  },
  {
    name: 'Calf Raise (Gastrocnemius)',
    muscleGroup: 'Legs',
    alternates: ['Seated Calf Raise', 'Single-leg Calf Raise'],
    defaultForDays: ['Legs+Triceps+Abs'],
    defaultOrder: 4
  },
  {
    name: 'Tricep Pushdown',
    muscleGroup: 'Triceps',
    alternates: ['Rope Pushdown', 'Reverse-Grip Pushdown'],
    defaultForDays: ['Legs+Triceps+Abs'],
    defaultOrder: 5
  },
  {
    name: 'Standing Cable Skull Crusher',
    muscleGroup: 'Triceps',
    alternates: ['Lying Skull Crusher', 'Overhead Tricep Extension'],
    defaultForDays: ['Legs+Triceps+Abs'],
    defaultOrder: 6
  },

  // ---------------- Abs (rotating across all days) ----------------
  {
    name: 'Plank',
    muscleGroup: 'Abs',
    alternates: ['Side Plank'],
    defaultForDays: ['Chest+Biceps+Abs', 'Back+Shoulders+Forearms+Abs', 'Legs+Triceps+Abs'],
    defaultOrder: 99,
    logType: 'time'
  },
  {
    name: 'Hanging Leg Raise',
    muscleGroup: 'Abs',
    alternates: ['Captain\u2019s Chair Knee Raise', 'Lying Leg Raise'],
    defaultForDays: [],
    defaultOrder: undefined
  },
  {
    name: 'Cable Crunch',
    muscleGroup: 'Abs',
    alternates: ['Crunches', 'Sit-ups'],
    defaultForDays: [],
    defaultOrder: undefined
  },
  {
    name: 'Russian Twist',
    muscleGroup: 'Abs',
    alternates: ['Bicycle Crunch'],
    defaultForDays: [],
    defaultOrder: undefined
  },
  {
    name: 'Ab Wheel Rollout',
    muscleGroup: 'Abs',
    alternates: ['Plank'],
    defaultForDays: [],
    defaultOrder: undefined
  }
]
