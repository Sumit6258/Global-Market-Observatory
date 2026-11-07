import { Link } from 'react-router-dom'
import { PERIODS } from '../config'
import { ago, etTime, itemText, useData, type FilingsFile } from '../data'
import { ret } from '../engine'
import { Chg, Spark, Tag } from '../ui'

interface FxFile { asOf: string; retrievedAt: string; dates: string[]; values: number[] }

export function Fx() {
  const { data, error, loading } = useData<FxFile>('fx.json')
  if (!data) return <section><h2>USD/INR</h2><p className="mute">{loading ? 'Loading.' : `Not available yet (${error}). It appears after the first successful data refresh.`}</p></section>
  const s = { dates: data.dates.map(d => new Date(`${d}T12:00:00`)), v: data.values }
  const L = s.v.length - 1
  return (
    <section>
      <h2>USD/INR</h2>
      <p className="lede"><b>{s.v[L].toFixed(4)}</b> rupees per US dollar, <Chg r={ret(s, 'Today')} /></p>
      <div className="sp"><Spark v={s.v.slice(-253)} /></div>
      <p>{PERIODS.map(p => <span key={p} className="pr">{p} <Chg r={ret(s, p)} /></span>)}</p>
      <p className="src">Source: <Link to="/methodology/sources/frankfurter">Frankfurter</Link>, <Tag s="END-OF-DAY" />, daily reference rate as of {data.asOf}, retrieved {ago(data.retrievedAt)}. Not live. <Link to="/methodology/freshness/ledger">Freshness ledger</Link></p>
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
