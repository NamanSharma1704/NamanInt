/**
 * Geometry of the Textiles & Materials inspection model: one fabric roll on its cardboard tube, one continuous sheet
 * unrolled from it, and the three inspection elements on that sheet: a certification tag tied to its edge near the
 * roll, five colour swatches lying on it, and the tear the tensile test runs into its edge, with loose fibres.
 *
 * The roll's proportions come from a procedural reconstruction of a partly unwound roll in the category's warehouse
 * photograph (used as a modelling reference only), credited through its blockout, structural and form passes: the
 * tube's outer radius is 0.649 of the roll's, its bore 0.522, and it stands 0.73 of the roll radius proud of the
 * fabric. The tag, swatches and tear are not in that photograph; they are built to the brief.
 *
 * Units are metres at an illustrative scale: +X runs along the roll's axis, +Y is up, the sheet runs toward +Z and
 * the ground is y = 0. Positions on the sheet are given as (x, s), where s is the distance along the sheet from where
 * it starts on the roll. Pure data and arithmetic with no Three.js or DOM, so the scene and the tests share it.
 */

export type Vec3 = readonly [number, number, number];

const DEG = Math.PI / 180;

export const ROLL = {
  radius: 0.34,
  /** The fabric width along the roll's axis. */
  width: 1.2,
  tubeOuter: 0.221,
  tubeInner: 0.177,
  /** How far the tube stands proud of the fabric at each end. */
  tubeProtrude: 0.248,
  /** Wound layers shown on each end face. */
  layers: 16,
} as const;

export const SHEET = {
  thickness: 0.006,
  /** The sheet lies on the roll's outer wrap over this arc before it peels away. */
  wrapDeg: 28,
  /** Where it peels away, in degrees above the roll's forward horizontal. */
  peelDeg: 38,
  /** Bezier handle lengths as it leaves the roll and as it settles on the ground. */
  peelHandle: 0.18,
  landHandle: 0.22,
  /** Where the sheet settles onto the ground, in front of the roll's axis. */
  landZ: 0.62,
  /** The free end, which waves a little across the width and lifts slightly. */
  endZ: 1.9,
  endWave: 0.018,
  curl: { length: 0.14, height: 0.03 },
  folds: { height: 0.02, wavelength: 0.4 },
} as const;

const EDGE_X = -ROLL.width / 2;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const smoothstep = (t: number): number => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};
export const round = (value: number): number => Math.round(value * 10000) / 10000;

interface PathPoint {
  readonly s: number;
  readonly z: number;
  readonly y: number;
  /** Unit tangent in the (z, y) plane, pointing along increasing s. */
  readonly tz: number;
  readonly ty: number;
}

/** The sheet's centreline in the (z, y) plane: an arc on the roll, a drape to the ground, then flat along the ground. */
function buildPath(): PathPoint[] {
  const raw: Array<{ z: number; y: number }> = [];
  const wrapRadius = ROLL.radius + SHEET.thickness / 2;
  const from = (SHEET.peelDeg + SHEET.wrapDeg) * DEG;
  const peel = SHEET.peelDeg * DEG;
  for (let i = 0; i <= 40; i += 1) {
    const angle = from + ((peel - from) * i) / 40;
    raw.push({ z: wrapRadius * Math.cos(angle), y: ROLL.radius + wrapRadius * Math.sin(angle) });
  }
  const p0 = raw[raw.length - 1]!;
  // Decreasing the angle moves the point down and forward, so this is the direction the sheet leaves in.
  const t0 = { z: Math.sin(peel), y: -Math.cos(peel) };
  const land = { z: SHEET.landZ, y: SHEET.thickness / 2 };
  const c1 = { z: p0.z + SHEET.peelHandle * t0.z, y: p0.y + SHEET.peelHandle * t0.y };
  const c2 = { z: land.z - SHEET.landHandle, y: land.y };
  for (let i = 1; i <= 90; i += 1) {
    const t = i / 90;
    const u = 1 - t;
    raw.push({
      z: u * u * u * p0.z + 3 * u * u * t * c1.z + 3 * u * t * t * c2.z + t * t * t * land.z,
      y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * land.y,
    });
  }
  const far = SHEET.endZ + SHEET.endWave + 0.02;
  for (let z = SHEET.landZ + 0.01; z <= far + 1e-9; z += 0.01) raw.push({ z, y: SHEET.thickness / 2 });

  const path: PathPoint[] = [];
  let s = 0;
  raw.forEach((point, index) => {
    if (index > 0) s += Math.hypot(point.z - raw[index - 1]!.z, point.y - raw[index - 1]!.y);
    const before = raw[Math.max(0, index - 1)]!;
    const after = raw[Math.min(raw.length - 1, index + 1)]!;
    const length = Math.hypot(after.z - before.z, after.y - before.y) || 1;
    path.push({ s, z: point.z, y: point.y, tz: (after.z - before.z) / length, ty: (after.y - before.y) / length });
  });
  return path;
}

const PATH = buildPath();

/** Distance along the sheet at which it settles onto the ground. */
export const SHEET_LAND_S: number = PATH.find((point) => point.z >= SHEET.landZ - 1e-9 && point.y <= SHEET.thickness / 2 + 1e-9)!.s;

/** The sheet's centreline at a distance s along it, interpolated. */
export function sheetCentre(s: number): { z: number; y: number; tz: number; ty: number } {
  if (s <= 0) return PATH[0]!;
  const last = PATH[PATH.length - 1]!;
  if (s >= last.s) return { z: last.z + (s - last.s), y: last.y, tz: 1, ty: 0 };
  let low = 0;
  let high = PATH.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (PATH[mid]!.s <= s) low = mid;
    else high = mid;
  }
  const a = PATH[low]!;
  const b = PATH[high]!;
  const t = (s - a.s) / (b.s - a.s || 1);
  return { z: a.z + (b.z - a.z) * t, y: a.y + (b.y - a.y) * t, tz: a.tz + (b.tz - a.tz) * t, ty: a.ty + (b.ty - a.ty) * t };
}

/** Length of the sheet along column x: it ends at a slightly wavy free edge. */
export function sheetLength(x: number): number {
  return SHEET_LAND_S + (SHEET.endZ + SHEET.endWave * Math.sin(3.1 * x + 0.4) - SHEET.landZ);
}

/** The sheet thins to nothing where it starts on the roll, so the wrap has no step at its first edge. */
export function sheetThickness(s: number): number {
  return SHEET.thickness * (0.25 + 0.75 * smoothstep(s / 0.08));
}

/** 01: the certification tag, lying on the sheet near the roll with its eyelet toward the near edge, tied through that edge. */
export const TAG = {
  x: EDGE_X + 0.2,
  s: SHEET_LAND_S + 0.16,
  /** Turn about the sheet's normal, from the roll's axis. */
  turnDeg: 18,
  /** The card rests on its eyelet end, its far end lifted this much off the fabric. */
  tiltDeg: 10,
  length: 0.19,
  breadth: 0.115,
  thickness: 0.004,
  corner: 0.012,
  hole: { inset: 0.02, radius: 0.007 },
  /** Where the cord passes through the fabric, just inside its edge. */
  cordAnchor: { x: EDGE_X + 0.03, s: SHEET_LAND_S + 0.1 },
} as const;

/** 02: five textile swatches with pinked edges, lying on the sheet in spectrum order. */
export const SWATCH_SIZE = { width: 0.1, length: 0.14, thickness: 0.0035, pinkDepth: 0.005, pinkPitch: 0.009 } as const;
const SWATCH_ROW = { x: 0.0, pitch: 0.114, s: SHEET_LAND_S + 0.5 } as const;
export const SWATCHES = [
  { name: 'crimson', colour: '#A3243A', ds: 0.004, turnDeg: -3 },
  { name: 'amber', colour: '#D4892A', ds: -0.006, turnDeg: 2 },
  { name: 'green', colour: '#3C7D4B', ds: 0.003, turnDeg: -1.5 },
  { name: 'blue', colour: '#2B6CA3', ds: -0.004, turnDeg: 2.5 },
  { name: 'violet', colour: '#5B3F8C', ds: 0.006, turnDeg: -2 },
].map((swatch, index) => ({ ...swatch, x: round(SWATCH_ROW.x + index * SWATCH_ROW.pitch), s: SWATCH_ROW.s + swatch.ds }));

/**
 * 03: the tear the tensile test runs into the sheet's near edge. Its progress is `run`, from 0 (the sheet whole) to 1
 * (torn as far as it goes): the tear runs in from the edge along one fixed path, its gap widening and its two sides
 * pulled further apart as it goes.
 */
export const TEAR = {
  s: SHEET_LAND_S + 0.9,
  /** How far in from the edge the tear runs. */
  depth: 0.17,
  /** The gap at the edge once torn, closing to nothing at the tear's tip. */
  opening: 0.05,
  /** How far each side is pulled back from the tear at the edge, once torn. */
  spread: 0.03,
  /** How far the far side lifts at the edge, once torn. */
  lift: 0.022,
} as const;

/** The tear's line across the sheet: it runs a little askew as it goes in from the edge. */
export function tearLine(x: number): number {
  return TEAR.s + 0.015 * ((x - EDGE_X) / TEAR.depth);
}

/** How far in from the edge the tear has run. */
export function tearLength(run: number): number {
  return TEAR.depth * clamp01(run);
}

/**
 * Half the tear's gap at x, before its sides are pulled apart, with a ragged edge: torn through by default, and at
 * any run never wider than that.
 */
export function tearHalfOpening(x: number, run = 1): number {
  const length = tearLength(run);
  if (length <= 0) return 0;
  const t = (x - EDGE_X) / length;
  if (t < 0 || t >= 1) return 0;
  const ragged = 0.0022 * Math.sin(x * 397 + 1.3) * Math.sin(x * 113 + 0.2);
  return Math.max(0, clamp01(run) ** 0.7 * ((TEAR.opening / 2) * (1 - t) ** 1.4 + ragged * (1 - t)));
}

/**
 * Moves a sample of the sheet lying within `reach` of the torn-through gap onto the gap's edge, so the torn edge
 * follows the tear's ragged line rather than the sampling grid's steps.
 */
export function snapToTear(x: number, s: number, reach: number): number {
  const half = tearHalfOpening(x);
  if (half <= 0) return s;
  const line = tearLine(x);
  const offset = s - line;
  if (Math.abs(offset) >= half + reach) return s;
  return line + (offset < 0 ? -half : half);
}

/** Whether a point of the sheet's parameter space falls in the torn-through gap. */
export function insideTear(x: number, s: number): boolean {
  return x >= EDGE_X - 1e-9 && x < EDGE_X + TEAR.depth && Math.abs(s - tearLine(x)) < tearHalfOpening(x);
}

/**
 * Where a sample of the sheet lies along it at `run`. A sample on the torn-through gap's edge (see `snapToTear`)
 * follows the gap as it opens, and lies on the tear's line where the tear has not reached, so both edges meet there
 * and the sheet is whole. Every other sample stays where it is.
 */
export function tornPosition(x: number, s: number, run: number): number {
  const full = tearHalfOpening(x);
  const line = tearLine(x);
  const along = s - line;
  if (full <= 0 || Math.abs(along) > full + 1e-7) return s;
  return line + Math.sign(along) * Math.min(full, tearHalfOpening(x, run));
}

/** Whether the tear moves the sheet at (x, s) at some run: in from the edge as far as it goes, and near its line. */
export function nearTear(x: number, s: number): boolean {
  return x - EDGE_X < TEAR.depth && Math.abs(s - tearLine(x)) < 0.25;
}

/**
 * How the sheet near the tear is pulled apart at `run` (torn through by default): along the sheet away from the tear,
 * and the far side lifted, most at the edge and not at all beyond the tear's tip.
 */
export function tearOffset(x: number, s: number, run = 1): { ds: number; dy: number } {
  const length = tearLength(run);
  if (length <= 0 || x - EDGE_X >= length) return { ds: 0, dy: 0 };
  const along = s - tearLine(x);
  const weight = (1 - Math.max(0, x - EDGE_X) / length) ** 2 * Math.exp(-((along / 0.06) ** 2));
  const pull = clamp01(run);
  return { ds: Math.sign(along) * TEAR.spread * pull * weight, dy: along > 0 ? TEAR.lift * pull * weight : 0 };
}

/** The folds' shape at (x, s), from 0 on the ground to 1 at a crest. */
function foldShape(x: number, s: number): number {
  const phase = (2 * Math.PI * (s - SHEET_LAND_S)) / SHEET.folds.wavelength + 0.9 * Math.sin(1.7 * x + 0.5);
  return 0.5 * (1 - Math.cos(phase));
}

/**
 * Elliptical zones around the inspection elements where the sheet's folds die away, so the elements lie on it cleanly.
 * Under the tag and the swatches the sheet settles onto the ground; around the tear, which leaves open fabric in view,
 * it holds the folds' height at the tear, since settling there would press a visible dent into the sheet.
 */
const QUIET_ZONES = [
  { x: TAG.x - 0.05, s: TAG.s - 0.03, rx: 0.23, rs: 0.18, level: 0 },
  { x: SWATCH_ROW.x + 2 * SWATCH_ROW.pitch, s: SWATCH_ROW.s, rx: 0.42, rs: 0.16, level: 0 },
  { x: EDGE_X + TEAR.depth / 2, s: TEAR.s, rx: 0.22, rs: 0.13, level: foldShape(EDGE_X + TEAR.depth / 2, TEAR.s) },
] as const;

/** How much the sheet lifts off the ground at (x, s): soft folds skewed across the width, calm around the elements. */
export function foldLift(x: number, s: number): number {
  const along = s - SHEET_LAND_S;
  if (along <= 0) return 0;
  const settle = smoothstep(along / 0.18);
  let shape = foldShape(x, s);
  for (const zone of QUIET_ZONES) {
    const distance = Math.hypot((x - zone.x) / zone.rx, (s - zone.s) / zone.rs);
    shape = zone.level + (shape - zone.level) * smoothstep((distance - 0.9) / 0.6);
  }
  return SHEET.folds.height * settle * shape;
}

/** How much the free end curls up at (x, s). */
export function curlLift(x: number, s: number): number {
  const end = sheetLength(x);
  return SHEET.curl.height * smoothstep((s - (end - SHEET.curl.length)) / SHEET.curl.length) ** 2;
}

/**
 * A point of the sheet: its mid-surface at `side` 0, its top face at 1 and its underside at -1, with the folds, the
 * curl and the tear's pull at `run` (whole by default, see `tearOffset`) applied.
 */
export function sheetPoint(x: number, s: number, side: -1 | 0 | 1 = 0, run = 0): Vec3 {
  const pull = tearOffset(x, s, run);
  const centre = sheetCentre(s + pull.ds);
  // The centreline's normal in the (z, y) plane, facing up and away from the roll.
  const nz = -centre.ty;
  const ny = centre.tz;
  const lift = foldLift(x, s) + curlLift(x, s) + pull.dy + (side * sheetThickness(s)) / 2;
  return [x, centre.y + lift * ny, centre.z + lift * nz];
}

/** An orthonormal frame on the sheet's top face at (x, s): across the sheet, along it, and its normal. */
export function sheetFrame(x: number, s: number): { origin: Vec3; across: Vec3; along: Vec3; normal: Vec3 } {
  const e = 0.004;
  const origin = sheetPoint(x, s, 1);
  const a = sheetPoint(x + e, s, 1);
  const b = sheetPoint(x - e, s, 1);
  const c = sheetPoint(x, s + e, 1);
  const d = sheetPoint(x, s - e, 1);
  const unit = (v: Vec3): Vec3 => {
    const length = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / length, v[1] / length, v[2] / length];
  };
  const across = unit([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);
  const rawAlong = unit([c[0] - d[0], c[1] - d[1], c[2] - d[2]]);
  const normal = unit([
    rawAlong[1] * across[2] - rawAlong[2] * across[1],
    rawAlong[2] * across[0] - rawAlong[0] * across[2],
    rawAlong[0] * across[1] - rawAlong[1] * across[0],
  ]);
  const along = unit([
    across[1] * normal[2] - across[2] * normal[1],
    across[2] * normal[0] - across[0] * normal[2],
    across[0] * normal[1] - across[1] * normal[0],
  ]);
  return { origin, across, along, normal };
}

export interface Fibre {
  /** A thread standing out of a torn side, one half of a thread across the gap, or a thread trailing off the edge. */
  readonly kind: 'edge' | 'bridge' | 'trailing';
  readonly points: readonly Vec3[];
  /** Zero until the tear reaches the thread. */
  readonly radius: number;
}

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type FibreSpec =
  | { kind: 'edge'; x: number; side: -1 | 1; share: number; tipDx: number; up: number; radius: number }
  | { kind: 'bridge'; x: number; dx: number; sag: number; radius: number; snapGap: number }
  | { kind: 'trailing'; side: -1 | 1; extra: number; length: number; drift: number; radius: number };

/** The tear's threads, drawn once from a fixed seed so they are the same every time and at every run. */
const FIBRE_SPECS: readonly FibreSpec[] = (() => {
  const next = random(20260914);
  const specs: FibreSpec[] = [];
  for (const side of [-1, 1] as const) {
    for (let k = 0; k < 26; k += 1) {
      const x = EDGE_X + 0.003 + ((k + next() * 0.8) / 26) * TEAR.depth * 0.9;
      const spec = { kind: 'edge', x, side, share: 0.5 + next() * 0.9, tipDx: (next() - 0.5) * 0.008, up: 0.0015 + next() * 0.004, radius: 0.0011 + next() * 0.0007 } as const;
      if (tearHalfOpening(x) >= 0.0015) specs.push(spec);
    }
  }
  for (let k = 0; k < 9; k += 1) {
    const x = EDGE_X + TEAR.depth * (0.25 + next() * 0.55);
    specs.push({ kind: 'bridge', x, dx: (next() - 0.5) * 0.006, sag: 0.0008 + next() * 0.0015, radius: 0.0009 + next() * 0.0004, snapGap: 0.008 + next() * 0.02 });
  }
  for (let k = 0; k < 6; k += 1) {
    specs.push({ kind: 'trailing', side: k < 3 ? -1 : 1, extra: 0.002 + next() * 0.014, length: 0.014 + next() * 0.018, drift: (next() - 0.5) * 0.02, radius: 0.001 + next() * 0.0005 });
  }
  return specs;
})();

/**
 * The tear's loose fibres at `run`: short threads standing out of both torn sides into the gap, threads across the gap
 * near its tip that hold until it has opened enough and then snap back to their own sides, and a few longer threads
 * trailing off the edge. Each grows in as the tear reaches it, so none shows on the whole sheet. Every run gives the
 * same fibres with the same point counts.
 */
export function tearFibres(run: number): Fibre[] {
  const at = (x: number, s: number): Vec3 => sheetPoint(x, s, 0, run);
  const toward = (from: Vec3, to: Vec3, t: number, rise: number): Vec3 => [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t + rise,
    from[2] + (to[2] - from[2]) * t,
  ];
  const grown = (base: Vec3, points: readonly Vec3[], grow: number): Vec3[] => points.map((point) => toward(base, point, grow, 0));
  const fibres: Fibre[] = [];
  for (const spec of FIBRE_SPECS) {
    if (spec.kind === 'edge') {
      const line = tearLine(spec.x);
      const half = tearHalfOpening(spec.x, run);
      const near = at(spec.x, line - half);
      const far = at(spec.x, line + half);
      const base = spec.side < 0 ? near : far;
      // Out into the gap, some far enough to cross the other side's threads, none to the other edge.
      const reach = (spec.share * (far[2] - near[2])) / 2;
      const tip: Vec3 = [base[0] + spec.tipDx, base[1], base[2] - spec.side * reach];
      const grow = smoothstep((half - 0.0008) / 0.002);
      const points = [base, toward(base, tip, 0.45, spec.up * 0.7), toward(tip, tip, 0, spec.up)];
      fibres.push({ kind: 'edge', points: grown(base, points, grow), radius: spec.radius * grow });
    } else if (spec.kind === 'bridge') {
      const line = tearLine(spec.x);
      const half = tearHalfOpening(spec.x, run);
      const a = at(spec.x, line - half);
      const b = at(spec.x + spec.dx, line + half);
      const grow = smoothstep((half - 0.0005) / 0.0015);
      const snap = smoothstep((b[2] - a[2] - spec.snapGap) / 0.004);
      const middle: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - spec.sag, (a[2] + b[2]) / 2];
      for (const end of [a, b]) {
        // Taut to the middle of the gap until it breaks; then each half springs back toward its own side and droops.
        const tip = toward(end, middle, 1 - 0.55 * snap, -0.002 * snap);
        const bend = toward(end, tip, 0.5, -spec.sag * 0.25 + 0.0015 * snap);
        fibres.push({ kind: 'bridge', points: grown(end, [end, bend, tip], grow), radius: spec.radius * grow });
      }
    } else {
      const s = tearLine(EDGE_X) + spec.side * (tearHalfOpening(EDGE_X, run) + spec.extra);
      const base = at(EDGE_X, s);
      const grow = smoothstep(clamp01(run) / 0.3);
      // They droop off the edge and come to rest on the ground.
      const points: Vec3[] = [base, [base[0] - spec.length * 0.45, base[1] * 0.75 + 0.001, base[2] + spec.drift * 0.4], [base[0] - spec.length, 0.0012, base[2] + spec.drift]];
      fibres.push({ kind: 'trailing', points: grown(base, points, grow), radius: spec.radius * grow });
    }
  }
  return fibres;
}

/** The three inspection elements as separate, clickable areas: a centre and a radius each, clear of one another. */
export const INSPECTION_AREAS = [
  { id: 'oeko-tex', protocol: 0, centre: sheetPoint(TAG.x - 0.04, TAG.s - 0.015, 1), radius: 0.15 },
  { id: 'colour-fastness', protocol: 1, centre: sheetPoint(SWATCH_ROW.x + 2 * SWATCH_ROW.pitch, SWATCH_ROW.s, 1), radius: 0.33 },
  { id: 'tear-test', protocol: 2, centre: sheetPoint(EDGE_X + TEAR.depth / 2, TEAR.s, 1), radius: 0.13 },
] as const;

/** The three-quarter camera: from the roll's near end, above and in front, looking down the sheet. */
export const TEXTILES_VIEW = { azimuthDeg: -38, elevationDeg: 24, fovDeg: 28 } as const;
