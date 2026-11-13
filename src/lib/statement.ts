import type { FundCo, FundMetric, FundYear, Profile } from '../data'

const sign = (v: number) => (v < 0 ? '−' : '')
const money = (v: number) => `${sign(v)}$${Math.abs(v) >= 1e9 ? `${(Math.abs(v) / 1e9).toFixed(2)}B` : `${(Math.abs(v) / 1e6).toFixed(0)}M`}`
export const shortUsd = (v: number) => `${sign(v)}$${Math.abs(v) >= 1e9 ? `${(Math.abs(v) / 1e9).toFixed(1)}B` : `${(Math.abs(v) / 1e6).toFixed(0)}M`}`
export const show = (v: number | null | undefined, kind: string) =>
  v == null ? 'n/a' : kind === 'usd' ? money(v) : kind === 'eps' ? `${sign(v)}$${Math.abs(v).toFixed(2)}` : kind === 'pct' ? `${sign(v)}${Math.abs(v * 100).toFixed(1)}%` : `${sign(v)}${Math.abs(v).toFixed(2)}`

export const STATEMENTS = ['Income statement', 'Balance sheet', 'Cash flow statement'] as const
export type Statement = (typeof STATEMENTS)[number]
// Calculated indicators shown under each statement.
export const DERIVED_BY: Record<Statement, string[]> = {
  'Income statement': ['grossMargin', 'operatingMargin', 'netMargin', 'revenueGrowth', 'netIncomeGrowth'],
  'Balance sheet': ['debtToEquity', 'roa', 'roe'],
  'Cash flow statement': ['freeCashFlow', 'fcfMargin'],
}

export const companyPath = (ticker: string) => `/company/${ticker}`
export const filingUrl = (cik: number, accession: string) => `https://www.sec.gov/Archives/edgar/data/${cik}/${accession.replace(/-/g, '')}/${accession}-index.htm`
export const edgarCompanyUrl = (cik: number) => `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=&dateb=&owner=include&count=40`

// Latest year first. Without history, the single latest-year record is used.
export const yearsOf = (c: FundCo): FundYear[] =>
  c.history?.length ? c.history : [{ fiscalYearEnd: c.fiscalYearEnd, filed: c.filed, accession: c.accession, metrics: c.metrics, derived: c.derived }]

export interface Row { key: string; label: string; kind: string; cells: (number | null)[]; note?: string }
export function statementRows(schema: FundMetric[], ys: FundYear[], statement: Statement): Row[] {
  const items: Row[] = schema.filter(m => m.group === statement).map(m => ({ key: m.key, label: m.label, kind: m.kind, cells: ys.map(y => y.metrics[m.key] ?? null) }))
  const derived: Row[] = DERIVED_BY[statement].flatMap(k => schema.filter(m => m.key === k).map(m => ({ key: m.key, label: m.label, kind: m.kind, cells: ys.map(y => y.derived[k] ?? null), note: m.formula })))
  return [...items, ...derived]
}

// Oldest first, for charts. A year without a value stays null and is never filled in.
export const seriesOf = (ys: FundYear[], key: string, from: 'metrics' | 'derived') => [...ys].reverse().map(y => ({ x: y.fiscalYearEnd, v: y[from][key] ?? null }))

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
// SEC gives the fiscal year end as MMDD, for example 0630.
export function fiscalYearEndLabel(mmdd: string | null | undefined) {
  if (!mmdd || !/^\d{4}$/.test(mmdd)) return null
  const m = Number(mmdd.slice(0, 2))
  return m >= 1 && m <= 12 ? `${MONTHS[m - 1]} ${Number(mmdd.slice(2))}` : null
}

export function filterCompanies(list: Profile[], q: string, country: string, industry: string) {
  const s = q.trim().toLowerCase()
  return list.filter(c => (!s || c.company.toLowerCase().includes(s) || c.name.toLowerCase().includes(s) || c.ticker.toLowerCase().includes(s)) && (country === 'All' || c.country === country) && (industry === 'All' || c.industry === industry))
}
