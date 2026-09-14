/**
 * The Precision Hardware inspection drawing's housing geometry: pure data, so no WebGL is needed.
 */
import { describe, expect, it } from 'vitest'

import {
  HOUSING_SOLIDS,
  INSPECTION_MARKERS,
  NOTCH_HALF_WIDTH,
  RIM_TOP,
  circle,
  housingBounds,
  roundedRect,
  type PlanPrism,
  type Point2,
  type Solid,
} from '../housing-inspection/geometry'

function solid<K extends Solid['kind']>(id: string, kind: K): Extract<Solid, { kind: K }> {
  const found = HOUSING_SOLIDS.find((item) => item.id === id)
  expect(found, `solid ${id}`).toBeDefined()
  expect(found!.kind).toBe(kind)
  return found as Extract<Solid, { kind: K }>
}

function inside([x, y]: Point2, polygon: readonly Point2[]): boolean {
  let hit = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i]!
    const [xj, yj] = polygon[j]!
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

describe('housing inspection geometry', () => {
  it('builds every part of the credited reconstruction once', () => {
    const ids = HOUSING_SOLIDS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ['base-block', 'base-deck-left', 'base-deck-right', 'cheek-left', 'cheek-right', 'window-back-wall', 'top-plate', 'top-rim', 'bore-boss', 'fitting-collar', 'fitting-nipple']) {
      expect(ids).toContain(id)
    }
    expect(ids.filter((id) => id.startsWith('screw-'))).toHaveLength(8)
  })

  it('produces only finite coordinates', () => {
    const numbers: number[] = []
    for (const item of HOUSING_SOLIDS) {
      if (item.kind === 'plan-prism') numbers.push(item.y, item.height, ...item.outline.flat(), ...item.holes.flat(2))
      if (item.kind === 'front-prism') numbers.push(item.z, item.depth, ...item.outline.flat())
      if (item.kind === 'z-lathe') numbers.push(item.x, item.y, ...item.profile.flat())
      if (item.kind === 'rod') numbers.push(...item.start, ...item.end, item.radius)
    }
    expect(numbers.length).toBeGreaterThan(100)
    for (const value of numbers) expect(Number.isFinite(value)).toBe(true)
  })

  it('cuts the base block with a notch that meets its top face at the bore collar', () => {
    const base = solid('base-block', 'front-prism')
    const top = base.outline.filter(([, y]) => Math.abs(y - 0.27) < 1e-3)
    const xs = top.map(([x]) => x).sort((a, b) => a - b)
    expect(xs[0]).toBe(-0.5)
    expect(xs.at(-1)).toBe(0.5)
    expect(xs).toContain(NOTCH_HALF_WIDTH)
    expect(xs).toContain(-NOTCH_HALF_WIDTH)
    const lowest = Math.min(...base.outline.map(([, y]) => y).filter((y) => y > 0))
    expect(lowest).toBeCloseTo(0.29 - 0.195, 3)
  })

  it('splits the deck ledges either side of the notch, each with a mounting hole inside it', () => {
    for (const id of ['base-deck-left', 'base-deck-right']) {
      const deck = solid(id, 'plan-prism')
      expect(deck.holes).toHaveLength(1)
      for (const point of deck.holes[0]!) expect(inside(point, deck.outline)).toBe(true)
    }
    const left = solid('base-deck-left', 'plan-prism').outline.map(([x]) => x)
    const right = solid('base-deck-right', 'plan-prism').outline.map(([x]) => x)
    expect(Math.max(...left)).toBeCloseTo(-Math.min(...right), 6)
  })

  it('cuts only the left front corner of the upper frame', () => {
    const plate = solid('top-plate', 'plan-prism')
    expect(plate.outline).toHaveLength(5)
    expect(solid('cheek-left', 'plan-prism').outline).toHaveLength(5)
    expect(solid('cheek-right', 'plan-prism').outline).toHaveLength(4)
    expect(plate.outline).toContainEqual([0.5, 0.22])
    expect(plate.outline).not.toContainEqual([-0.5, 0.22])
  })

  it('keeps the top bore and the pocket inside the plate and rim outlines', () => {
    const holesInside = (prism: PlanPrism) => prism.holes.every((hole) => hole.every((point) => inside(point, prism.outline)))
    expect(holesInside(solid('top-plate', 'plan-prism'))).toBe(true)
    expect(holesInside(solid('top-rim', 'plan-prism'))).toBe(true)
  })

  it('stands the bore collar proud of the base front face, with the bore narrower than the chamfer', () => {
    const boss = solid('bore-boss', 'z-lathe')
    const front = Math.max(...boss.profile.map(([, z]) => z))
    expect(front).toBeGreaterThan(0.28)
    const radii = boss.profile.map(([r]) => r)
    expect(Math.min(...radii)).toBeLessThan(0.18)
    expect(boss.profile[0]).toEqual(boss.profile.at(-1))
  })

  it('seats the screws on the rim, outside the pocket', () => {
    const rim = solid('top-rim', 'plan-prism')
    const pocket = rim.holes[0]!
    const screws = HOUSING_SOLIDS.filter((item) => item.id.startsWith('screw-'))
    for (const screw of screws) {
      if (screw.kind !== 'rod') throw new Error('screw must be a rod')
      const plan: Point2 = [screw.start[0], screw.start[2]]
      expect(inside(plan, rim.outline)).toBe(true)
      expect(inside(plan, pocket)).toBe(false)
      expect(screw.start[1]).toBeLessThan(RIM_TOP)
      expect(screw.end[1]).toBeGreaterThan(RIM_TOP)
    }
  })

  it('frames a part one base-width wide with the collar and fitting standing proud', () => {
    const { min, max } = housingBounds()
    expect(min[0]).toBeCloseTo(-0.5, 4)
    expect(max[0]).toBeGreaterThan(0.5)
    expect(max[0]).toBeLessThan(0.6)
    expect(min[1]).toBeCloseTo(0, 4)
    expect(max[1]).toBeGreaterThan(RIM_TOP)
    expect(max[2]).toBeGreaterThan(0.28)
  })

  it('anchors one marker per inspection protocol, in order, within the part', () => {
    expect(INSPECTION_MARKERS.map((marker) => marker.protocol)).toEqual([0, 1, 2])
    const { min, max } = housingBounds()
    for (const marker of INSPECTION_MARKERS) {
      marker.anchor.forEach((value, axis) => {
        expect(value).toBeGreaterThanOrEqual(min[axis]! - 1e-6)
        expect(value).toBeLessThanOrEqual(max[axis]! + 1e-6)
      })
      expect(marker.place.length).toBeGreaterThan(3)
    }
  })

  it('builds closed loops for circles and rounded rectangles', () => {
    expect(circle(0, 0, 1, 12)).toHaveLength(12)
    const loop = roundedRect(-1, 1, -0.5, 0.5, 0.2, 4)
    expect(loop).toHaveLength(20)
    for (const [x, y] of loop) {
      expect(Math.abs(x)).toBeLessThanOrEqual(1 + 1e-9)
      expect(Math.abs(y)).toBeLessThanOrEqual(0.5 + 1e-9)
    }
  })
})
