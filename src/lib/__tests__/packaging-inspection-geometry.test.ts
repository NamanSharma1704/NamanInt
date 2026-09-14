/**
 * The Packaging & Retail inspection drawing's display geometry: pure data, so no WebGL is needed.
 */
import { describe, expect, it } from 'vitest'

import { applyFrame, type Point2, type Solid, type Vec3 } from '../inspection-drawing/solids'
import {
  BAR_AREA,
  BOARD,
  CARTON,
  CARTON_DROP_HEIGHT,
  CARTON_FRAME,
  CARTON_PART_IDS,
  DROP_CORNER,
  ECT_WINDOW,
  EFFECT_ANCHORS,
  PACKAGING_DRAWING,
  PACKAGING_MARKERS,
  PACKAGING_SOLIDS,
  TRAY,
  cartonCorners,
  packagingBounds,
  rakeHeight,
} from '../packaging-inspection/geometry'

function solid<K extends Solid['kind']>(id: string, kind: K): Extract<Solid, { kind: K }> {
  const found = PACKAGING_SOLIDS.find((item) => item.id === id)
  expect(found, `solid ${id}`).toBeDefined()
  expect(found!.kind).toBe(kind)
  return found as Extract<Solid, { kind: K }>
}

function inside([a, b]: Point2, polygon: readonly Point2[]): boolean {
  let hit = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [ai, bi] = polygon[i]!
    const [aj, bj] = polygon[j]!
    if (bi > b !== bj > b && a < ((aj - ai) * (b - bi)) / (bj - bi) + ai) hit = !hit
  }
  return hit
}

/** The tray solid containing a point, if any (the front wall ignores its notch, so this is conservative). */
function trayPartAt([x, y, z]: Vec3): string | null {
  if (y < 0) return null
  if (z >= TRAY.back && z <= TRAY.sideFront && y <= rakeHeight(z)) {
    if (x >= TRAY.x1 - BOARD && x <= TRAY.x1) return 'right wall'
    if (x >= TRAY.x0 && x <= TRAY.x0 + BOARD) return 'left wall'
  }
  if (x >= TRAY.x0 + BOARD && x <= TRAY.x1 - BOARD && z >= TRAY.back && z <= TRAY.back + BOARD && y <= TRAY.backHeight) return 'back wall'
  if (x >= TRAY.x0 && x <= TRAY.x1 && z >= TRAY.front - 2 * BOARD && z <= TRAY.front && y <= TRAY.frontHeight) return 'front wall'
  if (x >= TRAY.x0 + BOARD && x <= TRAY.x1 - BOARD && z >= TRAY.back + BOARD && z <= TRAY.front - 2 * BOARD && y <= BOARD) return 'floor'
  return null
}

const bars = () => PACKAGING_SOLIDS.filter((item) => item.id.startsWith('gs1-bar-'))

describe('packaging inspection geometry', () => {
  it('builds every part of the credited reconstruction once', () => {
    const ids = PACKAGING_SOLIDS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of [
      'floor-flap-front',
      'floor-flap-back',
      'tray-front-wall',
      'front-fold-lip',
      'tray-side-wall-left',
      'tray-side-wall-right',
      'tray-back-wall',
      'flute-medium',
      'barcode-label',
      'barcode-label-face',
      ...CARTON_PART_IDS,
    ]) {
      expect(ids).toContain(id)
    }
    expect(bars()).toHaveLength(18)
    for (const parts of Object.values(PACKAGING_DRAWING.protocolParts)) {
      for (const part of parts) expect(ids).toContain(part)
    }
  })

  it('produces only finite coordinates', () => {
    const numbers: number[] = []
    for (const item of PACKAGING_SOLIDS) {
      if (item.kind === 'plan-prism') numbers.push(item.y, item.height, ...item.outline.flat(), ...item.holes.flat(2))
      if (item.kind === 'front-prism') numbers.push(item.z, item.depth, ...item.outline.flat())
      if (item.kind === 'side-prism') numbers.push(item.x, item.width, ...item.outline.flat(), ...item.holes.flat(2))
      if (item.frame) numbers.push(...item.frame.position, ...item.frame.rotation)
    }
    expect(numbers.length).toBeGreaterThan(300)
    for (const value of numbers) expect(Number.isFinite(value)).toBe(true)
  })

  it('rakes the side walls from the front wall height to full height at the back', () => {
    for (const id of ['tray-side-wall-left', 'tray-side-wall-right']) {
      const wall = solid(id, 'side-prism')
      expect(wall.outline).toContainEqual([TRAY.back, TRAY.backHeight])
      expect(wall.outline).toContainEqual([TRAY.sideFront, TRAY.frontHeight])
    }
    expect(rakeHeight(TRAY.sideFront)).toBeCloseTo(TRAY.frontHeight, 6)
    expect(rakeHeight(TRAY.back)).toBeCloseTo(TRAY.backHeight, 6)
  })

  it('cuts a thumb notch into both plies of the front wall', () => {
    for (const id of ['tray-front-wall', 'front-fold-lip']) {
      const heights = solid(id, 'front-prism').outline.map(([, y]) => y)
      expect(Math.max(...heights)).toBe(TRAY.frontHeight)
      expect(heights.filter((y) => y > 0 && y < TRAY.frontHeight)).toHaveLength(2)
    }
  })

  it('cuts the ECT window through the right wall and fills it with fluted medium', () => {
    const wall = solid('tray-side-wall-right', 'side-prism')
    expect(wall.holes).toHaveLength(1)
    for (const point of wall.holes[0]!) expect(inside(point, wall.outline)).toBe(true)
    expect(ECT_WINDOW.y1).toBeLessThan(rakeHeight(ECT_WINDOW.z1))

    const flute = solid('flute-medium', 'plan-prism')
    expect(flute.y).toBe(ECT_WINDOW.y0)
    for (const [x, z] of flute.outline) {
      expect(x).toBeGreaterThanOrEqual(TRAY.x1 - BOARD - 1e-9)
      expect(x).toBeLessThan(TRAY.x1)
      expect(z).toBeGreaterThanOrEqual(ECT_WINDOW.z0 - 1e-9)
      expect(z).toBeLessThanOrEqual(ECT_WINDOW.z1 + 1e-9)
    }
    const crests = flute.outline.filter(([x]) => Math.abs(x - (TRAY.x1 - 0.004)) < 1e-6)
    expect(crests).toHaveLength(5)
  })

  it('prints the barcode inside its label on the right wall, with longer guard bars', () => {
    const label = solid('barcode-label', 'side-prism')
    expect(label.x).toBe(TRAY.x1)
    for (const [z, y] of label.outline) {
      expect(z).toBeGreaterThan(TRAY.back)
      expect(z).toBeLessThan(TRAY.sideFront)
      expect(y).toBeLessThan(rakeHeight(z))
    }
    const bottoms = bars().map((bar) => {
      expect(bar.fill).toBe('line')
      if (bar.kind !== 'side-prism') throw new Error('bars must be side prisms')
      for (const [z] of bar.outline) {
        expect(z).toBeGreaterThanOrEqual(BAR_AREA.z0 - 1e-6)
        expect(z).toBeLessThanOrEqual(BAR_AREA.z1 + 1e-6)
      }
      return Math.min(...bar.outline.map(([, y]) => y))
    })
    expect(bottoms.filter((y) => y < BAR_AREA.y0 - 1e-6)).toHaveLength(6)
  })

  it('holds the carton corner-down with its centre of gravity over the drop corner', () => {
    const corner = applyFrame([CARTON.width / 2, -CARTON.height / 2, CARTON.depth / 2], CARTON_FRAME)
    corner.forEach((value, axis) => expect(value).toBeCloseTo(DROP_CORNER[axis]!, 4))
    const lowest = Math.min(...cartonCorners().map(([, y]) => y))
    expect(lowest).toBeCloseTo(DROP_CORNER[1], 4)
    // The frame's position is the carton's centre.
    expect(Math.hypot(CARTON_FRAME.position[0] - DROP_CORNER[0], CARTON_FRAME.position[2] - DROP_CORNER[2])).toBeLessThan(0.02)
    expect(DROP_CORNER[1]).toBeGreaterThan(BOARD)
  })

  it('keeps every carton face clear of the tray walls and floor', () => {
    const extents = [CARTON.width / 2, CARTON.height / 2, CARTON.depth / 2]
    const samples = 41
    const hits = new Set<string>()
    for (let axis = 0; axis < 3; axis += 1) {
      const others = [0, 1, 2].filter((other) => other !== axis)
      for (const sign of [-1, 1]) {
        for (let i = 0; i < samples; i += 1) {
          for (let j = 0; j < samples; j += 1) {
            const local = [0, 0, 0]
            local[axis] = sign * extents[axis]!
            local[others[0]!] = (-1 + (2 * i) / (samples - 1)) * extents[others[0]!]!
            local[others[1]!] = (-1 + (2 * j) / (samples - 1)) * extents[others[1]!]!
            const part = trayPartAt(applyFrame(local as unknown as Vec3, CARTON_FRAME))
            if (part) hits.add(part)
          }
        }
      }
    }
    expect([...hits]).toEqual([])
  })

  it('anchors one marker per inspection protocol, in order, within the drawing', () => {
    expect(PACKAGING_MARKERS.map((marker) => marker.protocol)).toEqual([0, 1, 2])
    const { min, max } = packagingBounds()
    for (const marker of PACKAGING_MARKERS) {
      const anchor = marker.frame ? applyFrame(marker.anchor, marker.frame) : marker.anchor
      anchor.forEach((value, axis) => {
        expect(value).toBeGreaterThanOrEqual(min[axis]! - 1e-3)
        expect(value).toBeLessThanOrEqual(max[axis]! + 1e-3)
      })
      expect(marker.place.length).toBeGreaterThan(3)
    }
  })

  it('places the drawn effects on their parts', () => {
    const { centre, radii } = EFFECT_ANCHORS.impact
    expect(centre[0] + radii[1]).toBeLessThan(TRAY.x1 - BOARD)
    expect(centre[0] - radii[1]).toBeGreaterThan(TRAY.x0 + BOARD)
    expect(centre[2] + radii[1]).toBeLessThan(TRAY.front - 2 * BOARD)
    expect(centre[2] - radii[1]).toBeGreaterThan(TRAY.back + BOARD)
    const { compression, scan } = EFFECT_ANCHORS
    // The arrows press on the cut-away itself, from just outside the wall's outer face.
    expect(compression.edgeY).toBe(ECT_WINDOW.y1)
    expect(compression.x).toBeGreaterThan(TRAY.x1)
    for (const z of compression.z) {
      expect(z).toBeGreaterThan(ECT_WINDOW.z0)
      expect(z).toBeLessThan(ECT_WINDOW.z1)
    }
    expect(scan.z).toEqual([BAR_AREA.z0, BAR_AREA.z1])
    expect(scan.x).toBeGreaterThan(TRAY.x1)
  })

  it('moves the carton and its cap as one body, and frames it lifted for the drop', () => {
    for (const id of CARTON_PART_IDS) expect(PACKAGING_SOLIDS.find((item) => item.id === id)?.frame).toBe(CARTON_FRAME)
    expect(PACKAGING_MARKERS[0]!.frame).toBe(CARTON_FRAME)
    expect(PACKAGING_DRAWING.sequence.stepYawDeg).toHaveLength(PACKAGING_MARKERS.length)
    const top = Math.max(...cartonCorners().map(([, y]) => y))
    expect(Math.max(...(PACKAGING_DRAWING.framingPoints ?? []).map(([, y]) => y))).toBeCloseTo(top + CARTON_DROP_HEIGHT, 3)
  })

  it('frames the tray from the floor to above its back wall, with the carton rising higher', () => {
    const { min, max } = packagingBounds()
    expect(min[0]).toBeCloseTo(TRAY.x0, 4)
    expect(min[1]).toBeCloseTo(0, 4)
    expect(max[1]).toBeGreaterThan(TRAY.backHeight)
    expect(Math.max(...cartonCorners().map(([, y]) => y))).toBeCloseTo(max[1], 2)
  })
})
