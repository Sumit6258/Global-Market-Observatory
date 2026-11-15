import { Link } from 'react-router-dom'
import { BASKETS, PERIODS } from '../config'
import { basket, ret } from '../engine'
import { Chg, SourceLine, Spark, Tag } from '../ui'
import Fundamentals from './Fundamentals'
import { LAYERS } from '../data/technology-ecosystem'
import { registryStats } from '../lib/ecosystem'

export default function Tech() {
  const s = registryStats()
  return (
    <>
      <section className="first">
        <h1>Technology and AI Intelligence</h1>
        <p className="lede">The technology economy by economic role, from chips to services. Explore how the seven layers connect, who operates in each, and open a company’s research page.</p>
        <p><Link className="cta" to="/technology-ecosystem">Open the Technology and AI ecosystem</Link></p>
        <ol className="plain">{LAYERS.map(l => <li key={l.n}>{l.n}. {l.name}</li>)}</ol>
        <p className="note">{s.entities} entities and {s.relations} relationships. Sources are identified for each, but {s.entities - s.checked} entities have not been checked against them. <Link to="/methodology/coverage/matrix">See coverage</Link></p>
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
