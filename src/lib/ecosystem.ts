import { CATEGORIES, ENTITIES, LAYERS, RELATIONS, type Category, type Entity, type Membership, type Part, type Relation } from '../data/technology-ecosystem'

export interface Filters { region: 'Global' | 'India' | 'United States'; status: 'All' | 'public' | 'private'; part: 'All' | Part; layer: number | null; cat: string | null; q: string }
export const NO_FILTERS: Filters = { region: 'Global', status: 'All', part: 'All', layer: null, cat: null, q: '' }

export const entityById = (id?: string) => (id ? ENTITIES.find(e => e.id === id) : undefined)
export const category = (id: string) => CATEGORIES.find(c => c.id === id)
// A research page exists only for companies in the SEC pipeline.
export const researchPath = (e: Entity) => (e.research ? `/company/${e.research}` : null)
export const relationsOf = (id: string) => RELATIONS.filter(r => r.from === id || r.to === id)

const memberOk = (m: Membership, f: Filters) => (f.layer === null || m.layer === f.layer) && (f.cat === null || m.cat === f.cat) && (f.part === 'All' || m.part === f.part)
const entityOk = (e: Entity, f: Filters) => (f.region === 'Global' || e.country === f.region) && (f.status === 'All' || e.status === f.status) && (!f.q.trim() || e.name.toLowerCase().includes(f.q.trim().toLowerCase()))
export const matchesEntity = (e: Entity, f: Filters) => entityOk(e, f) && e.memberships.some(m => memberOk(m, f))
// One chip per company per layer. It is active when any of the company's memberships in that layer matches the filters.
export const chipActive = (e: Entity, layer: number, f: Filters) => entityOk(e, f) && e.memberships.some(m => m.layer === layer && memberOk(m, f))
export const filterEntities = (f: Filters) => ENTITIES.filter(e => matchesEntity(e, f))

const ORDER: Record<Part, number> = { core: 0, enabling: 1, adjacent: 2 }
export const chipsIn = (layer: number) => ENTITIES.flatMap(e => {
  const ms = e.memberships.filter(m => m.layer === layer)
  return ms.length ? [{ e, ms, m: [...ms].sort((a, b) => ORDER[a.part] - ORDER[b.part])[0] }] : []
}).sort((a, b) => ORDER[a.m.part] - ORDER[b.m.part] || a.e.name.localeCompare(b.e.name))

export function breakdown() {
  return LAYERS.map(layer => ({
    layer,
    cats: CATEGORIES.filter(c => c.layer === layer.n).map(cat => {
      const ms = ENTITIES.flatMap(e => e.memberships.filter(m => m.cat === cat.id).map(m => ({ e, m })))
      const n = (p: Part) => ms.filter(x => x.m.part === p).length
      return { cat, core: n('core'), enabling: n('enabling'), adjacent: n('adjacent'), names: ms.map(x => x.e.name) }
    }),
  }))
}
export const multiLayer = () => ENTITIES.map(e => ({ e, layers: [...new Set(e.memberships.map(m => m.layer))].sort() })).filter(x => x.layers.length > 1)

export function registryStats() {
  const pub = ENTITIES.filter(e => e.status === 'public')
  return {
    entities: ENTITIES.length, public: pub.length, priv: ENTITIES.length - pub.length,
    us: pub.filter(e => e.country === 'United States').length, india: pub.filter(e => e.country === 'India').length,
    otherPublic: pub.filter(e => e.country !== 'United States' && e.country !== 'India').length,
    memberships: ENTITIES.reduce((n, e) => n + e.memberships.length, 0), relations: RELATIONS.length,
    checkedMemberships: ENTITIES.reduce((n, e) => n + e.memberships.filter(m => m.check).length, 0), checkedRelations: RELATIONS.filter(r => r.check).length,
    checkedEntities: ENTITIES.filter(e => e.memberships.some(m => m.check)).length,
    noResearch: ENTITIES.filter(e => !e.research).length, uncertain: ENTITIES.reduce((n, e) => n + e.memberships.filter(m => m.uncertain).length, 0),
  }
}

export interface Registry { entities: Entity[]; categories: Category[]; relations: Relation[] }
const https = (u: string) => /^https:\/\/\S+$/.test(u)
const day = (d: string) => /^\d{4}-\d\d-\d\d$/.test(d) && !Number.isNaN(Date.parse(d))

// Returns every problem found, so a bad registry fails the tests instead of shipping.
export function validate(r: Registry = { entities: ENTITIES, categories: CATEGORIES, relations: RELATIONS }): string[] {
  const out: string[] = []
  const dupes = (ids: string[], what: string) => ids.forEach((id, i) => { if (ids.indexOf(id) !== i) out.push(`duplicate ${what} id ${id}`) })
  dupes(r.entities.map(e => e.id), 'entity')
  dupes(r.categories.map(c => c.id), 'category')
  const layers = new Set(LAYERS.map(l => l.n))
  const cats = new Map(r.categories.map(c => [c.id, c]))
  for (const c of r.categories) if (!layers.has(c.layer)) out.push(`category ${c.id} has unknown layer ${c.layer}`)
  for (const e of r.entities) {
    if (!e.memberships.length) out.push(`${e.id} has no layer membership`)
    for (const m of e.memberships) {
      const c = cats.get(m.cat)
      if (!layers.has(m.layer)) out.push(`${e.id} has unknown layer ${m.layer}`)
      else if (!c) out.push(`${e.id} has unknown category ${m.cat}`)
      else if (c.layer !== m.layer) out.push(`${e.id}: category ${m.cat} is not in layer ${m.layer}`)
      if (!['core', 'enabling', 'adjacent'].includes(m.part)) out.push(`${e.id} has invalid participation ${m.part}`)
    }
    if (new Set(e.memberships.map(m => `${m.layer}/${m.cat}`)).size !== e.memberships.length) out.push(`${e.id} repeats a category membership`)
    if (!e.sources.length || !e.sources.every(https)) out.push(`${e.id} needs https source URLs`)
    if (!day(e.lastReviewed)) out.push(`${e.id} has an invalid review date`)
    for (const m of e.memberships) if (m.check && (!https(m.check.url) || !m.check.note.trim() || !day(m.check.date) || !e.sources.includes(m.check.url))) out.push(`${e.id}: the check on ${m.cat} needs an https URL listed in sources, a note and a date`)
    if (e.status !== 'public' && e.status !== 'private') out.push(`${e.id} has an invalid status`)
    if (e.status === 'private' && (e.ticker || e.research)) out.push(`${e.id} is private but has a ticker`)
    if (e.ticker && !/^[A-Z.]{1,6}$/.test(e.ticker)) out.push(`${e.id} has an invalid ticker`)
    if (e.research && e.research !== e.ticker) out.push(`${e.id}: research ticker differs from ticker`)
    if (!e.desc.trim()) out.push(`${e.id} has no description`)
  }
  const ids = new Set(r.entities.map(e => e.id))
  const seen = new Set<string>()
  for (const x of r.relations) {
    if (!ids.has(x.from) || !ids.has(x.to)) out.push(`relation ${x.from} to ${x.to} references an unknown entity`)
    if (x.from === x.to) out.push(`relation ${x.from} points to itself`)
    if (x.check && (!https(x.check.url) || !x.check.note.trim() || !day(x.check.date) || !x.sources.includes(x.check.url))) out.push(`relation ${x.from} to ${x.to}: the check needs an https URL listed in sources, a note and a date`)
    if (!x.sources.length || !x.sources.every(https)) out.push(`relation ${x.from} to ${x.to} needs https source URLs`)
    const key = x.kind === 'competitive' ? `${[x.from, x.to].sort().join('|')}|competitive` : `${x.from}|${x.to}|${x.kind}|${x.type}`
    if (seen.has(key)) out.push(`duplicate relation ${x.from} to ${x.to}`)
    seen.add(key)
  }
  return out
}
