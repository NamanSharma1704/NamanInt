/**
 * InspectionCanvas against a stand-in scene: jsdom has no WebGL, so these cover what the canvas owns:
 * palette, marker placement and emphasis, highlight forwarding, handing the scene to its owner,
 * fallback and teardown.
 */
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { INSPECTION_MARKERS } from '@/lib/housing-inspection/geometry'

import InspectionCanvas, { type SceneFactory } from '../inspection-drawing/InspectionCanvas'
import type { InspectionScene } from '../inspection-drawing/scene'

const PROTOCOLS = ['CMM 3D Coordinate inspection (±0.05mm)', 'RoHS & REACH compliance', 'Salt spray 96h corrosion test']
const SUBJECT = 'Inspection drawing of a machined aluminium housing.'

function fakeScene() {
  return { resize: vi.fn(), setHighlight: vi.fn(), setProgress: vi.fn(), setReducedMotion: vi.fn(), setActive: vi.fn(), dispose: vi.fn() }
}

type FactoryOptions = Parameters<SceneFactory>[0]
let options: FactoryOptions
let scene: ReturnType<typeof fakeScene>
const factory = vi.fn((next: FactoryOptions) => {
  options = next
  scene = fakeScene()
  return scene as unknown as InspectionScene
})

function renderCanvas(highlight: number | null = null, loadScene: () => Promise<SceneFactory> = () => Promise.resolve(factory)) {
  const onReady = vi.fn()
  const onFailed = vi.fn()
  const onScene = vi.fn()
  const element = (next: number | null) => (
    <figure style={{ backgroundColor: 'rgb(236, 240, 243)' }}>
      <InspectionCanvas
        markers={INSPECTION_MARKERS}
        protocols={PROTOCOLS}
        highlight={next}
        subject={SUBJECT}
        loadScene={loadScene}
        onReady={onReady}
        onFailed={onFailed}
        onScene={onScene}
      />
    </figure>
  )
  const view = render(element(highlight))
  return { ...view, rerender: (next: number | null) => view.rerender(element(next)), onReady, onFailed, onScene }
}

/** The shared setup's ResizeObserver mock cannot be constructed with `new`. */
class InertResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', InertResizeObserver)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  factory.mockClear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('InspectionCanvas', () => {
  it('starts the scene on the figure ground with the current highlight, then reports ready', async () => {
    const { onReady, onFailed } = renderCanvas(1)
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1))
    expect(factory).toHaveBeenCalledTimes(1)
    expect(options.palette.ground).toEqual([236 / 255, 240 / 255, 243 / 255])
    for (const channel of [...options.palette.line, ...options.palette.accent]) {
      expect(channel).toBeGreaterThanOrEqual(0)
      expect(channel).toBeLessThanOrEqual(1)
    }
    expect(scene.setHighlight).toHaveBeenCalledWith(1)
    expect(options.reducedMotion).toBe(false)
    expect(onFailed).not.toHaveBeenCalled()
  })

  it('hands the running scene to its owner, and null when it goes away', async () => {
    const { onScene, unmount } = renderCanvas()
    await waitFor(() => expect(onScene).toHaveBeenCalledWith(scene))
    unmount()
    expect(onScene).toHaveBeenLastCalledWith(null)
    expect(scene.dispose).toHaveBeenCalledTimes(1)
  })

  it('moves the numbered markers to where the scene projects them', async () => {
    const { container, onReady } = renderCanvas()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    act(() =>
      options.onMarkers([
        { protocol: 0, x: 120, y: 40 },
        { protocol: 1, x: 30, y: 180 },
        { protocol: 2, x: 250, y: 90 },
      ]),
    )
    const markers = container.querySelectorAll('ol > li')
    expect(markers).toHaveLength(3)
    expect((markers[0] as HTMLElement).style.transform).toBe('translate(120px, 40px)')
    expect((markers[2] as HTMLElement).style.transform).toBe('translate(250px, 90px)')
    expect(markers[1]!.textContent).toBe('2')
  })

  it('emphasises the highlighted point and steps the others back, without restarting the scene', async () => {
    const { container, rerender, onReady } = renderCanvas()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    expect([...container.querySelectorAll('ol > li')].every((li) => li.className.includes('opacity-100'))).toBe(true)
    rerender(2)
    expect(scene.setHighlight).toHaveBeenLastCalledWith(2)
    expect(factory).toHaveBeenCalledTimes(1)
    const badges = container.querySelectorAll('[data-balloon]')
    expect(badges[2]!.className).toContain('bg-accent')
    expect(badges[0]!.className).not.toContain('bg-accent')
    const items = container.querySelectorAll('ol > li')
    expect(items[2]!.className).toContain('opacity-100')
    expect(items[0]!.className).toContain('opacity-40')
  })

  it('starts still when the visitor prefers reduced motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const { onReady } = renderCanvas()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    expect(options.reducedMotion).toBe(true)
  })

  it('falls back when the WebGL module cannot load', async () => {
    const { onReady, onFailed } = renderCanvas(null, () => Promise.reject(new Error('chunk failed')))
    await waitFor(() => expect(onFailed).toHaveBeenCalledTimes(1))
    expect(onReady).not.toHaveBeenCalled()
  })

  it('falls back when WebGL cannot start', async () => {
    const failing = vi.fn(() => {
      throw new Error('Error creating WebGL context.')
    })
    const { onReady, onFailed } = renderCanvas(null, () => Promise.resolve(failing as unknown as SceneFactory))
    await waitFor(() => expect(onFailed).toHaveBeenCalledTimes(1))
    expect(onReady).not.toHaveBeenCalled()
  })

  it('falls back when the context is lost, and ignores late events after unmount', async () => {
    const { onReady, onFailed, unmount } = renderCanvas()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    act(() => options.onContextLost())
    expect(onFailed).toHaveBeenCalledTimes(1)
    unmount()
    options.onContextLost()
    expect(onFailed).toHaveBeenCalledTimes(1)
  })

  it('describes every inspection point in text, since the canvas and markers are hidden', async () => {
    const { container, onReady } = renderCanvas()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('ol')).toHaveAttribute('aria-hidden', 'true')
    const description = container.querySelector('p.sr-only')!.textContent!
    expect(description.startsWith(SUBJECT)).toBe(true)
    expect(description).toContain('Point 1: CMM 3D Coordinate inspection (±0.05mm), applied to the rim of the top bore.')
    expect(description).toContain('Point 3: Salt spray 96h corrosion test, applied to the side fitting.')
  })
})
