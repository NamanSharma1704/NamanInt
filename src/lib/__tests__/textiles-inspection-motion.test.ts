/**
 * The Textiles & Materials scene's scroll choreography, and the tear it runs. Pure data, so no WebGL is needed.
 */
import { describe, expect, it } from 'vitest'

import { ROLL, TAG, TEAR, sheetPoint, tearFibres, tearHalfOpening, tearLength, tearLine, tornPosition, type Vec3 } from '../textiles-inspection/geometry'
import { OVERVIEW, STEP_HOLD, STEP_VIEWS, TAG_LIFT_DEG, textilesPose, textilesView, type TextilesView } from '../textiles-inspection/motion'

const edge = -ROLL.width / 2
const distance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const scalars = (progress: number): number[] => {
  const pose = textilesPose(progress)
  return [...pose.view.toward, pose.view.zoom, pose.view.azimuthDeg / 100, pose.view.elevationDeg / 100, pose.tagTiltDeg / 100, ...pose.swatchRise, pose.tearRun]
}
const expectView = (actual: TextilesView, expected: TextilesView): void => {
  expect(actual.zoom).toBeCloseTo(expected.zoom, 9)
  expect(actual.azimuthDeg).toBeCloseTo(expected.azimuthDeg, 9)
  expect(actual.elevationDeg).toBeCloseTo(expected.elevationDeg, 9)
  actual.toward.forEach((weight, area) => expect(weight).toBeCloseTo(expected.toward[area]!, 9))
}

describe('textiles scene motion', () => {
  it('starts on the whole model at rest, with the sheet whole', () => {
    const pose = textilesPose(0)
    expect(pose.view).toEqual(OVERVIEW)
    expect(pose.tagTiltDeg).toBe(TAG.tiltDeg)
    expect(pose.swatchRise.every((rise) => rise === 0)).toBe(true)
    expect(pose.tearRun).toBe(0)
  })

  it("holds each step's closer view through its hold, the middle included, and the last view to the end", () => {
    STEP_VIEWS.forEach((view, index) => {
      const [from, to] = STEP_HOLD[index]!
      for (const share of [from, (from + 0.5) / 2, 0.5, (to + 0.5) / 2]) expectView(textilesView((index + share) / 3), view)
      // Each view looks toward its own step's element, closer than the whole model.
      expect(view.toward.indexOf(Math.max(...view.toward))).toBe(index)
      expect(view.zoom).toBeLessThan(1)
      expect(from).toBeLessThan(0.5)
      expect(to).toBeGreaterThan(0.5)
    })
    expect(textilesView(1)).toEqual(STEP_VIEWS[2])
  })

  it('moves each element only during its own step, while the camera holds on it, done by the middle', () => {
    // 01: the tag lifts once the camera has settled, is up by the middle, and is back at rest in the next step.
    expect(textilesPose(STEP_HOLD[0]![0] / 3).tagTiltDeg).toBe(TAG.tiltDeg)
    expect(textilesPose(1 / 6).tagTiltDeg).toBeCloseTo(TAG_LIFT_DEG, 6)
    expect(textilesPose(0.3).tagTiltDeg).toBeCloseTo(TAG_LIFT_DEG, 6)
    expect(textilesPose(0.5).tagTiltDeg).toBe(TAG.tiltDeg)
    expect(textilesPose(0.8).tagTiltDeg).toBe(TAG.tiltDeg)
    // 02: the swatches rise one after another, all up by the middle, and lie flat outside the step.
    expect(Math.max(...textilesPose((1 + STEP_HOLD[1]![0]) / 3).swatchRise)).toBe(0)
    const rising = textilesPose(1.4 / 3).swatchRise
    expect(rising[0]!).toBeGreaterThan(rising[4]!)
    expect(rising[4]).toBeGreaterThan(0)
    expect(Math.min(...textilesPose(0.5).swatchRise)).toBeGreaterThan(0.99)
    for (const progress of [0.2, 0.34, 0.66, 0.9]) expect(Math.max(...textilesPose(progress).swatchRise)).toBeLessThan(0.02)
    // 03: the sheet stays whole until the camera has settled on the tear, tears through by the middle, and stays torn.
    expect(textilesPose(0.6).tearRun).toBe(0)
    expect(textilesPose((2 + STEP_HOLD[2]![0]) / 3).tearRun).toBeCloseTo(0, 9)
    expect(textilesPose(0.8).tearRun).toBeGreaterThan(0.3)
    expect(textilesPose(0.8).tearRun).toBeLessThan(1)
    expect(textilesPose(5 / 6).tearRun).toBeCloseTo(1, 9)
    expect(textilesPose(1).tearRun).toBe(1)
  })

  it('moves smoothly with the scroll, without jumps at step boundaries', () => {
    let previous = scalars(0)
    for (let progress = 0.0005; progress <= 1; progress += 0.0005) {
      const next = scalars(progress)
      next.forEach((value, index) => expect(Math.abs(value - previous[index]!), `at ${progress.toFixed(4)}`).toBeLessThan(0.02))
      previous = next
    }
  })

  it('tears the sheet in from its edge as the tear runs, pulling the torn sides apart', () => {
    const line = tearLine(edge)
    // Whole at rest: no gap anywhere, and both edges of the finished tear closed onto its line.
    for (let x = edge; x < edge + TEAR.depth; x += 0.005) {
      expect(tearHalfOpening(x, 0)).toBe(0)
      expect(tornPosition(x, tearLine(x) + tearHalfOpening(x), 0)).toBeCloseTo(tearLine(x), 12)
      expect(tornPosition(x, tearLine(x) - tearHalfOpening(x), 0)).toBeCloseTo(tearLine(x), 12)
    }
    // Part way, the gap is open near the edge but has not reached the finished tear's tip, and is never wider than it.
    expect(tearHalfOpening(edge + 0.01, 0.5)).toBeGreaterThan(0)
    expect(tearHalfOpening(edge + TEAR.depth * 0.7, 0.5)).toBe(0)
    expect(tearHalfOpening(edge + TEAR.depth * 0.7)).toBeGreaterThan(0)
    for (const run of [0.1, 0.4, 0.8]) {
      for (let x = edge; x < edge + TEAR.depth; x += 0.002) expect(tearHalfOpening(x, run)).toBeLessThanOrEqual(tearHalfOpening(x) + 1e-12)
    }
    // Its sides move further apart, and the far side lifts, as it runs.
    const gap = (run: number): number => sheetPoint(edge, line + tearHalfOpening(edge, run), 1, run)[2] - sheetPoint(edge, line - tearHalfOpening(edge, run), 1, run)[2]
    expect(gap(0)).toBeCloseTo(0, 9)
    expect(gap(0.4)).toBeGreaterThan(gap(0.1))
    expect(gap(1)).toBeGreaterThan(gap(0.4))
    expect(sheetPoint(edge, line + 0.03, 1, 1)[1]).toBeGreaterThan(sheetPoint(edge, line + 0.03, 1, 0)[1])
    // Away from the tear, nothing moves.
    expect(sheetPoint(0, TEAR.s, 1, 1)).toEqual(sheetPoint(0, TEAR.s, 1, 0))
    expect(sheetPoint(edge, line + 0.5, 1, 1)).toEqual(sheetPoint(edge, line + 0.5, 1, 0))
  })

  it('grows the fibres with the tear, and snaps the threads across its gap as it opens', () => {
    const runs = [0, 0.3, 0.6, 1].map((run) => tearFibres(run))
    for (const fibres of runs) {
      expect(fibres).toHaveLength(runs[0]!.length)
      fibres.forEach((fibre, index) => expect(fibre.points).toHaveLength(runs[0]![index]!.points.length))
    }
    // None on the whole sheet, and only where the tear has run part way.
    expect(runs[0]!.every((fibre) => fibre.radius === 0)).toBe(true)
    for (const fibre of tearFibres(0.4)) if (fibre.radius > 0) expect(fibre.points[0]![0]).toBeLessThan(edge + tearLength(0.4) + 0.004)
    // Threads across the gap hold while it is narrow, their two halves meeting, and break once it has opened.
    const pairs = (run: number): Array<{ apart: number; shown: boolean }> => {
      const bridges = tearFibres(run).filter((fibre) => fibre.kind === 'bridge')
      const tip = (k: number): Vec3 => bridges[k]!.points[bridges[k]!.points.length - 1]!
      return Array.from({ length: bridges.length / 2 }, (_, k) => ({ apart: distance(tip(2 * k), tip(2 * k + 1)), shown: bridges[2 * k]!.radius > 0 }))
    }
    expect([0.3, 0.5, 0.7, 0.9].some((run) => pairs(run).some((pair) => pair.shown && pair.apart < 1e-9))).toBe(true)
    expect(pairs(1).some((pair) => pair.shown && pair.apart > 0.005)).toBe(true)
  })
})
