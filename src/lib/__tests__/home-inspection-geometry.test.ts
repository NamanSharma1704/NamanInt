/**
 * The Home & Living Utility inspection model's geometry: one fluted pitcher in its test bath, the beaker that pours
 * into it, and the coupon cut from its wall. Pure data, so no WebGL is needed.
 */
import { describe, expect, it } from 'vitest'

import {
  BATH,
  BEAKER,
  COUPON,
  FILL,
  INSPECTION_AREAS,
  PITCHER,
  PITCHER_BASE_Y,
  TRAY,
  HOME_VIEW,
  bathLevelY,
  bathSurface,
  beakerLip,
  beakerPlacement,
  couponFrame,
  fillSurfaceY,
  fluteOffset,
  handlePath,
  innerRadius,
  insideCoupon,
  pitcherRadius,
  pitcherWallPoint,
  spoutBump,
  streamPoints,
  type Vec3,
} from '../home-inspection/geometry'

const DEG = Math.PI / 180
const distance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const radiusOf = (point: Vec3): number => Math.hypot(point[0], point[2])
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

describe('home inspection geometry', () => {
  it('turns the silhouette from a foot through a belly and a waist to a flared rim', () => {
    expect(pitcherRadius(0)).toBeCloseTo(0.05, 4)
    const heights = Array.from({ length: 236 }, (_, k) => k / 1000)
    const widest = heights.reduce((best, y) => (pitcherRadius(y) > pitcherRadius(best) ? y : best), 0)
    expect(widest).toBeGreaterThan(0.06)
    expect(widest).toBeLessThan(0.11)
    // The waist is narrower than both the belly and the rim, and the wall stands all the way up.
    expect(pitcherRadius(0.198)).toBeLessThan(pitcherRadius(widest))
    expect(pitcherRadius(PITCHER.height)).toBeGreaterThan(pitcherRadius(0.198))
    for (const y of heights) expect(innerRadius(y), `wall at ${y.toFixed(3)}`).toBeGreaterThan(0.01)
  })

  it('keeps the wall an even thickness between its outer and inner faces', () => {
    for (let y = 0.02; y <= 0.23; y += 0.01) {
      // On a flute's crest the outer face sits on the silhouette itself.
      const outer = radiusOf(pitcherWallPoint(0, y, 0))
      const inner = radiusOf(pitcherWallPoint(0, y, 1))
      expect(outer - inner, `wall at ${y.toFixed(2)}`).toBeCloseTo(PITCHER.wall, 6)
      expect(radiusOf(pitcherWallPoint(0, y, 0.5))).toBeCloseTo((outer + inner) / 2, 6)
    }
  })

  it('cuts flutes into the outer wall, and leaves the base and the rim round', () => {
    expect(fluteOffset(0, 0.1)).toBeCloseTo(0, 9)
    expect(fluteOffset(Math.PI / PITCHER.flutes, 0.1)).toBeCloseTo(-PITCHER.fluteDepth, 9)
    for (let k = 0; k < PITCHER.flutes; k += 1) {
      expect(fluteOffset((2 * Math.PI * k) / PITCHER.flutes, 0.1)).toBeCloseTo(0, 9)
    }
    expect(fluteOffset(Math.PI / PITCHER.flutes, 0)).toBeCloseTo(0, 9)
    expect(fluteOffset(Math.PI / PITCHER.flutes, PITCHER.height)).toBeCloseTo(0, 9)
  })

  it('draws the rim out and up into a spout on one side only', () => {
    expect(spoutBump(PITCHER.spout.atDeg * DEG)).toBeCloseTo(1, 9)
    expect(spoutBump(PITCHER.handle.atDeg * DEG)).toBe(0)
    expect(spoutBump(COUPON.atDeg * DEG)).toBe(0)
    const lip = pitcherWallPoint(PITCHER.spout.atDeg * DEG, PITCHER.height, 0)
    const rim = pitcherWallPoint(COUPON.atDeg * DEG, PITCHER.height, 0)
    expect(lip[1] - rim[1]).toBeCloseTo(PITCHER.spout.lift, 6)
    expect(radiusOf(lip) - radiusOf(rim)).toBeCloseTo(PITCHER.spout.reach, 6)
    // The spout is the highest point of the piece, and the rim is unfluted all the way round.
    expect(lip[1]).toBeGreaterThan(PITCHER_BASE_Y + PITCHER.height)
  })

  it('runs the handle clear of the spout and the coupon, out from the wall and back into it', () => {
    const path = handlePath()
    expect(path.length).toBeGreaterThan(4)
    const ends = [path[0]!, path[path.length - 1]!]
    for (const end of ends) {
      // Both ends are buried in the wall, so the handle grows out of the piece.
      expect(radiusOf(end)).toBeLessThan(pitcherRadius(end[1] - PITCHER_BASE_Y))
    }
    const furthest = Math.max(...path.map((point) => radiusOf(point) - pitcherRadius(point[1] - PITCHER_BASE_Y)))
    expect(furthest).toBeGreaterThan(0.03)
    for (const point of path) expect(point[1]).toBeGreaterThan(PITCHER_BASE_Y)
    for (const other of [PITCHER.spout.atDeg, COUPON.atDeg]) {
      expect(Math.abs(PITCHER.handle.atDeg - other)).toBeGreaterThan(PITCHER.spout.halfWidthDeg + COUPON.halfWidthDeg)
    }
  })

  it('cuts the coupon from clear wall, above both waterlines and below the rim', () => {
    expect(COUPON.fromY).toBeGreaterThan(FILL.line)
    expect(COUPON.fromY).toBeGreaterThan(BATH.line)
    expect(COUPON.toY).toBeLessThan(PITCHER.height - 0.03)
    expect(COUPON.glaze * 2).toBeLessThan(PITCHER.wall)
    expect(insideCoupon(0, (COUPON.fromY + COUPON.toY) / 2)).toBe(true)
    expect(insideCoupon(Math.PI, (COUPON.fromY + COUPON.toY) / 2)).toBe(false)
    expect(insideCoupon(0, COUPON.toY + 0.01)).toBe(false)
    const { origin, across, up, outward } = couponFrame()
    expect(radiusOf(origin)).toBeCloseTo(radiusOf(pitcherWallPoint(0, (COUPON.fromY + COUPON.toY) / 2, 0.5)), 9)
    // A right-handed frame on the wall: across the coupon, up the piece, out of the wall.
    for (const axis of [across, up, outward]) expect(Math.hypot(...axis)).toBeCloseTo(1, 9)
    expect(dot(across, up)).toBeCloseTo(0, 9)
    expect(dot(across, outward)).toBeCloseTo(0, 9)
    expect(dot(up, outward)).toBeCloseTo(0, 9)
    expect(dot(outward, [origin[0], 0, origin[2]])).toBeGreaterThan(0)
  })

  it('fills the pitcher to a test line that stays inside it, below the coupon', () => {
    expect(fillSurfaceY(0)).toBeCloseTo(PITCHER_BASE_Y + PITCHER.floor, 9)
    expect(fillSurfaceY(1)).toBeCloseTo(PITCHER_BASE_Y + FILL.line, 9)
    expect(fillSurfaceY(0.5)).toBeGreaterThan(fillSurfaceY(0))
    expect(FILL.line).toBeLessThan(PITCHER.height - 0.05)
    expect(innerRadius(FILL.line)).toBeGreaterThan(0.05)
    expect(fillSurfaceY(1)).toBeLessThan(PITCHER_BASE_Y + COUPON.fromY)
  })

  it('fills the bath below its own rim and below the coupon, with ripples that settle', () => {
    expect(bathLevelY(0)).toBeCloseTo(TRAY.floor, 9)
    expect(bathLevelY(1)).toBeLessThan(TRAY.height - 0.01)
    expect(bathLevelY(1)).toBeGreaterThan(PITCHER_BASE_Y + 0.05)
    expect(bathLevelY(1)).toBeLessThan(PITCHER_BASE_Y + COUPON.fromY)
    // Rings run out from the piece while it fills, and the surface is still once it is full.
    const moving = Array.from({ length: 40 }, (_, k) => bathSurface(0.06 + k * 0.004, 0, 0.35) - bathLevelY(0.35))
    expect(Math.max(...moving.map(Math.abs))).toBeGreaterThan(0.0005)
    expect(Math.max(...moving.map(Math.abs))).toBeLessThanOrEqual(BATH.ripple.amplitude + 1e-9)
    expect(moving.some((height) => height > 0)).toBe(true)
    expect(moving.some((height) => height < 0)).toBe(true)
    // Full, it keeps only a trace of movement.
    const settled = Array.from({ length: 40 }, (_, k) => bathSurface(0.06 + k * 0.004, 0, 1) - bathLevelY(1))
    expect(Math.max(...settled.map(Math.abs))).toBeLessThan(BATH.ripple.amplitude * 0.4)
    expect(Math.max(...settled.map(Math.abs))).toBeGreaterThan(0)
  })

  it('tips the beaker from the bench to over the mouth, and pours into the piece', () => {
    const rest = beakerPlacement(0)
    expect(rest.position[1]).toBeCloseTo(0, 9)
    expect(rest.tiltDeg).toBe(0)
    // At rest it stands on the bench, clear of the bath.
    expect(Math.abs(rest.position[0]) - BEAKER.radius).toBeGreaterThan(TRAY.width / 2)
    const lip = beakerLip(1)
    expect(lip[1]).toBeGreaterThan(PITCHER_BASE_Y + PITCHER.height + PITCHER.spout.lift)
    // It pours into the mouth, not over the side.
    expect(Math.hypot(lip[0], lip[2])).toBeLessThan(innerRadius(PITCHER.height))
    expect(beakerPlacement(0.5).position[1]).toBeGreaterThan(BEAKER.lift)
    const stream = streamPoints(1, 1)
    expect(stream[0]).toEqual(lip)
    expect(stream[stream.length - 1]![1]).toBeCloseTo(fillSurfaceY(1), 9)
    for (let k = 1; k < stream.length; k += 1) expect(stream[k]![1]).toBeLessThan(stream[k - 1]![1])
  })

  it('keeps the three inspection areas apart, each around its own test', () => {
    expect(INSPECTION_AREAS.map((area) => area.protocol)).toEqual([0, 1, 2])
    for (let i = 0; i < INSPECTION_AREAS.length; i += 1) {
      for (let j = i + 1; j < INSPECTION_AREAS.length; j += 1) {
        const a = INSPECTION_AREAS[i]!
        const b = INSPECTION_AREAS[j]!
        expect(distance(a.centre, b.centre), `${a.id} to ${b.id}`).toBeGreaterThan(a.radius + b.radius)
      }
    }
    // Each sits on its own test: the mouth, the coupon and the waterline.
    expect(INSPECTION_AREAS[0]!.centre[1]).toBeGreaterThan(PITCHER_BASE_Y + FILL.line)
    expect(distance(INSPECTION_AREAS[1]!.centre, couponFrame().origin)).toBeCloseTo(0, 9)
    expect(INSPECTION_AREAS[2]!.centre[1]).toBeCloseTo(bathLevelY(1), 9)
  })

  it('looks from a three-quarter view, above the bath', () => {
    expect(HOME_VIEW.azimuthDeg).toBeLessThan(0)
    expect(HOME_VIEW.elevationDeg).toBeGreaterThan(5)
    expect(HOME_VIEW.elevationDeg).toBeLessThan(45)
    expect(HOME_VIEW.fovDeg).toBeGreaterThan(20)
    expect(HOME_VIEW.fovDeg).toBeLessThan(40)
  })
})
