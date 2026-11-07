import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BASKETS, LAYERS, LEDGER, LIMITATIONS, MARKETS, METRICS, MIN_COVERAGE, REVIEWED, SOURCES, STATUS_RULES, type Status } from '../config'
import { basket, hm, pct } from '../engine'
import { Tag } from '../ui'
import { DEMO, ago, useStatus } from '../data'

const repo = import.meta.env.VITE_REPO as string | undefined
const TOC: [string, string, string][] = [
  ['guide', 'status', 'How to read this platform'], ['sources', 'registry', 'Data sources'], ['freshness', 'ledger', 'Data freshness'],
  ['baskets', 'method', 'Basket methodology'], ['metrics', 'defs', 'Metric definitions'], ['coverage', 'matrix', 'Classification and coverage'],
  ['limitations', 'register', 'Known limitations'], ['policy', 'corrections', 'Policy and corrections'], ['attribution', 'licences', 'Attribution'],
]

export default function Methodology() {
  const { kind, id } = useParams()
  const st = useStatus()
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
          <p>Every observation carries three timestamps: the exchange as-of time, the provider time and the retrieval time. Data age is measured from the exchange as-of time.</p>
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
            <thead><tr><th>Dataset</th><th>Source</th><th>Status</th><th>Exchange as-of</th><th>Age</th></tr></thead>
            <tbody>{(st?.datasets ?? []).map(r => <tr key={r.id}><td>{r.name}{r.note ? `, ${r.note}` : ''}{r.error ? `. Last refresh failed, showing the last good data: ${r.error}` : ''}</td><td><Link to={`/methodology/sources/${r.source}`}>{r.source}</Link></td><td><Tag s={r.status} /></td><td>{r.asOf ?? 'none'}</td><td>{ago(r.asOf)}</td></tr>)}{DEMO && LEDGER.map(r => <tr key={r.ds}><td>{r.ds}</td><td>{r.src === 'none' ? 'No source' : <Link to={`/methodology/sources/${r.src}`}>{r.src}</Link>}</td><td><Tag s={r.st} /></td><td>none</td><td>n/a</td></tr>)}{!st && <tr><td colSpan={5}>The status file has not been generated yet. Run the Refresh data workflow once.</td></tr>}</tbody></table></div>
          <p><b>Snapshot pipeline.</b> The Refresh data workflow runs twice a day. Scheduled runs can be delayed, skipped or paused, so the real last run is shown: {st ? <>{st.runUrl ? <a href={st.runUrl}>run</a> : 'run'} generated {st.generatedAt}, {ago(st.generatedAt)}.</> : 'not available yet.'} <b>Provider health.</b> A failed refresh keeps the last good file, and the table above reports the error.</p>
          <p><b>Market calendar.</b> Session hours in use: {Object.values(MARKETS).map(m => `${m.name} ${hm(m.open[0])} to ${hm(m.open[1])} (${m.tz})${m.pre !== undefined ? `, pre-market from ${hm(m.pre)}, after-hours until ${hm(m.after ?? 0)}` : ''}`).join('; ')}. Holiday calendars are not loaded.</p>
        </section>

        <section id="baskets-method" className={cl('baskets-method')}>
          <h2>Basket methodology</h2>
          {BASKETS.map(b => {
            const c = basket(b.members)
            const day = c ? c.last.reduce((a, x) => a + x.c, 0) : null
            const facts: [string, string][] = [
              ['Identity', `Custom analytical basket, not an official index. Methodology version ${b.version} (draft).`],
              ['Constituents', `${b.members.length} companies, ${b.market}, ${b.ccy}. Equal weight of ${(100 / b.members.length).toFixed(2)}% each. Last reconstitution: none.`],
              ['Inclusion criteria', b.criteria],
              ['Weighting', 'Equal-weighted, rebalanced daily. Market-cap weighting is not implemented because no market-cap source is connected.'],
              ['Return type', 'Price return on synthetic DEMO series. No corporate-action adjustments.'],
              ['Rebalancing', 'Daily to equal weight. The reconstitution schedule and rules for delistings, mergers and ticker changes are not yet defined.'],
              ['Missing securities', `A value is published only when at least ${MIN_COVERAGE * 100}% of constituents have data.`],
              ['Currency', `${b.ccy} only. No conversion is offered.`],
              ['Calendar alignment', 'Single market, so not applicable.'],
              ['Benchmark', 'Not yet selected.'],
              ['Normalization', 'Base value 100 at the first date of the series.'],
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

        <section id="coverage-matrix" className={cl('coverage-matrix')}>
          <h2>Classification and coverage</h2>
          <p>No classification dataset is connected. Value-chain layers and the core, enabling and adjacent roles are draft judgments from the product brief. {companies} companies appear in the draft rosters. None has price quotes, price history or fundamentals yet. US filings cover the US names, as the freshness ledger states.</p>
        </section>

        <section id="limitations-register" className={cl('limitations-register')}>
          <h2>Known limitations</h2>
          <div className="tbl"><table><thead><tr><th>Limitation</th><th>Affects</th><th>Status</th></tr></thead>
            <tbody>{LIMITATIONS.map(l => <tr key={l.id} id={`limitations-${l.id}`} className={cl(`limitations-${l.id}`)}><td>{l.text}</td><td>{l.affects}</td><td>{l.status}</td></tr>)}</tbody></table></div>
        </section>

        <section id="policy-corrections" className={cl('policy-corrections')}>
          <h2>Policy and corrections</h2>
          <p><b>Event policy.</b> An event is listed only with a headline, company or industry, event date, publication timestamp, named source, factual description and the original URL. No unsourced summaries and no causal claims.</p>
          <p><b>Change log.</b> {REVIEWED}: real data pipeline (Frankfurter FX and SEC EDGAR filings), live freshness ledger, synthetic figures switched off. 2026-11-06: first build with synthetic DEMO data, source registry, basket methodology and metric definitions.</p>
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
