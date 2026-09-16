/**
 * Geometry of the Home & Living Utility inspection model: one fluted glazed pitcher standing in a shallow steel test
 * bath, a borosilicate beaker of food simulant beside it, and a coupon cut from the pitcher's wall.
 *
 * Each protocol is something physical done to the piece. The beaker pours simulant into the pitcher until it stands at
 * the test line (food contact). The coupon lifts out of the wall and turns to show the glaze over the ceramic body in
 * section (LFGB). The bath fills around the pitcher, rippling as it rises (thermal shock and dishwasher).
 *
 * Units are metres at an illustrative scale: +Y is up, the ground is y = 0, the pitcher stands on the bath's floor at
 * x = 0, z = 0, and a turn of 0 faces +Z. Heights along the pitcher are given from its own base, so `PITCHER_BASE_Y`
 * is added on the way out. Pure data and arithmetic with no Three.js or DOM, so the scene and the tests share it.
 */

export type Vec3 = readonly [number, number, number];

const DEG = Math.PI / 180;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const smoothstep = (t: number): number => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** An angle folded into (-pi, pi]. */
const wrap = (angle: number): number => angle - 2 * Math.PI * Math.round(angle / (2 * Math.PI));

/** The steel test bath the pitcher stands in, an open box on the ground. */
export const TRAY = { width: 0.33, depth: 0.24, height: 0.078, wall: 0.0035, floor: 0.004 } as const;

/** The pitcher stands on the bath's floor. */
export const PITCHER_BASE_Y = TRAY.floor;

export const PITCHER = {
  height: 0.235,
  wall: 0.006,
  /** The inside floor, above the pitcher's own base. */
  floor: 0.009,
  flutes: 18,
  fluteDepth: 0.0035,
  /** The rim is drawn out and up on one side into a pouring lip. */
  spout: { atDeg: -60, halfWidthDeg: 30, lift: 0.02, reach: 0.012 },
  handle: { atDeg: 120, topY: 0.19, bottomY: 0.085, reach: 0.055, radius: 0.0085 },
} as const;

/** The outer silhouette, as (height, radius) from the base to the rim: a soft belly, a waist, and a flared rim. */
const SILHOUETTE: ReadonlyArray<readonly [number, number]> = [
  [0, 0.05],
  [0.008, 0.0535],
  [0.032, 0.0665],
  [0.085, 0.0815],
  [0.125, 0.0795],
  [0.165, 0.067],
  [0.198, 0.0565],
  [0.221, 0.0575],
  [0.235, 0.0635],
];

/**
 * A monotone cubic through the silhouette (Fritsch-Carlson), so the profile is smooth and never bulges past a control
 * point: the radius at a height is then single valued, which the water, the coupon and the tests all rely on.
 */
function silhouetteRadius(): (y: number) => number {
  const heights = SILHOUETTE.map(([y]) => y);
  const radii = SILHOUETTE.map(([, r]) => r);
  const last = heights.length - 1;
  const secants = heights.slice(0, -1).map((y, i) => (radii[i + 1]! - radii[i]!) / (heights[i + 1]! - y));
  const tangents = heights.map((_, i) => {
    if (i === 0) return secants[0]!;
    if (i === last) return secants[last - 1]!;
    const before = secants[i - 1]!;
    const after = secants[i]!;
    return before * after <= 0 ? 0 : (before + after) / 2;
  });
  for (let i = 0; i < last; i += 1) {
    const secant = secants[i]!;
    if (secant === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const before = tangents[i]! / secant;
    const after = tangents[i + 1]! / secant;
    const size = Math.hypot(before, after);
    if (size > 3) {
      tangents[i] = (3 / size) * before * secant;
      tangents[i + 1] = (3 / size) * after * secant;
    }
  }
  return (y: number): number => {
    const height = Math.min(heights[last]!, Math.max(0, y));
    let index = 0;
    while (index < last - 1 && height > heights[index + 1]!) index += 1;
    const span = heights[index + 1]! - heights[index]!;
    const t = (height - heights[index]!) / span;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      radii[index]! * (2 * t3 - 3 * t2 + 1) +
      tangents[index]! * span * (t3 - 2 * t2 + t) +
      radii[index + 1]! * (-2 * t3 + 3 * t2) +
      tangents[index + 1]! * span * (t3 - t2)
    );
  };
}

const RADIUS = silhouetteRadius();

/** The pitcher's outer radius at a height above its base, before the flutes and the spout. */
export function pitcherRadius(y: number): number {
  return RADIUS(y);
}

/** The radius of the inside wall at a height above the base. */
export function innerRadius(y: number): number {
  return Math.max(0.004, RADIUS(y) - PITCHER.wall);
}

/** How deep the flutes cut into the outer wall at a turn and height: nothing on a crest, `fluteDepth` in a valley. */
export function fluteOffset(theta: number, y: number): number {
  const fade = smoothstep((y - 0.012) / 0.03) * (1 - smoothstep((y - 0.19) / 0.04));
  return -PITCHER.fluteDepth * fade * 0.5 * (1 - Math.cos(PITCHER.flutes * theta));
}

/** How much of the spout's draw applies at a turn (0 away from it, 1 at its middle). */
export function spoutBump(theta: number): number {
  const delta = Math.abs(wrap(theta - PITCHER.spout.atDeg * DEG));
  const half = PITCHER.spout.halfWidthDeg * DEG;
  return delta >= half ? 0 : 0.5 * (1 + Math.cos((Math.PI * delta) / half));
}

/** How much of the spout's draw applies at a height: only the rim is drawn out. */
function spoutWeight(y: number): number {
  return smoothstep((y - 0.185) / (PITCHER.height - 0.185));
}

/**
 * A point in the pitcher's wall at a turn and a height above its base: `depth` 0 on the outer face, 1 on the inner
 * face, and between for the layers of the wall.
 */
export function pitcherWallPoint(theta: number, y: number, depth: number): Vec3 {
  const draw = spoutBump(theta) * spoutWeight(y);
  const outer = RADIUS(y) + fluteOffset(theta, y);
  const inner = innerRadius(y);
  const radius = lerp(outer, inner, clamp01(depth)) + PITCHER.spout.reach * draw;
  const height = PITCHER_BASE_Y + y + PITCHER.spout.lift * draw;
  return [radius * Math.sin(theta), height, radius * Math.cos(theta)];
}

/** The handle's centreline, from inside the wall at the shoulder, out and down, back into the wall at the belly. */
export function handlePath(): Vec3[] {
  const { atDeg, topY, bottomY, reach } = PITCHER.handle;
  const theta = atDeg * DEG;
  const at = (y: number, out: number): Vec3 => {
    const radius = RADIUS(y) + out;
    return [radius * Math.sin(theta), PITCHER_BASE_Y + y, radius * Math.cos(theta)];
  };
  return [
    at(topY, -0.006),
    at(topY + 0.008, 0.016),
    at(topY - 0.022, reach),
    at((topY + bottomY) / 2 - 0.012, reach * 1.04),
    at(bottomY + 0.022, reach * 0.72),
    at(bottomY, 0.012),
    at(bottomY - 0.008, -0.006),
  ];
}

/** 02: the coupon cut from the wall, a window of it that lifts out and turns to show the glaze over the body. */
export const COUPON = {
  atDeg: 0,
  halfWidthDeg: 20,
  fromY: 0.118,
  toY: 0.168,
  glaze: 0.0016,
  /** Where it is held once cut: out of the wall and off to the side, clear of the piece, turned so its cut edge faces the camera. */
  lift: { out: 0.05, across: 0.12, up: 0.02, turnDeg: 38, tiltDeg: 18 },
} as const;

/** Whether a turn and height fall inside the coupon's window. */
export function insideCoupon(theta: number, y: number): boolean {
  return Math.abs(wrap(theta - COUPON.atDeg * DEG)) < COUPON.halfWidthDeg * DEG && y > COUPON.fromY && y < COUPON.toY;
}

/** Where the coupon sits in the wall, and the axes it lifts and turns on: across its width, up, and out of the wall. */
export function couponFrame(): { origin: Vec3; across: Vec3; up: Vec3; outward: Vec3 } {
  const theta = COUPON.atDeg * DEG;
  return {
    origin: pitcherWallPoint(theta, (COUPON.fromY + COUPON.toY) / 2, 0.5),
    across: [Math.cos(theta), 0, -Math.sin(theta)],
    up: [0, 1, 0],
    outward: [Math.sin(theta), 0, Math.cos(theta)],
  };
}

/** Halfway between the hole in the wall and the coupon held out beside it: what the camera holds on for that test. */
export function couponLook(): Vec3 {
  const { origin, across, up, outward } = couponFrame();
  const { out, across: aside, up: rise } = COUPON.lift;
  return [
    origin[0] + (across[0] * aside + outward[0] * out) / 2,
    origin[1] + (up[1] * rise) / 2 + 0.008,
    origin[2] + (across[2] * aside + outward[2] * out) / 2,
  ];
}

/** 01: the food simulant poured into the pitcher, standing at the test line. */
export const FILL = { line: 0.108 } as const;

/** The height of the simulant's surface inside the pitcher, from empty (0) to the test line (1). */
export function fillSurfaceY(level: number): number {
  return PITCHER_BASE_Y + PITCHER.floor + (FILL.line - PITCHER.floor) * clamp01(level);
}

/** 03: the bath around the pitcher, rippling as it rises. */
export const BATH = { line: 0.058, ripple: { wavelength: 0.026, amplitude: 0.0035, decay: 0.12, travel: 2.5 } } as const;

/** The still height of the bath's surface, from empty (0) to full (1). */
export function bathLevelY(bath: number): number {
  return TRAY.floor + BATH.line * clamp01(bath);
}

/** The bath's surface at a point on it: rings running out from the pitcher, which settle as the bath fills. */
export function bathSurface(x: number, z: number, bath: number): number {
  const filled = clamp01(bath);
  const distance = Math.hypot(x, z);
  // The rings settle as the bath fills, but never quite still: water in a bath keeps moving.
  const calm = 1 - 0.75 * smoothstep((filled - 0.45) / 0.55);
  const fade = Math.min(1, Math.exp(-(distance - 0.05) / BATH.ripple.decay));
  const phase = (2 * Math.PI * distance) / BATH.ripple.wavelength - filled * BATH.ripple.travel * 2 * Math.PI;
  return bathLevelY(filled) + BATH.ripple.amplitude * calm * fade * Math.sin(phase);
}

/** The borosilicate beaker of simulant: on the bench at rest, tipped over the pitcher's mouth to pour. */
export const BEAKER = {
  radius: 0.042,
  height: 0.095,
  wall: 0.0025,
  /** How full it stands at rest, as a share of its height. */
  fill: 0.62,
  lift: 0.06,
  rest: { position: [-0.245, 0, 0.02] as Vec3, tiltDeg: 0 },
  pour: { position: [-0.113, 0.285, 0.004] as Vec3, tiltDeg: 58 },
} as const;

/** Where the beaker stands at a point of the pour, from the bench (0) to tipped over the mouth (1). */
export function beakerPlacement(pour: number): { position: Vec3; tiltDeg: number } {
  const t = clamp01(pour);
  const arc = BEAKER.lift * Math.sin(Math.PI * t);
  return {
    position: [
      lerp(BEAKER.rest.position[0], BEAKER.pour.position[0], t),
      lerp(BEAKER.rest.position[1], BEAKER.pour.position[1], t) + arc,
      lerp(BEAKER.rest.position[2], BEAKER.pour.position[2], t),
    ],
    tiltDeg: BEAKER.pour.tiltDeg * t,
  };
}

/** The beaker's pouring lip, the point of its rim that leads as it tips. */
export function beakerLip(pour: number): Vec3 {
  const { position, tiltDeg } = beakerPlacement(pour);
  const tilt = tiltDeg * DEG;
  return [
    position[0] + BEAKER.radius * Math.cos(tilt) + BEAKER.height * Math.sin(tilt),
    position[1] - BEAKER.radius * Math.sin(tilt) + BEAKER.height * Math.cos(tilt),
    position[2],
  ];
}

/** The height of the simulant's own surface in the beaker: it stands lower as the pitcher fills, and as the beaker tips. */
export function beakerSurfaceY(pour: number, fill: number): number {
  const { position, tiltDeg } = beakerPlacement(pour);
  const level = BEAKER.fill * BEAKER.height * (1 - 0.72 * clamp01(fill));
  return position[1] + level * Math.cos(tiltDeg * DEG);
}

/** The simulant's path from the lip down onto the surface inside the pitcher. */
export function streamPoints(pour: number, level: number): Vec3[] {
  const lip = beakerLip(pour);
  const target: Vec3 = [0.006, fillSurfaceY(level), 0.008];
  return [
    lip,
    [lip[0] + 0.014, lip[1] - 0.028, lip[2] + 0.002],
    [lerp(lip[0], target[0], 0.7), lerp(lip[1], target[1], 0.55), lerp(lip[2], target[2], 0.7)],
    [target[0], target[1] + 0.018, target[2]],
    target,
  ];
}

/**
 * The three inspection elements as separate, clickable areas: a centre and a radius each, clear of one another. Where
 * the test moves a piece away from where it sits, `look` is where the camera holds instead, between the two.
 */
export const INSPECTION_AREAS = [
  { id: 'food-contact', protocol: 0, centre: [0, PITCHER_BASE_Y + PITCHER.height, 0] as Vec3, radius: 0.06 },
  {
    id: 'lfgb',
    protocol: 1,
    centre: couponFrame().origin,
    radius: 0.04,
    // Between the hole in the wall and the coupon held beside it.
    look: couponLook(),
  },
  { id: 'thermal-shock', protocol: 2, centre: [0, bathLevelY(1), 0] as Vec3, radius: 0.045 },
] as const;

/** The three-quarter camera: from the beaker's side, above the bath, looking across the pitcher. */
export const HOME_VIEW = { azimuthDeg: -35, elevationDeg: 18, fovDeg: 28 } as const;
