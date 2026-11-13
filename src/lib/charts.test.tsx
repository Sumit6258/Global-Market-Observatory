import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Chart } from './charts'

const fmt = (v: number) => `$${v}`

describe('financial history chart', () => {
  it('refuses to draw a chart from a single observation', () => {
    const html = renderToStaticMarkup(<Chart title="Revenue" points={[{ x: '2025-12-31', v: 10 }, { x: '2024-12-31', v: null }]} kind="bar" fmt={fmt} />)
    expect(html).toContain('at least two validated annual observations')
    expect(html).not.toContain('<svg')
  })
  it('leaves a missing year as an n/a gap instead of filling it', () => {
    const html = renderToStaticMarkup(<Chart title="Revenue" points={[{ x: '2023-12-31', v: 5 }, { x: '2024-12-31', v: null }, { x: '2025-12-31', v: 8 }]} kind="bar" fmt={fmt} />)
    expect(html.match(/<rect/g)).toHaveLength(2)
    expect(html.match(/>n\/a</g)).toHaveLength(1)
    expect(html).toContain('2024-12 not available')
  })
  it('draws no line across a gap', () => {
    const html = renderToStaticMarkup(<Chart title="Margin" points={[{ x: '2022-12-31', v: 1 }, { x: '2023-12-31', v: null }, { x: '2024-12-31', v: 2 }, { x: '2025-12-31', v: 3 }]} kind="line" fmt={fmt} />)
    expect(html.match(/<polyline/g)).toHaveLength(1)
  })
})
