/**
 * Geometry of the Seasonal & Promotional inspection model: one kraft shipping carton packed with printed retail gift
 * boxes, and the timber pallet it ships from.
 *
 * Each protocol is something physical done on the bench. The packed carton is lifted onto the dispatch pallet (the
 * shipping window). Its flaps stand open and a sample of gift boxes is drawn out and set down in front, one with its
 * lid off to show the tin inside (AQL). Then the sample goes back, the flaps fold in, tape runs along the seam and the
 * dispatch label lands on the top (pre-cartoned retail packaging).
 *
 * Units are metres at an illustrative scale: +Y is up, the ground is y = 0, and the pallet stands to +X of where the
 * carton is packed. Positions inside the carton are given in its own frame, whose origin is the middle of its floor.
 * Pure data and arithmetic with no Three.js or DOM, so the scene and the tests share it.
 */

export type Vec3 = readonly [number, number, number];

const DEG = Math.PI / 180;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (value: number): number => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/** The dispatch pallet: a slatted deck on three bearers. */
export const PALLET = {
  width: 0.52,
  depth: 0.44,
  height: 0.062,
  deck: 0.013,
  slats: 5,
  bearers: 3,
  at: [0.17, 0, 0] as Vec3,
} as const;

/** The shipping carton, and where it is packed before it goes on the pallet. */
export const CARTON = {
  width: 0.34,
  depth: 0.26,
  height: 0.17,
  board: 0.004,
  /** The flaps hinged on the long edges, which meet in the middle, and the pair under them. */
  major: 0.128,
  minor: 0.118,
  /** How far the flaps are folded back while the carton is packed: down against the outside, leaning a little off it. */
  openDeg: 262,
  packed: [-0.22, 0, 0.03] as Vec3,
} as const;

/** The printed retail gift boxes inside it, three across and two deep. */
export const GIFT = {
  width: 0.105,
  depth: 0.12,
  height: 0.105,
  columns: 3,
  rows: 2,
  lid: { height: 0.032, over: 0.0015 },
} as const;

/** The decorative tin inside a gift box, in its moulded tray. */
export const TIN = { radius: 0.034, height: 0.068, rim: 0.005, tray: 0.008 } as const;

/** The AQL sample: the front row, drawn out and set down in front of the pallet. `lift` is its clearance over the carton's rim. */
export const SAMPLE = { count: 3, spacing: 0.145, z: 0.34, turnDeg: -9, lift: 0.02 } as const;

/** The tape along the seam where the major flaps meet, and the dispatch label on the top. */
export const TAPE = { width: 0.05, overhang: 0.022, thickness: 0.0009 } as const;
export const LABEL = { width: 0.108, height: 0.074, across: 0.07, along: -0.067, drop: 0.17, tiltDeg: 26 } as const;

/** Where the carton's floor sits, from packed on the bench (0) to square on the pallet (1). */
export function cartonPlacement(slide: number): Vec3 {
  const t = clamp01(slide);
  // It is lifted across, so it rises clear of the pallet's deck on the way.
  const arc = 0.05 * Math.sin(Math.PI * t);
  return [
    lerp(CARTON.packed[0], PALLET.at[0], t),
    lerp(CARTON.packed[1], PALLET.at[1] + PALLET.height, t) + arc,
    lerp(CARTON.packed[2], PALLET.at[2], t),
  ];
}

/** How far each pair of flaps still stands open, in radians from closed, as the carton is closed up. */
export function flapAngles(close: number): { major: number; minor: number } {
  const t = clamp01(close);
  const open = CARTON.openDeg * DEG;
  // The pair underneath folds in first, so the major flaps close over them.
  return { minor: open * (1 - clamp01(t / 0.55)), major: open * (1 - clamp01((t - 0.3) / 0.7)) };
}

/** Where a gift box stands in the carton, in the carton's frame: index runs across the back row, then the front. */
export function giftSlot(index: number): Vec3 {
  const column = index % GIFT.columns;
  const row = Math.floor(index / GIFT.columns);
  const across = (CARTON.width - 2 * CARTON.board - GIFT.columns * GIFT.width) / (GIFT.columns + 1);
  const along = (CARTON.depth - 2 * CARTON.board - GIFT.rows * GIFT.depth) / (GIFT.rows + 1);
  return [
    (column - (GIFT.columns - 1) / 2) * (GIFT.width + across),
    CARTON.board,
    (row - (GIFT.rows - 1) / 2) * (GIFT.depth + along),
  ];
}

/** The gift boxes drawn as the AQL sample: the front row, nearest the inspector. */
export function sampleSlots(): number[] {
  return Array.from({ length: SAMPLE.count }, (_, k) => GIFT.columns * (GIFT.rows - 1) + k);
}

/** Where a sample box is, in the carton's frame, from its slot (0) to set down in front of the pallet (1). */
export function samplePlacement(order: number, out: number): { position: Vec3; turnDeg: number } {
  const t = clamp01(out);
  const slot = giftSlot(sampleSlots()[order]!);
  const carton = cartonPlacement(1);
  const bench: Vec3 = [PALLET.at[0] + (order - (SAMPLE.count - 1) / 2) * SAMPLE.spacing - carton[0], -carton[1], SAMPLE.z - carton[2]];
  // Lifted straight up until it clears the carton's rim, carried out over the folded-back flap, then set down.
  const up = smooth(t / 0.4);
  const across = smooth((t - 0.3) / 0.5);
  const down = smooth((t - 0.65) / 0.35);
  const clear = CARTON.height + CARTON.board + SAMPLE.lift - slot[1];
  return {
    position: [lerp(slot[0], bench[0], across), lerp(slot[1], bench[1], down) + clear * up * (1 - down), lerp(slot[2], bench[2], across)],
    turnDeg: SAMPLE.turnDeg * across,
  };
}

/** Where the dispatch label is, in the carton's frame, from held above the carton (0) to laid on the top (1). */
export function labelPlacement(land: number): { position: Vec3; tiltDeg: number } {
  const t = clamp01(land);
  return {
    position: [LABEL.across, CARTON.height + TAPE.thickness + lerp(LABEL.drop, 0.0006, t), LABEL.along],
    tiltDeg: LABEL.tiltDeg * (1 - t),
  };
}

/** How far the tape has run along the seam, in metres. */
export function tapeSpan(tape: number): number {
  return (CARTON.width + 2 * TAPE.overhang) * clamp01(tape);
}

/** The three inspection elements as separate, clickable areas: a centre and a radius each, clear of one another. */
export const INSPECTION_AREAS = [
  { id: 'shipping-window', protocol: 0, centre: [PALLET.at[0], PALLET.height / 2, PALLET.at[2]] as Vec3, radius: 0.09, look: [PALLET.at[0], PALLET.height + 0.09, PALLET.at[2]] as Vec3 },
  { id: 'aql', protocol: 1, centre: [PALLET.at[0], GIFT.height / 2, SAMPLE.z] as Vec3, radius: 0.1 },
  {
    id: 'pre-cartoned',
    protocol: 2,
    centre: [PALLET.at[0], PALLET.height + CARTON.height + 0.08, PALLET.at[2]] as Vec3,
    radius: 0.08,
    look: [PALLET.at[0], PALLET.height + CARTON.height + 0.01, PALLET.at[2]] as Vec3,
  },
] as const;

/** The three-quarter camera: from the packing side of the bench, above the pallet. */
export const SEASONAL_VIEW = { azimuthDeg: -32, elevationDeg: 22, fovDeg: 28 } as const;
