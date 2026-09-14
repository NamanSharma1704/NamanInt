/**
 * HousingInspection against a stand-in scene: jsdom has no WebGL, so these cover what the
 * component owns — palette, marker placement, highlight forwarding, fallback and teardown.
 */
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HousingSceneOptions } from '../housing-inspection/scene'

const sceneModule = vi.hoisted(() => ({ createHousingScene: vi.fn() }))
vi.mock('../housing-inspection/scene', () => sceneModule)

import HousingInspection from '../housing-inspection/HousingInspection'

const PROTOCOLS = ['CMM 3D Coordinate inspection (±0.05mm)', 'RoHS & REACH compliance', 'Salt spray 96h corrosion test']

function fakeScene() {
  return { resize: vi.fn(), setHighlight: vi.fn(), setReducedMotion: vi.fn(), setActive: vi.fn(), dispose: vi.fn() }
}

let options: HousingSceneOptions
let scene: ReturnType<typeof fakeScene>

function renderDrawing(highlight: number | null = null) {
  const onReady = vi.fn()
  const onFailed = vi.fn()
  const view = render(
    <figure style={{ backgroundColor: 'rgb(236, 240, 243)' }}>
      <HousingInspection protocols={PROTOCOLS} highlight={highlight} onReady={onReady} onFailed={onFailed} />
    </figure>,
  )
  const rerender = (next: number | null) =>
    view.rerender(
      <figure style={{ backgroundColor: 'rgb(236, 240, 243)' }}>
        <HousingInspection protocols={PROTOCOLS} highlight={next} onReady={onReady} onFailed={onFailed} />
      </figure>,
    )
  return { ...view, rerender, onReady, onFailed }
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
  sceneModule.createHousingScene.mockReset().mockImplementation((next: HousingSceneOptions) => {
    options = next
    scene = fakeScene()
    return scene
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('HousingInspection', () => {
  it('starts the scene on the figure ground with the current highlight, then reports ready', async () => {
    const { onReady, onFailed } = renderDrawing(1)
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1))
    expect(sceneModule.createHousingScene).toHaveBeenCalledTimes(1)
    expect(options.palette.ground).toEqual([236 / 255, 240 / 255, 243 / 255])
    for (const channel of [...options.palette.line, ...options.palette.accent]) {
      expect(channel).toBeGreaterThanOrEqual(0)
      expect(channel).toBeLessThanOrEqual(1)
    }
    expect(scene.setHighlight).toHaveBeenCalledWith(1)
    expect(options.reducedMotion).toBe(false)
    expect(onFailed).not.toHaveBeenCalled()
  })

  it('moves the numbered markers to where the scene projects them', async () => {
    const { container, onReady } = renderDrawing()
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

  it('forwards a new highlight to the running scene without restarting it', async () => {
    const { container, rerender, onReady } = renderDrawing()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    rerender(2)
    expect(scene.setHighlight).toHaveBeenLastCalledWith(2)
    expect(sceneModule.createHousingScene).toHaveBeenCalledTimes(1)
    const badges = container.querySelectorAll('[data-balloon]')
    expect(badges).toHaveLength(3)
    expect(badges[2]!.className).toContain('bg-accent')
    expect(badges[0]!.className).not.toContain('bg-accent')
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
    const { onReady } = renderDrawing()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    expect(options.reducedMotion).toBe(true)
  })

  it('hands back to the photograph when WebGL cannot start', async () => {
    sceneModule.createHousingScene.mockImplementation(() => {
      throw new Error('Error creating WebGL context.')
    })
    const { onReady, onFailed } = renderDrawing()
    await waitFor(() => expect(onFailed).toHaveBeenCalledTimes(1))
    expect(onReady).not.toHaveBeenCalled()
  })

  it('hands back to the photograph when the context is lost', async () => {
    const { onReady, onFailed } = renderDrawing()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    act(() => options.onContextLost())
    expect(onFailed).toHaveBeenCalledTimes(1)
  })

  it('disposes the scene on unmount and ignores its late events', async () => {
    const { unmount, onReady, onFailed } = renderDrawing()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    unmount()
    expect(scene.dispose).toHaveBeenCalledTimes(1)
    options.onContextLost()
    expect(onFailed).not.toHaveBeenCalled()
  })

  it('describes every inspection point in text, since the canvas and markers are hidden', async () => {
    const { container, onReady } = renderDrawing()
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('ol')).toHaveAttribute('aria-hidden', 'true')
    const description = container.querySelector('p.sr-only')!.textContent!
    expect(description).toContain('Point 1: CMM 3D Coordinate inspection (±0.05mm), applied to the rim of the top bore.')
    expect(description).toContain('Point 2: RoHS & REACH compliance, applied to the machined base block.')
    expect(description).toContain('Point 3: Salt spray 96h corrosion test, applied to the side fitting.')
  })
})
