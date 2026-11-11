import test from 'node:test'
import assert from 'node:assert/strict'
import { derive, extract, validateFundamentals } from './fundamentals.mjs'

const flow = (end, val, o = {}) => ({ start: `${Number(end.slice(0, 4)) - 1}${end.slice(4)}`, end, val, form: '10-K', filed: '2024-11-01', accn: 'A-1', ...o })
const stock = (end, val, o = {}) => ({ end, val, form: '10-K', filed: '2024-11-01', accn: 'A-1', ...o })
const facts = m => ({ facts: { 'us-gaap': Object.fromEntries(Object.entries(m).map(([c, a]) => [c, { units: { USD: a } }])) } })

test('uses full-year values and ignores quarterly or nine-month facts', () => {
  const r = extract(facts({ Revenues: [flow('2024-09-30', 1000), flow('2024-09-30', 250, { start: '2024-06-30' }), flow('2024-09-30', 750, { start: '2023-12-31' }), flow('2023-09-30', 800)] }))
  assert.equal(r.metrics.revenue, 1000)
  assert.equal(r.prior.revenue, 800)
})
test('takes every metric from one fiscal year and marks older-only metrics missing', () => {
  const r = extract(facts({ Revenues: [flow('2024-09-30', 1000)], NetIncomeLoss: [flow('2024-09-30', 100)], OperatingIncomeLoss: [flow('2023-09-30', 90)] }))
  assert.equal(r.metrics.netIncome, 100)
  assert.equal(r.metrics.operatingIncome, null)
  assert.ok(r.missing.includes('operatingIncome'))
})
test('the latest filing wins when a year is restated', () => {
  const r = extract(facts({ Revenues: [flow('2024-09-30', 1000), flow('2024-09-30', 1010, { filed: '2025-11-01' })] }))
  assert.equal(r.metrics.revenue, 1010)
})
test('follows the revenue concept used in the latest year', () => {
  const r = extract(facts({ SalesRevenueNet: [flow('2019-09-30', 500)], RevenueFromContractWithCustomerExcludingAssessedTax: [flow('2024-09-30', 900)] }))
  assert.equal(r.concepts.revenue, 'RevenueFromContractWithCustomerExcludingAssessedTax')
})
test('balance sheet items must be point-in-time facts', () => {
  const r = extract(facts({ Revenues: [flow('2024-09-30', 1000)], Assets: [flow('2024-09-30', 5), stock('2024-09-30', 7000)] }))
  assert.equal(r.metrics.totalAssets, 7000)
})
test('returns null when there is no annual revenue', () => assert.equal(extract({ facts: { 'us-gaap': {} } }), null))
test('derived indicators follow their formulas', () => {
  const x = derive({ revenue: 1000, costOfRevenue: 600, operatingIncome: 200, netIncome: 150, operatingCashFlow: 300, capex: 80, longTermDebt: 400, equity: 500, totalAssets: 1500 }, { revenue: 800, netIncome: 100 })
  assert.deepEqual([x.grossMargin, x.operatingMargin, x.netMargin, x.revenueGrowth, x.netIncomeGrowth], [0.4, 0.2, 0.15, 0.25, 0.5])
  assert.deepEqual([x.freeCashFlow, x.fcfMargin, x.debtToEquity, x.roa, x.roe], [220, 0.22, 0.8, 0.1, 0.3])
})
test('growth from a loss and ratios on negative equity are not calculated', () => {
  const x = derive({ revenue: 100, netIncome: 10, longTermDebt: 5, equity: -50 }, { revenue: 100, netIncome: -5 })
  assert.deepEqual([x.netIncomeGrowth, x.debtToEquity, x.roe], [null, null, null])
})
test('validation rejects a refresh where most companies lack revenue', () => {
  const co = ok => ({ ticker: 'X', metrics: { revenue: ok ? 1 : null, netIncome: 1 }, derived: {} })
  assert.throws(() => validateFundamentals([co(true), co(false), co(false)]), /only 1 of 3/)
  assert.equal(validateFundamentals([co(true), co(true), co(true)]).length, 3)
})

test('falls back to the productive-assets capex concept', () => {
  const r = extract(facts({ Revenues: [flow('2024-09-30', 1000)], PaymentsToAcquireProductiveAssets: [flow('2024-09-30', 50)] }))
  assert.equal(r.metrics.capex, 50)
  assert.equal(r.concepts.capex, 'PaymentsToAcquireProductiveAssets')
})
