/**
 * The Seasonal & Promotional inspection model's geometry: the packed carton, the pallet it ships from, the sample
 * drawn out of it, and the tape and label that close it. Pure data, so no WebGL is needed.
 */
import { describe, expect, it } from 'vitest'

import {
  CARTON,
  GIFT,
  INSPECTION_AREAS,
  LABEL,
  PALLET,
  SAMPLE,
  SEASONAL_VIEW,
  TAPE,
  cartonPlacement,
  flapAngles,
  giftSlot,
  labelPlacement,
  samplePlacement,
  sampleSlots,
  tapeSpan,
  type Vec3,
} from '../seasonal-inspection/geometry'

const DEG = Math.PI / 180
const distance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const slots = Array.from({ length: GIFT.columns * GIFT.rows }, (_, index) => giftSlot(index))

describe('seasonal inspection geometry', () => {
  it('stands the carton square on a pallet with room around it', () => {
    expect(CARTON.width).toBeLessThan(PALLET.width)
    expect(CARTON.depth).toBeLessThan(PALLET.depth)
    expect(cartonPlacement(0)).toEqual(CARTON.packed)
    const shipped = cartonPlacement(1)
    expect(shipped[0]).toBeCloseTo(PALLET.at[0], 9)
    expect(shipped[1]).toBeCloseTo(PALLET.height, 9)
    expect(shipped[2]).toBeCloseTo(PALLET.at[2], 9)
    // It is carried across, so it clears the deck on the way.
    expect(cartonPlacement(0.5)[1]).toBeGreaterThan(PALLET.height)
    expect(CARTON.packed[0]).toBeLessThan(PALLET.at[0] - PALLET.width / 2)
  })

  it('packs the gift boxes inside the carton, clear of its walls and of each other', () => {
    expect(slots).toHaveLength(6)
    for (const slot of slots) {
      expect(Math.abs(slot[0]) + GIFT.width / 2).toBeLessThan(CARTON.width / 2 - CARTON.board)
      expect(Math.abs(slot[2]) + GIFT.depth / 2).toBeLessThan(CARTON.depth / 2 - CARTON.board)
      expect(slot[1]).toBeCloseTo(CARTON.board, 9)
    }
    for (let i = 0; i < slots.length; i += 1) {
      for (let j = i + 1; j < slots.length; j += 1) {
        const apart = Math.max(Math.abs(slots[i]![0] - slots[j]![0]) / GIFT.width, Math.abs(slots[i]![2] - slots[j]![2]) / GIFT.depth)
        expect(apart, `slots ${i} and ${j}`).toBeGreaterThanOrEqual(1)
      }
    }
    // They fit under the flaps once the carton is closed.
    expect(GIFT.height + GIFT.lid.height / 2).toBeLessThan(CARTON.height - CARTON.board)
  })

  it('draws the sample from the front row and sets it down in front of the pallet', () => {
    const orders = sampleSlots()
    expect(orders).toHaveLength(SAMPLE.count)
    for (const index of orders) expect(giftSlot(index)[2]).toBeGreaterThan(0)
    const carton = cartonPlacement(1)
    orders.forEach((index, order) => {
      expect(samplePlacement(order, 0).position).toEqual(giftSlot(index))
      const set = samplePlacement(order, 1)
      // On the ground, in a row in front, each turned a little.
      expect(set.position[1] + carton[1]).toBeCloseTo(0, 9)
      expect(set.position[2] + carton[2]).toBeCloseTo(SAMPLE.z, 9)
      expect(set.turnDeg).toBeCloseTo(SAMPLE.turnDeg, 9)
      expect(samplePlacement(order, 0.5).position[1]).toBeGreaterThan(giftSlot(index)[1])
    })
    const spread = orders.map((_, order) => samplePlacement(order, 1).position[0])
    for (let k = 1; k < spread.length; k += 1) expect(spread[k]! - spread[k - 1]!).toBeCloseTo(SAMPLE.spacing, 9)
    expect(SAMPLE.z).toBeGreaterThan(PALLET.depth / 2 + GIFT.depth / 2)
  })

  it('folds the flaps in, the pair underneath before the pair that meets over them', () => {
    const open = flapAngles(0)
    expect(open.major).toBeCloseTo(CARTON.openDeg * DEG, 9)
    expect(open.minor).toBeCloseTo(CARTON.openDeg * DEG, 9)
    const closed = flapAngles(1)
    expect(closed.major).toBeCloseTo(0, 9)
    expect(closed.minor).toBeCloseTo(0, 9)
    expect(flapAngles(0.5).minor).toBeLessThan(flapAngles(0.5).major)
    // The major flaps meet in the middle; the pair under them stops short.
    expect(2 * CARTON.major).toBeGreaterThan(CARTON.depth - 2 * CARTON.board)
    expect(2 * CARTON.minor).toBeLessThan(CARTON.width)
  })

  it('runs the tape along the seam and lands the label beside it, both on the top', () => {
    expect(tapeSpan(0)).toBe(0)
    expect(tapeSpan(1)).toBeGreaterThan(CARTON.width)
    expect(tapeSpan(0.5)).toBeCloseTo(tapeSpan(1) / 2, 9)
    const held = labelPlacement(0)
    const laid = labelPlacement(1)
    expect(held.position[1] - laid.position[1]).toBeCloseTo(LABEL.drop - 0.0006, 9)
    expect(held.tiltDeg).toBeCloseTo(LABEL.tiltDeg, 9)
    expect(laid.tiltDeg).toBeCloseTo(0, 9)
    expect(laid.position[1]).toBeGreaterThan(CARTON.height)
    // It lies on the top face, clear of the taped seam.
    expect(Math.abs(LABEL.across) + LABEL.width / 2).toBeLessThan(CARTON.width / 2)
    expect(Math.abs(LABEL.along) + LABEL.height / 2).toBeLessThan(CARTON.depth / 2)
    expect(Math.abs(LABEL.along) - LABEL.height / 2).toBeGreaterThan(TAPE.width / 2)
  })

  it('keeps the three inspection areas apart, each around its own act', () => {
    expect(INSPECTION_AREAS.map((area) => area.protocol)).toEqual([0, 1, 2])
    for (let i = 0; i < INSPECTION_AREAS.length; i += 1) {
      for (let j = i + 1; j < INSPECTION_AREAS.length; j += 1) {
        const a = INSPECTION_AREAS[i]!
        const b = INSPECTION_AREAS[j]!
        expect(distance(a.centre, b.centre), `${a.id} to ${b.id}`).toBeGreaterThan(a.radius + b.radius)
      }
    }
    expect(INSPECTION_AREAS[1]!.centre[2]).toBeCloseTo(SAMPLE.z, 9)
    expect(INSPECTION_AREAS[2]!.centre[1]).toBeGreaterThan(PALLET.height + CARTON.height)
  })

  it('looks from a three-quarter view, above the bench', () => {
    expect(SEASONAL_VIEW.azimuthDeg).toBeLessThan(0)
    expect(SEASONAL_VIEW.elevationDeg).toBeGreaterThan(10)
    expect(SEASONAL_VIEW.elevationDeg).toBeLessThan(45)
    expect(SEASONAL_VIEW.fovDeg).toBeGreaterThan(20)
    expect(SEASONAL_VIEW.fovDeg).toBeLessThan(40)
  })
})
