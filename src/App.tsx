import { useState, type ReactNode } from 'react'
import { HashRouter, MemoryRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { LEDGER, brand } from './config'
import { Tag } from './ui'
import Pulse from './pages/Pulse'
import Tech from './pages/Tech'
import Narrative from './pages/Narrative'
import Methodology from './pages/Methodology'

// Hash routing keeps direct refreshes working on GitHub Pages. The single-file preview uses in-memory routing.
const R = ({ children }: { children: ReactNode }) => (import.meta.env.VITE_PREVIEW ? <MemoryRouter>{children}</MemoryRouter> : <HashRouter>{children}</HashRouter>)

function Shell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark')
  const toggle = () => {
    const t = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = t
    try { localStorage.setItem('theme', t) } catch { /* storage unavailable */ }
    setDark(!dark)
  }
  return (
    <>
      <div className="demo-bar" role="status">
        Demo build. Every figure is a synthetic fixture, not market data. <Link to="/methodology/limitations/no-live-data">Why</Link>
      </div>
      <header className="top">
        <div className="wrap bar">
          <Link className="brand" to="/">{brand.name}</Link>
          <nav aria-label="Primary">
            <NavLink to="/" end>The Pulse</NavLink>
            <NavLink to="/technology">Technology and AI</NavLink>
            <NavLink to="/narrative">The Narrative</NavLink>
          </nav>
          <div className="util">
            <Link to="/methodology">Methodology</Link>
            <details className="ds">
              <summary aria-label="Data status"><Tag /></summary>
              <div className="pop">
                {LEDGER.map(r => <div className="prow" key={r.ds}><span>{r.ds}</span><Tag s={r.st} /></div>)}
                <Link to="/methodology/freshness/ledger">Open the full ledger</Link>
              </div>
            </details>
            <button onClick={toggle} aria-pressed={dark}>Dark theme</button>
          </div>
        </div>
      </header>
      <main className="wrap">{children}</main>
      <footer>
        <div className="wrap">
          <p><Link to="/methodology">Methodology and Data Sources</Link>, <Link to="/methodology/sources/registry">Data sources</Link>, <Link to="/methodology/freshness/ledger">Data freshness</Link>, <Link to="/methodology/baskets/method">Basket methodology</Link>, <Link to="/methodology/metrics/defs">Metric definitions</Link>, <Link to="/methodology/limitations/register">Known limitations</Link>, <Link to="/methodology/attribution/licences">Attribution</Link></p>
          <p>This platform is for financial information and research. It is not individualized investment advice.</p>
        </div>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <R>
      <Shell>
        <Routes>
          <Route path="/" element={<Pulse />} />
          <Route path="/technology" element={<Tech />} />
          <Route path="/narrative" element={<Narrative />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/methodology/:kind/:id" element={<Methodology />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </R>
  )
}
