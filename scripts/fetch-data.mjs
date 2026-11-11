// Refreshes real data into public/data. Runs in GitHub Actions without secrets.
// A failed source keeps its last good file and is reported in meta/status.json.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dedupeFilings, validateFilings, validateFx } from './validate.mjs'
import { SCHEMA, diagnose, extract, validateFundamentals } from './fundamentals.mjs'

const OUT = 'public/data'
const CONTACT = process.env.SEC_CONTACT?.trim()
const now = new Date().toISOString()
const sleep = ms => new Promise(r => setTimeout(r, ms))
const read = async p => { try { return JSON.parse(await readFile(`${OUT}/${p}`, 'utf8')) } catch { return null } }
const save = (p, d) => writeFile(`${OUT}/${p}`, JSON.stringify(d) + '\n')
const get = async (url, ua) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'application/json' } })
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
      return await r.json()
    } catch (e) {
      if (attempt === 3) throw e
      await sleep(1000 * attempt)
    }
  }
}
await mkdir(`${OUT}/meta`, { recursive: true })
const prev = (await read('meta/status.json'))?.datasets ?? []
const datasets = []

async function run(id, name, source, status, job) {
  try {
    const { asOf, records, note } = await job()
    datasets.push({ id, name, source, status, asOf, retrievedAt: now, records, ...(note && { note }) })
    console.log(`${id}: ok, ${records} records, as of ${asOf}`)
  } catch (e) {
    console.error(`${id}: FAILED, keeping the last good data. ${e.message}`)
    const p = prev.find(d => d.id === id)
    datasets.push({ ...(p ?? { id, name, source, status: 'UNAVAILABLE', asOf: null, retrievedAt: null, records: 0 }), error: e.message, failedAt: now })
  }
}

// USD/INR: Frankfurter blended central-bank reference rates, daily.
await run('fx-usd-inr', 'USD/INR exchange rate', 'frankfurter', 'END-OF-DAY', async () => {
  const from = new Date(Date.now() - 5 * 365.25 * 864e5).toISOString().slice(0, 10)
  const j = await get(`https://api.frankfurter.dev/v2/rates?from=${from}&base=USD&quotes=INR`, 'Global-Market-Observatory')
  const rows = Array.isArray(j) ? j.map(x => [x.date, x.rate]) : Object.entries(j.rates ?? {}).map(([d, q]) => [d, q.INR])
  const pts = rows.filter(([d, v]) => /^\d{4}-\d\d-\d\d$/.test(d) && Number.isFinite(v)).sort((a, b) => a[0].localeCompare(b[0]))
  if (!pts.length) throw new Error(`unexpected response: ${JSON.stringify(j).slice(0, 160)}`)
  validateFx(pts)
  const asOf = pts.at(-1)[0]
  await save('fx.json', { source: 'frankfurter', base: 'USD', quote: 'INR', asOf, retrievedAt: now, dates: pts.map(p => p[0]), values: pts.map(p => p[1]) })
  return { asOf, records: pts.length }
})

// US filings: SEC EDGAR. Needs a declared User-Agent with a contact email and at most 10 requests per second.
const US = [['MSFT', 'Microsoft'], ['NVDA', 'NVIDIA'], ['GOOGL', 'Alphabet'], ['AMZN', 'Amazon'], ['META', 'Meta'], ['AAPL', 'Apple'], ['ORCL', 'Oracle'], ['ADBE', 'Adobe'], ['CRM', 'Salesforce'], ['NOW', 'ServiceNow'], ['PLTR', 'Palantir'], ['SNOW', 'Snowflake'], ['DDOG', 'Datadog'], ['NET', 'Cloudflare'], ['CRWD', 'CrowdStrike'], ['MDB', 'MongoDB'], ['AVGO', 'Broadcom'], ['AMD', 'AMD'], ['INTC', 'Intel'], ['IBM', 'IBM'], ['CSCO', 'Cisco']]
const FORMS = ['8-K', '8-K/A', '10-K', '10-K/A', '10-Q', '10-Q/A']
await run('sec-filings', 'US company filings (8-K, 10-Q, 10-K)', 'sec-edgar', 'HISTORICAL', async () => {
  if (!CONTACT) throw new Error('the SEC_CONTACT_EMAIL repository variable is not set')
  const ua = `Global-Market-Observatory ${CONTACT}`
  const map = await get('https://www.sec.gov/files/company_tickers.json', ua)
  const byTicker = new Map(Object.values(map).map(c => [c.ticker, c]))
  const since = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10)
  const events = [], failed = []
  for (const [ticker, company] of US) {
    const c = byTicker.get(ticker)
    if (!c) { failed.push(ticker); continue }
    try {
      await sleep(150)
      const r = (await get(`https://data.sec.gov/submissions/CIK${String(c.cik_str).padStart(10, '0')}.json`, ua)).filings.recent
      r.form.forEach((form, i) => {
        if (!FORMS.includes(form) || r.filingDate[i] < since) return
        const accession = r.accessionNumber[i]
        events.push({ ticker, company, cik: c.cik_str, form, filed: r.filingDate[i], accepted: r.acceptanceDateTime[i], period: r.reportDate[i] || null, items: form.startsWith('8-K') ? (r.items[i] || '').split(',').filter(Boolean) : [], accession, url: `https://www.sec.gov/Archives/edgar/data/${c.cik_str}/${accession.replaceAll('-', '')}/${r.primaryDocument[i]}` })
      })
    } catch (e) { failed.push(ticker); console.warn(`${ticker}: ${e.message}`) }
  }
  if (failed.length || !events.length) throw new Error(`incomplete refresh, last good data kept (failed: ${failed.join(', ') || 'none'}, filings found: ${events.length})`)
  const list = validateFilings(dedupeFilings(events))
  await save('filings.json', { source: 'sec-edgar', retrievedAt: now, since, events: list })
  return { asOf: list[0].accepted, records: list.length, note: `covers ${US.length} of ${US.length} companies, last 120 days` }
})

// US annual fundamentals: SEC XBRL company facts, latest 10-K per company. A transport failure keeps the last good file.
await run('sec-fundamentals', 'US annual fundamentals (10-K, XBRL)', 'sec-edgar', 'HISTORICAL', async () => {
  if (!CONTACT) throw new Error('the SEC_CONTACT_EMAIL repository variable is not set')
  const ua = `Global-Market-Observatory ${CONTACT}`
  const byTicker = new Map(Object.values(await get('https://www.sec.gov/files/company_tickers.json', ua)).map(c => [c.ticker, c]))
  const companies = [], unmapped = [], diagnostics = {}
  for (const [ticker, company] of US) {
    const c = byTicker.get(ticker)
    if (!c) throw new Error(`no CIK for ${ticker}, last good data kept`)
    await sleep(150)
    const facts = await get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(c.cik_str).padStart(10, '0')}.json`, ua)
    const x = extract(facts)
    if (!x) { unmapped.push(ticker); diagnostics[ticker] = diagnose(facts); console.warn(`${ticker}: no annual revenue found`, JSON.stringify(diagnostics[ticker])); continue }
    companies.push({ ticker, company, cik: c.cik_str, ...x })
    console.log(`${ticker}: FY ended ${x.fiscalYearEnd}, filed ${x.filed}, revenue ${x.metrics.revenue}, net income ${x.metrics.netIncome}, missing: ${x.missing.join(', ') || 'none'}`)
  }
  validateFundamentals(companies)
  await save('fundamentals.json', { source: 'sec-edgar', retrievedAt: now, schema: SCHEMA, unmapped, diagnostics, companies })
  return { asOf: companies.map(c => c.filed).sort().at(-1), records: companies.length, note: `latest 10-K per company, covers ${companies.length} of ${US.length}${unmapped.length ? `, no annual revenue found for ${unmapped.join(', ')}` : ''}` }
})

const { GITHUB_SERVER_URL: srv, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: id } = process.env
await save('meta/status.json', { generatedAt: now, runUrl: id ? `${srv}/${repo}/actions/runs/${id}` : undefined, datasets })
if (datasets.every(d => d.error)) process.exitCode = 1
