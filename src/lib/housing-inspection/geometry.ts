/**
 * Geometry of the machined aluminium housing drawn in the Precision Hardware inspection sequence.
 *
 * The dimensions are the final state of a procedural reconstruction of the housing in
 * public/assets/images/category-precision-hardware.jpg, credited through its blockout, structural
 * and form passes against the photo (silhouette IoU 0.87). Units are relative to the base width
 * W = 1: +X is the object's right, +Y is up and +Z faces the viewer.
 *
 * Pure data and arithmetic with no Three.js or DOM, so the WebGL scene and the tests share it.
 */
import {
  arc,
  circle,
  round,
  roundedRect,
  solidBounds,
  type Bounds,
  type InspectionDrawing,
  type InspectionMarker,
  type Point2,
  type Solid,
  type Vec3,
} from '@/lib/inspection-drawing/solids';

export { arc, circle, roundedRect } from '@/lib/inspection-drawing/solids';
export type { Bounds, FrontPrism, InspectionMarker, PlanPrism, Point2, Rod, Solid, Vec3, ZLathe } from '@/lib/inspection-drawing/solids';

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

/** The angle the photo was taken from, used as the drawing's camera. */
export const REFERENCE_VIEW = { azimuthDeg: 6, elevationDeg: 48 } as const;

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

const PROBE_CONTACT = INSPECTION_MARKERS[0]!.anchor;

/** Where the sequence's drawn effects sit, in model space. */
export const HOUSING_EFFECT_ANCHORS = {
  /** CMM probe: its ball comes down onto the top bore's front rim, from `travel` above it. */
  probe: { contact: PROBE_CONTACT, ballRadius: 0.018, travel: 0.2, shaft: 0.28 },
  /** Restricted-substance screening: a plane sweeps down through the base block, from just above its top to the floor. */
  screening: {
    x: [-0.56, 0.56] as const,
    z: [round(Z_BASE.back - 0.04), round(BORE.front + 0.04)] as const,
    y: [round(BASE_TOP + 0.05), 0] as const,
  },
  /** Salt spray: droplets travel from a nozzle beside the part to the side fitting. */
  spray: {
    nozzle: [0.8, round(FITTING.y + 0.1), round(FITTING.z + 0.06)] as Vec3,
    target: [0.555, FITTING.y, FITTING.z] as Vec3,
    spread: 0.03,
  },
} as const;

/** Axis-aligned bounds of every solid, for framing the camera. */
export function housingBounds(solids: readonly Solid[] = HOUSING_SOLIDS): Bounds {
  return solidBounds(solids);
}

export const HOUSING_DRAWING: InspectionDrawing = {
  solids: HOUSING_SOLIDS,
  markers: INSPECTION_MARKERS,
  view: REFERENCE_VIEW,
  /**
   * The part turns a little toward each inspection point: square to the top plate for the CMM probe, to the base
   * block's front for screening, and well round for the side fitting, which is edge-on at the photograph's angle.
   */
  sequence: { stepYawDeg: [-8, 0, -34], idleSwayDeg: 2.5, idlePeriodSeconds: 16 },
  framingPoints: [
    [PROBE_CONTACT[0], round(PROBE_CONTACT[1] + HOUSING_EFFECT_ANCHORS.probe.travel + 0.04), PROBE_CONTACT[2]],
    HOUSING_EFFECT_ANCHORS.spray.nozzle,
  ],
  protocolParts: {
    0: ['top-plate', 'top-rim'],
    1: ['base-block', 'base-deck-left', 'base-deck-right'],
    2: ['fitting-collar', 'fitting-nipple'],
  },
};
