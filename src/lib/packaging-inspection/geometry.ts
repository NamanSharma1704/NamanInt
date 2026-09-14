/**
 * Geometry of the shelf-ready display tray and corner-dropped carton drawn in the Packaging & Retail
 * inspection sequence.
 *
 * The dimensions are the final state of a procedural reconstruction of the owner's display
 * illustration (public/assets/images/Packaging & Retail.jpg, used as a modelling reference only),
 * credited through its blockout, structural and form passes under a camera solved from the tray's
 * corners (tray-band silhouette IoU 0.93). Units are relative to the tray width W = 1: +X is the
 * tray's right, +Y is up and +Z is its notched front wall.
 *
 * The carton hangs over the tray in the ISTA corner-drop pose, its centre of gravity straight above
 * its lowest corner. The illustration draws that carton as wide as the tray, which could not hang
 * over it, so it keeps the drawn pose and proportions at 0.59 of the drawn size.
 *
 * Pure data and arithmetic with no Three.js or DOM, so the WebGL scene and the tests share it.
 */
import {
  applyFrame,
  rect,
  round,
  roundedRect,
  solidBounds,
  type Bounds,
  type Frame,
  type InspectionDrawing,
  type InspectionMarker,
  type Point2,
  type Solid,
  type Vec3,
} from '@/lib/inspection-drawing/solids';

/** Double-wall corrugated board. */
export const BOARD = 0.018;
export const TRAY = {
  x0: -0.5,
  x1: 0.5,
  back: -0.45,
  front: 0.45,
  /** The side walls stop behind the full-width front wall. */
  sideFront: round(0.45 - BOARD),
  frontHeight: 0.29,
  backHeight: 0.99,
} as const;
/** Thumb notch in the front wall's top edge: half-widths at the top and at its floor. */
const NOTCH = { top: 0.245, bottom: 0.185, depth: 0.065 } as const;
/** Where the two bottom flaps meet. */
const SEAM_Z = -0.02;
/** ECT cut-away in the right wall beside the front corner, with the outer liner removed. */
export const ECT_WINDOW = { z0: 0.26, z1: 0.4, y0: 0.06, y1: 0.21 } as const;
const FLUTE = { pitches: 5, crest: 0.004, trough: 0.011 } as const;
const LABEL = { z0: -0.39, z1: -0.06, y0: 0.06, y1: 0.37, corner: 0.02, thickness: 0.003, inset: 0.022, face: 0.002 } as const;
export const BAR_AREA = { z0: -0.355, z1: -0.095, y0: 0.13, y1: 0.33, guardDrop: 0.025, thickness: 0.0015 } as const;
/** Stylised GS1 symbol in modules, alternating bar and space from a bar; not a real GTIN. */
const BAR_MODULES = [1, 1, 1, 3, 2, 1, 1, 2, 2, 2, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 2, 1, 3, 1, 2, 2, 3, 1, 1, 1, 1, 1] as const;
/** Start, centre and end guard bars, which drop below the others. */
const GUARD_INDICES: ReadonlySet<number> = new Set([0, 2, 16, 18, 32, 34]);

/**
 * The carton's edges from its lowest corner, solved from the illustration under its fitted camera:
 * A runs along the carton's width, C along its height (B, along its depth, follows from the two).
 */
const EDGE_A: Vec3 = [-0.869, 0.459, 0.185];
const EDGE_C: Vec3 = [0.457, 0.599, 0.657];
export const CARTON = { width: 0.4687, height: 0.6115, depth: 0.6693 } as const;
/** The carton's lowest corner, suspended over the tray floor. */
export const DROP_CORNER: Vec3 = [0.257, 0.34, 0.082];
/** How far above its drop pose the carton starts the ISTA step, before it is lowered onto its corner. */
export const CARTON_DROP_HEIGHT = 0.22;
const CAP = { along: 0.13, up: 0.38, shoulder: 0.5, thickness: 0.008 } as const;
/** The carton and its corner cap, which move together during the drop. */
export const CARTON_PART_IDS = ['product-carton', 'cap-flange-front', 'cap-flange-side', 'cap-flange-bottom'] as const;

/** The camera: turned toward the right wall so the ECT cut-away and the label face the viewer. */
export const PACKAGING_VIEW = { azimuthDeg: 40, elevationDeg: 16 } as const;

/** Height of a side wall's raked top edge at depth z. */
export function rakeHeight(z: number): number {
  return TRAY.frontHeight + ((TRAY.sideFront - z) * (TRAY.backHeight - TRAY.frontHeight)) / (TRAY.sideFront - TRAY.back);
}

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const normalize = (a: Vec3): Vec3 => scale(a, 1 / Math.sqrt(dot(a, a)));
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** The carton's placement: local axes from the solved edges, positioned so its corner (+w/2, -h/2, +d/2) is the drop corner. */
function cartonFrame(): Frame {
  const colY = normalize(EDGE_C);
  const minusA = normalize(scale(EDGE_A, -1));
  const colX = normalize([minusA[0] - colY[0] * dot(minusA, colY), minusA[1] - colY[1] * dot(minusA, colY), minusA[2] - colY[2] * dot(minusA, colY)]);
  const colZ = cross(colX, colY);
  const m = [
    [colX[0], colY[0], colZ[0]],
    [colX[1], colY[1], colZ[1]],
    [colX[2], colY[2], colZ[2]],
  ] as const;
  const rotation: Vec3 = [Math.atan2(-m[1][2], m[2][2]), Math.asin(Math.max(-1, Math.min(1, m[0][2]))), Math.atan2(-m[0][1], m[0][0])];
  const toCorner: Vec3 = [CARTON.width / 2, -CARTON.height / 2, CARTON.depth / 2];
  const cornerOffset = applyFrame(toCorner, { position: [0, 0, 0], rotation });
  return { rotation, position: [DROP_CORNER[0] - cornerOffset[0], DROP_CORNER[1] - cornerOffset[1], DROP_CORNER[2] - cornerOffset[2]] };
}

export const CARTON_FRAME: Frame = cartonFrame();

/** The carton's eight corners in model space, in its drop pose. */
export function cartonCorners(): Vec3[] {
  const corners: Vec3[] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corners.push(applyFrame([(sx * CARTON.width) / 2, (sy * CARTON.height) / 2, (sz * CARTON.depth) / 2], CARTON_FRAME));
      }
    }
  }
  return corners;
}

function notchOutline(x0: number, x1: number): Point2[] {
  const floor = round(TRAY.frontHeight - NOTCH.depth);
  return [
    [x0, 0],
    [x1, 0],
    [x1, TRAY.frontHeight],
    [NOTCH.top, TRAY.frontHeight],
    [NOTCH.bottom, floor],
    [-NOTCH.bottom, floor],
    [-NOTCH.top, TRAY.frontHeight],
    [x0, TRAY.frontHeight],
  ];
}

function fluteOutline(): Point2[] {
  const steps = FLUTE.pitches * 2;
  const inner = round(TRAY.x1 - BOARD);
  const points: Point2[] = [[inner, ECT_WINDOW.z0]];
  for (let i = 0; i <= steps; i += 1) {
    const z = ECT_WINDOW.z0 + (i * (ECT_WINDOW.z1 - ECT_WINDOW.z0)) / steps;
    points.push([round(TRAY.x1 - (i % 2 === 0 ? FLUTE.trough : FLUTE.crest)), round(z)]);
  }
  points.push([inner, ECT_WINDOW.z1]);
  return points;
}

function barSolids(): Solid[] {
  const total = BAR_MODULES.reduce((sum, modules) => sum + modules, 0);
  const moduleWidth = (BAR_AREA.z1 - BAR_AREA.z0) / total;
  const x = round(TRAY.x1 + LABEL.thickness + LABEL.face);
  const solids: Solid[] = [];
  // The label reads front to back from outside the right wall.
  let cursor: number = BAR_AREA.z1;
  BAR_MODULES.forEach((modules, index) => {
    const width = modules * moduleWidth;
    if (index % 2 === 0) {
      const bottom = GUARD_INDICES.has(index) ? BAR_AREA.y0 - BAR_AREA.guardDrop : BAR_AREA.y0;
      solids.push({
        kind: 'side-prism',
        id: `gs1-bar-${String(solids.length + 1).padStart(2, '0')}`,
        outline: rect(round(cursor - width), round(cursor), round(bottom), BAR_AREA.y1),
        holes: [],
        x,
        width: BAR_AREA.thickness,
        fill: 'line',
      });
    }
    cursor -= width;
  });
  return solids;
}

function buildSolids(): Solid[] {
  const innerX0 = round(TRAY.x0 + BOARD);
  const innerX1 = round(TRAY.x1 - BOARD);
  const sideOutline: Point2[] = [
    [TRAY.sideFront, 0],
    [TRAY.back, 0],
    [TRAY.back, TRAY.backHeight],
    [TRAY.sideFront, TRAY.frontHeight],
  ];
  const w2 = CARTON.width / 2;
  const h2 = CARTON.height / 2;
  const d2 = CARTON.depth / 2;
  const { along: a, up: b, shoulder: s, thickness: t } = CAP;
  return [
    { kind: 'plan-prism', id: 'floor-flap-front', outline: rect(innerX0, innerX1, SEAM_Z, round(TRAY.front - 2 * BOARD)), holes: [], y: 0, height: BOARD },
    { kind: 'plan-prism', id: 'floor-flap-back', outline: rect(innerX0, innerX1, round(TRAY.back + BOARD), SEAM_Z), holes: [], y: 0, height: BOARD },
    { kind: 'front-prism', id: 'tray-front-wall', outline: notchOutline(TRAY.x0, TRAY.x1), z: round(TRAY.front - BOARD), depth: BOARD },
    // The front wall is folded back on itself, so the notch and top edge show a second ply.
    { kind: 'front-prism', id: 'front-fold-lip', outline: notchOutline(innerX0, innerX1), z: round(TRAY.front - 2 * BOARD), depth: BOARD },
    { kind: 'side-prism', id: 'tray-side-wall-left', outline: sideOutline, holes: [], x: TRAY.x0, width: BOARD },
    {
      kind: 'side-prism',
      id: 'tray-side-wall-right',
      outline: sideOutline,
      holes: [rect(ECT_WINDOW.z0, ECT_WINDOW.z1, ECT_WINDOW.y0, ECT_WINDOW.y1)],
      x: innerX1,
      width: BOARD,
    },
    { kind: 'front-prism', id: 'tray-back-wall', outline: rect(innerX0, innerX1, 0, TRAY.backHeight), z: TRAY.back, depth: BOARD },
    { kind: 'plan-prism', id: 'flute-medium', outline: fluteOutline(), holes: [], y: ECT_WINDOW.y0, height: round(ECT_WINDOW.y1 - ECT_WINDOW.y0) },
    {
      kind: 'side-prism',
      id: 'barcode-label',
      outline: roundedRect(LABEL.z0, LABEL.z1, LABEL.y0, LABEL.y1, LABEL.corner, 5),
      holes: [],
      x: TRAY.x1,
      width: LABEL.thickness,
    },
    {
      kind: 'side-prism',
      id: 'barcode-label-face',
      outline: roundedRect(LABEL.z0 + LABEL.inset, LABEL.z1 - LABEL.inset, LABEL.y0 + LABEL.inset, LABEL.y1 - LABEL.inset, round(LABEL.corner * 0.6), 5),
      holes: [],
      x: round(TRAY.x1 + LABEL.thickness),
      width: LABEL.face,
    },
    ...barSolids(),
    {
      kind: 'front-prism',
      id: 'product-carton',
      outline: rect(round(-w2), round(w2), round(-h2), round(h2)),
      z: round(-d2),
      depth: CARTON.depth,
      frame: CARTON_FRAME,
    },
    // Corner cap: three flanges wrapping the drop corner, each peaking where it meets the vertical edge.
    {
      kind: 'front-prism',
      id: 'cap-flange-front',
      outline: [
        [round(w2 + t), round(-h2 - t)],
        [round(w2 - a), round(-h2 - t)],
        [round(w2 - a), round(-h2 + s * b)],
        [round(w2 + t), round(-h2 + b)],
      ],
      z: round(d2),
      depth: t,
      frame: CARTON_FRAME,
    },
    {
      kind: 'side-prism',
      id: 'cap-flange-side',
      outline: [
        [round(d2), round(-h2 - t)],
        [round(d2 - a), round(-h2 - t)],
        [round(d2 - a), round(-h2 + s * b)],
        [round(d2), round(-h2 + b)],
      ],
      holes: [],
      x: round(w2),
      width: t,
      frame: CARTON_FRAME,
    },
    {
      kind: 'plan-prism',
      id: 'cap-flange-bottom',
      outline: [
        [round(w2), round(d2)],
        [round(w2 - a), round(d2)],
        [round(w2 - a), round(d2 - 0.4 * a)],
        [round(w2 - 0.4 * a), round(d2 - a)],
        [round(w2), round(d2 - a)],
      ],
      holes: [],
      y: round(-h2 - t),
      height: t,
      frame: CARTON_FRAME,
    },
  ];
}

export const PACKAGING_SOLIDS: readonly Solid[] = buildSolids();

const BAR_IDS = PACKAGING_SOLIDS.filter((solid) => solid.id.startsWith('gs1-bar-')).map((solid) => solid.id);
const LABEL_SURFACE_X = round(TRAY.x1 + LABEL.thickness + LABEL.face + BAR_AREA.thickness);

/** One marker per Packaging & Retail inspection protocol, in the order the page lists them. */
export const PACKAGING_MARKERS: readonly InspectionMarker[] = [
  {
    protocol: 0,
    place: "the corner cap on the carton's lowest corner, where a corner drop lands",
    anchor: [round(CARTON.width / 2 + CAP.thickness), round(-CARTON.height / 2 + CAP.up * 0.55), round(CARTON.depth / 2 + CAP.thickness)],
    frame: CARTON_FRAME,
  },
  {
    protocol: 1,
    place: 'the cut-away in the corrugated side wall beside the front corner',
    // The cut-away's rear edge, so the balloon's leader runs clear of the compression arrows above it.
    anchor: [TRAY.x1, round((ECT_WINDOW.y0 + ECT_WINDOW.y1) / 2), ECT_WINDOW.z0],
  },
  {
    protocol: 2,
    place: 'the barcode label on the side wall',
    anchor: [LABEL_SURFACE_X, round((BAR_AREA.y0 + BAR_AREA.y1) / 2), round((BAR_AREA.z0 + BAR_AREA.z1) / 2)],
  },
];

/** Where the drawn effects sit, in model space. */
export const EFFECT_ANCHORS = {
  /** Impact rings spread in the horizontal plane through the drop corner, stopping short of the right wall. */
  impact: { centre: DROP_CORNER, radii: [0.04, 0.2] as const },
  /**
   * Compression arrows press down on the ECT cut-away's top edge, just off the wall's outer face. On
   * the wall's raked top edge they read as part of the drop corner beside them.
   */
  compression: {
    x: round(TRAY.x1 + 0.004),
    edgeY: ECT_WINDOW.y1,
    z: [round(ECT_WINDOW.z0 + 0.03), round(ECT_WINDOW.z1 - 0.03)] as const,
  },
  /** The scan line sweeps across the bars, just proud of them. */
  scan: { x: round(LABEL_SURFACE_X + 0.002), z: [BAR_AREA.z0, BAR_AREA.z1] as const, y: [round(BAR_AREA.y0 - BAR_AREA.guardDrop - 0.01), round(BAR_AREA.y1 + 0.01)] as const },
} as const;

export function packagingBounds(solids: readonly Solid[] = PACKAGING_SOLIDS): Bounds {
  return solidBounds(solids);
}

export const PACKAGING_DRAWING: InspectionDrawing = {
  solids: PACKAGING_SOLIDS,
  markers: PACKAGING_MARKERS,
  view: PACKAGING_VIEW,
  /** The display turns a little further toward its right wall for each step: the drop corner, then the ECT cut-away, then the label on the wall's rear half. */
  sequence: { stepYawDeg: [4, -8, -22], idleSwayDeg: 2.5, idlePeriodSeconds: 16 },
  framingPoints: cartonCorners().map(([x, y, z]): Vec3 => [x, round(y + CARTON_DROP_HEIGHT), z]),
  protocolParts: {
    0: ['cap-flange-front', 'cap-flange-side', 'cap-flange-bottom'],
    1: ['flute-medium'],
    2: ['barcode-label', 'barcode-label-face', ...BAR_IDS],
  },
};
