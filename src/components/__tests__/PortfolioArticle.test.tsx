/**
 * PortfolioArticle's inspection process against a stand-in scene: jsdom has no layout or WebGL, so the
 * container's position is set by hand. These cover the Photograph / Inspection process switch, the panel
 * swap, pinning and the scroll-driven steps, jumping to a step, reduced motion, leaving the tab and the fallback.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { INSPECTION_MARKERS } from '@/lib/housing-inspection/geometry'

const capability = vi.hoisted(() => ({ available: true }))
vi.mock('@/lib/housing-inspection/capability', () => ({ useInspectionDrawingAvailable: () => capability.available }))

import PortfolioArticle, { type PortfolioCategory } from '../category-inspection/PortfolioArticle'
import type { CategorySequence } from '../category-inspection/sequences'
import type { SceneFactory } from '../inspection-drawing/InspectionCanvas'
import type { InspectionScene } from '../inspection-drawing/scene'

const ITEM: PortfolioCategory = {
  id: 'hardware',
  number: '01',
  categoryTag: 'Precision Hardware & Castings',
  title: 'Precision Die-Castings, CNC & Engineering Hardware',
  description: 'High-tolerance mechanical parts.',
  image: '/assets/images/category-precision-hardware.jpg',
  imageAlt: 'Machined aluminium components',
  materials: ['ADC12 Aluminum', '6061-T6'],
  standards: ['CMM 3D Coordinate inspection (±0.05mm)', 'RoHS & REACH compliance', 'Salt spray 96h corrosion test'],
  leadTime: '30–45 Days',
  volumeProfile: 'FCL',
  contactParam: 'hardware',
}

function fakeScene() {
  return { resize: vi.fn(), setHighlight: vi.fn(), setProgress: vi.fn(), setReducedMotion: vi.fn(), setActive: vi.fn(), dispose: vi.fn() }
}

let scene: ReturnType<typeof fakeScene>
const factory = vi.fn(() => {
  scene = fakeScene()
  return scene as unknown as InspectionScene
})
const scrollTo = vi.fn()

function sequence(loadScene: () => Promise<SceneFactory> = () => Promise.resolve(factory as unknown as SceneFactory)): CategorySequence {
  return {
    subject: 'Inspection drawing of a machined aluminium housing.',
    steps: [
      { title: 'CMM 3D coordinate inspection', text: 'A coordinate measuring machine probes the bores.' },
      { title: 'RoHS & REACH compliance', text: 'The alloy is screened for restricted substances.' },
      { title: 'Salt spray corrosion test, 96 hours', text: 'Finished parts sit in a neutral salt fog.' },
    ],
    markers: INSPECTION_MARKERS,
    loadScene,
  }
}

/** `null` renders a category without an inspection model (an explicit `undefined` would take the default). */
function article(selected: boolean, withSequence: CategorySequence | null = sequence()) {
  return (
    <MemoryRouter>
      <PortfolioArticle item={ITEM} selected={selected} isDefault sequence={withSequence ?? undefined} reducedMotion={false} />
    </MemoryRouter>
  )
}

/** The shared setup's ResizeObserver mock cannot be constructed with `new`. */
class InertResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class InertIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

/** Places the container so that `scrolled` pixels have passed beneath the 72px header, over `travel` pixels of pinning. */
function scrollContainer(container: HTMLElement, scrolled: number, travel = 1500): void {
  const box = container.querySelector('[data-inspection-container]') as HTMLElement
  const frame = container.querySelector('[data-inspection-frame]') as HTMLElement
  box.getBoundingClientRect = () => ({ top: 72 - scrolled }) as DOMRect
  Object.defineProperty(box, 'offsetHeight', { configurable: true, value: travel + 700 })
  Object.defineProperty(frame, 'offsetHeight', { configurable: true, value: 700 })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

const processSwitch = () => screen.getByRole('button', { name: 'Inspection process' })
const photographSwitch = () => screen.getByRole('button', { name: 'Photograph' })
const stepList = () => screen.getByRole('list', { name: 'Inspection steps' })
const step = (name: RegExp) => within(stepList()).getByRole('button', { name })

beforeEach(() => {
  capability.available = true
  factory.mockClear()
  scrollTo.mockClear()
  vi.stubGlobal('scrollTo', scrollTo)
  vi.stubGlobal('ResizeObserver', InertResizeObserver)
  vi.stubGlobal('IntersectionObserver', InertIntersectionObserver)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('PortfolioArticle', () => {
  it('shows the photograph and specification, with no switch where WebGL 2 is unavailable', () => {
    capability.available = false
    const { container } = render(article(true))
    expect(screen.queryByRole('button', { name: 'Inspection process' })).toBeNull()
    expect(container.querySelector('canvas')).toBeNull()
    expect(screen.getByRole('heading', { name: ITEM.title })).toBeInTheDocument()
    expect(screen.getByText('RoHS & REACH compliance')).toBeInTheDocument()
  })

  it('offers no inspection process for a category without an inspection model', () => {
    render(article(true, null))
    expect(screen.queryByRole('group', { name: 'Figure view' })).toBeNull()
  })

  it('replaces the specification with the process, loads the drawing and scrolls the process into place', async () => {
    const { container } = render(article(true))
    expect(photographSwitch()).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(processSwitch())
    expect(processSwitch()).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(factory).toHaveBeenCalledTimes(1))
    expect(scrollTo).toHaveBeenCalledTimes(1)

    // The title, description, specification and inquiry link step aside.
    expect(screen.queryByText(ITEM.description)).toBeNull()
    expect(screen.queryByText('Key material grades')).toBeNull()
    expect(screen.queryByRole('link', { name: /Inquire for this category/ })).toBeNull()
    expect(screen.getByRole('heading', { name: `Inspection process: ${ITEM.title}` })).toBeInTheDocument()

    expect(container.querySelector('[data-inspection-frame]')!.className).toContain('sticky')
    expect(container.querySelector('[data-inspection-spacer]')).not.toBeNull()
    expect(step(/CMM 3D coordinate inspection/)).toHaveAttribute('aria-current', 'step')
    const visibleCaption = [...container.querySelectorAll('[data-step-caption]')].find((li) => li.className.includes('opacity-100'))
    expect(visibleCaption?.querySelector('h4')?.textContent).toBe('CMM 3D coordinate inspection')
  })

  it('follows the scroll through the steps and fills the progress rail', async () => {
    const { container } = render(article(true))
    fireEvent.click(processSwitch())
    await waitFor(() => expect(factory).toHaveBeenCalled())

    scrollContainer(container, 750)
    expect(scene.setProgress).toHaveBeenLastCalledWith(0.5)
    expect(step(/RoHS & REACH compliance/)).toHaveAttribute('aria-current', 'step')
    expect((stepList().querySelectorAll('span[aria-hidden]')[1] as HTMLElement).style.transform).toBe('scaleY(0.5)')
    await waitFor(() => expect(scene.setHighlight).toHaveBeenLastCalledWith(1))

    scrollContainer(container, 1450)
    expect(step(/Salt spray/)).toHaveAttribute('aria-current', 'step')
  })

  it('jumps to a step from the step list', () => {
    const { container } = render(article(true))
    fireEvent.click(processSwitch())
    scrollContainer(container, 750)
    fireEvent.click(step(/Salt spray/))
    const [{ top, behavior }] = scrollTo.mock.lastCall as [{ top: number; behavior: string }]
    expect(top).toBeCloseTo((2.5 / 3) * 1500 - 750, 6)
    expect(behavior).toBe('smooth')
  })

  it('settles each step on its middle frame under reduced motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const { container } = render(article(true))
    fireEvent.click(processSwitch())
    await waitFor(() => expect(factory).toHaveBeenCalled())
    scrollContainer(container, 300)
    expect(scene.setProgress.mock.lastCall![0]).toBeCloseTo(1 / 6, 9)
  })

  it('brings the specification back with the photograph', async () => {
    render(article(true))
    fireEvent.click(processSwitch())
    await waitFor(() => expect(factory).toHaveBeenCalled())
    fireEvent.click(photographSwitch())
    await waitFor(() => expect(scene.dispose).toHaveBeenCalledTimes(1))
    expect(screen.getByText(ITEM.description)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Inquire for this category/ })).toBeInTheDocument()
  })

  it('returns to the photograph when its tab is left, without scrolling the page', async () => {
    const { rerender } = render(article(true))
    fireEvent.click(processSwitch())
    await waitFor(() => expect(factory).toHaveBeenCalled())
    scrollTo.mockClear()
    rerender(article(false))
    await waitFor(() => expect(scene.dispose).toHaveBeenCalledTimes(1))
    expect(scrollTo).not.toHaveBeenCalled()
    rerender(article(true))
    expect(photographSwitch()).toHaveAttribute('aria-pressed', 'true')
  })

  it('falls back to the photograph and withdraws the switch when WebGL cannot start', async () => {
    const failing = vi.fn(() => {
      throw new Error('Error creating WebGL context.')
    })
    const { container } = render(article(true, sequence(() => Promise.resolve(failing as unknown as SceneFactory))))
    fireEvent.click(processSwitch())
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Figure view' })).toBeNull())
    expect(container.querySelector('[data-inspection-spacer]')).toBeNull()
    expect(screen.getByText(ITEM.description)).toBeInTheDocument()
  })
})
