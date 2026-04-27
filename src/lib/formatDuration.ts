/** Format seconds as `1:30` or `45s`. */
export function formatDurationSeconds(total: number): string {
  const t = Math.max(0, Math.round(total))
  const m = Math.floor(t / 60)
  const s = t % 60
  if (m === 0) return `${s}s`
  return `${m}:${s.toString().padStart(2, '0')}`
}
