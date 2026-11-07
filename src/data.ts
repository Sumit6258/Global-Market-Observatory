import { useEffect, useState } from 'react'
import type { Status } from './config'

// Synthetic figures exist only in development builds made with VITE_DEMO=1.
export const DEMO = import.meta.env.VITE_DEMO === '1'

export interface DS { id: string; name: string; source: string; status: Status; asOf: string | null; retrievedAt: string | null; records: number; note?: string; error?: string; failedAt?: string }
export interface StatusFile { generatedAt: string; runUrl?: string; datasets: DS[] }
export interface Filing { ticker: string; company: string; form: string; filed: string; accepted: string; period: string | null; items: string[]; url: string }
export interface FilingsFile { retrievedAt: string; since: string; events: Filing[] }

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

const ITEMS: Record<string, string> = { '1.01': 'entry into a material agreement', '1.02': 'termination of a material agreement', '2.01': 'completion of an acquisition or disposition', '2.02': 'results of operations and financial condition', '2.03': 'creation of a direct financial obligation', '3.02': 'unregistered sales of equity securities', '5.02': 'departure or appointment of directors or officers', '5.07': 'submission of matters to a shareholder vote', '7.01': 'Regulation FD disclosure', '8.01': 'other events', '9.01': 'financial statements and exhibits' }
export const itemText = (e: Filing) =>
  e.form === '8-K' ? (e.items.length ? `Reports: ${e.items.map(i => ITEMS[i] ?? `item ${i}`).join('; ')}.` : 'Current report.')
    : e.form === '10-K' ? `Annual report${e.period ? ` for the fiscal year ended ${e.period}` : ''}.`
      : `Quarterly report${e.period ? ` for the period ended ${e.period}` : ''}.`
