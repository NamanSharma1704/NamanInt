/**
 * The shared geometry vocabulary of the Categories inspection drawings: flat outlines extruded into
 * prisms, lathed profiles and rods, each optionally carried by a rigid frame, plus the arithmetic of
 * the scroll sequence that walks a visitor through each drawing's inspection points.
 *
 * Pure data and arithmetic with no Three.js or DOM, so the WebGL scene, the page and the tests share
 * it. Units are each drawing's own relative units, +Y is up and +Z faces the viewer.
 */

export type Vec3 = readonly [number, number, number];
export type Point2 = readonly [number, number];

/** A rigid placement: Euler XYZ rotation in radians (Three.js's default order), then a translation. */
export interface Frame {
  readonly position: Vec3;
  readonly rotation: Vec3;
}

interface SolidBase {
  readonly id: string;
  /** Parts of a tilted or moving body share its frame; without one a solid sits in model space. */
  readonly frame?: Frame;
  /**
   * `ground` (the default) fills the solid with the page ground so it hides the edges behind it;
   * `line` fills it with the line colour, for printed marks too thin to read as outlines.
   */
  readonly fill?: 'ground' | 'line';
}

/** A flat outline in plan view, as (x, z), extruded upward from `y` by `height`. */
export interface PlanPrism extends SolidBase {
  readonly kind: 'plan-prism';
  readonly outline: readonly Point2[];
  readonly holes: readonly (readonly Point2[])[];
  readonly y: number;
  readonly height: number;
}

/** A flat outline in front view, as (x, y), extruded from `z` toward the viewer by `depth`. */
export interface FrontPrism extends SolidBase {
  readonly kind: 'front-prism';
  readonly outline: readonly Point2[];
  readonly z: number;
  readonly depth: number;
}

/** A flat outline in side view, as (z, y), extruded from `x` toward +X by `width`. */
export interface SidePrism extends SolidBase {
  readonly kind: 'side-prism';
  readonly outline: readonly Point2[];
  readonly holes: readonly (readonly Point2[])[];
  readonly x: number;
  readonly width: number;
}

/** A closed profile of (radius, z) revolved about the Z-parallel axis through (x, y). */
export interface ZLathe extends SolidBase {
  readonly kind: 'z-lathe';
  readonly profile: readonly Point2[];
  readonly x: number;
  readonly y: number;
}

/** A solid cylinder between two points. */
export interface Rod extends SolidBase {
  readonly kind: 'rod';
  readonly start: Vec3;
  readonly end: Vec3;
  readonly radius: number;
}

export type Solid = PlanPrism | FrontPrism | SidePrism | ZLathe | Rod;

export interface InspectionMarker {
  /** Index into the category's inspection protocols, which is also its step in the sequence. */
  readonly protocol: number;
  /** Where on the part the protocol applies, in plain words for the accessible description. */
  readonly place: string;
  readonly anchor: Vec3;
  /** Set when the anchor belongs to a framed body, so the marker follows that body. */
  readonly frame?: Frame;
}

export interface Bounds {
  readonly min: Vec3;
  readonly max: Vec3;
}

export interface InspectionDrawing {
  readonly solids: readonly Solid[];
  readonly markers: readonly InspectionMarker[];
  /** The camera, in degrees: azimuth turns toward +X, elevation looks down. */
  readonly view: { readonly azimuthDeg: number; readonly elevationDeg: number };
  /**
   * The scroll sequence, one step per protocol in order: the drawing's turn about the vertical axis at
   * the middle of each step, and a slow idle sway on top of it while the drawing is on screen.
   */
  readonly sequence: {
    readonly stepYawDeg: readonly number[];
    readonly idleSwayDeg: number;
    readonly idlePeriodSeconds: number;
  };
  /** Points outside the solids that the animation reaches (a part lifted before a drop), so the framing includes them. */
  readonly framingPoints?: readonly Vec3[];
  /** Solids whose edges turn accent while their protocol is highlighted. */
  readonly protocolParts: Readonly<Record<number, readonly string[]>>;
}

export const round = (value: number): number => Math.round(value * 10000) / 10000;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

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

export const rect = (a0: number, a1: number, b0: number, b1: number): Point2[] => [
  [a0, b0],
  [a1, b0],
  [a1, b1],
  [a0, b1],
];

/** The rotation matrix of an Euler XYZ triple, matching Three.js's `Matrix4.makeRotationFromEuler`. */
export function eulerMatrix([x, y, z]: Vec3): [Vec3, Vec3, Vec3] {
  const a = Math.cos(x);
  const b = Math.sin(x);
  const c = Math.cos(y);
  const d = Math.sin(y);
  const e = Math.cos(z);
  const f = Math.sin(z);
  return [
    [c * e, -c * f, d],
    [a * f + b * e * d, a * e - b * f * d, -b * c],
    [b * f - a * e * d, b * e + a * f * d, a * c],
  ];
}

export function applyFrame(point: Vec3, frame: Frame): Vec3 {
  const m = eulerMatrix(frame.rotation);
  return [
    m[0][0] * point[0] + m[0][1] * point[1] + m[0][2] * point[2] + frame.position[0],
    m[1][0] * point[0] + m[1][1] * point[1] + m[1][2] * point[2] + frame.position[1],
    m[2][0] * point[0] + m[2][1] * point[1] + m[2][2] * point[2] + frame.position[2],
  ];
}

/** Points whose convex hull contains the solid, in its own space (before any frame). */
function hullPoints(solid: Solid): Vec3[] {
  switch (solid.kind) {
    case 'plan-prism':
      return solid.outline.flatMap(([x, z]): Vec3[] => [
        [x, solid.y, z],
        [x, solid.y + solid.height, z],
      ]);
    case 'front-prism':
      return solid.outline.flatMap(([x, y]): Vec3[] => [
        [x, y, solid.z],
        [x, y, solid.z + solid.depth],
      ]);
    case 'side-prism':
      return solid.outline.flatMap(([z, y]): Vec3[] => [
        [solid.x, y, z],
        [solid.x + solid.width, y, z],
      ]);
    case 'z-lathe':
      return solid.profile.flatMap(([radius, z]): Vec3[] => [
        [solid.x - radius, solid.y - radius, z],
        [solid.x + radius, solid.y + radius, z],
      ]);
    case 'rod':
      return [solid.start, solid.end].flatMap((point): Vec3[] => [
        [point[0] - solid.radius, point[1] - solid.radius, point[2] - solid.radius],
        [point[0] + solid.radius, point[1] + solid.radius, point[2] + solid.radius],
      ]);
  }
}

/** Points whose convex hull contains every solid, in model space (frames applied), plus any extra points. */
export function modelHullPoints(solids: readonly Solid[], extraPoints: readonly Vec3[] = []): Vec3[] {
  const points: Vec3[] = [];
  for (const solid of solids) {
    for (const local of hullPoints(solid)) points.push(solid.frame ? applyFrame(local, solid.frame) : local);
  }
  return [...points, ...extraPoints];
}

/** Axis-aligned bounds of every solid in model space, plus any extra points, for framing the camera. */
export function solidBounds(solids: readonly Solid[], extraPoints: readonly Vec3[] = []): Bounds {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const point of modelHullPoints(solids, extraPoints)) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis]!, point[axis]!);
      max[axis] = Math.max(max[axis]!, point[axis]!);
    }
  }
  return {
    min: [round(min[0]!), round(min[1]!), round(min[2]!)],
    max: [round(max[0]!), round(max[1]!), round(max[2]!)],
  };
}

/** The step a sequence progress in [0, 1] falls in, out of `steps` equal shares. */
export function stepForProgress(progress: number, steps: number): number {
  return Math.min(steps - 1, Math.max(0, Math.floor(clamp01(progress) * steps)));
}

/** Progress within the current step: 0 as it begins, 1 as it ends. */
export function stepProgress(progress: number, steps: number): number {
  return clamp01(clamp01(progress) * steps - stepForProgress(progress, steps));
}

/** Under reduced motion each step settles on its middle frame instead of following the scroll. */
export function settledProgress(progress: number, steps: number): number {
  return (stepForProgress(progress, steps) + 0.5) / steps;
}

/** The drawing's turn for a progress: held at the middle of the first and last steps and eased between step middles. */
export function sequenceYaw(stepYawDeg: readonly number[], progress: number): number {
  const count = stepYawDeg.length;
  if (count === 0) return 0;
  // 0 at the middle of the first step, count - 1 at the middle of the last.
  const position = clamp01(progress) * count - 0.5;
  if (position <= 0) return stepYawDeg[0]!;
  if (position >= count - 1) return stepYawDeg[count - 1]!;
  const index = Math.floor(position);
  const t = position - index;
  const eased = t * t * (3 - 2 * t);
  return stepYawDeg[index]! + (stepYawDeg[index + 1]! - stepYawDeg[index]!) * eased;
}
