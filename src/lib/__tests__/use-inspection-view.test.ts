/**
 * The Categories figure's photograph / inspection drawing state. The page itself reads
 * `virtual:content`, which unit tests must not load, so its wiring is checked in the browser.
 */
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useInspectionView } from '../housing-inspection/use-inspection-view'

describe('useInspectionView', () => {
  it('starts on the photograph with nothing highlighted', () => {
    const { result } = renderHook(() => useInspectionView())
    expect(result.current).toMatchObject({ on: false, ready: false, pinned: null, highlight: null })
  })

  it('keeps the photograph visible until the drawing reports its first frame', () => {
    const { result } = renderHook(() => useInspectionView())
    act(() => result.current.showDrawing())
    expect(result.current).toMatchObject({ on: true, ready: false })
    act(() => result.current.markReady())
    expect(result.current.ready).toBe(true)
  })

  it('pins a protocol with one press and releases it with a second', () => {
    const { result } = renderHook(() => useInspectionView())
    act(() => result.current.togglePin(1))
    expect(result.current).toMatchObject({ pinned: 1, highlight: 1 })
    act(() => result.current.togglePin(2))
    expect(result.current.pinned).toBe(2)
    act(() => result.current.togglePin(2))
    expect(result.current).toMatchObject({ pinned: null, highlight: null })
  })

  it('lets a preview override the pin, then falls back to it', () => {
    const { result } = renderHook(() => useInspectionView())
    act(() => result.current.togglePin(0))
    act(() => result.current.preview(2))
    expect(result.current).toMatchObject({ pinned: 0, highlight: 2 })
    act(() => result.current.preview(null))
    expect(result.current.highlight).toBe(0)
  })

  it('clears the drawing, its readiness and every highlight when returning to the photograph', () => {
    const { result } = renderHook(() => useInspectionView())
    act(() => {
      result.current.showDrawing()
      result.current.markReady()
      result.current.togglePin(1)
      result.current.preview(2)
    })
    act(() => result.current.showPhotograph())
    expect(result.current).toMatchObject({ on: false, ready: false, pinned: null, highlight: null })
  })

  it('hands out stable callbacks, so the drawing is not restarted by a re-render', () => {
    const { result, rerender } = renderHook(() => useInspectionView())
    const { markReady, showPhotograph } = result.current
    act(() => result.current.togglePin(1))
    rerender()
    expect(result.current.markReady).toBe(markReady)
    expect(result.current.showPhotograph).toBe(showPhotograph)
  })
})
