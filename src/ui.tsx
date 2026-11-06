import { Link } from 'react-router-dom'
import { STATUS_RULES, type Status } from './config'
import { pct } from './engine'

export const Tag = ({ s = 'DEMO' }: { s?: Status }) => (
  <span className={s === 'DEMO' ? 'tag demo' : 'tag'} title={STATUS_RULES[s]}>{s === 'DEMO' ? '◌' : '●'} {s}</span>
)
export const Chg = ({ r }: { r: number | null }) =>
  r === null ? <span className="mute">n/a</span> : <span className={r >= 0 ? 'up' : 'dn'}>{r >= 0 ? '▲' : '▼'} {pct(r)}</span>
export const SourceLine = ({ id = 'demo-fixtures' }: { id?: string }) => (
  <p className="src">
    Source: <Link to={`/methodology/sources/${id}`}>DEMO fixture generator</Link>, <Tag />, synthetic series normalised to 100.{' '}
    <Link to="/methodology/freshness/ledger">Freshness ledger</Link>
  </p>
)
export function Spark({ v }: { v: number[] }) {
  const w = 300, h = 64, lo = Math.min(...v), hi = Math.max(...v)
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * w},${h - 3 - ((x - lo) / (hi - lo || 1)) * (h - 6)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Synthetic DEMO series, normalised to 100">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
