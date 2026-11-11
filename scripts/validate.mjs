// Pure validation helpers used by fetch-data.mjs and by the tests.
const ISO_DAY = /^\d{4}-\d\d-\d\d$/

// pts: [[YYYY-MM-DD, rate]] sorted ascending. Throws on anything that should not be published.
export function validateFx(pts, today = new Date()) {
  if (pts.length < 1000) throw new Error(`FX series too short (${pts.length} points)`)
  for (let i = 0; i < pts.length; i++) {
    const [d, v] = pts[i]
    if (!ISO_DAY.test(d) || Number.isNaN(Date.parse(d))) throw new Error(`invalid FX date ${d}`)
    if (!Number.isFinite(v) || v <= 0) throw new Error(`invalid FX rate on ${d}`)
    if (i && d <= pts[i - 1][0]) throw new Error(`FX dates not strictly increasing at ${d}`)
    if (i && Math.abs(v / pts[i - 1][1] - 1) > 0.05) throw new Error(`implausible FX move on ${d}`)
  }
  const age = (today - Date.parse(pts.at(-1)[0])) / 864e5
  if (age > 7) throw new Error(`latest FX observation is ${Math.round(age)} days old`)
  return pts
}

export function dedupeFilings(events) {
  const seen = new Map()
  for (const e of events) if (!seen.has(e.accession)) seen.set(e.accession, e)
  return [...seen.values()].sort((a, b) => b.accepted.localeCompare(a.accepted))
}

export function validateFilings(events) {
  for (const e of events) {
    for (const k of ['ticker', 'company', 'form', 'filed', 'accepted', 'accession', 'url']) {
      if (!e[k]) throw new Error(`filing missing ${k}: ${e.accession ?? e.url}`)
    }
    if (Number.isNaN(Date.parse(e.accepted))) throw new Error(`invalid acceptance time for ${e.accession}`)
    if (!/^https:\/\/www\.sec\.gov\/Archives\//.test(e.url)) throw new Error(`unexpected URL for ${e.accession}`)
  }
  return events
}
