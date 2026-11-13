import { useState, type ReactNode } from 'react'
import { HashRouter, MemoryRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { LEDGER, brand } from './config'
import { Tag } from './ui'
import { effStatus, useStatus } from './data'
import Pulse from './pages/Pulse'
import Tech from './pages/Tech'
import Narrative from './pages/Narrative'
import Methodology from './pages/Methodology'
import Companies from './pages/Companies'
import Company from './pages/Company'

// Hash routing keeps direct refreshes working on GitHub Pages. The single-file preview uses in-memory routing.
const R = ({ children }: { children: ReactNode }) => (import.meta.env.VITE_PREVIEW ? <MemoryRouter>{children}</MemoryRouter> : <HashRouter>{children}</HashRouter>)

function Shell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark')
  const st = useStatus()
  const [open, setOpen] = useState(false)
  const toggle = () => {
    const t = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = t
    try { localStorage.setItem('theme', t) } catch { /* storage unavailable */ }
    setDark(!dark)
  }
  return (
    <>
      <div className="demo-bar" role="status">
        {DEMO ? 'Demo build. Every figure is a synthetic fixture, not market data. ' : 'Delayed and end-of-day data from public sources, refreshed on a schedule. Not real-time. '}<Link to={DEMO ? '/methodology/limitations/no-live-data' : '/methodology/freshness/ledger'}>{DEMO ? 'Why' : 'Freshness ledger'}</Link>
      </div>
      <header className="top">
        <div className="wrap bar">
          <Link className="brand" to="/">{brand.name}</Link>
          <button className="menu" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(!open)}>Menu</button>
          <nav id="nav" aria-label="Primary" className={open ? 'open' : ''} onClick={() => setOpen(false)}>
            <NavLink to="/" end>The Pulse</NavLink>
            <NavLink to="/technology">Technology and AI</NavLink>
            <NavLink to="/narrative">The Narrative</NavLink>
            <NavLink to="/companies">Companies</NavLink>
          </nav>
          <div className="util">
            <Link to="/methodology">Methodology</Link>
            <details className="ds">
              <summary aria-label="Data status">{DEMO ? <Tag /> : <span className="tag">DATA STATUS</span>}</summary>
              <div className="pop">
                {(st?.datasets ?? []).map(r => <div className="prow" key={r.id}><span>{r.name}{r.error ? ' (refresh failed)' : ''}</span><Tag s={effStatus(r)} /></div>)}{DEMO && LEDGER.map(r => <div className="prow" key={r.ds}><span>{r.ds}</span><Tag s={r.st} /></div>)}{!st && <p className="mute">Status not available yet.</p>}
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
          <Route path="/companies" element={<Companies />} />
          <Route path="/company/:ticker" element={<Company />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/methodology/:kind/:id" element={<Methodology />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </R>
  )
}
