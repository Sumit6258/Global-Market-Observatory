import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chart } from '../lib/charts'
import { STATEMENTS, edgarCompanyUrl, filingUrl, fiscalYearEndLabel, seriesOf, shortUsd, show, statementRows, yearsOf, type Statement } from '../lib/statement'
import { ago, categoriesOf, effStatus, etTime, itemText, useData, useStatus, type CompaniesFile, type FilingsFile, type FundFile } from '../data'
import { Tag } from '../ui'

const FILTERS = ['All', '8-K', '10-Q', '10-K', 'Amendments']
const href = (w: string) => (/^https?:\/\//i.test(w) ? w : `https://${w}`)
const pct = (v: number) => show(v, 'pct')

export default function Company() {
  const T = (useParams().ticker ?? '').toUpperCase()
  const fund = useData<FundFile>('fundamentals.json')
  const prof = useData<CompaniesFile>('companies.json')
  const fil = useData<FilingsFile>('filings.json')
  const st = useStatus()
  const [tab, setTab] = useState<Statement>('Income statement')
  const [flt, setFlt] = useState('All')
  const co = fund.data?.companies.find(c => c.ticker === T)
  const pr = prof.data?.companies.find(c => c.ticker === T)
  if (!co && !pr) {
    const wait = fund.loading || prof.loading
    return (
      <section className="first">
        <h1>{wait ? 'Loading' : 'Company not found'}</h1>
        {!wait && <p>There is no data for {T || 'this company'}. <Link to="/companies">Browse the company directory</Link>. Company data appears after the first successful refresh.</p>}
      </section>
    )
  }
  const name = co?.company ?? pr?.company ?? T
  const cik = co?.cik ?? pr?.cik
  const ys = co ? yearsOf(co) : []
  const rows = co && fund.data ? statementRows(fund.data.schema, ys, tab) : []
  const events = (fil.data?.events ?? []).filter(e => e.ticker === T && (flt === 'All' || (flt === 'Amendments' ? e.form.endsWith('/A') : e.form === flt)))
  const ds = st?.datasets.find(d => d.id === 'sec-fundamentals')
  const facts: [string, ReactNode][] = [
    ['Ticker', T], ['SEC registrant name', pr?.name ?? 'Not provided'], ['CIK', cik ?? 'Not provided'],
    ['Exchange', pr?.exchanges.join(', ') || 'Not provided'],
    ['Country', pr?.country ?? 'Not provided'],
    ['Industry (SEC SIC)', pr?.industry ? `${pr.industry}${pr.sic ? `, SIC ${pr.sic}` : ''}` : 'Not provided'],
    ['Fiscal year end', fiscalYearEndLabel(pr?.fiscalYearEnd) ?? 'Not provided'],
    ['Website', pr?.website ? <a href={href(pr.website)} rel="noopener noreferrer">{pr.website}</a> : 'Not provided by the SEC data'],
    ['Business description', 'Not shown. The SEC data in use has no verified description text.'],
  ]
  const chart = (title: string, key: string, from: 'metrics' | 'derived', kind: 'bar' | 'line', fmt: (v: number) => string) =>
    <Chart title={title} points={seriesOf(ys, key, from)} kind={kind} fmt={fmt} />
  return (
    <>
      <section className="first">
        <nav aria-label="Breadcrumb" className="crumbs"><Link to="/technology">Technology and AI</Link> / <Link to="/companies">Companies</Link> / {name}</nav>
        <h1>{name} <span className="mute">({T})</span></h1>
        <dl className="facts">{facts.map(([k, v]) => <div className="fact" key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </section>

      <section>
        <h2>Financial statements</h2>
        {!co || !fund.data ? <p className="mute">Annual statements are not available yet. They appear after the first successful fundamentals refresh.</p> : (
          <>
            <p className="lede">Annual figures from the 10-K, in US dollars. These are filings, not real-time data. n/a means the company does not report the item for that year.</p>
            <div className="seg" role="group" aria-label="Statement">{STATEMENTS.map(s => <button key={s} aria-pressed={tab === s} onClick={() => setTab(s)}>{s}</button>)}</div>
            <div className="tbl stmt">
              <table>
                <caption>{name}, {tab.toLowerCase()}, annual</caption>
                <thead><tr><th>Item</th>{ys.map(y => <th key={y.fiscalYearEnd}>FY ended {y.fiscalYearEnd}<br /><a href={filingUrl(co.cik, y.accession)}>10-K filed {y.filed}</a></th>)}</tr></thead>
                <tbody>{rows.map(r => <tr key={r.key}><th scope="row">{r.label}{r.note ? <span className="mute"> (calculated)</span> : ''}</th>{r.cells.map((v, i) => <td key={i}>{show(v, r.kind)}</td>)}</tr>)}</tbody>
              </table>
            </div>
            {rows.some(r => r.note) && <ul className="note">{rows.filter(r => r.note).map(r => <li key={r.key}>{r.label}: {r.note}</li>)}</ul>}
          </>
        )}
      </section>

      {co && (
        <section>
          <h2>Financial history</h2>
          <p className="note">Validated annual observations only, oldest to newest, up to six consecutive fiscal years.</p>
          <div className="charts">
            {chart('Revenue', 'revenue', 'metrics', 'bar', shortUsd)}
            {chart('Net income', 'netIncome', 'metrics', 'bar', shortUsd)}
            {chart('Operating margin', 'operatingMargin', 'derived', 'line', pct)}
            {chart('Free cash flow', 'freeCashFlow', 'derived', 'bar', shortUsd)}
            {chart('Revenue growth', 'revenueGrowth', 'derived', 'line', pct)}
          </div>
        </section>
      )}

      <section>
        <h2>Corporate disclosures</h2>
        <div className="seg" role="group" aria-label="Filing type">{FILTERS.map(x => <button key={x} aria-pressed={flt === x} onClick={() => setFlt(x)}>{x}</button>)}</div>
        {!fil.data ? <p className="mute">{fil.loading ? 'Loading.' : 'Filings are not available yet.'}</p> : (
          <>
            <p className="note">{events.length} filings in the last 120 days that the refresh keeps. {cik ? <a href={edgarCompanyUrl(cik)}>All filings on SEC EDGAR</a> : null}</p>
            <ul className="plain">
              {events.map(e => (
                <li key={e.accession ?? e.url}>
                  <b><a href={e.url}>Form {e.form}{e.form.endsWith('/A') ? ' (amendment)' : ''}</a></b>
                  <div className="mute">Filed {e.filed}, accepted {etTime(e.accepted)}{e.accession ? `, accession ${e.accession}` : ''}. Source: SEC EDGAR.</div>
                  <div>{itemText(e)} Category: {categoriesOf(e).join(', ')}.</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <h2>Data provenance</h2>
        <dl className="facts">
          {([
            ['Financial data provider', <>SEC EDGAR: XBRL company facts and submissions. <Link to="/methodology/sources/sec-edgar">Source entry</Link></>],
            ['Latest reported fiscal year', co ? <>FY ended {ys[0].fiscalYearEnd}, 10-K filed {ys[0].filed}, <a href={filingUrl(co.cik, ys[0].accession)}>original filing</a></> : 'Not available yet'],
            ['Last successful retrieval', `Statements ${ago(fund.data?.retrievedAt)}, profile ${ago(prof.data?.retrievedAt)}, filings ${ago(fil.data?.retrievedAt)}`],
            ['Data status', ds ? <><Tag s={effStatus(ds)} /> {ds.error ? `The latest refresh failed (${ds.error}); this is the last good data.` : ''} <Link to="/methodology/freshness/ledger">Freshness ledger</Link></> : 'Status not available yet'],
          ] as [string, ReactNode][]).map(([k, v]) => <div className="fact" key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <p><b>Known limitations.</b> <Link to="/methodology/limitations/company-pages">Read all</Link></p>
        <ul>
          <li>Annual statements only, so they are not current. There are no quarterly or trailing-twelve-month figures.</li>
          <li>An item a company does not report shows n/a. Nothing is estimated.</li>
          <li>Free cash flow is operating cash flow minus gross capital expenditure and can differ from the company’s own measure.</li>
          <li>No stock price, P/E ratio or market capitalisation, because no licensed price source is connected.</li>
        </ul>
      </section>
    </>
  )
}
