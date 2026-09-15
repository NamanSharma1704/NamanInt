/**
 * The Textiles & Materials inspection model's geometry: one roll, one continuous sheet, and the three inspection
 * elements attached to that sheet. Pure data, so no WebGL is needed.
 */
import { describe, expect, it } from 'vitest'

import {
  INSPECTION_AREAS,
  ROLL,
  SHEET,
  SHEET_LAND_S,
  SWATCHES,
  SWATCH_SIZE,
  TAG,
  TEAR,
  TEXTILES_VIEW,
  foldLift,
  insideTear,
  sheetCentre,
  sheetFrame,
  sheetLength,
  sheetPoint,
  sheetThickness,
  tearFibres,
  tearHalfOpening,
  tearLine,
  tearOffset,
} from '../textiles-inspection/geometry'

const half = ROLL.width / 2
const distance = (a: readonly number[], b: readonly number[]): number => Math.hypot(...a.map((value, axis) => value - b[axis]!))
const fromAxis = (z: number, y: number): number => Math.hypot(z, y - ROLL.radius)

describe('textiles inspection geometry', () => {
  it("keeps the reconstruction's tube proportions of the roll radius", () => {
    expect(ROLL.tubeOuter / ROLL.radius).toBeCloseTo(0.649, 2)
    expect(ROLL.tubeInner / ROLL.radius).toBeCloseTo(0.522, 2)
    expect(ROLL.tubeProtrude / ROLL.radius).toBeCloseTo(0.73, 2)
    expect(ROLL.tubeInner).toBeLessThan(ROLL.tubeOuter)
    expect(ROLL.layers).toBeGreaterThan(8)
  })

  it('starts the sheet on the roll as its outer wrap and peels it away tangentially, clear of the roll', () => {
    const start = sheetCentre(0)
    expect(fromAxis(start.z, start.y)).toBeCloseTo(ROLL.radius + SHEET.thickness / 2, 6)
    // At the start the sheet runs along the roll's surface: its tangent is perpendicular to the radius.
    expect(start.tz * start.z + start.ty * (start.y - ROLL.radius)).toBeCloseTo(0, 2)
    for (let s = 0; s <= SHEET_LAND_S; s += 0.005) {
      const { z, y } = sheetCentre(s)
      expect(fromAxis(z, y), `clear of the roll at s ${s.toFixed(3)}`).toBeGreaterThanOrEqual(ROLL.radius + SHEET.thickness / 2 - 2e-3)
    }
    // It thins toward its first edge on the roll, so the wrap starts without a step.
    expect(sheetThickness(0)).toBeLessThan(SHEET.thickness / 2)
    expect(sheetThickness(0.2)).toBeCloseTo(SHEET.thickness, 6)
  })

  it('drapes the sheet forward and down onto the ground, where it lies as one continuous piece', () => {
    let previous = sheetCentre(0)
    for (let s = 0.01; s <= sheetLength(0); s += 0.01) {
      const point = sheetCentre(s)
      // Continuous: no jumps between neighbouring samples.
      expect(Math.hypot(point.z - previous.z, point.y - previous.y)).toBeLessThan(0.011)
      expect(point.y).toBeGreaterThanOrEqual(SHEET.thickness / 2 - 1e-9)
      previous = point
    }
    const land = sheetCentre(SHEET_LAND_S)
    expect(land.z).toBeCloseTo(SHEET.landZ, 3)
    expect(land.y).toBeCloseTo(SHEET.thickness / 2, 6)
    for (const x of [-half, 0, half]) {
      const end = sheetCentre(sheetLength(x))
      expect(Math.abs(end.z - SHEET.endZ)).toBeLessThanOrEqual(SHEET.endWave + 1e-6)
      // The underside never goes through the ground, folds and curl included.
      for (let s = SHEET_LAND_S; s <= sheetLength(x); s += 0.02) expect(sheetPoint(x, s, -1)[1]).toBeGreaterThanOrEqual(-1e-6)
    }
  })

  it('ties the certification tag through the sheet edge near the roll', () => {
    expect(TAG.x - TAG.length / 2).toBeGreaterThan(-half)
    expect(TAG.cordAnchor.x).toBeGreaterThan(-half)
    expect(TAG.cordAnchor.x).toBeLessThan(-half + 0.05)
    // Near the roll: just past where the sheet settles, ahead of the swatches and the tear.
    expect(TAG.s).toBeGreaterThan(SHEET_LAND_S)
    expect(TAG.s).toBeLessThan(Math.min(...SWATCHES.map((swatch) => swatch.s)))
    // The cord is short: from the anchor to the eyelet end of the tag.
    const turn = (TAG.turnDeg * Math.PI) / 180
    const eyeletX = TAG.x - (TAG.length / 2 - TAG.hole.inset) * Math.cos(turn)
    expect(Math.hypot(eyeletX - TAG.cordAnchor.x, TAG.s - TAG.cordAnchor.s)).toBeLessThan(0.15)
  })

  it('lays five swatches side by side on the sheet, in spectrum order, clear of each other and of the sheet edges', () => {
    expect(SWATCHES).toHaveLength(5)
    expect(SWATCHES.map((swatch) => swatch.name)).toEqual(['crimson', 'amber', 'green', 'blue', 'violet'])
    for (const [index, swatch] of SWATCHES.entries()) {
      expect(swatch.x - SWATCH_SIZE.width / 2).toBeGreaterThan(-half)
      expect(swatch.x + SWATCH_SIZE.width / 2).toBeLessThan(half)
      expect(swatch.s + SWATCH_SIZE.length / 2).toBeLessThan(sheetLength(swatch.x) - SHEET.curl.length)
      expect(swatch.colour).toMatch(/^#[0-9A-F]{6}$/)
      const next = SWATCHES[index + 1]
      if (next) {
        // The gap between neighbours outlasts the few millimetres a small turn moves a corner.
        const reach = (SWATCH_SIZE.length / 2) * Math.sin((4 * Math.PI) / 180)
        expect(next.x - swatch.x - SWATCH_SIZE.width).toBeGreaterThan(2 * reach)
      }
    }
  })

  it('keeps the sheet calm under the tag and the swatches, so they lie on it cleanly', () => {
    for (let dx = -TAG.length / 2; dx <= TAG.length / 2; dx += 0.01) {
      for (let ds = -TAG.breadth / 2; ds <= TAG.breadth / 2; ds += 0.01) expect(foldLift(TAG.x + dx, TAG.s + ds)).toBeLessThan(0.0005)
    }
    for (const swatch of SWATCHES) {
      for (let dx = -SWATCH_SIZE.width / 2; dx <= SWATCH_SIZE.width / 2; dx += 0.01) {
        for (let ds = -SWATCH_SIZE.length / 2; ds <= SWATCH_SIZE.length / 2; ds += 0.01) expect(foldLift(swatch.x + dx, swatch.s + ds)).toBeLessThan(0.0005)
      }
    }
    // Elsewhere the sheet does fold.
    expect(Math.max(...Array.from({ length: 60 }, (_, k) => foldLift(half - 0.05, SHEET_LAND_S + 0.3 + k * 0.01)))).toBeGreaterThan(0.01)
  })

  it('cuts the tear into the sheet edge and pulls its sides apart', () => {
    const line = tearLine(-half)
    expect(insideTear(-half + 0.002, line)).toBe(true)
    expect(insideTear(-half + TEAR.depth + 0.01, tearLine(-half + TEAR.depth))).toBe(false)
    expect(insideTear(0, line)).toBe(false)
    expect(insideTear(-half + 0.002, line + TEAR.opening)).toBe(false)
    expect(tearHalfOpening(-half + TEAR.depth * 0.999)).toBeLessThan(0.001)
    const near = tearOffset(-half, line - 0.01)
    const far = tearOffset(-half, line + 0.01)
    expect(near.ds).toBeLessThan(0)
    expect(far.ds).toBeGreaterThan(0)
    expect(far.dy).toBeGreaterThan(0)
    expect(tearOffset(0, line)).toEqual({ ds: 0, dy: 0 })
    // It sits on the flat sheet, clear of the curl and of the swatches.
    expect(TEAR.s).toBeGreaterThan(Math.max(...SWATCHES.map((swatch) => swatch.s)) + SWATCH_SIZE.length / 2)
    expect(TEAR.s + 0.1).toBeLessThan(sheetLength(-half) - SHEET.curl.length)
  })

  it('grows loose fibres out of the torn sides, the same every time', () => {
    const fibres = tearFibres(1)
    expect(fibres.length).toBeGreaterThan(30)
    expect(tearFibres(1)).toEqual(fibres)
    for (const fibre of fibres) {
      expect(fibre.points.length).toBeGreaterThanOrEqual(3)
      expect(fibre.radius).toBeGreaterThan(0)
      expect(fibre.radius).toBeLessThan(0.002)
      const [x, , z] = fibre.points[0]!
      // Every fibre starts at the tear: within its depth of the edge and a few centimetres of its line, sides pulled apart.
      expect(x).toBeGreaterThanOrEqual(-half - 1e-6)
      expect(x).toBeLessThanOrEqual(-half + TEAR.depth)
      expect(Math.abs(z - sheetPoint(x, tearLine(x), 0)[2])).toBeLessThan(0.08)
      for (const point of fibre.points) for (const value of point) expect(Number.isFinite(value)).toBe(true)
    }
  })

  it('gives the sheet a proper frame to place things on', () => {
    const { across, along, normal } = sheetFrame(TAG.x, TAG.s)
    const dot = (a: readonly number[], b: readonly number[]): number => a.reduce((sum, value, axis) => sum + value * b[axis]!, 0)
    expect(dot(across, along)).toBeCloseTo(0, 6)
    expect(dot(across, normal)).toBeCloseTo(0, 6)
    expect(normal[1]).toBeGreaterThan(0.95)
  })

  it('keeps the three inspection areas apart, each around its own element', () => {
    for (let i = 0; i < INSPECTION_AREAS.length; i += 1) {
      for (let j = i + 1; j < INSPECTION_AREAS.length; j += 1) {
        const a = INSPECTION_AREAS[i]!
        const b = INSPECTION_AREAS[j]!
        expect(distance(a.centre, b.centre)).toBeGreaterThan(a.radius + b.radius)
      }
    }
    expect(INSPECTION_AREAS.map((area) => area.protocol)).toEqual([0, 1, 2])
    expect(distance(INSPECTION_AREAS[0].centre, sheetPoint(TAG.x, TAG.s, 1))).toBeLessThan(INSPECTION_AREAS[0].radius)
    for (const swatch of SWATCHES) expect(distance(INSPECTION_AREAS[1].centre, sheetPoint(swatch.x, swatch.s, 1))).toBeLessThan(INSPECTION_AREAS[1].radius)
    expect(distance(INSPECTION_AREAS[2].centre, sheetPoint(-half, tearLine(-half), 1))).toBeLessThan(INSPECTION_AREAS[2].radius)
  })

  it('views the model in three-quarter perspective from above', () => {
    expect(Math.abs(TEXTILES_VIEW.azimuthDeg)).toBeGreaterThan(20)
    expect(Math.abs(TEXTILES_VIEW.azimuthDeg)).toBeLessThan(60)
    expect(TEXTILES_VIEW.elevationDeg).toBeGreaterThan(10)
    expect(TEXTILES_VIEW.fovDeg).toBeGreaterThan(15)
  })
})
