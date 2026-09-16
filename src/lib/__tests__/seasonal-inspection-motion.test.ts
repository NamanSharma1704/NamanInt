/**
 * The Seasonal & Promotional scene's scroll choreography: the camera's moves and the three acts it holds on. Pure
 * data, so no WebGL is needed.
 */
import { describe, expect, it } from 'vitest'

import { OVERVIEW, STEP_HOLD, STEP_VIEWS, seasonalPose, seasonalView, type SeasonalView } from '../seasonal-inspection/motion'

const scalars = (progress: number): number[] => {
  const pose = seasonalPose(progress)
  return [
    ...pose.view.toward,
    pose.view.zoom,
    pose.view.azimuthDeg / 100,
    pose.view.elevationDeg / 100,
    pose.slide,
    ...pose.sample,
    pose.lid,
    pose.close,
    pose.tape,
    pose.label,
  ]
}
const expectView = (actual: SeasonalView, expected: SeasonalView): void => {
  expect(actual.zoom).toBeCloseTo(expected.zoom, 9)
  expect(actual.azimuthDeg).toBeCloseTo(expected.azimuthDeg, 9)
  expect(actual.elevationDeg).toBeCloseTo(expected.elevationDeg, 9)
  actual.toward.forEach((weight, area) => expect(weight).toBeCloseTo(expected.toward[area]!, 9))
}

describe('seasonal scene motion', () => {
  it('starts on the whole bench, with the carton still packed on it', () => {
    const pose = seasonalPose(0)
    expect(pose.view).toEqual(OVERVIEW)
    expect([pose.slide, pose.lid, pose.close, pose.tape, pose.label]).toEqual([0, 0, 0, 0, 0])
    expect(pose.sample.every((out) => out === 0)).toBe(true)
  })

  it("holds each step's closer view through its hold, the middle included, and the last view to the end", () => {
    STEP_VIEWS.forEach((view, index) => {
      const [from, to] = STEP_HOLD[index]!
      for (const share of [from, (from + 0.5) / 2, 0.5, (to + 0.5) / 2]) expectView(seasonalView((index + share) / 3), view)
      expect(view.toward.indexOf(Math.max(...view.toward))).toBe(index)
      expect(view.zoom).toBeLessThan(1)
      expect(from).toBeLessThan(0.5)
      expect(to).toBeGreaterThan(0.5)
    })
    expect(seasonalView(1)).toEqual(STEP_VIEWS[2])
  })

  it('carries out each act only during its own step, while the camera holds on it', () => {
    // 01: the carton is on the pallet by the middle, and ships from there.
    expect(seasonalPose(0.05).slide).toBe(0)
    expect(seasonalPose(1 / 6).slide).toBeCloseTo(1, 6)
    for (const progress of [0.3, 0.5, 0.8, 1]) expect(seasonalPose(progress).slide).toBe(1)
    // 02: the sample comes out one box after another, its lid is off at the middle, and it all goes back.
    const drawing = seasonalPose(1.35 / 3).sample
    expect(drawing[0]!).toBeGreaterThan(drawing[2]!)
    expect(drawing[2]).toBeGreaterThan(0)
    const out = seasonalPose(0.5)
    expect(Math.min(...out.sample)).toBeGreaterThan(0.99)
    expect(out.lid).toBeCloseTo(1, 6)
    for (const progress of [0.2, 0.34, 0.66, 0.9]) {
      const pose = seasonalPose(progress)
      expect(Math.max(...pose.sample, pose.lid), `at ${progress}`).toBeLessThan(0.02)
    }
    // 03: the carton is closed, taped and labelled by the middle, and stays that way.
    expect(seasonalPose(0.72).close).toBe(0)
    const shipped = seasonalPose(5 / 6)
    expect(shipped.close).toBeCloseTo(1, 6)
    expect(shipped.tape).toBeCloseTo(1, 6)
    expect(shipped.label).toBeCloseTo(1, 6)
    expect(seasonalPose(1).label).toBe(1)
  })

  it('moves smoothly with the scroll, without jumps at step boundaries', () => {
    let previous = scalars(0)
    for (let progress = 0.0005; progress <= 1; progress += 0.0005) {
      const next = scalars(progress)
      next.forEach((value, index) => expect(Math.abs(value - previous[index]!), `at ${progress.toFixed(4)}`).toBeLessThan(0.02))
      previous = next
    }
  })

  it('closes the carton before it tapes it, and tapes it before the label lands', () => {
    for (let progress = 2 / 3; progress <= 1; progress += 0.002) {
      const pose = seasonalPose(progress)
      expect(pose.tape, `tape at ${progress.toFixed(3)}`).toBeLessThanOrEqual(pose.close + 1e-9)
      expect(pose.label, `label at ${progress.toFixed(3)}`).toBeLessThanOrEqual(pose.tape + 1e-9)
    }
    // The sample is back in the carton before the flaps fold over it.
    for (let progress = 0.6; progress <= 0.7; progress += 0.002) {
      const pose = seasonalPose(progress)
      if (pose.close > 0) expect(Math.max(...pose.sample), `at ${progress.toFixed(3)}`).toBeLessThan(0.02)
    }
  })
})
