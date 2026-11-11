import { useEffect, useState } from 'react'
import { STALE_AFTER, type Status } from './config'

// DEMO is a compile-time constant (vite.config.ts). Synthetic figures exist only in builds made with VITE_DEMO=1.

export interface DS { id: string; name: string; source: string; status: Status; asOf: string | null; retrievedAt: string | null; records: number; note?: string; error?: string; failedAt?: string }
export interface StatusFile { generatedAt: string; runUrl?: string; datasets: DS[] }
export interface Filing { ticker: string; company: string; cik?: number; accession?: string; form: string; filed: string; accepted: string; period: string | null; items: string[]; url: string }
export interface FilingsFile { retrievedAt: string; since: string; events: Filing[] }

export interface FundMetric { key: string; label: string; group: string; kind: string; concepts?: string[]; formula?: string }
export interface FundCo { ticker: string; company: string; cik: number; fiscalYearEnd: string; filed: string; accession: string; metrics: Record<string, number | null>; derived: Record<string, number | null>; concepts: Record<string, string>; missing: string[] }
export interface FundFile { retrievedAt: string; schema: FundMetric[]; unmapped: string[]; companies: FundCo[] }

export function useData<T>(name: string) {
  const [s, set] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true })
  useEffect(() => {
    let on = true
    fetch(`${import.meta.env.BASE_URL}data/${name}`, { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => on && set({ data: d as T, loading: false }), e => on && set({ error: String(e), loading: false }))
    return () => { on = false }
  }, [name])
  return s
}
export const useStatus = () => useData<StatusFile>('meta/status.json').data

// Date-only values count from the start of that day (UTC), so age is never understated.
export const ago = (iso: string | null | undefined) => {
  if (!iso) return 'n/a'
  const t = /^\d{4}-\d\d-\d\d$/.test(iso) ? Date.parse(`${iso}T00:00:00Z`) : Date.parse(iso)
  const m = Math.max(0, (Date.now() - t) / 60000)
  return m < 90 ? `${Math.round(m)} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`
}
export const etTime = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })

const ITEMS: Record<string, string> = { '1.01': 'entry into a material agreement', '1.02': 'termination of a material agreement', '1.03': 'bankruptcy or receivership', '2.01': 'completion of an acquisition or disposition', '2.02': 'results of operations and financial condition', '2.03': 'creation of a direct financial obligation', '2.04': 'triggering events that accelerate an obligation', '3.01': 'notice of delisting or listing-standard failure', '3.02': 'unregistered sales of equity securities', '4.01': 'change in certifying accountant', '4.02': 'non-reliance on previously issued financial statements', '5.01': 'change in control', '5.02': 'departure or appointment of directors or officers', '5.03': 'amendment to articles or bylaws', '5.07': 'submission of matters to a shareholder vote', '7.01': 'Regulation FD disclosure', '8.01': 'other events', '9.01': 'financial statements and exhibits' }
// Categories come only from official 8-K item numbers, never from guesswork.
const CAT: [string, string[]][] = [['Financial results', ['2.02']], ['Leadership changes', ['5.02']], ['Material agreements', ['1.01', '1.02']], ['Bankruptcy or receivership', ['1.03']], ['Completed acquisitions and disposals', ['2.01']], ['Securities and financing', ['2.03', '2.04', '3.02']], ['Regulatory, listing and accounting', ['3.01', '4.01', '4.02']]]
export const CATEGORY_NAMES = [...CAT.map(c => c[0]), 'Other disclosures', 'Periodic reports']
export const categoriesOf = (e: Filing): string[] => {
  if (!e.form.startsWith('8-K')) return ['Periodic reports']
  const hit = [...new Set(e.items.map(i => CAT.find(c => c[1].includes(i))?.[0]).filter((x): x is string => !!x))]
  return hit.length ? hit : ['Other disclosures']
}
export const itemText = (e: Filing) => {
  const base = e.form.startsWith('8-K') ? (e.items.length ? `Reports: ${e.items.map(i => `${i} ${ITEMS[i] ?? 'other item'}`).join('; ')}.` : 'Current report.')
    : e.form.startsWith('10-K') ? `Annual report${e.period ? ` for the fiscal year ended ${e.period}` : ''}.`
      : `Quarterly report${e.period ? ` for the period ended ${e.period}` : ''}.`
  return e.form.endsWith('/A') ? `Amendment. ${base}` : base
}

const hoursSince = (iso: string | null) => (iso ? (Date.now() - (/^\d{4}-\d\d-\d\d$/.test(iso) ? Date.parse(`${iso}T00:00:00Z`) : Date.parse(iso))) / 36e5 : Infinity)
// A failed refresh or an over-age dataset is shown as STALE, never under its original label.
export const effStatus = (d: DS): Status => {
  const r = STALE_AFTER[d.id]
  return d.error || (r && hoursSince(d[r.basis]) > r.hours) ? 'STALE' : d.status
}
