/**
 * The Trade Services container load sequence as plain data. It holds:
 *   - the 20ft container, its hinged doors and its lifting rig
 *   - the load plan
 *   - the scroll timeline
 *   - the camera the WebGL scene and the server-rendered drawing share
 *
 * Nothing here imports Three.js, so it is tested directly and costs the page chunk almost nothing.
 *
 * The geometry is the img2threejs reconstruction credited through form refinement, built against the crane photograph
 * at ISO 668 1CC size.
 *
 * Units are metres:
 *   +X runs toward the front (blind) end, with the door end at -X.
 *   +Y is up from the ground.
 *   +Z points toward the near long side the camera sees.
 */

export type Vec3 = readonly [number, number, number];
export type Point2 = readonly [number, number];

export interface BoxSolid {
  readonly kind: 'box';
  readonly id: string;
  readonly centre: Vec3;
  readonly size: Vec3;
}

/** Plan outline in (x, z), extruded upward from `y`. */
export interface PlanPrism {
  readonly kind: 'plan-prism';
  readonly id: string;
  readonly outline: readonly Point2[];
  readonly y: number;
  readonly height: number;
}

/** Side outline in (x, y) with holes, extruded toward +Z from `z`. */
export interface SidePrism {
  readonly kind: 'side-prism';
  readonly id: string;
  readonly outline: readonly Point2[];
  readonly holes: readonly (readonly Point2[])[];
  readonly z: number;
  readonly depth: number;
}

/** A ring lying in the X-Y plane. */
export interface RingSolid {
  readonly kind: 'ring';
  readonly id: string;
  readonly centre: Vec3;
  readonly radius: number;
  readonly tube: number;
}

export type Solid = BoxSolid | PlanPrism | SidePrism | RingSolid;

export interface Segment3 {
  readonly start: Vec3;
  readonly end: Vec3;
}

const round = (value: number): number => Math.round(value * 1e4) / 1e4;
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

// ── Container ────────────────────────────────────────────────────────────────────────────────────────────────
export const CONTAINER = { length: 6.058, width: 2.438, height: 2.591 } as const;
const HL = CONTAINER.length / 2;
const HW = CONTAINER.width / 2;
const H = CONTAINER.height;

const CASTING: Vec3 = [0.178, 0.118, 0.162];
const PROUD = 0.004;
const POST = 0.16;
/** Door-end posts are narrow across the width so the ISO 2.34 m door opening fits between them. */
const DOOR_POST_DEPTH = round(HW - 1.17);
const TOP_RAIL = { height: 0.1, depth: 0.08 } as const;
const BOTTOM_RAIL = { height: 0.2, depth: 0.1 } as const;
export const SILL_TOP = 0.16;
export const HEADER_BOTTOM = 2.44;
const CORRUGATION = { sideBays: 21, endBays: 7, depth: 0.036, crestInset: 0.03, sheet: 0.012 } as const;
/** Measured from the photograph and kept symmetric; not the ISO 2.05 m pocket centres. */
export const POCKET_CENTRES: readonly number[] = [-1.85, 1.85];
const POCKET = { width: 0.36, bottom: 0.03, top: 0.15 } as const;
/** The inner face of the corrugated side walls' valleys. Cartons must stay inside it. */
export const INNER_WALL_Z = round(HW - CORRUGATION.crestInset - CORRUGATION.depth - CORRUGATION.sheet);
/** The inner face of the corrugated front end wall. */
export const INNER_FRONT_X = round(HL - CORRUGATION.crestInset - CORRUGATION.depth - CORRUGATION.sheet);

/** Trapezoidal corrugation as (along, across) points: crest, flank, valley and flank per bay. */
function wave(a0: number, a1: number, bays: number, crest: number, inward: number): Point2[] {
  const pitch = (a1 - a0) / bays;
  const flat = 0.26 * pitch;
  const flank = 0.24 * pitch;
  const valley = crest + inward * CORRUGATION.depth;
  const points: Point2[] = [];
  for (let i = 0; i < bays; i += 1) {
    const s = a0 + i * pitch;
    points.push([s, crest], [s + flat, crest], [s + flat + flank, valley], [s + 2 * flat + flank, valley]);
  }
  points.push([a1, crest]);
  return points;
}

/** Close a corrugation line into a sheet of CORRUGATION.sheet thickness. */
function sheet(points: readonly Point2[], inward: number): Point2[] {
  const back = [...points].reverse().map(([a, c]): Point2 => [a, c + inward * CORRUGATION.sheet]);
  return [...points, ...back].map(([a, c]): Point2 => [round(a), round(c)]);
}

function rect(x0: number, x1: number, y0: number, y1: number): Point2[] {
  return [
    [round(x0), round(y0)],
    [round(x1), round(y0)],
    [round(x1), round(y1)],
    [round(x0), round(y1)],
  ];
}

function box(id: string, centre: Vec3, size: Vec3): BoxSolid {
  return { kind: 'box', id, centre: centre.map(round) as unknown as Vec3, size: size.map(round) as unknown as Vec3 };
}

/** Bars, handles and keepers sit at these distances from the centre seam on both leaves. */
export const LOCKING_BAR_Z: readonly number[] = [0.16, 0.67];

function buildBody(): Solid[] {
  const solids: Solid[] = [];
  const wallX: Point2 = [-HL + POST, HL - POST];
  const wallY = BOTTOM_RAIL.height;
  const wallHeight = round(H - TOP_RAIL.height - wallY);

  for (const [name, sign] of [['near', 1], ['far', -1]] as const) {
    const line = wave(wallX[0], wallX[1], CORRUGATION.sideBays, sign * (HW - CORRUGATION.crestInset), -sign);
    solids.push({ kind: 'plan-prism', id: `side-wall-${name}`, outline: sheet(line, -sign), y: wallY, height: wallHeight });
  }
  const endLine = wave(-HW + POST, HW - POST, CORRUGATION.endBays, HL - CORRUGATION.crestInset, -1);
  solids.push({
    kind: 'plan-prism',
    id: 'front-end-wall',
    outline: sheet(endLine, -1).map(([along, across]): Point2 => [across, along]),
    y: wallY,
    height: wallHeight,
  });
  solids.push(box('roof-panel', [0, H - 0.035, 0], [CONTAINER.length - 2 * CASTING[0], 0.03, CONTAINER.width - 0.24]));
  solids.push(box('floor-deck', [0, SILL_TOP - 0.025, 0], [CONTAINER.length - 0.16, 0.05, CONTAINER.width - 0.09]));

  for (const [end, sx] of [['door', -1], ['front', 1]] as const) {
    for (const [side, sz] of [['near', 1], ['far', -1]] as const) {
      const depth = end === 'door' ? DOOR_POST_DEPTH : POST;
      solids.push(box(`corner-post-${end}-${side}`, [sx * (HL - POST / 2), H / 2, sz * (HW - depth / 2)], [POST, H - 2 * CASTING[1], depth]));
      // Bottom castings stand proud upward only, so they sit on the ground rather than 4 mm below it.
      for (const [level, y] of [['top', H - CASTING[1] / 2], ['bottom', CASTING[1] / 2 + PROUD]] as const) {
        solids.push(
          box(
            `corner-casting-${end}-${level}-${side}`,
            [sx * (HL - CASTING[0] / 2), y, sz * (HW - CASTING[2] / 2)],
            [CASTING[0] + 2 * PROUD, CASTING[1] + 2 * PROUD, CASTING[2] + 2 * PROUD],
          ),
        );
      }
    }
  }

  for (const [side, sz] of [['near', 1], ['far', -1]] as const) {
    solids.push(box(`top-side-rail-${side}`, [0, H - TOP_RAIL.height / 2, sz * (HW - TOP_RAIL.depth / 2)], [CONTAINER.length - 2 * CASTING[0], TOP_RAIL.height, TOP_RAIL.depth]));
    solids.push({
      kind: 'side-prism',
      id: `bottom-side-rail-${side}`,
      outline: rect(-HL + CASTING[0], HL - CASTING[0], 0, BOTTOM_RAIL.height),
      holes: POCKET_CENTRES.map((c) => rect(c - POCKET.width / 2, c + POCKET.width / 2, POCKET.bottom, POCKET.top)),
      z: round(side === 'near' ? HW - BOTTOM_RAIL.depth : -HW),
      depth: BOTTOM_RAIL.depth,
    });
  }

  const endSpan = CONTAINER.width - 2 * CASTING[2];
  solids.push(box('front-top-rail', [HL - 0.05, H - TOP_RAIL.height / 2, 0], [0.1, TOP_RAIL.height, endSpan]));
  solids.push(box('front-bottom-rail', [HL - 0.05, SILL_TOP / 2, 0], [0.1, SILL_TOP, endSpan]));
  solids.push(box('door-header', [-HL + 0.05, (HEADER_BOTTOM + H) / 2, 0], [0.1, H - HEADER_BOTTOM, endSpan]));
  solids.push(box('door-sill', [-HL + 0.05, SILL_TOP / 2, 0], [0.1, SILL_TOP, endSpan]));

  for (const side of [1, -1] as const) {
    LOCKING_BAR_Z.forEach((z, index) => {
      for (const [end, y] of [['header', 2.5], ['sill', 0.1]] as const) {
        solids.push(box(`cam-keeper-${side > 0 ? 'right' : 'left'}-${index + 1}-${end}`, [-HL - 0.025, y, side * z], [0.05, 0.08, 0.07]));
      }
    });
  }
  return solids;
}

export const BODY_SOLIDS: readonly Solid[] = buildBody();

// ── Doors ────────────────────────────────────────────────────────────────────────────────────────────────────
export interface DoorLeaf {
  readonly id: 'door-left' | 'door-right';
  /** +1 for the leaf on the near (+Z) side, -1 for the far side. */
  readonly side: 1 | -1;
  /** The vertical hinge axis, on the ground plane. The leaf's solids are relative to it. */
  readonly hinge: Vec3;
  readonly solids: readonly Solid[];
}

const HINGE = { x: round(-HL + 0.005), z: 1.175 } as const;
const LEAF = { width: 1.165, height: 2.28, thickness: 0.04 } as const;
/** How far the doors swing: far enough to fold back beside the side walls without clipping the corner castings. */
export const DOOR_OPEN_DEG = 250;

function buildLeaf(side: 1 | -1): DoorLeaf {
  const centreY = SILL_TOP + LEAF.height / 2;
  const leafZ = -side * (HINGE.z - 0.0075 - LEAF.width / 2);
  const solids: Solid[] = [
    box('hinge-axis', [0, centreY, 0], [0.03, 2.2, 0.03]),
    box('leaf', [0.025, centreY, leafZ], [LEAF.thickness, LEAF.height, LEAF.width]),
  ];
  LOCKING_BAR_Z.forEach((worldZ, index) => {
    const z = side * worldZ - side * HINGE.z;
    solids.push(box(`locking-bar-${index + 1}`, [-0.015, centreY, z], [0.032, 2.2, 0.032]));
    // Turned toward the hinge, so the inner handle never crosses the seam.
    solids.push(box(`lock-handle-${index + 1}`, [-0.045, centreY - 0.02, z + side * 0.12], [0.03, 0.035, 0.26]));
  });
  [-0.85, -0.45, 0.45, 0.85].forEach((offset, index) => {
    solids.push(box(`panel-rib-${index + 1}`, [-0.001, centreY + offset, leafZ], [0.012, 0.16, 1.0]));
  });
  return { id: side > 0 ? 'door-right' : 'door-left', side, hinge: [HINGE.x, 0, side * HINGE.z], solids };
}

export const DOOR_LEAVES: readonly DoorLeaf[] = [buildLeaf(1), buildLeaf(-1)];

/** Rotation about +Y, in radians, that opens a leaf by `openDeg`: the near leaf turns positive and the far leaf negative. */
export function doorRotation(side: 1 | -1, openDeg: number): number {
  return (side * openDeg * Math.PI) / 180;
}

/** A point on a leaf, in container coordinates, with the doors open by `openDeg`. */
export function leafPointToWorld(leaf: DoorLeaf, local: Vec3, openDeg: number): Vec3 {
  const angle = doorRotation(leaf.side, openDeg);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const [x, y, z] = local;
  return [leaf.hinge[0] + x * cos + z * sin, leaf.hinge[1] + y, leaf.hinge[2] - x * sin + z * cos];
}

// ── Lifting rig ──────────────────────────────────────────────────────────────────────────────────────────────
/** Sling apex above the roof and hook drop below the block, as credited in the reconstruction. */
export const APEX_Y = round(H + 1.05);
const BLOCK_Y = round(APEX_Y + 0.85);

function castingTop(sx: number, sz: number): Vec3 {
  return [round(sx * (HL - CASTING[0] / 2)), round(H + 0.07), round(sz * (HW - CASTING[2] / 2))];
}

export const RIG_SOLIDS: readonly Solid[] = [
  box('hook-block', [0, BLOCK_Y, 0], [0.3, 0.42, 0.14]),
  box('hook-shank', [0, (BLOCK_Y - 0.21 + APEX_Y + 0.2) / 2, 0], [0.06, BLOCK_Y - 0.21 - (APEX_Y + 0.2), 0.06]),
  { kind: 'ring', id: 'crane-hook', centre: [0, round(APEX_Y + 0.12), 0], radius: 0.1, tube: 0.022 },
  ...[[-1, 1], [-1, -1], [1, 1], [1, -1]].map(([sx, sz]): RingSolid => {
    const [x, , z] = castingTop(sx!, sz!);
    return { kind: 'ring', id: `sling-end-hook-${sx! < 0 ? 'door' : 'front'}-${sz! > 0 ? 'near' : 'far'}`, centre: [x, round(H + 0.04), z], radius: 0.04, tube: 0.01 };
  }),
];

export const RIG_LINES: readonly Segment3[] = [
  ...[[-1, 1], [-1, -1], [1, 1], [1, -1]].map(([sx, sz]): Segment3 => ({ start: [0, APEX_Y, 0], end: castingTop(sx!, sz!) })),
  ...[-0.07, 0.07].map((x): Segment3 => ({ start: [x, round(BLOCK_Y + 0.21), 0], end: [x, round(BLOCK_Y + 3.2), 0] })),
];

// ── Ground ───────────────────────────────────────────────────────────────────────────────────────────────────
/** L-shaped landing marks just outside each corner of the footprint. */
export const GROUND_MARKS: readonly Segment3[] = [[-1, 1], [-1, -1], [1, 1], [1, -1]].flatMap(([sx, sz]) => {
  const corner: Vec3 = [round(sx! * (HL + 0.12)), 0, round(sz! * (HW + 0.12))];
  return [
    { start: corner, end: [round(corner[0] - sx! * 0.6), 0, corner[2]] },
    { start: corner, end: [corner[0], 0, round(corner[2] - sz! * 0.6)] },
  ] satisfies Segment3[];
});

/** Dashed loading path on the ground, leading out of the door opening. */
export const LOADING_PATH: readonly Segment3[] = Array.from({ length: 4 }, (_, index): Segment3 => {
  const x0 = round(-HL - 0.25 - index * 0.3);
  return { start: [x0, 0, 0], end: [round(x0 - 0.18), 0, 0] };
});

// ── Load plan ────────────────────────────────────────────────────────────────────────────────────────────────
/** Export master carton, sized so five layers pass under the 2.28 m door opening. */
const CARTON_HEIGHT = 0.45;
export const CARTON = { length: 0.6, height: CARTON_HEIGHT, width: 0.455 } as const;
export const LOAD = { slices: 9, layers: 5, rows: 5 } as const;
export const CARTON_COUNT = LOAD.slices * LOAD.layers * LOAD.rows;
/** ISO 1CC internal size, 5.898 x 2.352 x 2.393 m. */
const INTERNAL_CUBE = 5.898 * 2.352 * 2.393;

export const LOAD_SUMMARY = {
  cartons: CARTON_COUNT,
  cubicMetres: Math.round(CARTON_COUNT * CARTON.length * CARTON.height * CARTON.width * 10) / 10,
  cubeUsedPercent: Math.round(((CARTON_COUNT * CARTON.length * CARTON.height * CARTON.width) / INTERNAL_CUBE) * 100),
} as const;

/**
 * Stuffing order runs front wall first: slice by slice toward the doors, and within a slice from the floor up and
 * across the width.
 */
export function cartonSlot(index: number): Vec3 {
  const perSlice = LOAD.layers * LOAD.rows;
  const slice = Math.floor(index / perSlice);
  const layer = Math.floor((index % perSlice) / LOAD.rows);
  const row = index % LOAD.rows;
  return [
    round(INNER_FRONT_X - 0.01 - CARTON.length / 2 - slice * CARTON.length),
    round(SILL_TOP + CARTON.height * (layer + 0.5)),
    round((row - (LOAD.rows - 1) / 2) * CARTON.width),
  ];
}

// ── Scroll timeline ──────────────────────────────────────────────────────────────────────────────────────────
/** The four captioned steps, as shares of the scroll track. */
export const STEP_RANGES: readonly (readonly [number, number])[] = [
  [0, 0.25],
  [0.25, 0.42],
  [0.42, 0.9],
  [0.9, 1],
];

const PHASES = {
  drop: [0.02, 0.17],
  release: [0.19, 0.25],
  doors: [0.27, 0.4],
  stuffing: [0.44, 0.88],
  /** Inside the last step: the doors close on the full load, ready for the seal. */
  doorsClose: [0.9, 0.97],
} as const;

/** The container starts this far above its marks. */
export const DROP_HEIGHT = 5.5;
/** Yaw the container swings through as it is lowered, easing to square on landing. */
export const SWAY_DEG = 9;
/** How far the rig rises after release: clear of the frame. */
export const RIG_LIFT = 5;
/** Share of the track one carton takes to slide from the door mouth to its slot. */
export const CARTON_TRAVEL = 0.035;
/**
 * Where cartons appear: just outside the door opening, at sill height. From there they lift into their layer as they
 * slide in, the way a forklift carries them, instead of floating in at their final height.
 */
export const ENTRY_X = round(-HL - 0.45);
export const ENTRY_Y = round(SILL_TOP + CARTON_HEIGHT / 2);

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const phase = (progress: number, [from, to]: readonly [number, number]): number => clamp01((progress - from) / (to - from));

export function stepForProgress(progress: number): number {
  const p = clamp01(progress);
  const index = STEP_RANGES.findIndex(([, to]) => p < to);
  return index === -1 ? STEP_RANGES.length - 1 : index;
}

/**
 * Under reduced motion the section still follows scrolling, but each step shows one settled frame instead of
 * continuous motion. Stuffing shows a half-loaded container, so it still differs from the final step.
 */
export const REDUCED_MOTION_PROGRESS: readonly number[] = [0.25, 0.42, 0.66, 1];

export function reducedMotionProgress(progress: number): number {
  return REDUCED_MOTION_PROGRESS[stepForProgress(progress)]!;
}

export interface SequenceState {
  /** Height of the container above its marks. */
  readonly containerY: number;
  readonly yawDeg: number;
  /** Height of the rig relative to its landed position. It rides with the container until release. */
  readonly rigY: number;
  readonly doorOpenDeg: number;
  /** Cartons that have reached their slots. */
  readonly cartonsPlaced: number;
  readonly step: number;
}

function cartonArrival(index: number): number {
  const [from, to] = PHASES.stuffing;
  return from + CARTON_TRAVEL + (index / (CARTON_COUNT - 1)) * (to - from - CARTON_TRAVEL);
}

export function sequenceState(progress: number): SequenceState {
  const p = clamp01(progress);
  const drop = easeOutCubic(phase(p, PHASES.drop));
  const containerY = round(DROP_HEIGHT * (1 - drop));
  let placed = 0;
  // Arrivals are ordered, so count until the first carton still in flight.
  while (placed < CARTON_COUNT && p >= cartonArrival(placed)) placed += 1;
  return {
    containerY,
    yawDeg: round(SWAY_DEG * (1 - drop)),
    rigY: round(containerY + RIG_LIFT * easeInOutCubic(phase(p, PHASES.release))),
    doorOpenDeg: round(DOOR_OPEN_DEG * (easeInOutCubic(phase(p, PHASES.doors)) - easeInOutCubic(phase(p, PHASES.doorsClose)))),
    cartonsPlaced: placed,
    step: stepForProgress(p),
  };
}

export interface CartonPose {
  readonly position: Vec3;
  /** 0 to 1 while the carton appears at the door mouth, then 1. */
  readonly scale: number;
}

/** Where carton `index` is at `progress`, or null before it enters. */
export function cartonPose(index: number, progress: number): CartonPose | null {
  const arrival = cartonArrival(index);
  const start = arrival - CARTON_TRAVEL;
  if (progress < start) return null;
  const t = clamp01((progress - start) / CARTON_TRAVEL);
  const slot = cartonSlot(index);
  return {
    position: [round(ENTRY_X + (slot[0] - ENTRY_X) * easeOutCubic(t)), round(ENTRY_Y + (slot[1] - ENTRY_Y) * easeInOutCubic(t)), slot[2]],
    scale: clamp01(t / 0.2),
  };
}

// ── Camera ───────────────────────────────────────────────────────────────────────────────────────────────────
/** Three-quarter view on the door end, raised enough to see the landing marks and into the doors. */
export const VIEW = { azimuthDeg: -42, elevationDeg: 22 } as const;

/**
 * Everything the camera keeps in frame from landing onward: the container, the landed rig, the doors at every
 * angle, and cartons entering at the door mouth.
 */
// At 180 degrees a leaf lies flat against the door plane, sticking out 1.17 m past its hinge, so z reaches about +/-2.35 m.
export const FRAME_BOX = { min: [-4.5, 0, -2.45] as Vec3, max: [3.25, 4.8, 2.45] as Vec3 } as const;
export const FRAME_CENTRE: Vec3 = [
  (FRAME_BOX.min[0] + FRAME_BOX.max[0]) / 2,
  (FRAME_BOX.min[1] + FRAME_BOX.max[1]) / 2,
  (FRAME_BOX.min[2] + FRAME_BOX.max[2]) / 2,
];

export interface CameraBasis {
  /** From the target toward the camera. */
  readonly direction: Vec3;
  readonly right: Vec3;
  readonly up: Vec3;
}

const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
};

/** The same basis Three.js builds in Object3D.lookAt with +Y up, so the SVG drawing and the canvas line up. */
export function cameraBasis(view: { azimuthDeg: number; elevationDeg: number } = VIEW): CameraBasis {
  const az = (view.azimuthDeg * Math.PI) / 180;
  const el = (view.elevationDeg * Math.PI) / 180;
  const direction: Vec3 = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  const right = normalize(cross([0, 1, 0], direction));
  return { direction, right, up: cross(direction, right) };
}

/** Screen position of a point, in metres, relative to the frame centre. */
export function project(point: Vec3, basis: CameraBasis = cameraBasis()): Point2 {
  const offset: Vec3 = [point[0] - FRAME_CENTRE[0], point[1] - FRAME_CENTRE[1], point[2] - FRAME_CENTRE[2]];
  return [dot(offset, basis.right), dot(offset, basis.up)];
}

export interface Extent {
  readonly left: number;
  readonly right: number;
  readonly bottom: number;
  readonly top: number;
}

export function frameExtent(basis: CameraBasis = cameraBasis()): Extent {
  let left = Infinity;
  let right = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;
  for (const x of [FRAME_BOX.min[0], FRAME_BOX.max[0]]) {
    for (const y of [FRAME_BOX.min[1], FRAME_BOX.max[1]]) {
      for (const z of [FRAME_BOX.min[2], FRAME_BOX.max[2]]) {
        const [sx, sy] = project([x, y, z], basis);
        left = Math.min(left, sx);
        right = Math.max(right, sx);
        bottom = Math.min(bottom, sy);
        top = Math.max(top, sy);
      }
    }
  }
  return { left, right, bottom, top };
}

// ── Server-rendered drawing ──────────────────────────────────────────────────────────────────────────────────
export interface FallbackDrawing {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  /** Visible edges of the landed, closed container. */
  readonly structure: string;
  /** Corrugation creases, door seam, header and sill lines, and locking bars on the visible faces. */
  readonly detail: string;
  /** Landing marks and the loading path. */
  readonly marks: string;
}

const SVG_SCALE = 60;

/**
 * A line drawing of the landed, closed container, drawn from the same camera as the WebGL scene. It is what the
 * server renders and what stays on screen where WebGL does not run.
 */
export function fallbackDrawing(): FallbackDrawing {
  const basis = cameraBasis();
  const extent = frameExtent(basis);
  const toSvg = (point: Vec3): string => {
    const [x, y] = project(point, basis);
    return `${((x - extent.left) * SVG_SCALE).toFixed(1)} ${((extent.top - y) * SVG_SCALE).toFixed(1)}`;
  };
  const path = (segments: readonly Segment3[]): string => segments.map((s) => `M${toSvg(s.start)}L${toSvg(s.end)}`).join('');

  // For a convex box, the edges worth drawing are the edges of the faces turned toward the camera.
  const corner = (sx: number, sy: number, sz: number): Vec3 => [sx * HL, sy > 0 ? H : 0, sz * HW];
  const faces: { normal: Vec3; corners: Vec3[] }[] = [
    { normal: [-1, 0, 0], corners: [corner(-1, 0, -1), corner(-1, 0, 1), corner(-1, 1, 1), corner(-1, 1, -1)] },
    { normal: [1, 0, 0], corners: [corner(1, 0, -1), corner(1, 0, 1), corner(1, 1, 1), corner(1, 1, -1)] },
    { normal: [0, 1, 0], corners: [corner(-1, 1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(-1, 1, 1)] },
    { normal: [0, -1, 0], corners: [corner(-1, 0, -1), corner(1, 0, -1), corner(1, 0, 1), corner(-1, 0, 1)] },
    { normal: [0, 0, 1], corners: [corner(-1, 0, 1), corner(1, 0, 1), corner(1, 1, 1), corner(-1, 1, 1)] },
    { normal: [0, 0, -1], corners: [corner(-1, 0, -1), corner(1, 0, -1), corner(1, 1, -1), corner(-1, 1, -1)] },
  ];
  const visible = faces.filter((face) => dot(face.normal, basis.direction) > 0);
  const edgeKeys = new Set<string>();
  const structure: Segment3[] = [];
  for (const face of visible) {
    face.corners.forEach((start, index) => {
      const end = face.corners[(index + 1) % 4]!;
      const key = [start, end].map((p) => p.join(',')).sort().join('|');
      if (edgeKeys.has(key)) return;
      edgeKeys.add(key);
      structure.push({ start, end });
    });
  }

  const detail: Segment3[] = [];
  const near = dot([0, 0, 1], basis.direction) > 0 ? HW : -HW;
  const pitch = (2 * (HL - POST)) / CORRUGATION.sideBays;
  for (let i = 0; i <= CORRUGATION.sideBays; i += 1) {
    const x = -HL + POST + i * pitch;
    detail.push({ start: [x, BOTTOM_RAIL.height, near], end: [x, H - TOP_RAIL.height, near] });
  }
  detail.push({ start: [-HL + POST, BOTTOM_RAIL.height, near], end: [HL - POST, BOTTOM_RAIL.height, near] });
  detail.push({ start: [-HL + POST, H - TOP_RAIL.height, near], end: [HL - POST, H - TOP_RAIL.height, near] });
  const doorX = -HL;
  detail.push({ start: [doorX, SILL_TOP, -1.17], end: [doorX, SILL_TOP, 1.17] });
  detail.push({ start: [doorX, HEADER_BOTTOM, -1.17], end: [doorX, HEADER_BOTTOM, 1.17] });
  detail.push({ start: [doorX, SILL_TOP, 0], end: [doorX, HEADER_BOTTOM, 0] });
  for (const side of [1, -1]) {
    for (const z of LOCKING_BAR_Z) detail.push({ start: [doorX, 0.2, side * z], end: [doorX, 2.4, side * z] });
  }

  const width = (extent.right - extent.left) * SVG_SCALE;
  const height = (extent.top - extent.bottom) * SVG_SCALE;
  return {
    viewBox: `0 0 ${width.toFixed(1)} ${height.toFixed(1)}`,
    width,
    height,
    structure: path(structure),
    detail: path(detail),
    // The drawing has no hidden-line removal, so drop the landing mark at the corner diagonally behind the container.
    // The WebGL scene depth-tests it instead.
    marks: path([
      ...GROUND_MARKS.filter(({ start: [x, , z] }) => !(x * basis.direction[0] < 0 && z * basis.direction[2] < 0)),
      ...LOADING_PATH,
    ]),
  };
}
