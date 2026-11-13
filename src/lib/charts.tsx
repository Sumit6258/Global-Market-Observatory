export interface Pt { x: string; v: number | null }

// Annual observations only. A missing year is drawn as a gap labelled n/a, never filled in.
export function Chart({ title, points, kind, fmt }: { title: string; points: Pt[]; kind: 'bar' | 'line'; fmt: (v: number) => string }) {
  const nums = points.map(p => p.v).filter((v): v is number => v !== null)
  if (nums.length < 2) {
    return <figure className="chart"><figcaption>{title}</figcaption><p className="mute">A chart needs at least two validated annual observations; {nums.length ? 'only one is available' : 'none is available'}.</p></figure>
  }
  const W = 320, H = 170, top = 24, bottom = 30
  const lo = Math.min(0, ...nums), hi = Math.max(0, ...nums), span = hi - lo || 1
  const y = (v: number) => top + ((hi - v) / span) * (H - top - bottom)
  const slot = W / points.length
  const cx = (i: number) => slot * (i + 0.5)
  const segs: string[][] = [[]]
  points.forEach((p, i) => { if (p.v === null) segs.push([]); else segs[segs.length - 1].push(`${cx(i)},${y(p.v)}`) })
  const label = `${title}: ${points.map(p => `${p.x.slice(0, 7)} ${p.v === null ? 'not available' : fmt(p.v)}`).join(', ')}`
  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <line x1="0" x2={W} y1={y(0)} y2={y(0)} className="axis" />
        {kind === 'bar' && points.map((p, i) => p.v === null ? null : <rect key={p.x} x={cx(i) - slot * 0.3} width={slot * 0.6} y={Math.min(y(p.v), y(0))} height={Math.max(1, Math.abs(y(p.v) - y(0)))} className={p.v < 0 ? 'neg' : 'pos'} />)}
        {kind === 'line' && segs.filter(s => s.length > 1).map((s, k) => <polyline key={k} points={s.join(' ')} className="ln" />)}
        {kind === 'line' && points.map((p, i) => p.v === null ? null : <circle key={p.x} cx={cx(i)} cy={y(p.v)} r="3" />)}
        {points.map((p, i) => p.v === null
          ? <text key={p.x} x={cx(i)} y={y(0) - 5} textAnchor="middle" className="mt">n/a</text>
          : <text key={p.x} x={cx(i)} y={p.v < 0 ? y(p.v) + 13 : y(p.v) - 6} textAnchor="middle">{fmt(p.v)}</text>)}
        {points.map(p => <text key={`x${p.x}`} x={cx(points.indexOf(p))} y={H - 6} textAnchor="middle" className="mt">{p.x.slice(0, 7)}</text>)}
      </svg>
    </figure>
  )
}
