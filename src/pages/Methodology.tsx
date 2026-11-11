import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BASKETS, INDIA_COVERAGE, LAYERS, LEDGER, LIMITATIONS, MARKETS, METRICS, MIN_COVERAGE, REVIEWED, SOURCES, STATUS_RULES, type Status } from '../config'
import { basket, hm, pct } from '../engine'
import { Tag } from '../ui'
import { ago, effStatus, useData, useStatus, type FundFile } from '../data'

const repo = import.meta.env.VITE_REPO as string | undefined
const TOC: [string, string, string][] = [
  ['guide', 'status', 'How to read this platform'], ['sources', 'registry', 'Data sources'], ['freshness', 'ledger', 'Data freshness'],
  ['baskets', 'method', 'Basket methodology'], ['metrics', 'defs', 'Metric definitions'], ['fundamentals', 'defs', 'Fundamentals definitions'], ['coverage', 'matrix', 'Classification and coverage'], ['coverage', 'india', 'Indian market coverage'],
  ['limitations', 'register', 'Known limitations'], ['policy', 'corrections', 'Policy and corrections'], ['attribution', 'licences', 'Attribution'],
]

export default function Methodology() {
  const { kind, id } = useParams()
  const st = useStatus()
  const fund = useData<FundFile>('fundamentals.json').data
  const target = kind && id ? `${kind}-${id}` : ''
  useEffect(() => { if (target) document.getElementById(target)?.scrollIntoView(); else window.scrollTo(0, 0) }, [target])
  const cl = (k: string) => 'entry' + (target === k ? ' hl' : '')
  const companies = new Set(LAYERS.flatMap(l => l.roster.map(c => c.n))).size
  const issue = repo ? `https://github.com/${repo}/issues/new?title=${encodeURIComponent('Data or methodology issue: ')}` : undefined

  return (
    <div className="meth">
      <nav className="toc" aria-label="On this page">
        <p className="mute">On this page</p>
        {TOC.map(([k, i, t]) => <div key={k}><Link to={`/methodology/${k}/${i}`}>{t}</Link></div>)}
      </nav>
      <article>
        <h1>Methodology and Data Sources</h1>
        <p className="lede">Where each number comes from, how old it is, how custom baskets are calculated, and what is missing. Last reviewed {REVIEWED}. The tables below are generated from the configuration the application runs on.</p>

        <section id="guide-status" className={cl('guide-status')}>
          <h2>How to read this platform</h2>
          <div className="tbl"><table><thead><tr><th>Status label</th><th>Assignment rule</th></tr></thead>
            <tbody>{Object.entries(STATUS_RULES).map(([s, r]) => <tr key={s}><td><Tag s={s as Status} /></td><td>{r}</td></tr>)}</tbody></table></div>
          <p>Each dataset stores its as-of time (when the observation was valid) and its retrieval time (when GitHub Actions fetched it). The provider’s own publication time is not captured. Age is measured from the as-of time.</p>
          <p>A basket is a custom analytical index built by this platform. It is not an official exchange index and is always labelled as such. Analytical statements are either a confirmed fact, a market observation or an interpretation, and event timing is never presented as causation.</p>
        </section>

        <section id="sources-registry" className={cl('sources-registry')}>
          <h2>Data sources</h2>
          <div className="tbl"><table>
            <thead><tr><th>Source</th><th>Supplies</th><th>Access</th><th>Delay</th><th>Credentials</th><th>Terms</th><th>Redistribution</th><th>Terms reviewed</th><th>Known issues</th><th>Used by</th></tr></thead>
            <tbody>{SOURCES.map(s => (
              <tr key={s.id} id={`sources-${s.id}`} className={cl(`sources-${s.id}`)}>
                <td>{s.name}</td><td>{s.supplies}</td><td>{s.access}</td><td>{s.delay}</td><td>{s.creds}</td><td>{s.terms}</td><td>{s.redistribution}</td><td>{s.reviewed}</td><td>{s.issues}</td><td>{s.features}</td>
              </tr>))}</tbody></table></div>
          <p className="note">A provider whose terms have not been reviewed is listed as such and is never omitted. No provider may require credentials.</p>
        </section>

        <section id="freshness-ledger" className={cl('freshness-ledger')}>
          <h2>Data freshness</h2>
          <div className="tbl"><table>
            <thead><tr><th>Dataset</th><th>Provider</th><th>Status</th><th>As-of</th><th>Retrieved</th><th>Age</th><th>Records</th><th>Last result</th></tr></thead>
            <tbody>{(st?.datasets ?? []).map(r => <tr key={r.id}><td>{r.name}{r.note ? `, ${r.note}` : ''}</td><td><Link to={`/methodology/sources/${r.source}`}>{r.source}</Link></td><td><Tag s={effStatus(r)} /></td><td>{r.asOf ?? 'none'}</td><td>{r.retrievedAt ?? 'none'}</td><td>{ago(r.asOf)}</td><td>{r.records}</td><td>{r.error ? `Failed ${r.failedAt}: ${r.error}. Showing the last good data.` : 'Succeeded'}</td></tr>)}{DEMO && LEDGER.map(r => <tr key={r.ds}><td>{r.ds}</td><td>{r.src}</td><td><Tag s={r.st} /></td><td>none</td><td>none</td><td>n/a</td><td>0</td><td>Synthetic</td></tr>)}{!st && <tr><td colSpan={8}>The status file has not been generated yet. Run the Refresh data workflow once.</td></tr>}</tbody></table></div>
          <p><b>Snapshot pipeline.</b> The Refresh data workflow runs twice a day. Scheduled runs can be delayed, skipped or paused, so the real last run is shown: {st ? <>{st.runUrl ? <a href={st.runUrl}>run</a> : 'run'} generated {st.generatedAt}, {ago(st.generatedAt)}.</> : 'not available yet.'} <b>Provider health.</b> A failed refresh keeps the last good file, and the table above reports the error.</p>
          <p><b>Market calendar.</b> Session hours in use: {Object.values(MARKETS).map(m => `${m.name} ${hm(m.open[0])} to ${hm(m.open[1])} (${m.tz})${m.pre !== undefined ? `, pre-market from ${hm(m.pre)}, after-hours until ${hm(m.after ?? 0)}` : ''}`).join('; ')}. Holiday calendars are not loaded.</p>
        </section>

        <section id="baskets-method" className={cl('baskets-method')}>
          <h2>Basket methodology</h2>
          {BASKETS.map(b => {
            const c = DEMO ? basket(b.members) : null
            const day = c ? c.last.reduce((a, x) => a + x.c, 0) : null
            const facts: [string, string][] = [
              ['Identity', `Custom analytical basket, not an official index. Methodology version ${b.version} (draft).`],
              ['Constituents', `${b.members.length} companies, ${b.market}, ${b.ccy}. Equal weight of ${(100 / b.members.length).toFixed(2)}% each. Last reconstitution: none.`],
              ['Inclusion criteria', b.criteria],
              ['Weighting', 'Equal-weighted, rebalanced daily. Market-cap weighting is not implemented because no market-cap source is connected.'],
              ['Return type', DEMO ? 'Price return on synthetic DEMO series. No corporate-action adjustments.' : 'Not computed. No licensed price history is connected.'],
              ['Rebalancing', 'Daily to equal weight. The reconstitution schedule and rules for delistings, mergers and ticker changes are not yet defined.'],
              ['Missing securities', `A value is published only when at least ${MIN_COVERAGE * 100}% of constituents have data.`],
              ['Currency', `${b.ccy} only. No conversion is offered.`],
              ['Calendar alignment', 'Single market, so not applicable.'],
              ['Benchmark', 'Not yet selected.'],
              ['Normalization', 'Base value 100 at the first date of the series.'],
              ['Latest calculation', DEMO ? 'Shown below with synthetic DEMO data.' : 'Not shown. No licensed price history is connected, and nothing is estimated.'],
              ['Back-test disclosure', 'History here is synthetic. With real history, membership chosen today carries survivorship and hindsight bias.'],
            ]
            return (
              <div key={b.id} id={`baskets-${b.id}`} className={cl(`baskets-${b.id}`)}>
                <h3>{b.name}</h3>
                <div className="tbl"><table><tbody>{facts.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table></div>
                {c && (
                  <div className="tbl"><table>
                    <caption>Latest calculation, DEMO data</caption>
                    <thead><tr><th>Constituent</th><th>Return</th><th>Contribution</th></tr></thead>
                    <tbody>{c.last.map(x => <tr key={x.n}><td>{x.n}</td><td>{pct(x.r)}</td><td>{pct(x.c)}</td></tr>)}
                      <tr><th>Basket</th><td></td><th>{pct(day)}</th></tr></tbody></table></div>
                )}
              </div>
            )
          })}
        </section>

        <section id="metrics-defs" className={cl('metrics-defs')}>
          <h2>Metric definitions</h2>
          {METRICS.map(m => (
            <div key={m.id} id={`metrics-${m.id}`} className={cl(`metrics-${m.id}`)}>
              <h3>{m.name}</h3><p><code>{m.formula}</code></p><p>{m.note}</p>
            </div>))}
        </section>

        <section id="fundamentals-defs" className={cl('fundamentals-defs')}>
          <h2>Fundamentals definitions</h2>
          <p>Annual figures only, from 10-K filings in SEC XBRL company facts. A flow item must cover a full year (350 to 380 days) and a balance item must be a point in time. Periods are identified by their dates, because the fy and fp fields in company facts describe the filing, not the fact. Every metric for a company comes from the same fiscal year as its revenue, and an item missing for that year is shown as n/a instead of being taken from an older year. When a year is restated, the latest filing wins. Values are absolute US dollars (EPS in dollars per share). Derived indicators use year-end balances, not averages, are calculated only when their inputs exist, and are dropped when the result is implausible. Total debt is not derived: long-term debt is the reported noncurrent amount only.</p>
          {fund ? (
            <div className="tbl"><table>
              <thead><tr><th>Group</th><th>Metric</th><th>XBRL concepts in priority order, or formula</th></tr></thead>
              <tbody>{fund.schema.map(x => <tr key={x.key}><td>{x.group}</td><td>{x.label}</td><td>{x.concepts ? x.concepts.join(', ') : x.formula}</td></tr>)}</tbody>
            </table></div>
          ) : <p className="mute">The definitions load with the first successful fundamentals refresh.</p>}
        </section>

        <section id="coverage-matrix" className={cl('coverage-matrix')}>
          <h2>Classification and coverage</h2>
          <p>No classification dataset is connected. Value-chain layers and the core, enabling and adjacent roles are draft judgments from the product brief. {companies} companies appear in the draft rosters. None has price quotes, price history or fundamentals yet. US filings cover the US names, as the freshness ledger states.</p>
        </section>

        <section id="coverage-india" className={cl('coverage-india')}>
          <h2>Indian market coverage</h2>
          <p>No Indian index or equity price source is connected. Authorised NSE and BSE vendors licence data for personal or internal use, and public display needs written approval from the exchanges and the vendor, so nothing is shown rather than anything estimated. USD/INR is foreign-exchange data, not NSE or BSE data.</p>
          <div className="tbl"><table>
            <thead><tr><th>Instrument</th><th>Exchange</th><th>Type</th><th>Data source</th><th>Latest observation</th><th>Status</th></tr></thead>
            <tbody>{INDIA_COVERAGE.map(i => <tr key={i.n}><td>{i.n}</td><td>{i.x}</td><td>{i.t}</td><td>None</td><td>None</td><td><span className="tag">NOT IMPLEMENTED</span></td></tr>)}</tbody>
          </table></div>
        </section>

        <section id="limitations-register" className={cl('limitations-register')}>
          <h2>Known limitations</h2>
          <div className="tbl"><table><thead><tr><th>Limitation</th><th>Affects</th><th>Status</th></tr></thead>
            <tbody>{LIMITATIONS.map(l => <tr key={l.id} id={`limitations-${l.id}`} className={cl(`limitations-${l.id}`)}><td>{l.text}</td><td>{l.affects}</td><td>{l.status}</td></tr>)}</tbody></table></div>
        </section>

        <section id="policy-corrections" className={cl('policy-corrections')}>
          <h2>Policy and corrections</h2>
          <p><b>Event policy.</b> An event is listed only with a headline, company or industry, event date, publication timestamp, named source, factual description and the original URL. No unsourced summaries and no causal claims.</p>
          <p><b>Change log.</b> 2026-11-11: annual US fundamentals from SEC XBRL company facts, with statements and derived indicators. 2026-11-10: audit fixes, calendar-based USD/INR returns, STALE status, validated refreshes, filing amendments and 8-K categories, synthetic basket calculation removed from production, Indian coverage report. 2026-11-07: real data pipeline (Frankfurter FX and SEC EDGAR filings) and the live freshness ledger. 2026-11-06: first build with synthetic DEMO data.</p>
          <p><b>Corrections.</b> {issue ? <a href={issue}>Report a data or methodology issue</a> : 'The issue link appears once the site is built in GitHub Actions.'}</p>
        </section>

        <section id="attribution-licences" className={cl('attribution-licences')}>
          <h2>Attribution</h2>
          <p>Built with React and React Router, both MIT licensed. Fonts are system fonts. Data: exchange rates from Frankfurter (blended central-bank reference rates) and filings from SEC EDGAR. No third-party logos are used. Disclaimer: this platform is for financial information and research and is not individualized investment advice.</p>
        </section>
      </article>
    </div>
  )
}
