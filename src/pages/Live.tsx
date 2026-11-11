import { Link } from 'react-router-dom'
import { PERIODS } from '../config'
import { ago, effStatus, etTime, itemText, useData, useStatus, type FilingsFile } from '../data'
import { retDate } from '../engine'
import { Chg, Spark, Tag } from '../ui'

interface FxFile { asOf: string; retrievedAt: string; dates: string[]; values: number[] }

export function Fx() {
  const { data, error, loading } = useData<FxFile>('fx.json')
  const ds = useStatus()?.datasets.find(d => d.id === 'fx-usd-inr')
  if (!data) return <section><h2>USD/INR</h2><p className="mute">{loading ? 'Loading.' : `Not available yet (${error}). It appears after the first successful data refresh.`}</p></section>
  const v = data.values
  const L = v.length - 1
  return (
    <section>
      <h2>USD/INR</h2>
      <p className="lede"><b>{v[L].toFixed(4)}</b> rupees per US dollar, <Chg r={retDate(data.dates, v, 'Today')} /></p>
      <div className="sp"><Spark v={v.slice(-366)} /></div>
      <p>{PERIODS.map(p => <span key={p} className="pr">{p} <Chg r={retDate(data.dates, v, p)} /></span>)}</p>
      <p className="src">Source: <Link to="/methodology/sources/frankfurter">Frankfurter</Link>, <Tag s={ds ? effStatus(ds) : 'END-OF-DAY'} />, daily reference rate as of {data.asOf}, retrieved {ago(data.retrievedAt)}. Not live.{ds?.error ? ' The latest refresh failed, so this is the last good data.' : ''} Calendar-day windows, weekends included. <Link to="/methodology/freshness/ledger">Freshness ledger</Link></p>
    </section>
  )
}

export function Changes({ limit = 8 }: { limit?: number }) {
  const { data, error, loading } = useData<FilingsFile>('filings.json')
  if (!data) return <p className="mute">{loading ? 'Loading.' : `No filings loaded yet (${error}). They appear after the first successful data refresh.`}</p>
  return (
    <>
      <ul className="plain">
        {data.events.slice(0, limit).map(e => (
          <li key={e.url}><a href={e.url}>{e.company} filed Form {e.form}</a> <span className="mute">{etTime(e.accepted)}</span><br />{itemText(e)}</li>
        ))}
      </ul>
      <p className="src">Source: <Link to="/methodology/sources/sec-edgar">SEC EDGAR</Link>, retrieved {ago(data.retrievedAt)}. A filing’s timing is not causation. <Link to="/narrative">All filings</Link></p>
    </>
  )
}
