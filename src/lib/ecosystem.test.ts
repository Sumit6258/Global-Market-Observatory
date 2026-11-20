import { describe, expect, it } from 'vitest'
import { CATEGORIES, ENTITIES, LAYERS, RELATIONS } from '../data/technology-ecosystem'
import { NO_FILTERS, breakdown, chipActive, chipsIn, entityById, filterEntities, multiLayer, registryStats, relationsOf, researchPath, validate } from './ecosystem'

const ids = (f: Parameters<typeof filterEntities>[0]) => filterEntities(f).map(e => e.id)
const copy = () => ({ entities: structuredClone(ENTITIES), categories: structuredClone(CATEGORIES), relations: structuredClone(RELATIONS) })

describe('registry integrity', () => {
  it('has no validation problems', () => expect(validate()).toEqual([]))
  it('covers seven layers and fifty-seven sub-industries', () => { expect(LAYERS).toHaveLength(7); expect(CATEGORIES).toHaveLength(57) })
  it('keeps one canonical entity for a company that spans layers', () => {
    expect(ENTITIES.filter(e => e.id === 'alphabet')).toHaveLength(1)
    expect(new Set(entityById('alphabet')!.memberships.map(m => m.layer)).size).toBeGreaterThanOrEqual(4)
    expect(multiLayer().map(x => x.e.id)).toContain('nvidia')
  })
  it('never gives a private organisation a ticker or research page', () => {
    for (const e of ENTITIES.filter(x => x.status === 'private')) { expect(e.ticker).toBeUndefined(); expect(researchPath(e)).toBeNull() }
    expect(ENTITIES.filter(e => e.status === 'private').map(e => e.id).sort()).toEqual(['anthropic', 'openai'])
  })
  it('marks every classification as unchecked until it is', () => { expect(registryStats().checked).toBe(0); expect(RELATIONS.every(r => !r.checked)).toBe(true) })
})

describe('validation catches problems', () => {
  it('duplicate ids', () => { const r = copy(); r.entities.push(structuredClone(r.entities[0])); expect(validate(r).join()).toContain('duplicate entity id nvidia') })
  it('invalid layer assignment', () => { const r = copy(); r.entities[0].memberships[0].layer = 9; expect(validate(r).join()).toContain('unknown layer 9') })
  it('category in the wrong layer', () => { const r = copy(); r.entities[0].memberships[0].layer = 2; expect(validate(r).join()).toContain('is not in layer 2') })
  it('unknown category', () => { const r = copy(); r.entities[0].memberships[0].cat = 'nope'; expect(validate(r).join()).toContain('unknown category nope') })
  it('missing or non-https evidence URLs', () => {
    const r = copy(); r.entities[0].sources = []; r.entities[1].sources = ['http://example.com']
    expect(validate(r).filter(p => p.includes('needs https source URLs'))).toHaveLength(2)
  })
  it('ticker on a private organisation', () => { const r = copy(); r.entities.find(e => e.id === 'openai')!.ticker = 'OPAI'; expect(validate(r).join()).toContain('private but has a ticker') })
  it('invalid relationship reference, self link and duplicate', () => {
    const r = copy(); r.relations.push({ ...r.relations[0], to: 'ghost' }, { ...r.relations[1], to: r.relations[1].from }, { ...r.relations[2] })
    const p = validate(r).join()
    expect(p).toContain('unknown entity'); expect(p).toContain('points to itself'); expect(p).toContain('duplicate relation')
  })
  it('a competitor pair listed in both directions counts as a duplicate', () => {
    const r = copy(); const c = r.relations.find(x => x.kind === 'competitive')!; r.relations.push({ ...c, from: c.to, to: c.from })
    expect(validate(r).join()).toContain('duplicate relation')
  })
})

describe('filters', () => {
  it('shows everything without filters, and reset restores it', () => {
    expect(filterEntities(NO_FILTERS)).toHaveLength(ENTITIES.length)
    expect(ids({ ...NO_FILTERS, region: 'India' })).toHaveLength(registryStats().india)
    expect(filterEntities(NO_FILTERS)).toHaveLength(ENTITIES.length)
  })
  it('filters by region and listing', () => {
    expect(filterEntities({ ...NO_FILTERS, region: 'India' }).every(e => e.country === 'India')).toBe(true)
    expect(ids({ ...NO_FILTERS, status: 'private' }).sort()).toEqual(['anthropic', 'openai'])
    expect(ids({ ...NO_FILTERS, region: 'India', status: 'private' })).toEqual([])
  })
  it('filters by layer and sub-industry', () => {
    const foundry = ids({ ...NO_FILTERS, layer: 1, cat: 'foundry' })
    expect(foundry).toEqual(expect.arrayContaining(['tsmc', 'samsung', 'intel'])); expect(foundry).not.toContain('nvidia')
  })
  it('filters by participation', () => {
    for (const e of filterEntities({ ...NO_FILTERS, part: 'enabling' })) expect(e.memberships.some(m => m.part === 'enabling')).toBe(true)
  })
  it('combines filters and searches by name', () => {
    expect(ids({ ...NO_FILTERS, q: 'tata' })).toEqual(['tataelxsi'])
    expect(filterEntities({ ...NO_FILTERS, region: 'United States', status: 'public', layer: 3 }).some(e => e.country === 'India')).toBe(false)
  })
  it('shows one chip per company per layer and dims it only when no membership in that layer matches', () => {
    const nvidia = entityById('nvidia')!
    const f = { ...NO_FILTERS, layer: 1, cat: 'gpu' }
    expect(chipActive(nvidia, 1, f)).toBe(true)
    expect(chipActive(nvidia, 2, f)).toBe(false)
    expect(chipActive(entityById('intel')!, 1, f)).toBe(false)
    expect(chipsIn(1).filter(c => c.e.id === 'nvidia')).toHaveLength(1)
    expect(chipsIn(1).find(c => c.e.id === 'tsmc')!.ms).toHaveLength(2)
  })
})

describe('selection, relationships and navigation', () => {
  it('selects by identifier and reports a missing entity', () => { expect(entityById('nvidia')?.name).toBe('NVIDIA'); expect(entityById('nope')).toBeUndefined(); expect(entityById(undefined)).toBeUndefined() })
  it('finds relationships in both directions', () => {
    const names = relationsOf('nvidia').map(r => (r.from === 'nvidia' ? r.to : r.from))
    expect(names).toEqual(expect.arrayContaining(['tsmc', 'amd', 'microsoft']))
  })
  it('links to company research only when a page exists', () => { expect(researchPath(entityById('nvidia')!)).toBe('/company/NVDA'); expect(researchPath(entityById('tsmc')!)).toBeNull(); expect(researchPath(entityById('tcs')!)).toBeNull() })
  it('reports sub-industries that have no entries', () => {
    const gaps = breakdown().flatMap(l => l.cats).filter(c => !c.names.length).map(c => c.cat.id)
    expect(gaps).toEqual(expect.arrayContaining(['parts', 'train', 'rsw']))
  })
})
