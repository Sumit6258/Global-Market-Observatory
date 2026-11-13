import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ago, useData, type FundCo, type FundFile } from '../data'
import { companyPath, show } from '../lib/statement'

const val = (c: FundCo, k: string) => c.derived[k] ?? c.metrics[k] ?? null
const COLS: [string, string][] = [['revenue', 'Revenue'], ['revenueGrowth', 'Revenue growth'], ['operatingMargin', 'Operating margin'], ['netIncome', 'Net income'], ['freeCashFlow', 'Free cash flow'], ['longTermDebt', 'Long-term debt']]

export default function Fundamentals() {
  const { data, error, loading } = useData<FundFile>('fundamentals.json')
  const [t, setT] = useState('')
  if (!data) return <section><h2>US company fundamentals</h2><p className="mute">{loading ? 'Loading.' : `Not available yet (${error}). It appears after the first successful data refresh.`}</p></section>
  const kind = (k: string) => data.schema.find(x => x.key === k)?.kind ?? 'usd'
  const sel = data.companies.find(c => c.ticker === t) ?? data.companies[0]
  const groups = [...new Set(data.schema.map(x => x.group))]
  return (
    <section>
      <h2>US company fundamentals</h2>
      <p className="lede">Annual figures from each company’s latest 10-K, in US dollars. These are SEC filings, not a price feed. n/a means the filing does not report the item or it could not be calculated.</p>
      <div className="tbl">
        <table>
          <thead><tr><th>Company</th><th>Market</th><th>Fiscal year ended</th>{COLS.map(([k, l]) => <th key={k}>{l}</th>)}<th>10-K filed</th></tr></thead>
          <tbody>
            {data.companies.map(c => (
              <tr key={c.ticker}>
                <td><Link to={companyPath(c.ticker)}>{c.company}</Link> ({c.ticker})</td><td>US</td><td>{c.fiscalYearEnd}</td>
                {COLS.map(([k]) => <td key={k}>{show(val(c, k), kind(k))}</td>)}
                <td className="nw"><a href={`https://www.sec.gov/Archives/edgar/data/${c.cik}/${c.accession.replace(/-/g, '')}/${c.accession}-index.htm`}>{c.filed}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="filters">
        <label>Company detail<select value={sel.ticker} onChange={e => setT(e.target.value)}>{data.companies.map(c => <option key={c.ticker} value={c.ticker}>{c.company} ({c.ticker})</option>)}</select></label>
      </div>
      {groups.map(g => (
        <div className="tbl" key={g}>
          <table>
            <caption>{sel.company}, {g.toLowerCase()}, fiscal year ended {sel.fiscalYearEnd}</caption>
            <tbody>{data.schema.filter(x => x.group === g).map(x => <tr key={x.key}><th>{x.label}</th><td>{show(val(sel, x.key), x.kind)}</td><td className="mute">{x.formula ?? `XBRL ${sel.concepts[x.key] ?? 'not reported'}`}</td></tr>)}</tbody>
          </table>
        </div>
      ))}
      <p className="src">
        Source: <Link to="/methodology/sources/sec-edgar">SEC EDGAR XBRL company facts</Link>, retrieved {ago(data.retrievedAt)}. Formulas and period rules are on <Link to="/methodology/fundamentals/defs">the methodology page</Link>. Annual only, with no quarterly or trailing-twelve-month values.
        {data.unmapped.length ? ` No annual revenue found for ${data.unmapped.join(', ')}.` : ''}
      </p>
    </section>
  )
}
