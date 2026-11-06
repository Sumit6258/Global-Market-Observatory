import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BASKETS, MARKETS, PERIODS, SECTORS, brand } from '../config'
import { basket, demoSeries, localTime, ret, session } from '../engine'
import { Chg, SourceLine, Tag } from '../ui'

type MK = 'india' | 'us'
const KEYS: MK[] = ['india', 'us']

function useNow() {
  const [n, set] = useState(new Date())
  useEffect(() => { const t = setInterval(() => set(new Date()), 30000); return () => clearInterval(t) }, [])
  return n
}

export default function Pulse() {
  const now = useNow()
  const [mk, setMk] = useState<MK>('india')
  const [per, setPer] = useState('1 Month')
  const rows = SECTORS.map(s => ({ s, r: ret(demoSeries(`${mk}:${s}`), per) })).sort((a, b) => (b.r ?? 0) - (a.r ?? 0))
  const max = Math.max(...rows.map(x => Math.abs(x.r ?? 0)), 1e-4)
  return (
    <>
      <div className="hero">
        <div>
          <p className="mute">{now.toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
          <h1>{brand.tagline}</h1>
          <p className="lede">No verified market summary is available, because no live data provider is connected in this build. <Link to="/methodology/limitations/no-live-data">See the limitation</Link>.</p>
        </div>
        <div className="sessions">
          {KEYS.map(k => <p key={k}><b>{MARKETS[k].name}</b>, {localTime(MARKETS[k].tz, now)}<br /><span className="mute">{session(MARKETS[k], now)}</span></p>)}
          <p className="mute">Last successful data update: none, no live provider is connected.</p>
        </div>
      </div>

      <section>
        <h2>Global Market Pulse</h2>
        <div className="cols">
          {KEYS.map(k => (
            <div key={k}>
              <h3>{MARKETS[k].name}</h3>
              {MARKETS[k].indices.map(n => {
                const s = demoSeries(`idx:${n}`, 0.008), L = s.v.length - 1, d = s.v[L] - s.v[L - 1]
                return (
                  <div className="row" key={n}>
                    <span>{n}</span><b>{s.v[L].toFixed(2)}</b>
                    <span className={d >= 0 ? 'up' : 'dn'}>{d >= 0 ? '+' : '−'}{Math.abs(d).toFixed(2)}</span>
                    <Chg r={ret(s, 'Today')} /><Tag />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <SourceLine />
      </section>

      <section id="landscape">
        <h2>The Market Landscape</h2>
        <div className="seg" role="group" aria-label="Market">
          {KEYS.map(k => <button key={k} aria-pressed={mk === k} onClick={() => setMk(k)}>{MARKETS[k].name}</button>)}
        </div>
        <div className="seg" role="group" aria-label="Period">
          {PERIODS.map(p => <button key={p} aria-pressed={per === p} onClick={() => setPer(p)}>{p}</button>)}
        </div>
        <ol className="bars">
          {rows.map(({ s, r }) => (
            <li key={s}>
              <span>{s}</span>
              <span className="track"><i className={r !== null && r < 0 ? 'dn' : 'up'} style={{ width: `${(Math.abs(r ?? 0) / max) * 100}%` }} /></span>
              <Chg r={r} />
            </li>
          ))}
        </ol>
        <p className="note">How this is calculated: one synthetic series per sector, ranked by {per} return using <Link to="/methodology/metrics/period-returns">the shared period definition</Link>. Coverage: no constituents, the series are synthetic.</p>
        <SourceLine />
      </section>

      <section>
        <h2>What Changed?</h2>
        <p className="lede">Nothing to show. No event provider is connected, and this section lists only events that carry a source, a timestamp and a company or sector association. <Link to="/methodology/policy/corrections">Event policy</Link></p>
      </section>

      <section>
        <h2>Technology and AI Focus</h2>
        <ul className="plain">
          {BASKETS.map(b => {
            const c = basket(b.members)
            return (
              <li key={b.id}>
                <Link to="/technology">{b.name}</Link> <Chg r={c ? ret(c.series, '1 Month') : null} /> <Tag />{' '}
                <span className="mute">Custom basket, not an official index. <Link to={`/methodology/baskets/${b.id}`}>How it is calculated</Link></span>
              </li>
            )
          })}
        </ul>
        <p><Link to="/technology">Explore the technology value chain</Link></p>
      </section>

      <section>
        <h2>Sources and method</h2>
        <p>Every figure on this page comes from <Link to="/methodology/sources/demo-fixtures">the DEMO fixture generator</Link>. There is no live market data here to age, rank or explain. <Link to="/methodology">Open Methodology and Data Sources</Link> for the source registry, the freshness ledger, basket formulas and known limitations.</p>
      </section>
    </>
  )
}
