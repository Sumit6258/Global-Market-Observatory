import { describe, expect, it } from 'vitest'
import type { FundCo, FundMetric, FundYear, Profile } from '../data'
import { companyPath, filingUrl, filterCompanies, fiscalYearEndLabel, seriesOf, show, statementRows, yearsOf } from './statement'

const schema: FundMetric[] = [
  { key: 'revenue', label: 'Revenue', group: 'Income statement', kind: 'usd' },
  { key: 'netIncome', label: 'Net income', group: 'Income statement', kind: 'usd' },
  { key: 'cash', label: 'Cash', group: 'Balance sheet', kind: 'usd' },
  { key: 'operatingMargin', label: 'Operating margin', group: 'Derived (calculated)', kind: 'pct', formula: 'operating income ÷ revenue' },
  { key: 'revenueGrowth', label: 'Revenue growth', group: 'Derived (calculated)', kind: 'pct', formula: 'revenue ÷ prior-year revenue − 1' },
]
const year = (end: string, revenue: number | null, netIncome: number | null, growth: number | null): FundYear => ({
  fiscalYearEnd: end, filed: '2025-02-01', accession: '0000000000-25-000001',
  metrics: { revenue, netIncome, cash: null }, derived: { operatingMargin: 0.3, revenueGrowth: growth },
})

describe('number formatting', () => {
  it('marks missing values n/a and keeps signs', () => {
    expect(show(null, 'usd')).toBe('n/a')
    expect(show(undefined, 'pct')).toBe('n/a')
    expect(show(-1.33e9, 'usd')).toBe('−$1.33B')
    expect(show(98.3e6, 'usd')).toBe('$98M')
    expect(show(0.3067, 'pct')).toBe('30.7%')
    expect(show(-0.306, 'pct')).toBe('−30.6%')
    expect(show(8.98, 'eps')).toBe('$8.98')
  })
})

describe('financial statement rows', () => {
  const ys = [year('2025-12-31', 1000, 100, 0.25), year('2024-12-31', 800, null, null)]
  it('keeps schema order and leaves missing metrics null', () => {
    const rows = statementRows(schema, ys, 'Income statement')
    expect(rows.map(r => r.key)).toEqual(['revenue', 'netIncome', 'operatingMargin', 'revenueGrowth'])
    expect(rows[1].cells).toEqual([100, null])
  })
  it('adds calculated rows with their formula only under their own statement', () => {
    const income = statementRows(schema, ys, 'Income statement')
    expect(income.find(r => r.key === 'operatingMargin')?.note).toBe('operating income ÷ revenue')
    expect(statementRows(schema, ys, 'Balance sheet').map(r => r.key)).toEqual(['cash'])
  })
})

describe('fiscal periods and history', () => {
  const co = { fiscalYearEnd: '2026-06-30', filed: '2026-07-29', accession: 'A-1', metrics: { revenue: 5 }, derived: {} } as unknown as FundCo
  it('falls back to the latest year when there is no history', () => {
    expect(yearsOf(co)).toHaveLength(1)
    expect(yearsOf(co)[0].fiscalYearEnd).toBe('2026-06-30')
  })
  it('lists series oldest first and keeps missing years null', () => {
    const s = seriesOf([year('2025-12-31', 1000, 100, 0.25), year('2024-12-31', null, 90, null)], 'revenue', 'metrics')
    expect(s).toEqual([{ x: '2024-12-31', v: null }, { x: '2025-12-31', v: 1000 }])
  })
  it('turns the SEC fiscal year end into a readable label', () => {
    expect(fiscalYearEndLabel('0630')).toBe('June 30')
    expect(fiscalYearEndLabel('1231')).toBe('December 31')
    expect(fiscalYearEndLabel('9999')).toBeNull()
    expect(fiscalYearEndLabel(null)).toBeNull()
  })
})

describe('company navigation', () => {
  const p = (ticker: string, company: string, country: string | null, industry: string | null): Profile =>
    ({ ticker, company, cik: 1, name: company.toUpperCase() + ' CORP', exchanges: ['Nasdaq'], industry, sic: null, website: null, fiscalYearEnd: null, country, state: null })
  const list = [p('MSFT', 'Microsoft', 'United States', 'Software'), p('NVDA', 'NVIDIA', 'United States', 'Semiconductors'), p('XYZ', 'Example', 'India', 'Software')]
  it('searches by name or ticker, ignoring case', () => {
    expect(filterCompanies(list, 'micro', 'All', 'All').map(c => c.ticker)).toEqual(['MSFT'])
    expect(filterCompanies(list, 'nvda', 'All', 'All').map(c => c.ticker)).toEqual(['NVDA'])
  })
  it('filters by country and industry together', () => {
    expect(filterCompanies(list, '', 'United States', 'Software').map(c => c.ticker)).toEqual(['MSFT'])
    expect(filterCompanies(list, '', 'India', 'Semiconductors')).toEqual([])
  })
  it('builds company and filing links', () => {
    expect(companyPath('MSFT')).toBe('/company/MSFT')
    expect(filingUrl(789019, '0000950170-25-100235')).toBe('https://www.sec.gov/Archives/edgar/data/789019/000095017025100235/0000950170-25-100235-index.htm')
  })
})
