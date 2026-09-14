/**
 * Scene model for the trade-network drawing in the homepage section
 * "A measured approach to worldwide supply".
 *
 * Plain numbers only — no Three.js, no DOM — so a single description drives
 * three things that have to agree with each other: the WebGL scene, the
 * server-rendered SVG that stands in before (or instead of) WebGL, and the
 * unit tests.
 *
 * The drawing is an axonometric schematic of the route the section describes,
 * not a map. Three supplier lanes leave factory stacks in South & East China,
 * pass one inspection gate at the Hong Kong consolidation hub, and continue as
 * a single freight lane into a North American warehouse. An elevated line
 * above the route carries the information that runs the other way: orders back
 * toward the factories, and inspection sign-offs rising from the gate.
 */

export type Vec3 = readonly [number, number, number];
export type Segment = readonly [Vec3, Vec3];
export type Layout = 'wide' | 'compact';
export type Tone = 'structure' | 'accent';
export type StationId = 'origin' | 'consolidation' | 'destination';
export type UnitSystemId = 'feeder' | 'freight' | 'orders' | 'signoff';

export interface Lane {
  readonly points: readonly Vec3[];
  readonly length: number;
}

export interface Station {
  readonly id: StationId;
  /** Index of the matching route step in the section (01, 02, 03). */
  readonly step: 0 | 1 | 2;
  /** Hairline structure: floor frame, stacks or gate, and the datum mast. */
  readonly segments: readonly Segment[];
}

export interface ViewBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly width: number;
  readonly height: number;
}

export interface TradeNetworkModel {
  readonly layout: Layout;
  /** The look-at point; every projected coordinate is relative to it. */
  readonly center: Vec3;
  readonly stations: readonly Station[];
  /** Lane lines drawn on the floor. */
  readonly floorGuides: readonly Segment[];
  /** The elevated information line and the sign-off riser. */
  readonly infoGuides: readonly Segment[];
  readonly lanes: {
    readonly feeder: readonly Lane[];
    readonly freight: Lane;
    readonly orders: Lane;
    readonly signoff: Lane;
  };
  /** Projected bounds of every drawn point, padded, in view units. */
  readonly view: ViewBounds;
}

export interface UnitSystem {
  readonly id: UnitSystemId;
  readonly tone: Tone;
  readonly perLane: number;
  readonly size: Vec3;
  /** World units per second along the lane. */
  readonly speed: number;
}

export interface UnitInstance {
  readonly position: Vec3;
  readonly scale: Vec3;
}

export interface UnitGroup {
  readonly system: UnitSystem;
  readonly instances: readonly UnitInstance[];
}

export interface Hsl {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

export interface SvgDrawing {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly stations: readonly string[];
  readonly floorGuides: string;
  readonly infoGuides: string;
  readonly structureUnits: string;
  readonly accentUnits: string;
}

/** Direction from the look-at point toward the camera: a shallow dimetric view. */
export const CAMERA_DIRECTION: Vec3 = [0.25, 0.7, 1];

/** Height of the information line above the floor. */
export const INFO_HEIGHT = 5.2;

/** Scene time used for the reduced-motion frame and for the SVG fallback. */
export const STATIC_TIME = 4.6;

/** Line and fill opacities, shared so the SVG fallback matches the WebGL frame. */
export const OPACITY = {
  guide: 0.45,
  station: 0.6,
  stationDim: 0.2,
  info: 0.75,
  goods: 0.9,
} as const;

export const UNIT_SYSTEMS: readonly UnitSystem[] = [
  { id: 'feeder', tone: 'structure', perLane: 3, size: [0.5, 0.3, 0.6], speed: 0.9 },
  { id: 'freight', tone: 'structure', perLane: 3, size: [1.0, 0.5, 0.8], speed: 0.75 },
  { id: 'orders', tone: 'accent', perLane: 4, size: [0.3, 0.06, 0.06], speed: 1.3 },
  { id: 'signoff', tone: 'accent', perLane: 2, size: [0.06, 0.3, 0.06], speed: 0.8 },
];

const LAYOUTS: Record<Layout, { readonly spacing: number; readonly floorWidth: number; readonly floorDepth: number }> = {
  wide: { spacing: 10, floorWidth: 6, floorDepth: 7 },
  compact: { spacing: 5.4, floorWidth: 4.2, floorDepth: 7 },
};

// ─── vector helpers ─────────────────────────────────────────────────────────

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const magnitude = (a: Vec3): number => Math.sqrt(dot(a, a));
const normalize = (a: Vec3): Vec3 => {
  const m = magnitude(a);
  return [a[0] / m, a[1] / m, a[2] / m];
};

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
const wrap01 = (n: number): number => ((n % 1) + 1) % 1;
const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

// ─── projection ─────────────────────────────────────────────────────────────

/**
 * The camera's screen axes, built the way Object3D.lookAt builds them with a
 * world-up of +Y, so a point projected here lands where Three.js draws it.
 */
export function cameraBasis(): { readonly x: Vec3; readonly y: Vec3; readonly z: Vec3 } {
  const z = normalize(CAMERA_DIRECTION);
  const x = normalize(cross([0, 1, 0], z));
  const y = cross(z, x);
  return { x, y, z };
}

const BASIS = cameraBasis();

/** Orthographic projection of a world point to view coordinates (y up). */
export function project(point: Vec3, center: Vec3): [number, number] {
  const d = sub(point, center);
  return [dot(d, BASIS.x), dot(d, BASIS.y)];
}

// ─── geometry builders ──────────────────────────────────────────────────────

function boxEdges([cx, cy, cz]: Vec3, [w, h, d]: Vec3): Segment[] {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  return [
    [[x0, y0, z0], [x1, y0, z0]],
    [[x1, y0, z0], [x1, y0, z1]],
    [[x1, y0, z1], [x0, y0, z1]],
    [[x0, y0, z1], [x0, y0, z0]],
    [[x0, y1, z0], [x1, y1, z0]],
    [[x1, y1, z0], [x1, y1, z1]],
    [[x1, y1, z1], [x0, y1, z1]],
    [[x0, y1, z1], [x0, y1, z0]],
    [[x0, y0, z0], [x0, y1, z0]],
    [[x1, y0, z0], [x1, y1, z0]],
    [[x1, y0, z1], [x1, y1, z1]],
    [[x0, y0, z1], [x0, y1, z1]],
  ];
}

function floorFrame(cx: number, width: number, depth: number): Segment[] {
  const x0 = cx - width / 2;
  const x1 = cx + width / 2;
  const z0 = -depth / 2;
  const z1 = depth / 2;
  return [
    [[x0, 0, z0], [x1, 0, z0]],
    [[x1, 0, z0], [x1, 0, z1]],
    [[x1, 0, z1], [x0, 0, z1]],
    [[x0, 0, z1], [x0, 0, z0]],
  ];
}

/** A datum mast from the floor to the information line, with a short cap. */
function mast(x: number, z: number, height: number): Segment[] {
  return [
    [[x, 0, z], [x, height, z]],
    [[x, height, z], [x, height, z + 0.5]],
  ];
}

function laneOf(points: readonly Vec3[]): Lane {
  const deduped: Vec3[] = [];
  for (const p of points) {
    const last = deduped[deduped.length - 1];
    if (!last || magnitude(sub(p, last)) > 1e-9) deduped.push(p);
  }
  let length = 0;
  for (let i = 1; i < deduped.length; i++) length += magnitude(sub(deduped[i]!, deduped[i - 1]!));
  return { points: deduped, length };
}

function laneSegments(lane: Lane): Segment[] {
  const out: Segment[] = [];
  for (let i = 1; i < lane.points.length; i++) out.push([lane.points[i - 1]!, lane.points[i]!]);
  return out;
}

/** Position at fraction `u` of a lane's arc length. */
export function pointOnLane(lane: Lane, u: number): Vec3 {
  const first = lane.points[0]!;
  const last = lane.points[lane.points.length - 1]!;
  if (u <= 0 || lane.length === 0) return first;
  let target = clamp01(u) * lane.length;
  for (let i = 1; i < lane.points.length; i++) {
    const a = lane.points[i - 1]!;
    const b = lane.points[i]!;
    const segmentLength = magnitude(sub(b, a));
    if (target > segmentLength) {
      target -= segmentLength;
      continue;
    }
    const t = segmentLength === 0 ? 0 : target / segmentLength;
    if (t <= 0) return a;
    if (t >= 1) return b;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  return last;
}

// ─── composition ────────────────────────────────────────────────────────────

export function buildModel(layout: Layout): TradeNetworkModel {
  const { spacing, floorWidth: W, floorDepth: D } = LAYOUTS[layout];
  const H = INFO_HEIGHT;
  const back = -D / 2 + 0.3;
  const originX = -spacing;
  const consolidationX = 0;
  const destinationX = spacing;

  // Origin — three factory stacks, one per supplier lane.
  const laneZ = [-2.2, 0, 2.2] as const;
  const stackX = originX - W / 2 + 1.0;
  const stackHeights = [2, 3, 2] as const;
  const crate: Vec3 = [0.9, 0.45, 1.1];
  const origin: Segment[] = [...floorFrame(originX, W, D)];
  laneZ.forEach((z, k) => {
    for (let i = 0; i < stackHeights[k]; i++) {
      origin.push(...boxEdges([stackX, crate[1] / 2 + i * crate[1], z], crate));
    }
  });
  origin.push(...mast(originX - W / 2 + 0.3, back, H));

  // Consolidation — one inspection gate every lane passes through, then one
  // consolidated block.
  const gateX = consolidationX - W / 2 + 0.9;
  const gateHalf = 3.0;
  const gateHeight = 2.4;
  const consolidation: Segment[] = [...floorFrame(consolidationX, W, D)];
  for (const z of [-gateHalf, -1.1, 1.1, gateHalf]) {
    consolidation.push([[gateX, 0, z], [gateX, gateHeight, z]]);
  }
  consolidation.push([[gateX, gateHeight, -gateHalf], [gateX, gateHeight, gateHalf]]);
  const block: Vec3 = [1.4, 0.7, 2.6];
  const blockX = gateX + 1.9;
  for (let i = 0; i < 2; i++) {
    consolidation.push(...boxEdges([blockX, block[1] / 2 + i * block[1], 0], block));
  }
  consolidation.push(...mast(consolidationX - W / 2 + 0.3, back, H));

  // Destination — a warehouse frame with pallets inside.
  const houseX = destinationX + 0.3;
  const house: Vec3 = [W - 1.6, 2.2, 4.4];
  const pallet: Vec3 = [0.8, 0.4, 0.9];
  const destination: Segment[] = [
    ...floorFrame(destinationX, W, D),
    ...boxEdges([houseX, house[1] / 2, 0.6], house),
    ...boxEdges([houseX - house[0] / 4, pallet[1] / 2, 0.2], pallet),
    ...boxEdges([houseX + house[0] / 4, pallet[1] / 2, 1.2], pallet),
    ...mast(destinationX - W / 2 + 0.3, back, H),
  ];

  const feeder = laneZ.map((z) => laneOf([[stackX + crate[0] / 2 + 0.25, 0, z], [gateX + 0.7, 0, z]]));
  const jogX = (blockX + destinationX) / 2;
  const freight = laneOf([
    [blockX + block[0] / 2 + 0.3, 0, 0],
    [jogX, 0, 0],
    [jogX, 0, 1.2],
    [houseX - house[0] / 2 + 0.4, 0, 1.2],
  ]);
  const orders = laneOf([
    [destinationX - W / 2 + 0.3, H, back],
    [originX - W / 2 + 0.3, H, back],
  ]);
  const signoff = laneOf([
    [gateX, gateHeight, 0],
    [gateX, H, 0],
    [gateX, H, back],
  ]);

  const stations: Station[] = [
    { id: 'origin', step: 0, segments: origin },
    { id: 'consolidation', step: 1, segments: consolidation },
    { id: 'destination', step: 2, segments: destination },
  ];
  const floorGuides = [...feeder.flatMap(laneSegments), ...laneSegments(freight)];
  const infoGuides = [...laneSegments(orders), ...laneSegments(signoff)];
  const center: Vec3 = [0, 1.6, 0];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const segment of [...stations.flatMap((s) => s.segments), ...floorGuides, ...infoGuides]) {
    for (const point of segment) {
      const [x, y] = project(point, center);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const padX = (maxX - minX) * 0.04 + 0.6;
  const padY = (maxY - minY) * 0.04 + 0.6;
  minX -= padX;
  maxX += padX;
  minY -= padY;
  maxY += padY;

  return {
    layout,
    center,
    stations,
    floorGuides,
    infoGuides,
    lanes: { feeder, freight, orders, signoff },
    view: { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY },
  };
}

// ─── motion ─────────────────────────────────────────────────────────────────

/** 0 at a lane's ends, 1 through its middle — units grow in and out, never pop. */
export function envelope(u: number): number {
  return smoothstep(0, 0.08, u) * (1 - smoothstep(0.92, 1, u));
}

function lanesFor(model: TradeNetworkModel, id: UnitSystemId): readonly Lane[] {
  switch (id) {
    case 'feeder':
      return model.lanes.feeder;
    case 'freight':
      return [model.lanes.freight];
    case 'orders':
      return [model.lanes.orders];
    case 'signoff':
      return [model.lanes.signoff];
  }
}

/**
 * Every moving unit's position and scale at `time` seconds. Deterministic, and
 * periodic per lane with period `lane.length / system.speed`.
 */
export function unitStates(model: TradeNetworkModel, time: number): UnitGroup[] {
  return UNIT_SYSTEMS.map((system) => {
    const lanes = lanesFor(model, system.id);
    const instances: UnitInstance[] = [];
    lanes.forEach((lane, laneIndex) => {
      for (let i = 0; i < system.perLane; i++) {
        const offset = (i + laneIndex / lanes.length) / system.perLane;
        const u = wrap01((system.speed * time) / lane.length + offset);
        const point = pointOnLane(lane, u);
        const grow = envelope(u);
        const lift = system.tone === 'structure' ? system.size[1] / 2 : 0;
        instances.push({
          position: [point[0], point[1] + lift, point[2]],
          scale: [system.size[0] * grow, system.size[1] * grow, system.size[2] * grow],
        });
      }
    });
    return { system, instances };
  });
}

// ─── design-token colours ───────────────────────────────────────────────────

/** Reads the space-separated HSL triplets globals.css stores, e.g. "39 72% 33%". */
export function parseHslTriplet(value: string): Hsl | null {
  const match = value.trim().match(/^(-?\d*\.?\d+)\s+(\d*\.?\d+)%\s+(\d*\.?\d+)%$/);
  if (!match) return null;
  return { h: Number(match[1]), s: Number(match[2]) / 100, l: Number(match[3]) / 100 };
}

/** HSL to sRGB channels in 0–1. */
export function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  return [rgb[0] + m, rgb[1] + m, rgb[2] + m];
}

// ─── SVG fallback ───────────────────────────────────────────────────────────

const round = (n: number): string => {
  const v = Math.round(n * 100) / 100;
  return Object.is(v, -0) ? '0' : String(v);
};

function pathFor(segments: readonly Segment[], center: Vec3): string {
  let d = '';
  for (const [a, b] of segments) {
    const [ax, ay] = project(a, center);
    const [bx, by] = project(b, center);
    d += `M${round(ax)} ${round(-ay)}L${round(bx)} ${round(-by)}`;
  }
  return d;
}

type Point2 = readonly [number, number];

/** Convex hull by Andrew's monotone chain; collinear points are dropped. */
function convexHull(points: readonly Point2[]): Point2[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o: Point2, a: Point2, b: Point2): number =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (input: readonly Point2[]): Point2[] => {
    const out: Point2[] = [];
    for (const point of input) {
      while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, point) <= 1e-9) out.pop();
      out.push(point);
    }
    out.pop();
    return out;
  };
  return [...chain(sorted), ...chain([...sorted].reverse())];
}

/**
 * Moving units as filled silhouettes: the outline an orthographic box casts,
 * which is what the WebGL scene shows for its solid units. One polygon of four
 * to six corners per unit, instead of twelve stroked edges.
 */
function silhouettesFor(units: readonly UnitInstance[], center: Vec3): string {
  let d = '';
  for (const { position, scale } of units) {
    const corners: Point2[] = [];
    for (const sx of [-0.5, 0.5]) {
      for (const sy of [-0.5, 0.5]) {
        for (const sz of [-0.5, 0.5]) {
          const [x, y] = project(
            [position[0] + sx * scale[0], position[1] + sy * scale[1], position[2] + sz * scale[2]],
            center,
          );
          corners.push([x, -y]);
        }
      }
    }
    d += 'M' + convexHull(corners).map(([x, y]) => round(x) + ' ' + round(y)).join('L') + 'Z';
  }
  return d;
}

/**
 * The same scene as a static line drawing, frozen at `time`. Server-rendered as
 * the placeholder, and kept as the fallback wherever WebGL doesn't run.
 */
export function svgDrawing(model: TradeNetworkModel, time: number = STATIC_TIME): SvgDrawing {
  const groups = unitStates(model, time);
  const unitsOf = (tone: Tone): UnitInstance[] =>
    groups
      .filter((group) => group.system.tone === tone)
      .flatMap((group) => group.instances.filter((unit) => unit.scale[0] > 0.02));
  const { minX, maxY, width, height } = model.view;
  return {
    viewBox: `${round(minX)} ${round(-maxY)} ${round(width)} ${round(height)}`,
    width,
    height,
    stations: model.stations.map((station) => pathFor(station.segments, model.center)),
    floorGuides: pathFor(model.floorGuides, model.center),
    infoGuides: pathFor(model.infoGuides, model.center),
    structureUnits: silhouettesFor(unitsOf('structure'), model.center),
    accentUnits: silhouettesFor(unitsOf('accent'), model.center),
  };
}
