// Refreshes real data into public/data. Runs in GitHub Actions without secrets.
// A failed source keeps its last good file and is reported in meta/status.json.
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const OUT = 'public/data'
const CONTACT = process.env.SEC_CONTACT?.trim()
const now = new Date().toISOString()
const sleep = ms => new Promise(r => setTimeout(r, ms))
const read = async p => { try { return JSON.parse(await readFile(`${OUT}/${p}`, 'utf8')) } catch { return null } }
const save = (p, d) => writeFile(`${OUT}/${p}`, JSON.stringify(d) + '\n')
const get = async (url, ua) => {
  const r = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'application/json' } })
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
  return r.json()
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
  if (pts.length < 200) throw new Error(`unexpected response (${pts.length} usable points): ${JSON.stringify(j).slice(0, 160)}`)
  const asOf = pts.at(-1)[0]
  await save('fx.json', { source: 'frankfurter', base: 'USD', quote: 'INR', asOf, retrievedAt: now, dates: pts.map(p => p[0]), values: pts.map(p => p[1]) })
  return { asOf, records: pts.length }
})

// US filings: SEC EDGAR. Needs a declared User-Agent with a contact email and at most 10 requests per second.
const US = [['MSFT', 'Microsoft'], ['NVDA', 'NVIDIA'], ['GOOGL', 'Alphabet'], ['AMZN', 'Amazon'], ['META', 'Meta'], ['AAPL', 'Apple'], ['ORCL', 'Oracle'], ['ADBE', 'Adobe'], ['CRM', 'Salesforce'], ['NOW', 'ServiceNow'], ['PLTR', 'Palantir'], ['SNOW', 'Snowflake'], ['DDOG', 'Datadog'], ['NET', 'Cloudflare'], ['CRWD', 'CrowdStrike'], ['MDB', 'MongoDB'], ['AVGO', 'Broadcom'], ['AMD', 'AMD'], ['INTC', 'Intel'], ['IBM', 'IBM'], ['CSCO', 'Cisco']]
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
        if (!['8-K', '10-Q', '10-K'].includes(form) || r.filingDate[i] < since) return
        events.push({ ticker, company, form, filed: r.filingDate[i], accepted: r.acceptanceDateTime[i], period: r.reportDate[i] || null, items: form === '8-K' ? (r.items[i] || '').split(',').filter(Boolean) : [], url: `https://www.sec.gov/Archives/edgar/data/${c.cik_str}/${r.accessionNumber[i].replaceAll('-', '')}/${r.primaryDocument[i]}` })
      })
    } catch (e) { failed.push(ticker); console.warn(`${ticker}: ${e.message}`) }
  }
  if (failed.length > US.length / 2 || !events.length) throw new Error(`too few companies covered (failed: ${failed.join(', ') || 'none'}, filings found: ${events.length})`)
  events.sort((a, b) => b.accepted.localeCompare(a.accepted))
  await save('filings.json', { source: 'sec-edgar', retrievedAt: now, since, events })
  return { asOf: events[0].accepted, records: events.length, note: `covers ${US.length - failed.length} of ${US.length} companies, last 120 days` }
})

const { GITHUB_SERVER_URL: srv, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: id } = process.env
await save('meta/status.json', { generatedAt: now, runUrl: id ? `${srv}/${repo}/actions/runs/${id}` : undefined, datasets })
if (datasets.every(d => d.error)) process.exitCode = 1
