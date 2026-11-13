import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData, type CompaniesFile, type FundFile, type Profile } from '../data'
import { companyPath, filterCompanies, show } from '../lib/statement'

export default function Companies() {
  const prof = useData<CompaniesFile>('companies.json')
  const fund = useData<FundFile>('fundamentals.json')
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('All')
  const [industry, setIndustry] = useState('All')
  // Before the first profile refresh, the directory falls back to the fundamentals list.
  const list: Profile[] = prof.data?.companies ?? fund.data?.companies.map(c => ({ ticker: c.ticker, company: c.company, cik: c.cik, name: c.company, exchanges: [], industry: null, sic: null, website: null, fiscalYearEnd: null, country: null, state: null })) ?? []
  const opts = (k: 'country' | 'industry') => [...new Set(list.map(c => c[k]).filter((x): x is string => !!x))].sort()
  const rows = filterCompanies(list, q, country, industry)
  const sel = (label: string, value: string, set: (v: string) => void, options: string[]) => (
    <label>{label}<select value={value} onChange={e => set(e.target.value)}><option>All</option>{options.map(o => <option key={o}>{o}</option>)}</select></label>
  )
  return (
    <section className="first">
      <nav aria-label="Breadcrumb" className="crumbs"><Link to="/technology">Technology and AI</Link> / Companies</nav>
      <h1>Companies</h1>
      <p className="lede">Research pages built from SEC filings: annual statements, history, and corporate disclosures. No prices, because no licensed price source is connected.</p>
      {!list.length ? <p className="mute">{prof.loading || fund.loading ? 'Loading.' : 'The directory appears after the first successful data refresh.'}</p> : (
        <>
          <div className="filters">
            <label>Search<input type="search" value={q} placeholder="Name or ticker" onChange={e => setQ(e.target.value)} /></label>
            {sel('Country', country, setCountry, opts('country'))}
            {sel('Industry', industry, setIndustry, opts('industry'))}
          </div>
          <p className="note">{rows.length} of {list.length} companies.</p>
          <div className="tbl">
            <table>
              <thead><tr><th>Company</th><th>Ticker</th><th>Exchange</th><th>Country</th><th>Industry</th><th>Latest fiscal year</th><th>Revenue</th></tr></thead>
              <tbody>
                {rows.map(c => {
                  const f = fund.data?.companies.find(x => x.ticker === c.ticker)
                  return <tr key={c.ticker}><td><Link to={companyPath(c.ticker)}>{c.company}</Link></td><td>{c.ticker}</td><td>{c.exchanges.join(', ') || 'n/a'}</td><td>{c.country ?? 'n/a'}</td><td>{c.industry ?? 'n/a'}</td><td>{f?.fiscalYearEnd ?? 'n/a'}</td><td>{show(f?.metrics.revenue, 'usd')}</td></tr>
                })}
              </tbody>
            </table>
          </div>
          {!rows.length && <p>No company matches. <button onClick={() => { setQ(''); setCountry('All'); setIndustry('All') }}>Clear filters</button></p>}
        </>
      )}
    </section>
  )
}
