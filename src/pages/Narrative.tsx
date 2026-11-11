import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_NAMES, ago, categoriesOf, effStatus, etTime, itemText, useData, useStatus, type FilingsFile } from '../data'

const FORMS = ['8-K', '8-K/A', '10-K', '10-K/A', '10-Q', '10-Q/A']

export default function Narrative() {
  const { data, error, loading } = useData<FilingsFile>('filings.json')
  const ds = useStatus()?.datasets.find(d => d.id === 'sec-filings')
  const [co, setCo] = useState('All')
  const [form, setForm] = useState('All')
  const [cat, setCat] = useState('All')
  const events = data?.events ?? []
  const companies = [...new Set(events.map(e => e.ticker))].sort()
  const list = events.filter(e => (co === 'All' || e.ticker === co) && (form === 'All' || e.form === form) && (cat === 'All' || categoriesOf(e).includes(cat)))
  const sel = (label: string, value: string, set: (v: string) => void, opts: string[]) => (
    <label>{label}<select value={value} onChange={e => set(e.target.value)}><option>All</option>{opts.map(o => <option key={o}>{o}</option>)}</select></label>
  )
  return (
    <section className="first">
      <h1>The Narrative</h1>
      <p className="lede">The Market Intelligence Timeline: verified events, each with its original source. Today it covers US SEC filings only. A filing’s timing is never presented as causation, and categories come only from official 8-K item numbers.</p>
      {!data ? <p className="mute">{loading ? 'Loading.' : `No filings loaded yet (${error}). They appear after the first successful data refresh.`}</p> : (
        <>
          <div className="filters">
            {sel('Company', co, setCo, companies)}
            {sel('Filing type', form, setForm, FORMS)}
            {sel('Category', cat, setCat, CATEGORY_NAMES)}
          </div>
          <p className="note">
            {list.length} of {events.length} filings since {data.since}. {ds?.note}. Retrieved {ago(data.retrievedAt)} from <Link to="/methodology/sources/sec-edgar">SEC EDGAR</Link>.
            {ds && effStatus(ds) === 'STALE' ? ` Showing the last good data${ds.error ? `; the latest refresh failed (${ds.error})` : ''}.` : ''}
          </p>
          <ul className="plain">
            {list.map(e => (
              <li key={e.accession ?? e.url}>
                <b><a href={e.url}>{e.company} ({e.ticker}) filed Form {e.form}</a></b>{e.form.endsWith('/A') ? ' (amendment)' : ''}
                <div className="mute">
                  Filed {e.filed}, accepted {etTime(e.accepted)}
                  {e.period ? (e.form.startsWith('8-K') ? `, event date ${e.period}` : `, period ended ${e.period}`) : ''}
                  {e.cik ? `, CIK ${e.cik}` : ''}{e.accession ? `, accession ${e.accession}` : ''}. Source: SEC EDGAR.
                </div>
                <div>{itemText(e)}{` Category: ${categoriesOf(e).join(', ')}.`}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
