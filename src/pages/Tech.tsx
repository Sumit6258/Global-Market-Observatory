import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BASKETS, LAYERS, PERIODS } from '../config'
import { basket, ret } from '../engine'
import { Chg, SourceLine, Spark, Tag } from '../ui'
import Fundamentals from './Fundamentals'

export default function Tech() {
  const [i, setI] = useState(0)
  const L = LAYERS[i]
  return (
    <>
      <section className="first">
        <h1>Technology and AI Intelligence</h1>
        <p className="lede">The technology economy by economic role. Rosters are a draft classification from the product brief; no classification dataset is connected yet. <Link to="/methodology/coverage/matrix">See coverage</Link>.</p>
        <div className="seg" role="group" aria-label="Value-chain layer">
          {LAYERS.map((l, k) => <button key={l.name} aria-pressed={i === k} onClick={() => setI(k)}>{k + 1}. {l.name}</button>)}
        </div>
        <p className="mute">{L.cats.join(', ')}</p>
        {L.roster.length ? (
          <div className="tbl">
            <table>
              <thead><tr><th>Company</th><th>Market</th><th>Role in this layer</th><th>Price data</th></tr></thead>
              <tbody>{L.roster.map(c => <tr key={c.n + c.role}><td>{c.n}</td><td>{c.m}</td><td>{c.role}</td><td><Tag s="UNAVAILABLE" /></td></tr>)}</tbody>
            </table>
          </div>
        ) : <p>No publicly listed businesses are assigned to this layer yet.</p>}
        {L.contextual && <p className="note">Private organizations, shown for context only and never in price tables: {L.contextual.join(', ')}.</p>}
      </section>

      <Fundamentals />

      {DEMO && <section>
        <h2>Technology Performance Baskets</h2>
        <p className="lede">Custom analytical baskets, not official indices. Equal-weighted and normalised to 100, here built on DEMO series.</p>
        <div className="cols">
          {BASKETS.map(b => {
            const c = basket(b.members)
            return (
              <div key={b.id}>
                <h3>{b.name} <span className="tag demo">Custom basket</span></h3>
                {c ? (
                  <>
                    <div className="sp"><Spark v={c.series.v} /></div>
                    <p>{PERIODS.map(p => <span key={p} className="pr">{p} <Chg r={ret(c.series, p)} /></span>)}</p>
                    <p className="note">{b.members.length} constituents, coverage {(c.coverage * 100).toFixed(0)}%. <Link to={`/methodology/baskets/${b.id}`}>Methodology</Link></p>
                  </>
                ) : <p>No value is published: coverage is below the threshold.</p>}
              </div>
            )
          })}
        </div>
        <SourceLine />
      </section>}
      {!DEMO && (
        <section>
          <h2>Technology Performance Baskets</h2>
          <p className="lede">Baskets need real price history, so they are switched off until a licensed price source is connected. Their definitions are on <Link to="/methodology/baskets/method">the methodology page</Link>.</p>
        </section>
      )}
    </>
  )
}
