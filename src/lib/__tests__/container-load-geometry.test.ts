/**
 * The Trade Services container load sequence: geometry, load plan, timeline and camera. Pure data, so no WebGL.
 */
import { describe, expect, it } from 'vitest'

import {
  APEX_Y,
  BODY_SOLIDS,
  CARTON,
  CARTON_COUNT,
  CONTAINER,
  DOOR_LEAVES,
  DOOR_OPEN_DEG,
  DROP_HEIGHT,
  ENTRY_X,
  ENTRY_Y,
  FRAME_BOX,
  HEADER_BOTTOM,
  INNER_FRONT_X,
  INNER_WALL_Z,
  LOAD_SUMMARY,
  LOCKING_BAR_Z,
  POCKET_CENTRES,
  REDUCED_MOTION_PROGRESS,
  RIG_LINES,
  RIG_SOLIDS,
  SILL_TOP,
  STEP_RANGES,
  cameraBasis,
  cartonPose,
  cartonSlot,
  fallbackDrawing,
  leafPointToWorld,
  reducedMotionProgress,
  sequenceState,
  stepForProgress,
  type BoxSolid,
  type Solid,
  type Vec3,
} from '../container-load/geometry'

const HL = CONTAINER.length / 2
const HW = CONTAINER.width / 2

function boxCorners({ centre, size }: BoxSolid): Vec3[] {
  const corners: Vec3[] = []
  for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) {
    corners.push([centre[0] + sx * size[0], centre[1] + sy * size[1], centre[2] + sz * size[2]])
  }
  return corners
}

function numbersOf(solid: Solid): number[] {
  switch (solid.kind) {
    case 'box': return [...solid.centre, ...solid.size]
    case 'plan-prism': return [solid.y, solid.height, ...solid.outline.flat()]
    case 'side-prism': return [solid.z, solid.depth, ...solid.outline.flat(), ...solid.holes.flat(2)]
    case 'ring': return [...solid.centre, solid.radius, solid.tube]
  }
}

const inside = (value: number, min: number, max: number) => value >= min - 1e-6 && value <= max + 1e-6

describe('container body', () => {
  it('builds the frame, walls and hardware once each, with finite coordinates', () => {
    const ids = BODY_SOLIDS.map((solid) => solid.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.filter((id) => id.startsWith('corner-casting-'))).toHaveLength(8)
    expect(ids.filter((id) => id.startsWith('corner-post-'))).toHaveLength(4)
    expect(ids.filter((id) => id.startsWith('cam-keeper-'))).toHaveLength(8)
    for (const id of ['side-wall-near', 'side-wall-far', 'front-end-wall', 'roof-panel', 'floor-deck', 'door-header', 'door-sill']) {
      expect(ids).toContain(id)
    }
    for (const solid of BODY_SOLIDS) for (const value of numbersOf(solid)) expect(Number.isFinite(value)).toBe(true)
  })

  it('corrugates the side walls with 21 bays and the front end with 7', () => {
    const wall = BODY_SOLIDS.find((solid) => solid.id === 'side-wall-near')
    const end = BODY_SOLIDS.find((solid) => solid.id === 'front-end-wall')
    if (wall?.kind !== 'plan-prism' || end?.kind !== 'plan-prism') throw new Error('walls must be plan prisms')
    expect(wall.outline).toHaveLength((21 * 4 + 1) * 2)
    expect(end.outline).toHaveLength((7 * 4 + 1) * 2)
    const zs = wall.outline.map(([, z]) => z)
    expect(Math.min(...zs)).toBeCloseTo(INNER_WALL_Z, 3)
    expect(Math.max(...zs)).toBeLessThan(HW)
  })

  it('cuts both forklift pockets through each bottom rail at the photographed positions', () => {
    for (const id of ['bottom-side-rail-near', 'bottom-side-rail-far']) {
      const rail = BODY_SOLIDS.find((solid) => solid.id === id)
      if (rail?.kind !== 'side-prism') throw new Error('rails must be side prisms')
      expect(rail.holes).toHaveLength(2)
      const railXs = rail.outline.map(([x]) => x)
      rail.holes.forEach((hole, index) => {
        const xs = hole.map(([x]) => x)
        expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(POCKET_CENTRES[index]!, 3)
        expect(Math.min(...xs)).toBeGreaterThan(Math.min(...railXs))
        expect(Math.max(...xs)).toBeLessThan(Math.max(...railXs))
      })
    }
  })
})

describe('doors', () => {
  it('hangs two mirrored leaves that close the door opening from the seam to the posts', () => {
    expect(DOOR_LEAVES.map((leaf) => leaf.side).sort()).toEqual([-1, 1])
    for (const leaf of DOOR_LEAVES) {
      const panel = leaf.solids.find((solid) => solid.id === 'leaf') as BoxSolid
      const zs = boxCorners(panel).map((corner) => leafPointToWorld(leaf, corner, 0)[2] * leaf.side)
      expect(Math.min(...zs)).toBeGreaterThanOrEqual(0)
      expect(Math.max(...zs)).toBeLessThanOrEqual(1.18)
      const ys = boxCorners(panel).map((corner) => corner[1])
      expect(Math.min(...ys)).toBeCloseTo(SILL_TOP, 4)
      expect(Math.max(...ys)).toBeCloseTo(HEADER_BOTTOM, 4)
    }
  })

  it('places the locking bars at the measured distances from the seam, with handles clear of it', () => {
    for (const leaf of DOOR_LEAVES) {
      const bars = leaf.solids.filter((solid) => solid.id.startsWith('locking-bar-')) as BoxSolid[]
      expect(bars.map((bar) => Math.abs(leafPointToWorld(leaf, bar.centre, 0)[2]))).toEqual(LOCKING_BAR_Z.map((z) => expect.closeTo(z, 4)))
      for (const handle of leaf.solids.filter((solid) => solid.id.startsWith('lock-handle-')) as BoxSolid[]) {
        for (const corner of boxCorners(handle)) expect(leafPointToWorld(leaf, corner, 0)[2] * leaf.side).toBeGreaterThan(0)
      }
    }
  })

  it('swings each leaf outward, never through the container, all the way to the open angle', () => {
    for (const leaf of DOOR_LEAVES) {
      for (let angle = 15; angle <= DOOR_OPEN_DEG; angle += 15) {
        // The hinge axis turns in place on the corner post. Near the hinge the leaf passes through the door frame's
        // own 0.1 m depth, which is where a recessed door sits. Nothing may reach the interior or the side walls.
        for (const solid of (leaf.solids as BoxSolid[]).filter((s) => s.id !== 'hinge-axis')) {
          for (const corner of boxCorners(solid)) {
            const [x, , z] = leafPointToWorld(leaf, corner, angle)
            const insideBody = x > -HL + 0.1 && Math.abs(z) < HW - 0.001
            expect(insideBody, `${leaf.id} ${solid.id} at ${angle} degrees`).toBe(false)
          }
        }
      }
    }
  })
})

describe('lifting rig', () => {
  it('runs four sling legs from the apex to the top corner castings, and two falls up out of frame', () => {
    const slings = RIG_LINES.filter((line) => line.start[1] === APEX_Y)
    expect(slings).toHaveLength(4)
    for (const sling of slings) {
      expect(Math.abs(sling.end[0])).toBeCloseTo(HL - 0.089, 3)
      expect(Math.abs(sling.end[2])).toBeCloseTo(HW - 0.081, 3)
      expect(sling.end[1]).toBeGreaterThan(CONTAINER.height)
    }
    const falls = RIG_LINES.filter((line) => line.start[1] !== APEX_Y)
    expect(falls).toHaveLength(2)
    for (const fall of falls) expect(fall.end[1]).toBeGreaterThan(FRAME_BOX.max[1])
    expect(RIG_SOLIDS.map((solid) => solid.id)).toContain('crane-hook')
  })
})

describe('load plan', () => {
  it('stows 225 cartons inside the walls, below the roof and clear of each other', () => {
    expect(CARTON_COUNT).toBe(225)
    const slots = Array.from({ length: CARTON_COUNT }, (_, index) => cartonSlot(index))
    expect(new Set(slots.map((slot) => slot.join(','))).size).toBe(CARTON_COUNT)
    for (const [x, y, z] of slots) {
      expect(x + CARTON.length / 2).toBeLessThanOrEqual(INNER_FRONT_X)
      expect(x - CARTON.length / 2).toBeGreaterThan(-HL + 0.1)
      expect(y - CARTON.height / 2).toBeGreaterThanOrEqual(SILL_TOP - 1e-6)
      expect(Math.abs(z) + CARTON.width / 2).toBeLessThanOrEqual(INNER_WALL_Z)
    }
  })

  it('keeps every carton small enough to pass through the door opening', () => {
    for (let index = 0; index < CARTON_COUNT; index += 1) {
      const [, y, z] = cartonSlot(index)
      expect(y + CARTON.height / 2).toBeLessThanOrEqual(HEADER_BOTTOM)
      expect(Math.abs(z) + CARTON.width / 2).toBeLessThanOrEqual(1.17)
    }
  })

  it('stuffs from the front wall toward the doors, floor first', () => {
    expect(cartonSlot(0)[0]).toBeGreaterThan(cartonSlot(CARTON_COUNT - 1)[0])
    expect(cartonSlot(0)[1]).toBeLessThan(cartonSlot(24)[1])
  })

  it('reports the load as the section states it', () => {
    expect(LOAD_SUMMARY).toEqual({ cartons: 225, cubicMetres: 27.6, cubeUsedPercent: 83 })
  })
})

describe('scroll timeline', () => {
  it('starts with the container high above its marks, closed and empty', () => {
    expect(sequenceState(0)).toMatchObject({ containerY: DROP_HEIGHT, doorOpenDeg: 0, cartonsPlaced: 0, step: 0 })
  })

  it('lands square, releases the rig, opens the doors, then fills the container', () => {
    const landed = sequenceState(0.18)
    expect(landed.containerY).toBe(0)
    expect(landed.yawDeg).toBe(0)
    expect(landed.rigY).toBe(0)
    expect(sequenceState(0.25).rigY).toBeGreaterThan(4)
    expect(sequenceState(0.26).doorOpenDeg).toBe(0)
    expect(sequenceState(0.41).doorOpenDeg).toBe(DOOR_OPEN_DEG)
    expect(sequenceState(0.43).cartonsPlaced).toBe(0)
    expect(sequenceState(0.9).cartonsPlaced).toBe(CARTON_COUNT)
  })

  it('closes the doors on the full load in the last step', () => {
    expect(sequenceState(0.9)).toMatchObject({ doorOpenDeg: DOOR_OPEN_DEG, cartonsPlaced: CARTON_COUNT })
    const closing = sequenceState(0.935).doorOpenDeg
    expect(closing).toBeGreaterThan(0)
    expect(closing).toBeLessThan(DOOR_OPEN_DEG)
    expect(sequenceState(0.98)).toMatchObject({ doorOpenDeg: 0, cartonsPlaced: CARTON_COUNT, step: 3 })
    expect(sequenceState(REDUCED_MOTION_PROGRESS[3]!).doorOpenDeg).toBe(0)
    // Closed leaves stand in the door frame, clear of the last slice of cartons.
    const lastSliceRear = Math.min(...Array.from({ length: CARTON_COUNT }, (_, index) => cartonSlot(index)[0])) - CARTON.length / 2
    for (const leaf of DOOR_LEAVES) {
      for (const solid of leaf.solids as BoxSolid[]) {
        for (const corner of boxCorners(solid)) expect(leafPointToWorld(leaf, corner, 0)[0]).toBeLessThan(lastSliceRear)
      }
    }
  })

  it('never unloads while scrolling forward', () => {
    let previous = 0
    for (let p = 0; p <= 1.0001; p += 0.005) {
      const { cartonsPlaced } = sequenceState(p)
      expect(cartonsPlaced).toBeGreaterThanOrEqual(previous)
      previous = cartonsPlaced
    }
  })

  it('slides each carton in from the door mouth to its slot', () => {
    const index = 100
    expect(cartonPose(index, 0.3)).toBeNull()
    const slot = cartonSlot(index)
    let entered = 0
    for (let p = 0.44; p <= 0.9; p += 0.0005) {
      const pose = cartonPose(index, p)
      if (!pose) continue
      if (!entered) {
        entered = p
        expect(pose.position[0]).toBeLessThan(-HL)
        // Enters at sill height and lifts into its layer on the way in, rather than floating at slot height.
        expect(pose.position[1]).toBeCloseTo(ENTRY_Y, 1)
        expect(pose.scale).toBeLessThan(0.5)
      }
    }
    expect(entered).toBeGreaterThan(0)
    expect(cartonPose(index, 1)).toEqual({ position: slot, scale: 1 })
    expect(ENTRY_X - CARTON.length / 2).toBeGreaterThanOrEqual(FRAME_BOX.min[0])
  })

  it('maps progress onto four steps that tile the track', () => {
    expect(STEP_RANGES[0]![0]).toBe(0)
    expect(STEP_RANGES.at(-1)![1]).toBe(1)
    STEP_RANGES.slice(1).forEach(([from], index) => expect(from).toBe(STEP_RANGES[index]![1]))
    expect([0, 0.24, 0.25, 0.5, 0.95, 1, 1.4].map(stepForProgress)).toEqual([0, 0, 1, 2, 3, 3, 3])
  })

  it('settles each step on one frame under reduced motion', () => {
    expect([0.1, 0.3, 0.6, 0.95].map(reducedMotionProgress)).toEqual(REDUCED_MOTION_PROGRESS)
    expect(sequenceState(REDUCED_MOTION_PROGRESS[2]!).cartonsPlaced).toBeGreaterThan(0)
    expect(sequenceState(REDUCED_MOTION_PROGRESS[2]!).cartonsPlaced).toBeLessThan(CARTON_COUNT)
  })
})

describe('camera and server drawing', () => {
  it('builds an orthonormal right-handed basis looking at the door end, the near side and the roof', () => {
    const { direction, right, up } = cameraBasis()
    const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    expect(dot(direction, right)).toBeCloseTo(0, 6)
    expect(dot(direction, up)).toBeCloseTo(0, 6)
    expect(dot(right, up)).toBeCloseTo(0, 6)
    expect(up[1]).toBeGreaterThan(0)
    expect(direction[0]).toBeLessThan(0)
    expect(direction[1]).toBeGreaterThan(0)
    expect(direction[2]).toBeGreaterThan(0)
  })

  it('keeps the landed container, the landed rig and the swinging doors inside the frame box', () => {
    const within = ([x, y, z]: Vec3) =>
      inside(x, FRAME_BOX.min[0], FRAME_BOX.max[0]) && inside(y, FRAME_BOX.min[1], FRAME_BOX.max[1]) && inside(z, FRAME_BOX.min[2], FRAME_BOX.max[2])
    for (const solid of [...BODY_SOLIDS, ...RIG_SOLIDS]) {
      if (solid.kind === 'box') for (const corner of boxCorners(solid)) expect(within(corner), solid.id).toBe(true)
    }
    for (const leaf of DOOR_LEAVES) {
      for (let angle = 0; angle <= DOOR_OPEN_DEG; angle += 10) {
        for (const solid of leaf.solids as BoxSolid[]) {
          for (const corner of boxCorners(solid)) expect(within(leafPointToWorld(leaf, corner, angle)), `${leaf.id} at ${angle}`).toBe(true)
        }
      }
    }
  })

  it('draws the landed container as three visible faces, its details and the marks', () => {
    const drawing = fallbackDrawing()
    const [, , width, height] = drawing.viewBox.split(' ').map(Number)
    expect(width).toBeGreaterThan(height!)
    expect(drawing.structure.match(/M/g)).toHaveLength(9)
    expect(drawing.detail.match(/M/g)!.length).toBeGreaterThan(20)
    // Three landing marks (the one hidden behind the container is dropped) and four loading-path dashes.
    expect(drawing.marks.match(/M/g)).toHaveLength(10)
    for (const value of drawing.structure.match(/-?\d+\.\d/g)!.map(Number)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(Math.max(width!, height!))
    }
  })
})
