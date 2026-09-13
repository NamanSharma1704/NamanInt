/**
 * TradeNetwork and TradeRouteExplorer in jsdom, which has no WebGL and no
 * IntersectionObserver: exactly the environment where the component has to
 * leave its server-rendered SVG in place and never reach for Three.js.
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import TradeNetwork from '../trade-network/TradeNetwork'
import TradeRouteExplorer from '../trade-network/TradeRouteExplorer'

const STEPS = [
  { num: '01', label: 'Origin', place: 'South & East China', desc: 'Factory clusters.' },
  { num: '02', label: 'Consolidation', place: 'Hong Kong Hub', desc: 'Export clearance.' },
  { num: '03', label: 'Destination', place: 'North America', desc: 'Port-to-warehouse delivery.' },
]

/** Path order inside each drawing: floor guides, three stations, info line, goods, signals. */
function stationClass(index: number): string {
  const drawing = document.querySelector('svg')!
  return drawing.querySelectorAll('path')[index + 1]!.getAttribute('class') ?? ''
}

/**
 * jsdom's :focus-visible matches only a bare focus() with no earlier input;
 * after any event, a Tab keypress included, it never matches. Browsers decide
 * it from the input modality, so tests state the browser's answer instead.
 */
function stubFocusVisible(visible: boolean): void {
  const matches = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
    return selector === ':focus-visible' ? visible : matches.call(this, selector)
  })
}

/** An IntersectionObserver that reports its target as visible immediately. */
class VisibleIntersectionObserver {
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element): void {
    this.callback([{ isIntersecting: true, target } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }

  unobserve(): void {}

  disconnect(): void {}

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('TradeNetwork', () => {
  it('renders both fallback drawings hidden from assistive tech, with the canvas hidden too', () => {
    const { container } = render(<TradeNetwork highlightStep={null} origin="SOURCE / GLOBAL" destination="DESTINATION / NORTH AMERICA" />)

    const drawings = container.querySelectorAll('svg')
    expect(drawings).toHaveLength(2)
    drawings.forEach((drawing) => {
      expect(drawing).toHaveAttribute('aria-hidden', 'true')
      expect(drawing.getAttribute('class')).toContain('opacity-100')
    })

    const canvas = container.querySelector('canvas')!
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    expect(canvas.className).toContain('opacity-0')
  })

  it('describes the route for screen readers and keeps the route labels as text', () => {
    render(<TradeNetwork highlightStep={null} origin="SOURCE / GLOBAL" destination="DESTINATION / NORTH AMERICA" />)

    expect(screen.getByText(/Diagram of the sourcing route/)).toBeInTheDocument()
    expect(screen.getByText('SOURCE / GLOBAL')).toBeInTheDocument()
    expect(screen.getByText('DESTINATION / NORTH AMERICA')).toBeInTheDocument()
  })

  it('never probes for WebGL where IntersectionObserver is missing', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    render(<TradeNetwork highlightStep={null} origin="O" destination="D" />)

    expect(getContext).not.toHaveBeenCalled()
  })

  it('probes for a capable WebGL 2 context and keeps the SVG when there is none', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver)
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const { container } = render(<TradeNetwork highlightStep={null} origin="O" destination="D" />)
    await vi.advanceTimersByTimeAsync(500)

    expect(getContext).toHaveBeenCalledWith('webgl2', { failIfMajorPerformanceCaveat: true })
    expect(container.querySelector('canvas')!.className).toContain('opacity-0')
    container.querySelectorAll('svg').forEach((drawing) => {
      expect(drawing.getAttribute('class')).toContain('opacity-100')
    })
  })

  it('highlights one station and dims the others in the fallback drawing', () => {
    const { rerender } = render(<TradeNetwork highlightStep={null} origin="O" destination="D" />)
    for (const index of [0, 1, 2]) expect(stationClass(index)).toContain('stroke-foreground/60')

    rerender(<TradeNetwork highlightStep={1} origin="O" destination="D" />)
    expect(stationClass(1)).toContain('stroke-accent')
    expect(stationClass(0)).toContain('stroke-foreground/20')
    expect(stationClass(2)).toContain('stroke-foreground/20')
  })
})

describe('TradeRouteExplorer', () => {
  it('renders the three stages as unpressed buttons', () => {
    render(<TradeRouteExplorer steps={STEPS} origin="O" destination="D" />)

    const stages = screen.getAllByRole('button')
    expect(stages).toHaveLength(3)
    stages.forEach((stage) => expect(stage).toHaveAttribute('aria-pressed', 'false'))
  })

  it('pins a stage on click and releases it on a second click', () => {
    render(<TradeRouteExplorer steps={STEPS} origin="O" destination="D" />)
    const hub = screen.getByRole('button', { name: /Hong Kong Hub/ })

    fireEvent.click(hub)
    expect(hub).toHaveAttribute('aria-pressed', 'true')
    expect(stationClass(1)).toContain('stroke-accent')

    fireEvent.click(hub)
    expect(hub).toHaveAttribute('aria-pressed', 'false')
    expect(stationClass(1)).toContain('stroke-foreground/60')
  })

  it('previews a stage while it has keyboard focus', async () => {
    stubFocusVisible(true)
    const user = userEvent.setup()
    render(<TradeRouteExplorer steps={STEPS} origin="O" destination="D" />)
    const destination = screen.getByRole('button', { name: /North America/ })

    await user.tab()
    await user.tab()
    await user.tab()
    expect(destination).toHaveFocus()
    expect(stationClass(2)).toContain('stroke-accent')
    expect(stationClass(0)).toContain('stroke-foreground/20')
    expect(destination).toHaveAttribute('aria-pressed', 'false')

    await user.tab()
    expect(destination).not.toHaveFocus()
    expect(stationClass(2)).toContain('stroke-foreground/60')
  })

  it('does not preview a stage whose focus is not focus-visible', () => {
    stubFocusVisible(false)
    render(<TradeRouteExplorer steps={STEPS} origin="O" destination="D" />)
    const hub = screen.getByRole('button', { name: /Hong Kong Hub/ })

    act(() => hub.focus())
    expect(hub).toHaveFocus()
    for (const index of [0, 1, 2]) expect(stationClass(index)).toContain('stroke-foreground/60')
  })

  it('previews on mouse hover but not on touch contact', async () => {
    const user = userEvent.setup()
    render(<TradeRouteExplorer steps={STEPS} origin="O" destination="D" />)
    const origin = screen.getByRole('button', { name: /South & East China/ })

    await user.hover(origin)
    expect(stationClass(0)).toContain('stroke-accent')
    await user.unhover(origin)
    expect(stationClass(0)).toContain('stroke-foreground/60')

    stubFocusVisible(false)
    await user.pointer({ keys: '[TouchA>]', target: origin })
    expect(stationClass(0)).toContain('stroke-foreground/60')
  })
})
