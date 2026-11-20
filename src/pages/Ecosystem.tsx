import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES, ENTITIES, KIND_LABEL, LAYERS, LAYER_LINKS, PART_TEXT, type Entity, type Part } from '../data/technology-ecosystem'
import { NO_FILTERS, breakdown, category, chipActive, chipsIn, entityById, filterEntities, multiLayer, registryStats, relationsOf, researchPath, type Filters } from '../lib/ecosystem'
import { useData, type CompaniesFile } from '../data'
import { uniq } from '../lib/statement'

const PART: Record<Part, string> = { core: 'Core', enabling: 'Enabling', adjacent: 'Adjacent' }
type View = 'map' | 'directory' | 'breakdown'
type SetF = (f: Filters) => void

function useMobile() {
  const q = '(max-width: 900px)'
  const [m, set] = useState(() => matchMedia(q).matches)
  useEffect(() => { const mq = matchMedia(q); const on = () => set(mq.matches); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on) }, [])
  return m
}

function FilterBar({ f, setF, onReset }: { f: Filters; setF: SetF; onReset: () => void }) {
  const cats = CATEGORIES.filter(c => f.layer === null || c.layer === f.layer)
  const sel = (label: string, value: string, on: (v: string) => void, opts: [string, string][]) => (
    <label>{label}<select value={value} onChange={e => on(e.target.value)}>{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
  )
  return (
    <div className="filters" role="search" aria-label="Ecosystem filters">
      <label>Search<input type="search" value={f.q} placeholder="Company name" onChange={e => setF({ ...f, q: e.target.value })} /></label>
      {sel('Region', f.region, v => setF({ ...f, region: v as Filters['region'] }), [['Global', 'Global'], ['India', 'India'], ['United States', 'United States']])}
      {sel('Listing', f.status, v => setF({ ...f, status: v as Filters['status'] }), [['All', 'All'], ['public', 'Public companies'], ['private', 'Private organisations']])}
      {sel('Participation', f.part, v => setF({ ...f, part: v as Filters['part'] }), [['All', 'All'], ['core', 'Core'], ['enabling', 'Enabling'], ['adjacent', 'Adjacent']])}
      {sel('Layer', String(f.layer ?? ''), v => setF({ ...f, layer: v ? Number(v) : null, cat: null }), [['', 'All layers'], ...LAYERS.map(l => [String(l.n), `${l.n}. ${l.name}`] as [string, string])])}
      {sel('Sub-industry', f.cat ?? '', v => setF({ ...f, cat: v || null }), [['', 'All sub-industries'], ...cats.map(c => [c.id, c.name] as [string, string])])}
      <button onClick={onReset}>Reset</button>
    </div>
  )
}

function Chip({ e, m, ms, f, selected, select, layer }: { e: Entity; m: Entity['memberships'][number]; ms: Entity['memberships']; f: Filters; selected?: Entity; select: (id: string) => void; layer: number }) {
  const on = chipActive(e, layer, f)
  const unsure = ms.some(x => x.uncertain)
  return (
    <button className={`chip ${m.part}${on ? '' : ' dim'}${selected?.id === e.id ? ' sel' : ''}`} data-eid={e.id} data-layer={layer} aria-pressed={selected?.id === e.id}
      aria-label={`${e.name}, ${PART[m.part]}${e.status === 'private' ? ', private organisation' : ''}${unsure ? ', classification needs review' : ''}`} onClick={() => select(e.id)}>
      {e.name}{e.status === 'private' && <span className="tagp">PRIVATE</span>}{unsure && <span className="tagp">?</span>}
    </button>
  )
}

function EcoMap({ f, setF, selected, select }: { f: Filters; setF: SetF; selected?: Entity; select: (id: string) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [paths, setPaths] = useState<{ key: string; kind: string; d: string }[]>([])
  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const draw = () => {
      if (!selected) { setPaths([]); return }
      const box = el.getBoundingClientRect()
      const rects = (id: string) => [...el.querySelectorAll<HTMLElement>(`[data-eid="${id}"]`)].map(c => c.getBoundingClientRect())
      setPaths(relationsOf(selected.id).flatMap(r => {
        const other = r.from === selected.id ? r.to : r.from
        const a = rects(selected.id), b = rects(other)
        if (!a.length || !b.length) return []
        let best: [DOMRect, DOMRect] = [a[0], b[0]], bd = Infinity
        for (const x of a) for (const y of b) { const d = Math.abs(x.top - y.top) + Math.abs(x.left - y.left) * 0.1; if (d < bd) { bd = d; best = [x, y] } }
        const [x, y] = best
        const x1 = x.left + x.width / 2 - box.left, y1 = x.top + x.height / 2 - box.top, x2 = y.left + y.width / 2 - box.left, y2 = y.top + y.height / 2 - box.top
        const mid = (y1 + y2) / 2
        const d = Math.abs(y1 - y2) < 4 ? `M${x1},${y1 - 17} C${x1},${y1 - 64} ${x2},${y2 - 64} ${x2},${y2 - 17}` : `M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`
        return [{ key: `${r.from}-${r.to}-${r.type}`, kind: r.kind, d }]
      }))
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(el)
    return () => ro.disconnect()
  }, [selected, f])
  return (
    <div className="eco" ref={wrap}>
      <svg className="eco-lines" aria-hidden="true">{paths.map(p => <path key={p.key} d={p.d} className={`k-${p.kind}`} />)}</svg>
      {LAYERS.map(l => {
        const chips = chipsIn(l.n)
        const n = chips.filter(({ e }) => chipActive(e, l.n, f)).length
        const link = LAYER_LINKS.find(k => k.from === l.n && k.to === l.n + 1)
        return (
          <section key={l.n} className={`band${f.layer !== null && f.layer !== l.n ? ' faded' : ''}`} aria-label={l.name}>
            <header>
              <div>
                <button className="layer-btn" aria-pressed={f.layer === l.n} onClick={() => setF({ ...f, layer: f.layer === l.n ? null : l.n, cat: null })}><span className="num">{l.n}</span>{l.name}</button>
                <div className="mute">{n} of {chips.length} entries match</div>
              </div>
              <p className="mute">{l.summary}</p>
              {f.layer === l.n && (
                <div className="subs" role="group" aria-label={`${l.name} sub-industries`}>
                  {CATEGORIES.filter(c => c.layer === l.n).map(c => <button key={c.id} aria-pressed={f.cat === c.id} title={c.def} onClick={() => setF({ ...f, cat: f.cat === c.id ? null : c.id })}>{c.name}</button>)}
                </div>
              )}
            </header>
            <ul className="chips">{chips.map(({ e, m, ms }) => <li key={e.id}><Chip e={e} m={m} ms={ms} f={f} selected={selected} select={select} layer={l.n} /></li>)}</ul>
            {link && <p className="flow">{link.text}</p>}
          </section>
        )
      })}
    </div>
  )
}

function Accordion({ f, setF, select }: { f: Filters; setF: SetF; select: (id: string) => void }) {
  const [open, setOpen] = useState<number[]>([1])
  return (
    <div>
      {LAYERS.map(l => {
        const isOpen = open.includes(l.n)
        const rows = chipsIn(l.n).filter(({ e }) => chipActive(e, l.n, f))
        return (
          <section key={l.n} aria-label={l.name}>
            <h2 className="acc-h"><button aria-expanded={isOpen} aria-controls={`acc-${l.n}`} onClick={() => setOpen(isOpen ? open.filter(x => x !== l.n) : [...open, l.n])}><span>{l.n}. {l.name}</span><span className="mute">{rows.length}</span></button></h2>
            {isOpen && (
              <div id={`acc-${l.n}`}>
                <p className="mute">{l.summary}</p>
                <div className="subs" role="group" aria-label={`${l.name} sub-industries`}>
                  {CATEGORIES.filter(c => c.layer === l.n).map(c => <button key={c.id} aria-pressed={f.cat === c.id} onClick={() => setF(f.cat === c.id ? { ...f, layer: null, cat: null } : { ...f, layer: l.n, cat: c.id })}>{c.name}</button>)}
                </div>
                <ul className="erows">
                  {rows.map(({ e, m, ms }) => <li key={e.id}><button className="erow" onClick={() => select(e.id)}><b>{e.name}</b><span className="mute">{e.country}, {PART[m.part]}{e.status === 'private' ? ', private' : ''}</span><span className="mute">{ms.map(x => category(x.cat)?.name).join(', ')}</span></button></li>)}
                </ul>
                {!rows.length && <p className="mute">No entries match the current filters.</p>}
                {LAYER_LINKS.find(k => k.from === l.n && k.to === l.n + 1) && <p className="flow">{LAYER_LINKS.find(k => k.from === l.n && k.to === l.n + 1)?.text}</p>}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function Panel({ e, onClose, select, sheet }: { e: Entity; onClose: () => void; select: (id: string) => void; sheet: boolean }) {
  const prof = useData<CompaniesFile>('companies.json').data?.companies.find(c => c.ticker === e.ticker)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const k = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); prev?.focus?.() }
  }, [e.id])
  const [first, ...rest] = e.memberships
  const role = (m: Entity['memberships'][number]) => `${category(m.cat)?.name ?? m.cat}, ${PART[m.part]}, layer ${m.layer}`
  const path = researchPath(e)
  const rel = relationsOf(e.id)
  const facts: [string, React.ReactNode][] = [
    ['Primary role', role(first)],
    ['Other roles', rest.length ? rest.map(m => role(m)).join('; ') : 'None recorded'],
    ['Listing', e.status === 'private' ? 'Private organisation. No ticker, price or valuation is shown.' : e.ticker ? `${e.ticker}${prof?.exchanges.length ? `, ${uniq(prof.exchanges).join(', ')}` : ''}, from the SEC pipeline` : 'Public company. Ticker and exchange are not verified here, so none is shown.'],
    ...(prof?.industry ? [['SEC industry', prof.industry] as [string, React.ReactNode]] : []),
    ['Description', e.desc],
  ]
  return (
    <aside ref={ref} tabIndex={-1} className={sheet ? 'panel sheet' : 'panel'} role={sheet ? 'dialog' : 'region'} aria-label={`${e.name} details`}>
      <div className="panel-top"><h2>{e.name}</h2><button onClick={onClose} aria-label={`Close ${e.name} details`}>Close</button></div>
      <p><span className="tag">{e.status === 'private' ? 'PRIVATE' : 'PUBLIC'}</span> {e.country}</p>
      <dl>{facts.map(([k, v]) => <div className="fact" key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <h3>Why it belongs</h3>
      <ul>{e.memberships.map(m => <li key={`${m.layer}${m.cat}`}><b>{category(m.cat)?.name}.</b> {PART_TEXT[m.part]} {category(m.cat)?.def}{m.uncertain ? ' Needs review: this classification is uncertain.' : ''}</li>)}</ul>
      <h3>Evidence</h3>
      <p>{e.evidenceChecked ? 'Checked against the source.' : 'Source identified. The specific statement has not been checked against it.'}</p>
      <ul>{e.sources.map(u => <li key={u}><a href={u} rel="noopener noreferrer">{u.includes('sec.gov') ? 'Latest 10-K filing index (SEC)' : u.replace('https://', '').replace(/\/$/, '')}</a></li>)}</ul>
      <h3>Relationships</h3>
      {rel.length > 0 && <p className="note">Map lines: solid is a commercial relationship, dashed is a product integration, dotted is a competitor.</p>}
      {rel.length ? (
        <ul>
          {rel.map(r => {
            const a = entityById(r.from), b = entityById(r.to), other = r.from === e.id ? b : a
            return (
              <li key={`${r.from}${r.to}${r.type}`}>
                <b>{a?.name} {r.type.toLowerCase()} {b?.name}</b> <span className="tag">{KIND_LABEL[r.kind]}</span><br />
                {r.text} {r.checked ? '' : 'Not yet checked against its source.'}{' '}
                {r.sources.map((u, i) => <a key={u} href={u} rel="noopener noreferrer">source {i + 1}</a>)}{' '}
                {other && <button className="link" onClick={() => select(other.id)}>Open {other.name}</button>}
              </li>
            )
          })}
        </ul>
      ) : <p className="mute">No company-level relationship is recorded. Layer-level dependencies are on the map.</p>}
      <h3>Research</h3>
      <p>{path ? <Link to={path}>Open {e.name} company research</Link> : 'No company research page. It needs the company to be in the SEC data pipeline.'}</p>
      <p className="note">Last reviewed {e.lastReviewed}.</p>
      {sheet && <button onClick={onClose}>Back to the ecosystem</button>}
    </aside>
  )
}

function Intro({ setF }: { setF: SetF }) {
  return (
    <aside className="panel" aria-label="How to read the map">
      <h2>What makes modern AI possible?</h2>
      <ol className="plain">
        {LAYERS.map(l => (
          <li key={l.n}><button className="link" onClick={() => setF({ ...NO_FILTERS, layer: l.n })}>{l.n}. {l.name}</button>
            {LAYER_LINKS.find(k => k.from === l.n && k.to === l.n + 1) && <div className="mute">{LAYER_LINKS.find(k => k.from === l.n && k.to === l.n + 1)?.text}</div>}
          </li>
        ))}
      </ol>
      <h3>How to read the map</h3>
      <div className="legend"><span className="chip core">Core</span><span className="chip enabling">Enabling</span><span className="chip adjacent">Adjacent</span></div>
      <p className="note">Core companies operate directly in a category, enabling ones supply what it depends on, and adjacent ones take part without being central. Select a company to see its role, evidence and relationships. Lines show a selected company’s relationships: solid is commercial, dashed is product integration, dotted is a competitor. Layer-to-layer text is general industry structure, not a claim about any company pair.</p>
    </aside>
  )
}

function Directory({ f, select, selected }: { f: Filters; select: (id: string) => void; selected?: Entity }) {
  const rows = filterEntities(f)
  return (
    <div className="tbl">
      <table>
        <caption>{rows.length} companies and organisations</caption>
        <thead><tr><th>Name</th><th>Main category</th><th>Layer</th><th>Country</th><th>Listing</th><th>Role</th></tr></thead>
        <tbody>
          {rows.map(e => { const m = e.memberships[0]; return (
            <tr key={e.id} className={selected?.id === e.id ? 'sel-row' : ''}>
              <td><button className="link" onClick={() => select(e.id)}>{e.name}</button></td>
              <td>{category(m.cat)?.name}, {PART[m.part]}</td><td>{m.layer}</td><td>{e.country}</td><td>{e.status === 'private' ? 'Private' : 'Public'}</td><td>{e.desc}</td>
            </tr>) })}
        </tbody>
      </table>
    </div>
  )
}

function Breakdown() {
  const s = registryStats()
  return (
    <div>
      <p className="note">{s.entities} entities: {s.us} US and {s.india} Indian public companies, {s.otherPublic} other public companies and {s.priv} private organisations. A sub-industry with no entry has not been reviewed yet, which does not mean it is empty.</p>
      {breakdown().map(({ layer, cats }) => (
        <div className="tbl" key={layer.n}>
          <table>
            <caption>{layer.n}. {layer.name}</caption>
            <thead><tr><th>Sub-industry</th><th>Core</th><th>Enabling</th><th>Adjacent</th><th>Companies</th></tr></thead>
            <tbody>{cats.map(c => <tr key={c.cat.id}><th scope="row">{c.cat.name}</th><td>{c.core}</td><td>{c.enabling}</td><td>{c.adjacent}</td><td>{c.names.length ? c.names.join(', ') : <span className="mute">No entries yet</span>}</td></tr>)}</tbody>
          </table>
        </div>
      ))}
      <h3>Companies in more than one layer</h3>
      <ul>{multiLayer().map(({ e, layers }) => <li key={e.id}>{e.name}: layers {layers.join(', ')}</li>)}</ul>
    </div>
  )
}

function Compare() {
  const names = (layer: number, test: (c: string) => boolean) => ENTITIES.filter(e => e.status === 'public' && test(e.country) && e.memberships.some(m => m.layer === layer && m.part !== 'adjacent')).map(e => e.name).join(', ') || 'None reviewed'
  return (
    <section>
      <h2>India and the United States</h2>
      <p className="lede">A structural comparison of which reviewed public companies sit in each layer, by country of headquarters.</p>
      <div className="tbl">
        <table>
          <thead><tr><th>Layer</th><th>United States</th><th>India</th><th>Other countries</th></tr></thead>
          <tbody>{LAYERS.map(l => <tr key={l.n}><th scope="row">{l.n}. {l.name}</th><td>{names(l.n, c => c === 'United States')}</td><td>{names(l.n, c => c === 'India')}</td><td>{names(l.n, c => c !== 'India' && c !== 'United States')}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="note">Method: the table lists core and enabling participants from this registry. It reflects which companies have been reviewed, not market share, revenue or capability, and “None reviewed” does not mean none exists. It is not a ranking, and it uses no market data.</p>
      <h3>Questions to research, with no claims made yet</h3>
      <ul>
        <li>Where do Indian technology-services companies fit in enterprise AI implementation?</li>
        <li>Which parts of semiconductor design, equipment and manufacturing sit in which countries?</li>
        <li>How is cloud infrastructure organised across providers, and who operates the data centres?</li>
        <li>Where is AI model development happening, and which organisations are public or private?</li>
        <li>How do engineering and outsourcing services differ from proprietary software products?</li>
      </ul>
    </section>
  )
}

export default function Ecosystem() {
  const splat = (useParams()['*'] ?? '').replace(/^\/+|\/+$/g, '')
  const nav = useNavigate()
  const mobile = useMobile()
  const [view, setView] = useState<View>('map')
  const [f, setF] = useState<Filters>(NO_FILTERS)
  const selected = entityById(splat || undefined)
  const select = (id?: string) => nav(id ? `/technology-ecosystem/${id}` : '/technology-ecosystem')
  const reset = () => { setF(NO_FILTERS); select() }
  const s = registryStats()
  const shown = filterEntities(f).length
  return (
    <>
      <section className="first">
        <nav aria-label="Breadcrumb" className="crumbs"><Link to="/technology">Technology and AI</Link> / Technology ecosystem</nav>
        <h1>Technology and AI ecosystem</h1>
        <p className="lede">How chips, infrastructure, cloud, AI models, software, services and automation connect. It maps industry structure. It is not investment advice and it shows no prices.</p>
        <div className="seg" role="group" aria-label="View">
          {([['map', 'Ecosystem map'], ['directory', 'Company directory'], ['breakdown', 'Industry breakdown']] as [View, string][]).map(([v, t]) => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{t}</button>)}
        </div>
        <FilterBar f={f} setF={setF} onReset={reset} />
        <p className="note">{shown} of {s.entities} companies and organisations match. Sources are identified for every entry, but {s.entities - s.checked} of {s.entities} have not been checked against them. <Link to="/methodology/coverage/matrix">Coverage</Link></p>
        {splat && !selected && <p>No entry has the identifier “{splat}”. <button className="link" onClick={reset}>Back to the full ecosystem</button></p>}
      </section>
      <div className={mobile ? '' : 'eco-layout'}>
        <div>
          {view === 'map' && (mobile ? <Accordion f={f} setF={setF} select={select} /> : <EcoMap f={f} setF={setF} selected={selected} select={select} />)}
          {view === 'directory' && <Directory f={f} select={select} selected={selected} />}
          {view === 'breakdown' && <Breakdown />}
        </div>
        {!mobile && (selected ? <Panel e={selected} onClose={() => select()} select={select} sheet={false} /> : <Intro setF={setF} />)}
      </div>
      {mobile && selected && <Panel e={selected} onClose={() => select()} select={select} sheet />}
      <Compare />
    </>
  )
}
