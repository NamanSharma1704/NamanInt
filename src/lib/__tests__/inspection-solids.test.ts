/**
 * The shared inspection-drawing geometry: frames, bounds and the scroll-sequence arithmetic, which every
 * drawing, its scene and the page rely on.
 */
import { describe, expect, it } from 'vitest'

import {
  applyFrame,
  eulerMatrix,
  sequenceYaw,
  settledProgress,
  solidBounds,
  stepForProgress,
  stepProgress,
  type Frame,
  type Solid,
  type Vec3,
} from '../inspection-drawing/solids'

function expectClose(actual: Vec3, expected: Vec3, digits = 6): void {
  actual.forEach((value, axis) => expect(value).toBeCloseTo(expected[axis]!, digits))
}

const still: Vec3 = [0, 0, 0]

describe('inspection drawing solids', () => {
  it('rotates the way Three.js Euler XYZ rotations do', () => {
    // A quarter turn about Y takes +X to -Z, as Object3D.rotation.y does.
    expectClose(applyFrame([1, 0, 0], { position: still, rotation: [0, Math.PI / 2, 0] }), [0, 0, -1])
    // A quarter turn about X takes +Y to +Z.
    expectClose(applyFrame([0, 1, 0], { position: still, rotation: [Math.PI / 2, 0, 0] }), [0, 0, 1])
    const m = eulerMatrix([0.73, -0.19, -0.48])
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        const columnDot = m[0][i] * m[0][j] + m[1][i] * m[1][j] + m[2][i] * m[2][j]
        expect(columnDot).toBeCloseTo(i === j ? 1 : 0, 9)
      }
    }
  })

  it('translates after rotating', () => {
    expectClose(applyFrame([1, 0, 0], { position: [2, 3, 4], rotation: [0, 0, Math.PI / 2] }), [2, 4, 4])
  })

  it('bounds side prisms along +X, framed solids in model space, and extra framing points', () => {
    const wall: Solid = { kind: 'side-prism', id: 'wall', outline: [[-0.2, 0], [0.3, 0], [0.3, 0.5], [-0.2, 0.5]], holes: [], x: 0.4, width: 0.1 }
    expect(solidBounds([wall])).toEqual({ min: [0.4, 0, -0.2], max: [0.5, 0.5, 0.3] })
    expect(solidBounds([wall], [[0, 2, 0]]).max[1]).toBe(2)

    const frame: Frame = { position: [1, 0, 0], rotation: [0, Math.PI / 2, 0] }
    const slab: Solid = { kind: 'front-prism', id: 'slab', outline: [[0, 0], [0.5, 0], [0.5, 0.2], [0, 0.2]], z: 0, depth: 0.1, frame }
    const { min, max } = solidBounds([slab])
    // x in [0, 0.5] turns to z in [-0.5, 0]; z in [0, 0.1] turns to x in [0, 0.1], then moves 1 along X.
    expectClose(min, [1, 0, -0.5], 4)
    expectClose(max, [1.1, 0.2, 0], 4)
  })

  it('divides scroll progress into steps, progress within a step and settled middle frames', () => {
    expect(stepForProgress(0, 3)).toBe(0)
    expect(stepForProgress(0.34, 3)).toBe(1)
    expect(stepForProgress(1, 3)).toBe(2)
    expect(stepForProgress(-0.5, 3)).toBe(0)
    expect(stepProgress(0.5, 3)).toBeCloseTo(0.5, 9)
    expect(stepProgress(1, 3)).toBe(1)
    expect(stepProgress(0, 3)).toBe(0)
    expect(settledProgress(0.1, 3)).toBeCloseTo(1 / 6, 9)
    expect(settledProgress(0.99, 3)).toBeCloseTo(5 / 6, 9)
  })

  it('holds the turn at the first and last step middles and eases between step middles', () => {
    const yaw = [0, 10, -20]
    expect(sequenceYaw(yaw, 0)).toBe(0)
    expect(sequenceYaw(yaw, 1 / 6)).toBe(0)
    expect(sequenceYaw(yaw, 0.5)).toBeCloseTo(10, 9)
    // Halfway between the first two step middles.
    expect(sequenceYaw(yaw, 1 / 3)).toBeCloseTo(5, 9)
    expect(sequenceYaw(yaw, 1)).toBe(-20)
    expect(sequenceYaw([], 0.4)).toBe(0)
  })
})
