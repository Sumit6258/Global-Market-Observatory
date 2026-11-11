import { MIN_COVERAGE, WINDOWS, type Market } from './config'

export interface Series { dates: Date[]; v: number[] }
const N = 253
const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
const rng = (a: number) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const DATES = (() => { const out: Date[] = []; const d = new Date(); d.setHours(12, 0, 0, 0); while (out.length < N) { if (d.getDay() % 6) out.unshift(new Date(d)); d.setDate(d.getDate() - 1) } return out })()
const cache = new Map<string, Series>()

// DEMO fixtures only: a seeded random walk normalised to 100. Never market data.
export function demoSeries(key: string, vol = 0.011): Series {
  const hit = cache.get(key); if (hit) return hit
  const r = rng(hash(key)); let x = 100; const v = [x]
  for (let i = 1; i < N; i++) { x *= 1 + (r() - 0.5) * 2 * vol; v.push(x) }
  const s = { dates: DATES, v }; cache.set(key, s); return s
}

export function ret(s: Series, p: string): number | null {
  const last = s.v.length - 1; let from = -1
  if (p === 'YTD') { const y = s.dates[last].getFullYear(); s.dates.forEach((d, i) => { if (d.getFullYear() < y) from = i }) }
  else { const w = WINDOWS[p]; if (w !== undefined && last - w >= 0) from = last - w }
  return from < 0 ? null : s.v[last] / s.v[from] - 1
}

// Calendar-based returns for series that include non-trading days (USD/INR): last observation on or before the target date.
export function retDate(dates: string[], v: number[], p: string): number | null {
  const last = dates.length - 1
  if (last < 1) return null
  const end = new Date(`${dates[last]}T00:00:00Z`)
  const back = (days: number, months = 0) => { const t = new Date(end); t.setUTCMonth(t.getUTCMonth() - months); t.setUTCDate(t.getUTCDate() - days); return t.toISOString().slice(0, 10) }
  const target = ({ Today: back(1), '1 Week': back(7), '1 Month': back(0, 1), '3 Months': back(0, 3), '6 Months': back(0, 6), '1 Year': back(0, 12), YTD: `${end.getUTCFullYear() - 1}-12-31` } as Record<string, string>)[p]
  if (!target || dates[0] > target) return null
  for (let i = last; i >= 0; i--) if (dates[i] <= target) return v[last] / v[i] - 1
  return null
}

export function basket(members: string[]) {
  const ser = members.map(m => demoSeries('co:' + m, 0.016))
  const coverage = ser.length / members.length
  if (coverage < MIN_COVERAGE) return null
  const v = [100]
  for (let i = 1; i < N; i++) v.push(v[i - 1] * (1 + ser.reduce((a, s) => a + s.v[i] / s.v[i - 1] - 1, 0) / ser.length))
  const L = N - 1
  const last = members.map((n, k) => { const r = ser[k].v[L] / ser[k].v[L - 1] - 1; return { n, r, c: r / ser.length } })
  return { series: { dates: DATES, v } as Series, coverage, last }
}

export function session(m: Market, now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: m.tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(now).map(x => [x.type, x.value] as [string, string]))
  const mins = +p.hour * 60 + +p.minute
  if (p.weekday === 'Sat' || p.weekday === 'Sun') return 'Closed for the weekend'
  if (mins >= m.open[0] && mins < m.open[1]) return 'Regular session, holidays not verified'
  if (m.pre !== undefined && mins >= m.pre && mins < m.open[0]) return 'Pre-market, holidays not verified'
  if (m.after !== undefined && mins >= m.open[1] && mins < m.after) return 'After-hours, holidays not verified'
  return 'Closed, outside session hours'
}
export const localTime = (tz: string, now = new Date()) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(now)
export const hm = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
export const pct = (x: number | null) => (x === null ? 'n/a' : `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(2)}%`)
