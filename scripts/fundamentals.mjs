// Annual fundamentals from SEC XBRL company facts. Pure functions, no network access.
const days = (a, b) => (Date.parse(b) - Date.parse(a)) / 864e5
const IS = 'Income statement', BS = 'Balance sheet', CF = 'Cash flow statement'
const m = (key, label, group, concepts, o = {}) => ({ key, label, group, kind: 'usd', concepts, ...o })

export const METRICS = [
  m('revenue', 'Revenue', IS, ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerIncludingAssessedTax']),
  m('costOfRevenue', 'Cost of revenue', IS, ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold']),
  m('grossProfit', 'Gross profit', IS, ['GrossProfit']),
  m('operatingExpenses', 'Operating expenses', IS, ['OperatingExpenses']),
  m('rnd', 'Research and development', IS, ['ResearchAndDevelopmentExpense']),
  m('sga', 'Selling, general and administrative', IS, ['SellingGeneralAndAdministrativeExpense']),
  m('operatingIncome', 'Operating income', IS, ['OperatingIncomeLoss']),
  m('netIncome', 'Net income', IS, ['NetIncomeLoss', 'ProfitLoss']),
  m('epsBasic', 'Basic EPS', IS, ['EarningsPerShareBasic'], { kind: 'eps', unit: 'USD/shares' }),
  m('epsDiluted', 'Diluted EPS', IS, ['EarningsPerShareDiluted'], { kind: 'eps', unit: 'USD/shares' }),
  m('cash', 'Cash and cash equivalents', BS, ['CashAndCashEquivalentsAtCarryingValue'], { stock: true }),
  m('shortTermInvestments', 'Short-term investments', BS, ['ShortTermInvestments', 'MarketableSecuritiesCurrent', 'AvailableForSaleSecuritiesDebtSecuritiesCurrent'], { stock: true }),
  m('currentAssets', 'Total current assets', BS, ['AssetsCurrent'], { stock: true }),
  m('totalAssets', 'Total assets', BS, ['Assets'], { stock: true }),
  m('currentLiabilities', 'Current liabilities', BS, ['LiabilitiesCurrent'], { stock: true }),
  m('totalLiabilities', 'Total liabilities', BS, ['Liabilities'], { stock: true }),
  m('longTermDebt', 'Long-term debt (noncurrent)', BS, ['LongTermDebtNoncurrent'], { stock: true }),
  m('equity', 'Stockholders’ equity', BS, ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'], { stock: true }),
  m('operatingCashFlow', 'Operating cash flow', CF, ['NetCashProvidedByUsedInOperatingActivities']),
  m('capex', 'Capital expenditure', CF, ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets']),
  m('investingCashFlow', 'Investing cash flow', CF, ['NetCashProvidedByUsedInInvestingActivities']),
  m('financingCashFlow', 'Financing cash flow', CF, ['NetCashProvidedByUsedInFinancingActivities']),
]
const d = (key, label, kind, formula) => ({ key, label, group: 'Derived (calculated)', kind, formula })
export const DERIVED = [
  d('grossMargin', 'Gross margin', 'pct', 'gross profit ÷ revenue, where gross profit is reported or, when only the cost is reported, revenue − cost of revenue'),
  d('operatingMargin', 'Operating margin', 'pct', 'operating income ÷ revenue'),
  d('netMargin', 'Net profit margin', 'pct', 'net income ÷ revenue'),
  d('revenueGrowth', 'Revenue growth', 'pct', 'revenue ÷ prior-year revenue − 1, using the same XBRL concept'),
  d('netIncomeGrowth', 'Net income growth', 'pct', 'net income ÷ prior-year net income − 1, only when the prior year was positive'),
  d('freeCashFlow', 'Free cash flow', 'usd', 'operating cash flow − capital expenditure (calculated, not reported)'),
  d('fcfMargin', 'Free cash flow margin', 'pct', 'free cash flow ÷ revenue'),
  d('debtToEquity', 'Debt-to-equity', 'ratio', 'long-term debt (noncurrent) ÷ stockholders’ equity, only when equity is positive'),
  d('roa', 'Return on assets', 'pct', 'net income ÷ total assets at year end'),
  d('roe', 'Return on equity', 'pct', 'net income ÷ stockholders’ equity at year end, only when equity is positive'),
]
export const SCHEMA = [...METRICS.map(({ key, label, group, kind, concepts }) => ({ key, label, group, kind, concepts })), ...DERIVED]

// Annual facts only, from 10-K filings: a full-year duration (350 to 380 days) for flows, a point in time for balances.
// The fy and fp fields describe the filing, not the fact, so periods are identified by their dates.
function annual(entries, stock) {
  const out = new Map()
  for (const e of entries) {
    if (!e.form?.startsWith('10-K') || !Number.isFinite(e.val)) continue
    if (stock ? e.start : !(e.start && days(e.start, e.end) >= 350 && days(e.start, e.end) <= 380)) continue
    const cur = out.get(e.end)
    if (!cur || e.filed > cur.filed) out.set(e.end, e)
  }
  return out
}

const bound = (x, lo, hi) => (Number.isFinite(x) && x >= lo && x <= hi ? x : null)
const div = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : null)
const growth = (a, b) => (Number.isFinite(a) && b > 0 ? a / b - 1 : null)

export function derive(v, prior = {}) {
  const gp = v.grossProfit ?? (v.revenue != null && v.costOfRevenue != null ? v.revenue - v.costOfRevenue : null)
  const fcf = v.operatingCashFlow != null && v.capex != null ? v.operatingCashFlow - Math.abs(v.capex) : null
  return {
    grossMargin: bound(div(gp, v.revenue), -1, 1),
    operatingMargin: bound(div(v.operatingIncome, v.revenue), -10, 1),
    netMargin: bound(div(v.netIncome, v.revenue), -10, 1),
    revenueGrowth: bound(growth(v.revenue, prior.revenue), -0.9, 10),
    netIncomeGrowth: bound(growth(v.netIncome, prior.netIncome), -20, 100),
    freeCashFlow: fcf,
    fcfMargin: bound(div(fcf, v.revenue), -10, 1),
    debtToEquity: v.equity > 0 ? bound(div(v.longTermDebt, v.equity), 0, 100) : null,
    roa: bound(div(v.netIncome, v.totalAssets), -5, 1),
    roe: v.equity > 0 ? bound(div(v.netIncome, v.equity), -50, 50) : null,
  }
}

// Every metric is taken from the same fiscal year as revenue. An item missing for that year stays missing.
export function extract(cf) {
  const gaap = cf?.facts?.['us-gaap'] ?? {}
  const maps = Object.fromEntries(METRICS.map(x => [x.key, x.concepts.map(c => ({ c, by: annual(gaap[c]?.units?.[x.unit ?? 'USD'] ?? [], !!x.stock) }))]))
  const ends = maps.revenue.map(s => [...s.by.keys()].sort().at(-1)).filter(Boolean)
  if (!ends.length) return null
  const end = ends.sort().at(-1)
  const metrics = {}, concepts = {}, missing = [], entry = {}
  for (const x of METRICS) {
    const hit = maps[x.key].find(s => s.by.has(end))
    if (hit) { entry[x.key] = hit.by.get(end); metrics[x.key] = entry[x.key].val; concepts[x.key] = hit.c } else { metrics[x.key] = null; missing.push(x.key) }
  }
  const prior = {}
  for (const k of ['revenue', 'netIncome']) {
    const hit = maps[k].find(s => s.c === concepts[k])
    const e = hit && [...hit.by.values()].find(e => { const n = days(e.end, end); return n >= 350 && n <= 380 })
    prior[k] = e ? e.val : null
  }
  return { fiscalYearEnd: end, filed: entry.revenue.filed, accession: entry.revenue.accn, metrics, concepts, prior, derived: derive(metrics, prior), missing }
}

export function validateFundamentals(list) {
  const ok = list.filter(c => c.metrics.revenue > 0 && Number.isFinite(c.metrics.netIncome)).length
  if (ok < Math.ceil(list.length * 0.8)) throw new Error(`only ${ok} of ${list.length} companies have revenue and net income`)
  for (const c of list) for (const [k, v] of Object.entries({ ...c.metrics, ...c.derived })) if (v !== null && !Number.isFinite(v)) throw new Error(`${c.ticker}: ${k} is not a number`)
  return list
}

// Lists revenue-like concepts and their 10-K coverage, to explain why a company could not be mapped.
export function diagnose(cf) {
  const gaap = cf?.facts?.['us-gaap'] ?? {}
  return Object.entries(gaap).filter(([k]) => /revenue|sales/i.test(k)).slice(0, 12).map(([concept, v]) => {
    const rows = Object.values(v.units ?? {}).flat()
    const tenK = rows.filter(r => r.form?.startsWith('10-K'))
    const s = tenK[0]
    return { concept, rows: rows.length, tenK: tenK.length, latestEnd: tenK.map(r => r.end).sort().at(-1) ?? null, sample: s ? { start: s.start ?? null, end: s.end, form: s.form } : null }
  })
}
