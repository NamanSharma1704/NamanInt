/**
 * Geometry of the machined aluminium housing drawn in the Precision Hardware inspection view.
 *
 * The dimensions are the final state of a procedural reconstruction of the housing in
 * public/assets/images/category-precision-hardware.jpg, credited through its blockout, structural
 * and form passes against the photo (silhouette IoU 0.87). Units are relative to the base width
 * W = 1: +X is the object's right, +Y is up and +Z faces the viewer.
 *
 * Pure data and arithmetic with no Three.js or DOM, so the WebGL scene and the tests share it.
 */

export type Vec3 = readonly [number, number, number];
export type Point2 = readonly [number, number];

/** A flat outline in plan view, as (x, z), extruded upward from `y` by `height`. */
export interface PlanPrism {
  readonly kind: 'plan-prism';
  readonly id: string;
  readonly outline: readonly Point2[];
  readonly holes: readonly (readonly Point2[])[];
  readonly y: number;
  readonly height: number;
}

/** A flat outline in front view, as (x, y), extruded from `z` toward the viewer by `depth`. */
export interface FrontPrism {
  readonly kind: 'front-prism';
  readonly id: string;
  readonly outline: readonly Point2[];
  readonly z: number;
  readonly depth: number;
}

/** A closed profile of (radius, z) revolved about the Z-parallel axis through (x, y). */
export interface ZLathe {
  readonly kind: 'z-lathe';
  readonly id: string;
  readonly profile: readonly Point2[];
  readonly x: number;
  readonly y: number;
}

/** A solid cylinder between two points. */
export interface Rod {
  readonly kind: 'rod';
  readonly id: string;
  readonly start: Vec3;
  readonly end: Vec3;
  readonly radius: number;
}

export type Solid = PlanPrism | FrontPrism | ZLathe | Rod;

export interface InspectionMarker {
  /** Index into the Precision Hardware category's inspection protocols. */
  readonly protocol: number;
  /** Where on the part the protocol applies, in plain words for the accessible description. */
  readonly place: string;
  readonly anchor: Vec3;
}

export interface Bounds {
  readonly min: Vec3;
  readonly max: Vec3;
}

const BASE_TOP = 0.27;
const DECK = { y: 0.25, height: 0.06 } as const;
const FRAME = { y: 0.29, top: 0.66 } as const;
const PLATE = { y: 0.64, height: 0.075 } as const;
const RIM = { y: 0.705, height: 0.03 } as const;
const Z_BASE = { back: -0.28, front: 0.28 } as const;
const Z_FRAME = { back: -0.28, front: 0.22 } as const;
const WINDOW_WALL_FRONT = 0.17;
const CHEEK_WIDTH = 0.14;
/** The front bore: a collar standing proud of the base, a chamfer, and a bore through the part. */
const BORE = { x: 0, y: 0.29, outer: 0.195, chamfer: 0.18, bore: 0.095, chamferDepth: 0.06, back: -0.28, front: 0.33 } as const;
const TOP_BORE = { x: 0, z: -0.03, radius: 0.115 } as const;
const POCKET = { x0: -0.3, x1: 0.3, z0: -0.21, z1: 0.16, corner: 0.05 } as const;
/** Only the object's left front corner of the upper frame is cut; the right one is square. */
const CORNER_CUT = { x: 0.13, z: 0.12 } as const;
const MOUNT_HOLE = { x: 0.44, z: 0.25, radius: 0.02 } as const;
const SCREW_RADIUS = 0.012;
const FITTING = { y: 0.6775, z: -0.03 } as const;

export const RIM_TOP = RIM.y + RIM.height;

/** The angle the photo was taken from, used as the drawing's resting view. */
export const REFERENCE_VIEW = { azimuthDeg: 6, elevationDeg: 48 } as const;

const round = (value: number): number => Math.round(value * 10000) / 10000;

export function arc(cx: number, cy: number, radius: number, from: number, to: number, steps: number): Point2[] {
  const points: Point2[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = from + ((to - from) * i) / steps;
    points.push([round(cx + radius * Math.cos(angle)), round(cy + radius * Math.sin(angle))]);
  }
  return points;
}

export function circle(cx: number, cy: number, radius: number, steps = 32): Point2[] {
  return arc(cx, cy, radius, 0, Math.PI * 2, steps).slice(0, steps);
}

export function roundedRect(x0: number, x1: number, y0: number, y1: number, radius: number, steps = 6): Point2[] {
  return [
    ...arc(x1 - radius, y0 + radius, radius, -Math.PI / 2, 0, steps),
    ...arc(x1 - radius, y1 - radius, radius, 0, Math.PI / 2, steps),
    ...arc(x0 + radius, y1 - radius, radius, Math.PI / 2, Math.PI, steps),
    ...arc(x0 + radius, y0 + radius, radius, Math.PI, Math.PI * 1.5, steps),
  ];
}

/** Half-width of the notch the bore collar sits in, where it meets the base top face. */
export const NOTCH_HALF_WIDTH = round(Math.sqrt(BORE.outer ** 2 - (BASE_TOP - BORE.y) ** 2));

function baseOutline(): Point2[] {
  const start = Math.asin((BASE_TOP - BORE.y) / BORE.outer);
  return [
    [-0.5, 0],
    [0.5, 0],
    [0.5, BASE_TOP],
    ...arc(BORE.x, BORE.y, BORE.outer, start, -Math.PI - start, 20),
    [-0.5, BASE_TOP],
  ];
}

const rect = (x0: number, x1: number, z0: number, z1: number): Point2[] => [
  [x0, z1],
  [x1, z1],
  [x1, z0],
  [x0, z0],
];

/** The top plate and rim outline: the plan rectangle with the left front corner cut. */
function upperOutline(): Point2[] {
  return [
    [round(-0.5 + CORNER_CUT.x), Z_FRAME.front],
    [0.5, Z_FRAME.front],
    [0.5, Z_FRAME.back],
    [-0.5, Z_FRAME.back],
    [-0.5, round(Z_FRAME.front - CORNER_CUT.z)],
  ];
}

function screwPositions(): Point2[] {
  const corners: Point2[] = [-1, 1].flatMap((side) => [POCKET.z0, POCKET.z1].map((z): Point2 => [round(side * 0.335), z]));
  const edges: Point2[] = [-1, 1].flatMap((side) => [-0.245, 0.195].map((z): Point2 => [round(side * 0.12), z]));
  return [...corners, ...edges];
}

function buildSolids(): Solid[] {
  const innerX = 0.5 - CHEEK_WIDTH;
  const solids: Solid[] = [
    { kind: 'front-prism', id: 'base-block', outline: baseOutline(), z: Z_BASE.back, depth: Z_BASE.front - Z_BASE.back },
    {
      kind: 'plan-prism',
      id: 'base-deck-left',
      outline: rect(-0.5, -NOTCH_HALF_WIDTH, Z_BASE.back, Z_BASE.front),
      holes: [circle(-MOUNT_HOLE.x, MOUNT_HOLE.z, MOUNT_HOLE.radius, 20)],
      y: DECK.y,
      height: DECK.height,
    },
    {
      kind: 'plan-prism',
      id: 'base-deck-right',
      outline: rect(NOTCH_HALF_WIDTH, 0.5, Z_BASE.back, Z_BASE.front),
      holes: [circle(MOUNT_HOLE.x, MOUNT_HOLE.z, MOUNT_HOLE.radius, 20)],
      y: DECK.y,
      height: DECK.height,
    },
    {
      kind: 'plan-prism',
      id: 'cheek-left',
      outline: [
        [round(-0.5 + CORNER_CUT.x), Z_FRAME.front],
        [round(-innerX), Z_FRAME.front],
        [round(-innerX), Z_FRAME.back],
        [-0.5, Z_FRAME.back],
        [-0.5, round(Z_FRAME.front - CORNER_CUT.z)],
      ],
      holes: [],
      y: FRAME.y,
      height: round(FRAME.top - FRAME.y),
    },
    {
      kind: 'plan-prism',
      id: 'cheek-right',
      outline: rect(round(innerX), 0.5, Z_FRAME.back, Z_FRAME.front),
      holes: [],
      y: FRAME.y,
      height: round(FRAME.top - FRAME.y),
    },
    {
      kind: 'plan-prism',
      id: 'window-back-wall',
      outline: rect(round(-innerX - 0.02), round(innerX + 0.02), Z_FRAME.back, WINDOW_WALL_FRONT),
      holes: [],
      y: FRAME.y,
      height: round(FRAME.top - FRAME.y),
    },
    {
      kind: 'plan-prism',
      id: 'top-plate',
      outline: upperOutline(),
      holes: [circle(TOP_BORE.x, TOP_BORE.z, TOP_BORE.radius, 40)],
      y: PLATE.y,
      height: PLATE.height,
    },
    {
      kind: 'plan-prism',
      id: 'top-rim',
      outline: upperOutline(),
      holes: [roundedRect(POCKET.x0, POCKET.x1, POCKET.z0, POCKET.z1, POCKET.corner)],
      y: RIM.y,
      height: RIM.height,
    },
    {
      kind: 'z-lathe',
      id: 'bore-boss',
      profile: [
        [BORE.outer, BORE.back],
        [BORE.outer, BORE.front],
        [BORE.chamfer, BORE.front],
        [BORE.bore, round(BORE.front - BORE.chamferDepth)],
        [BORE.bore, BORE.back],
        [BORE.outer, BORE.back],
      ],
      x: BORE.x,
      y: BORE.y,
    },
    { kind: 'rod', id: 'fitting-collar', start: [0.49, FITTING.y, FITTING.z], end: [0.52, FITTING.y, FITTING.z], radius: 0.032 },
    { kind: 'rod', id: 'fitting-nipple', start: [0.515, FITTING.y, FITTING.z], end: [0.555, FITTING.y, FITTING.z], radius: 0.022 },
  ];
  screwPositions().forEach(([x, z], index) => {
    solids.push({
      kind: 'rod',
      id: `screw-${index + 1}`,
      start: [x, round(RIM_TOP - 0.006), z],
      end: [x, round(RIM_TOP + 0.008), z],
      radius: SCREW_RADIUS,
    });
  });
  return solids;
}

export const HOUSING_SOLIDS: readonly Solid[] = buildSolids();

/** One marker per Precision Hardware inspection protocol, in the order the page lists them. */
export const INSPECTION_MARKERS: readonly InspectionMarker[] = [
  { protocol: 0, place: 'the rim of the top bore', anchor: [TOP_BORE.x, PLATE.y + PLATE.height, round(TOP_BORE.z + TOP_BORE.radius)] },
  { protocol: 1, place: 'the machined base block', anchor: [-0.32, 0.12, Z_BASE.front] },
  { protocol: 2, place: 'the side fitting', anchor: [0.555, FITTING.y, FITTING.z] },
];

/** Axis-aligned bounds of every solid, for framing the camera. */
export function housingBounds(solids: readonly Solid[] = HOUSING_SOLIDS): Bounds {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const include = (x: number, y: number, z: number): void => {
    min[0] = Math.min(min[0]!, x);
    min[1] = Math.min(min[1]!, y);
    min[2] = Math.min(min[2]!, z);
    max[0] = Math.max(max[0]!, x);
    max[1] = Math.max(max[1]!, y);
    max[2] = Math.max(max[2]!, z);
  };
  for (const solid of solids) {
    switch (solid.kind) {
      case 'plan-prism':
        for (const [x, z] of solid.outline) {
          include(x, solid.y, z);
          include(x, solid.y + solid.height, z);
        }
        break;
      case 'front-prism':
        for (const [x, y] of solid.outline) {
          include(x, y, solid.z);
          include(x, y, solid.z + solid.depth);
        }
        break;
      case 'z-lathe':
        for (const [radius, z] of solid.profile) {
          include(solid.x - radius, solid.y - radius, z);
          include(solid.x + radius, solid.y + radius, z);
        }
        break;
      case 'rod':
        for (const point of [solid.start, solid.end]) {
          include(point[0] - solid.radius, point[1] - solid.radius, point[2] - solid.radius);
          include(point[0] + solid.radius, point[1] + solid.radius, point[2] + solid.radius);
        }
        break;
    }
  }
  return {
    min: [round(min[0]!), round(min[1]!), round(min[2]!)],
    max: [round(max[0]!), round(max[1]!), round(max[2]!)],
  };
}
