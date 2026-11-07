import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ago, etTime, itemText, useData, useStatus, type FilingsFile } from '../data'

const FORMS = ['All', '8-K', '10-Q', '10-K']

export default function Narrative() {
  const { data, error, loading } = useData<FilingsFile>('filings.json')
  const ds = useStatus()?.datasets.find(d => d.id === 'sec-filings')
  const [f, setF] = useState('All')
  const list = (data?.events ?? []).filter(e => f === 'All' || e.form === f)
  return (
    <section className="first">
      <h1>The Narrative</h1>
      <p className="lede">The Market Intelligence Timeline: verified events, each with its original source. Today it covers US SEC filings only. A filing’s timing is never presented as causation.</p>
      {!data ? <p className="mute">{loading ? 'Loading.' : `No filings loaded yet (${error}). They appear after the first successful data refresh.`}</p> : (
        <>
          <div className="seg" role="group" aria-label="Filing type">
            {FORMS.map(x => <button key={x} aria-pressed={f === x} onClick={() => setF(x)}>{x}</button>)}
          </div>
          <p className="note">{list.length} filings since {data.since}. {ds?.note}. Retrieved {ago(data.retrievedAt)} from <Link to="/methodology/sources/sec-edgar">SEC EDGAR</Link>.{ds?.error ? ` The latest refresh failed (${ds.error}); this is the last good data.` : ''}</p>
          <ul className="plain">
            {list.map(e => (
              <li key={e.url}>
                <b><a href={e.url}>{e.company} filed Form {e.form}</a></b>
                <div className="mute">{e.ticker}, event date {e.filed}, published {etTime(e.accepted)}, source SEC EDGAR</div>
                <div>{itemText(e)}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
