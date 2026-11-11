import test from 'node:test'
import assert from 'node:assert/strict'
import { dedupeFilings, validateFilings, validateFx } from './validate.mjs'

const day = i => new Date(Date.UTC(2023, 0, 1 + i)).toISOString().slice(0, 10)
const series = n => Array.from({ length: n }, (_, i) => [day(i), 80 + i / 100])
const today = new Date(Date.UTC(2023, 0, 1 + 1100))

test('accepts a clean FX series', () => assert.equal(validateFx(series(1100), today).length, 1100))
test('rejects a short FX series', () => assert.throws(() => validateFx(series(50), today), /too short/))
test('rejects duplicate dates', () => { const s = series(1100); s[500][0] = s[499][0]; assert.throws(() => validateFx(s, today), /strictly increasing/) })
test('rejects non-numeric rates', () => { const s = series(1100); s[10][1] = NaN; assert.throws(() => validateFx(s, today), /invalid FX rate/) })
test('rejects implausible jumps', () => { const s = series(1100); s[700][1] = 200; assert.throws(() => validateFx(s, today), /implausible/) })
test('rejects a stale FX series', () => assert.throws(() => validateFx(series(1100), new Date(Date.UTC(2027, 0, 1))), /days old/))

const f = (accession, accepted = '2026-01-01T00:00:00.000Z') => ({ ticker: 'X', company: 'X', form: '8-K', filed: '2026-01-01', accepted, accession, url: 'https://www.sec.gov/Archives/edgar/data/1/2/a.htm' })
test('dedupes by accession and sorts newest first', () => {
  const r = dedupeFilings([f('a'), f('a'), f('b', '2026-02-01T00:00:00.000Z')])
  assert.deepEqual(r.map(e => e.accession), ['b', 'a'])
})
test('rejects filings with missing fields', () => assert.throws(() => validateFilings([{ ...f('a'), url: '' }]), /missing url/))
test('rejects non-SEC document URLs', () => assert.throws(() => validateFilings([{ ...f('a'), url: 'https://example.com/x' }]), /unexpected URL/))
