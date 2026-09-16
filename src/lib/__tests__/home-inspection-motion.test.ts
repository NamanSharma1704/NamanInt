/**
 * The Home & Living Utility scene's scroll choreography: the camera's moves and the three tests it holds on. Pure
 * data, so no WebGL is needed.
 */
import { describe, expect, it } from 'vitest'

import { OVERVIEW, STEP_HOLD, STEP_VIEWS, homePose, homeView, type HomeView } from '../home-inspection/motion'

const scalars = (progress: number): number[] => {
  const pose = homePose(progress)
  return [
    ...pose.view.toward,
    pose.view.zoom,
    pose.view.azimuthDeg / 100,
    pose.view.elevationDeg / 100,
    pose.pour,
    pose.stream,
    pose.fill,
    pose.couponOut,
    pose.couponTurn,
    pose.bath,
  ]
}
const expectView = (actual: HomeView, expected: HomeView): void => {
  expect(actual.zoom).toBeCloseTo(expected.zoom, 9)
  expect(actual.azimuthDeg).toBeCloseTo(expected.azimuthDeg, 9)
  expect(actual.elevationDeg).toBeCloseTo(expected.elevationDeg, 9)
  actual.toward.forEach((weight, area) => expect(weight).toBeCloseTo(expected.toward[area]!, 9))
}

describe('home scene motion', () => {
  it('starts on the whole bench, with the piece untouched', () => {
    const pose = homePose(0)
    expect(pose.view).toEqual(OVERVIEW)
    expect([pose.pour, pose.stream, pose.fill, pose.couponOut, pose.couponTurn, pose.bath]).toEqual([0, 0, 0, 0, 0, 0])
  })

  it("holds each step's closer view through its hold, the middle included, and the last view to the end", () => {
    STEP_VIEWS.forEach((view, index) => {
      const [from, to] = STEP_HOLD[index]!
      for (const share of [from, (from + 0.5) / 2, 0.5, (to + 0.5) / 2]) expectView(homeView((index + share) / 3), view)
      expect(view.toward.indexOf(Math.max(...view.toward))).toBe(index)
      expect(view.zoom).toBeLessThan(1)
      expect(from).toBeLessThan(0.5)
      expect(to).toBeGreaterThan(0.5)
    })
    expect(homeView(1)).toEqual(STEP_VIEWS[2])
  })

  it('runs each test only during its own step, while the camera holds on it', () => {
    // 01: the beaker is pouring at the middle, the simulant is at the line, and it is back on the bench by the end.
    const pouring = homePose(1 / 6)
    expect(pouring.pour).toBeCloseTo(1, 6)
    expect(pouring.stream).toBeCloseTo(1, 6)
    expect(pouring.fill).toBeGreaterThan(0.85)
    expect(homePose(0.3).pour).toBeCloseTo(0, 6)
    expect(homePose(0.3).stream).toBeCloseTo(0, 6)
    // Nothing happens while the camera is still coming in from the whole bench.
    expect(homePose(0.05).pour).toBe(0)
    // The simulant stays in the piece for the rest of the process.
    for (const progress of [0.3, 0.5, 0.8, 1]) expect(homePose(progress).fill).toBe(1)
    // 02: the coupon is out and turned at the middle, and back in the wall before the bath.
    const lifted = homePose(0.5)
    expect(lifted.couponOut).toBeCloseTo(1, 6)
    expect(lifted.couponTurn).toBeCloseTo(1, 6)
    expect(homePose((1 + STEP_HOLD[1]![0]) / 3).couponOut).toBe(0)
    for (const progress of [0.2, 0.34, 0.66, 0.9]) {
      expect(Math.max(homePose(progress).couponOut, homePose(progress).couponTurn), `at ${progress}`).toBeLessThan(0.02)
    }
    // 03: the bath fills once the camera is down at the waterline, and stays full.
    expect(homePose(0.6).bath).toBe(0)
    expect(homePose((2 + STEP_HOLD[2]![0]) / 3).bath).toBeCloseTo(0, 9)
    expect(homePose(0.8).bath).toBeGreaterThan(0.3)
    expect(homePose(5 / 6).bath).toBeCloseTo(1, 9)
    expect(homePose(1).bath).toBe(1)
  })

  it('moves smoothly with the scroll, without jumps at step boundaries', () => {
    let previous = scalars(0)
    for (let progress = 0.0005; progress <= 1; progress += 0.0005) {
      const next = scalars(progress)
      next.forEach((value, index) => expect(Math.abs(value - previous[index]!), `at ${progress.toFixed(4)}`).toBeLessThan(0.02))
      previous = next
    }
  })

  it('pours before it fills, and turns the coupon only once it is out of the wall', () => {
    const streaming = Array.from({ length: 200 }, (_, k) => homePose(k / 600)).filter((pose) => pose.stream > 0.01)
    expect(streaming.length).toBeGreaterThan(10)
    // The stream only runs while the beaker is tipped over the mouth.
    for (const pose of streaming) expect(pose.pour).toBeGreaterThan(0.5)
    // Nothing pours into a piece that is already at the line and left alone.
    expect(homePose(0.3).stream).toBeCloseTo(0, 6)
    for (let progress = 1 / 3; progress <= 2 / 3; progress += 0.002) {
      const pose = homePose(progress)
      expect(pose.couponTurn, `at ${progress.toFixed(3)}`).toBeLessThanOrEqual(pose.couponOut + 1e-9)
    }
  })
})
