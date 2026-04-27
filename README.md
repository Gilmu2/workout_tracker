# Workout Tracker

A free, installable Progressive Web App (PWA) for logging strength-training sessions. It is mobile-first, works offline after the first load, and does not require a backend or user accounts. Workout data is stored locally in the browser (IndexedDB).

## Features

- **Pre-seeded 3-day split** (example): Sunday chest / biceps / abs · Tuesday back / shoulders / forearms / abs · Thursday legs / triceps / abs. Day type can be overridden when starting a session.
- **Weekday hint** for which split matches the calendar day (optional).
- **Exercise alternates** with quick swap during a session (e.g. machine substitutions when equipment is busy).
- **Order / position** per exercise in a session; progress charts can filter to “only when done first” for fair comparisons.
- **Weight and reps** logging with large stepper controls; **time-based holds** (e.g. plank) log duration instead of weight.
- **Progress**: charts, estimated 1RM (Epley) for load-based lifts, personal bests.
- **History** and per-session detail views.
- **Exercise library** with editable alternates and log type (weight + reps vs. time).
- **JSON export / import** in Settings for backups (recommended because data is device-local).
- **PWA**: add to home screen; precached assets for offline use.

## Requirements

- Node.js 18 or newer

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview   # optional: serve dist/ locally
```

## Deploy (example: GitHub + Vercel)

### 1. Host the source on GitHub

Create an empty repository, then from this project directory:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<ORG_OR_USER>/<REPO>.git
git push -u origin main
```

Use a remote URL you control. If `git push` is rejected, confirm Git credentials and repository permissions for that account.

### 2. Deploy on Vercel

1. Sign in at [vercel.com](https://vercel.com) (e.g. with GitHub).
2. **Add New → Project** and import the repository.
3. Defaults for Vite are usually correct: **Build command** `npm run build`, **Output directory** `dist`.
4. Deploy and use the generated production URL.

### 3. Install as an app (PWA)

On Android Chrome (and most Chromium-based mobile browsers): open the deployed site → browser menu → **Install app** or **Add to Home screen**. iOS Safari: **Share → Add to Home Screen**.

## Data and privacy

- Data lives in **IndexedDB** on the device that opened the app. There is **no server-side sync** in this version.
- Clearing site data, removing the installed PWA, or resetting the device can delete local data.
- Use **Settings → Export JSON backup** periodically and store the file somewhere safe. **Settings → Choose backup file** restores a prior export.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Vite, React 18, TypeScript |
| Styling | Tailwind CSS |
| Local storage | Dexie.js (IndexedDB) |
| Charts | Recharts |
| PWA | vite-plugin-pwa (injectManifest, Workbox precaching) |
| Routing | react-router-dom (HashRouter; no SPA rewrite rules required on static hosts) |
| Example hosting | Vercel (free tier works for static + serverless is unused here) |

## Project layout

```
src/
  main.tsx              app entry, DB seed on first run
  App.tsx               shell + bottom navigation
  db/dexie.ts           schema, migrations, helpers
  db/seed.ts            default exercise library
  lib/                  day-type helpers, duration formatting, log-type helpers
  pages/                Home, Session, History, SessionDetail, Progress, Library, Settings
  components/           Set logger, exercise picker
  sw.ts                 service worker (precache)
public/
  favicon.svg
  icons/                PWA icons (see scripts/)
scripts/
  generate-icons.mjs    generates PNG icons without extra dependencies
```

## Icons

Regenerate `public/icons/icon-192.png` and `icon-512.png`:

```bash
node scripts/generate-icons.mjs
```

## Roadmap

- Rest timer between sets
- Plate calculator
- Body-weight tracking
- RPE / effort per set
- Per-exercise notes
- Optional cloud sync (e.g. Supabase)
- CSV export
