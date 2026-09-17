/**
 * The trade-network scene model: geometry, projection, motion and the SVG
 * fallback. Pure functions, so no WebGL is involved.
 */
import { describe, expect, it } from 'vitest'

import {
  STATIC_TIME,
  UNIT_SYSTEMS,
  buildModel,
  cameraBasis,
  envelope,
  hslToRgb,
  parseHslTriplet,
  pointOnLane,
  project,
  stationAnchors,
  svgDrawing,
  unitStates,
  type Lane,
  type Layout,
  type Vec3,
} from '../trade-network/model'

const LAYOUTS: readonly Layout[] = ['wide', 'compact']

function close(a: number, b: number, epsilon: number = 1e-6): boolean {
  return Math.abs(a - b) < epsilon
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function lastPoint(lane: Lane): Vec3 {
  return lane.points[lane.points.length - 1]!
}

describe('trade network model', () => {
  describe('design-token colours', () => {
    it('parses the space-separated HSL triplets globals.css stores', () => {
      expect(parseHslTriplet('179 80% 27%')).toEqual({ h: 179, s: 0.8, l: 0.27 })
      expect(parseHslTriplet(' 210 20% 97% ')).toEqual({ h: 210, s: 0.2, l: 0.97 })
    })

    it('returns null for values it cannot read, so callers fall back', () => {
      expect(parseHslTriplet('')).toBeNull()
      expect(parseHslTriplet('#0E7B7A')).toBeNull()
      expect(parseHslTriplet('hsl(179, 80%, 27%)')).toBeNull()
    })

    it('converts the accent token to the teal the site renders', () => {
      const [r, g, b] = hslToRgb({ h: 179, s: 0.8, l: 0.27 }).map((v) => Math.round(v * 255))
      expect(Math.abs(r! - 14)).toBeLessThanOrEqual(1)
      expect(Math.abs(g! - 123)).toBeLessThanOrEqual(1)
      expect(Math.abs(b! - 122)).toBeLessThanOrEqual(1)
    })
  })

  describe('projection', () => {
    it('builds an orthonormal camera basis with no roll', () => {
      const { x, y, z } = cameraBasis()
      for (const axis of [x, y, z]) expect(close(dot(axis, axis), 1)).toBe(true)
      expect(close(dot(x, y), 0)).toBe(true)
      expect(close(dot(y, z), 0)).toBe(true)
      expect(close(dot(x, z), 0)).toBe(true)
      expect(x[1]).toBe(0)
    })

    it('maps the camera axes onto the screen axes', () => {
      const { x, y } = cameraBasis()
      const c: Vec3 = [1, 2, 3]
      const [px, py] = project([c[0] + x[0], c[1] + x[1], c[2] + x[2]], c)
      expect(close(px, 1)).toBe(true)
      expect(close(py, 0)).toBe(true)
      const [qx, qy] = project([c[0] + y[0], c[1] + y[1], c[2] + y[2]], c)
      expect(close(qx, 0)).toBe(true)
      expect(close(qy, 1)).toBe(true)
    })
  })

  describe('composition', () => {
    it('orders the stations to match the three route steps', () => {
      for (const layout of LAYOUTS) {
        const model = buildModel(layout)
        expect(model.stations.map((s) => s.id)).toEqual(['origin', 'consolidation', 'destination'])
        expect(model.stations.map((s) => s.step)).toEqual([0, 1, 2])
      }
    })

    it('keeps the wide drawing wider than the compact one, and neither extreme', () => {
      const aspect = (layout: Layout): number => {
        const { width, height } = buildModel(layout).view
        return width / height
      }
      expect(aspect('wide')).toBeGreaterThan(aspect('compact'))
      expect(aspect('wide')).toBeLessThan(3.2)
      expect(aspect('compact')).toBeGreaterThan(1.1)
    })

    it('produces only finite geometry', () => {
      for (const layout of LAYOUTS) {
        const model = buildModel(layout)
        const segments = [...model.stations.flatMap((s) => s.segments), ...model.floorGuides, ...model.infoGuides]
        expect(segments.length).toBeGreaterThan(0)
        for (const segment of segments) {
          for (const point of segment) for (const v of point) expect(Number.isFinite(v)).toBe(true)
        }
      }
    })

    it('feeds three supplier lanes through the gate into one freight lane', () => {
      const { feeder, freight } = buildModel('wide').lanes
      expect(feeder).toHaveLength(3)
      for (const lane of feeder) expect(lastPoint(lane)[0]).toBeGreaterThan(lane.points[0]![0])
      expect(lastPoint(freight)[0]).toBeGreaterThan(freight.points[0]![0])
      for (const lane of feeder) expect(freight.points[0]![0]).toBeGreaterThan(lastPoint(lane)[0])
    })

    it('runs information back toward origin, above the floor', () => {
      const { orders, signoff } = buildModel('wide').lanes
      expect(lastPoint(orders)[0]).toBeLessThan(orders.points[0]![0])
      expect(orders.points[0]![1]).toBeGreaterThan(0)
      expect(lastPoint(signoff)[1]).toBeGreaterThan(signoff.points[0]![1])
    })

    it('routes every lane with right-angle turns only', () => {
      for (const layout of LAYOUTS) {
        const { feeder, freight, orders, signoff } = buildModel(layout).lanes
        for (const lane of [...feeder, freight, orders, signoff]) {
          for (let i = 1; i < lane.points.length; i++) {
            const a = lane.points[i - 1]!
            const b = lane.points[i]!
            const axesChanged = [0, 1, 2].filter((k) => Math.abs(a[k]! - b[k]!) > 1e-9).length
            expect(axesChanged).toBe(1)
          }
        }
      }
    })
  })

  describe('lanes', () => {
    it('walks a lane by arc length from its first point to its last', () => {
      const lane = buildModel('wide').lanes.freight
      expect(pointOnLane(lane, 0)).toEqual(lane.points[0])
      expect(pointOnLane(lane, 1)).toEqual(lastPoint(lane))

      let measured = 0
      for (let i = 1; i < lane.points.length; i++) {
        const a = lane.points[i - 1]!
        const b = lane.points[i]!
        measured += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
      }
      expect(close(measured, lane.length)).toBe(true)
    })
  })

  describe('motion', () => {
    it('is deterministic for a given time', () => {
      const model = buildModel('wide')
      expect(unitStates(model, 7.3)).toEqual(unitStates(model, 7.3))
    })

    it('repeats after one lane length divided by speed', () => {
      const model = buildModel('wide')
      const system = UNIT_SYSTEMS.find((s) => s.id === 'freight')!
      const period = model.lanes.freight.length / system.speed
      const at = (t: number) => unitStates(model, t).find((g) => g.system.id === 'freight')!.instances
      const a = at(2)
      const b = at(2 + period)
      a.forEach((unit, i) => {
        unit.position.forEach((v, k) => expect(close(v, b[i]!.position[k]!, 1e-6)).toBe(true))
      })
    })

    it('grows units in and out at lane ends instead of popping', () => {
      expect(envelope(0)).toBe(0)
      expect(envelope(1)).toBe(0)
      expect(envelope(0.5)).toBe(1)
      expect(envelope(0.02)).toBeGreaterThan(0)
      expect(envelope(0.02)).toBeLessThan(1)
    })

    it('creates the expected number of units per system', () => {
      const groups = unitStates(buildModel('compact'), 0)
      const count = (id: string) => groups.find((g) => g.system.id === id)!.instances.length
      expect(count('feeder')).toBe(9)
      expect(count('freight')).toBe(3)
      expect(count('orders')).toBe(4)
      expect(count('signoff')).toBe(2)
    })

    it('keeps every unit inside the drawing bounds', () => {
      for (const layout of LAYOUTS) {
        const model = buildModel(layout)
        for (const t of [0, STATIC_TIME, 13.7, 60]) {
          for (const group of unitStates(model, t)) {
            for (const unit of group.instances) {
              const [x, y] = project(unit.position, model.center)
              expect(x).toBeGreaterThanOrEqual(model.view.minX)
              expect(x).toBeLessThanOrEqual(model.view.maxX)
              expect(y).toBeGreaterThanOrEqual(model.view.minY)
              expect(y).toBeLessThanOrEqual(model.view.maxY)
            }
          }
        }
      }
    })
  })

  describe('static fallback drawing', () => {
    it('emits clean path data and a four-number viewBox', () => {
      for (const layout of LAYOUTS) {
        const drawing = svgDrawing(buildModel(layout))
        expect(drawing.viewBox.split(' ')).toHaveLength(4)
        expect(drawing.stations).toHaveLength(3)
        for (const d of [...drawing.stations, drawing.floorGuides, drawing.infoGuides, drawing.structureUnits, drawing.accentUnits]) {
          expect(d.startsWith('M')).toBe(true)
          expect(d).not.toMatch(/NaN|Infinity/)
        }
      }
    })

    it('draws moving units as closed silhouettes of four to six corners', () => {
      for (const layout of LAYOUTS) {
        const drawing = svgDrawing(buildModel(layout))
        for (const path of [drawing.structureUnits, drawing.accentUnits]) {
          const shapes = path.split('M').filter(Boolean)
          expect(shapes.length).toBeGreaterThan(0)
          for (const shape of shapes) {
            expect(shape.endsWith('Z')).toBe(true)
            const corners = shape.slice(0, -1).split('L').length
            expect(corners).toBeGreaterThanOrEqual(4)
            expect(corners).toBeLessThanOrEqual(6)
          }
        }
      }
    })

    it('draws the reduced-motion frame by default', () => {
      const model = buildModel('wide')
      expect(svgDrawing(model)).toEqual(svgDrawing(model, STATIC_TIME))
    })
  })

  describe('station anchors', () => {
    it('places each station across the drawing in route order, inside the view', () => {
      for (const layout of LAYOUTS) {
        const anchors = stationAnchors(buildModel(layout))
        expect(anchors).toHaveLength(3)
        for (const anchor of anchors) {
          expect(anchor).toBeGreaterThan(0)
          expect(anchor).toBeLessThan(1)
        }
        expect(anchors[0]!).toBeLessThan(anchors[1]!)
        expect(anchors[1]!).toBeLessThan(anchors[2]!)
      }
    })
  })
})
