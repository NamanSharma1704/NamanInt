/**
 * ContainerLoadSequence in jsdom, which has no WebGL: the server-rendered drawing and captions must stand on their own,
 * and the stand-in scene must receive the scroll progress, reduced motion included.
 */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CARTON_COUNT, REDUCED_MOTION_PROGRESS } from '@/lib/container-load/geometry'

const sceneModule = vi.hoisted(() => ({ createContainerLoadScene: vi.fn() }))
vi.mock('../container-load/scene', () => sceneModule)

const capability = vi.hoisted(() => ({ available: true }))
vi.mock('@/lib/webgl2', () => ({ hasCapableWebGL2: () => capability.available }))

import ContainerLoadSequence from '../container-load/ContainerLoadSequence'

const STEPS = [
  { title: 'Set down on its marks', text: 'Lowered square onto its landing marks.' },
  { title: 'Doors open for inspection', text: 'Both doors swing clear.' },
  { title: 'Stuffed to the load plan', text: 'Front wall first.' },
  { title: 'Loaded and ready to seal', text: 'Counted against the packing list.' },
]

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

class InertResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function fakeScene() {
  return { resize: vi.fn(), setProgress: vi.fn(), dispose: vi.fn() }
}

let scene: ReturnType<typeof fakeScene>

function renderSequence() {
  return render(<ContainerLoadSequence eyebrow="Container Stuffing Supervision" title="One 20ft container, loaded to plan." intro="Intro." steps={STEPS} />)
}

/**
 * Lay the track out as if the visitor had scrolled `progress` of the way through it: jsdom has no layout, so the
 * track reports 3000px, every other element 600px, and the track's top sits where that progress puts it.
 */
function scrollTo(progress: number): void {
  const travel = 3000 - 600
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute('data-sequence-track') ? 3000 : 600
  })
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const top = this.hasAttribute('data-sequence-track') ? 72 - progress * travel : 0
    return { top, bottom: top + 600, left: 0, right: 0, width: 0, height: 600, x: 0, y: top, toJSON: () => ({}) } as DOMRect
  })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

beforeEach(() => {
  capability.available = true
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  sceneModule.createContainerLoadScene.mockReset().mockImplementation(() => {
    scene = fakeScene()
    return scene
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ContainerLoadSequence', () => {
  it('renders the drawing, every caption and the load readout without WebGL', () => {
    capability.available = false
    const { container } = renderSequence()
    expect(container.querySelectorAll('svg path')).toHaveLength(3)
    for (const path of container.querySelectorAll('svg path')) expect(path.getAttribute('d')).toMatch(/^M/)
    for (const step of STEPS) expect(screen.getAllByText(step.title).length).toBeGreaterThan(0)
    expect(screen.getByText(String(CARTON_COUNT))).toBeInTheDocument()
    expect(container.querySelector('figcaption')!.textContent).toContain(`${CARTON_COUNT} cartons`)
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByRole('button', { name: /Set down on its marks/ })[0]).toHaveAttribute('aria-current', 'step')
  })

  it('never loads the WebGL scene where WebGL 2 does not run well', async () => {
    capability.available = false
    vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver)
    vi.stubGlobal('ResizeObserver', InertResizeObserver)
    renderSequence()
    await new Promise((resolve) => setTimeout(resolve, 350))
    expect(sceneModule.createContainerLoadScene).not.toHaveBeenCalled()
  })

  it('starts the scene near the viewport and hands it the scroll progress', async () => {
    vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver)
    vi.stubGlobal('ResizeObserver', InertResizeObserver)
    const { container } = renderSequence()
    await waitFor(() => expect(sceneModule.createContainerLoadScene).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(container.querySelector('canvas')!.className).toContain('opacity-100'))
    expect(scene.setProgress).toHaveBeenCalled()

    scrollTo(0.5)
    expect(scene.setProgress).toHaveBeenLastCalledWith(0.5)
    expect(screen.getAllByRole('button', { name: /Stuffed to the load plan/ })[0]).toHaveAttribute('aria-current', 'step')
  })

  it('settles each step on one frame under reduced motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)', media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    )
    vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver)
    vi.stubGlobal('ResizeObserver', InertResizeObserver)
    renderSequence()
    await waitFor(() => expect(sceneModule.createContainerLoadScene).toHaveBeenCalledTimes(1))
    scrollTo(0.3)
    expect(scene.setProgress).toHaveBeenLastCalledWith(REDUCED_MOTION_PROGRESS[1])
  })

  it('releases the scene when unmounted', async () => {
    vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver)
    vi.stubGlobal('ResizeObserver', InertResizeObserver)
    const { unmount } = renderSequence()
    await waitFor(() => expect(sceneModule.createContainerLoadScene).toHaveBeenCalledTimes(1))
    unmount()
    expect(scene.dispose).toHaveBeenCalledTimes(1)
  })
})
