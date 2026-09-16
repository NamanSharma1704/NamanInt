/**
 * The Home & Living Utility scene's scroll choreography: where the camera looks, and what is done to the pitcher, at
 * every point of the inspection process.
 *
 * The camera starts on the whole bench and moves with the steps to a closer view of each test, then holds still while
 * that test plays out. The beaker lifts, tips over the mouth and pours until the simulant stands at the test line,
 * where it stays. The coupon lifts out of the wall and turns to show the glaze over the body, then goes back. The bath
 * fills around the pitcher and stays. There are no callouts: the piece and the bench do the showing.
 *
 * Pure arithmetic with no Three.js or DOM, so the scene and the tests share it. Each test reads at its step's middle,
 * where the page settles progress under reduced motion.
 */
import { HOME_VIEW } from './geometry';

/** A camera view: how far the target moves from the whole bench toward each inspection area, the distance as a share
 * of the whole-bench distance, and the direction the camera looks from. */
export interface HomeView {
  readonly toward: readonly [number, number, number];
  readonly zoom: number;
  readonly azimuthDeg: number;
  readonly elevationDeg: number;
}

export interface HomePose {
  readonly view: HomeView;
  /** The beaker's move from the bench to tipped over the mouth. */
  readonly pour: number;
  /** The stream running from the lip into the pitcher. */
  readonly stream: number;
  /** The simulant inside the pitcher, from empty to the test line, where it stays. */
  readonly fill: number;
  /** The coupon out of the wall, and turned to show its section. */
  readonly couponOut: number;
  readonly couponTurn: number;
  /** The bath around the pitcher, from empty to full, where it stays. */
  readonly bath: number;
}

const STEPS = 3;

/** The whole bench, from the three-quarter view. */
export const OVERVIEW: HomeView = { toward: [0, 0, 0], zoom: 1, azimuthDeg: HOME_VIEW.azimuthDeg, elevationDeg: HOME_VIEW.elevationDeg };

/** One closer view per step: over the mouth for the pour, square onto the coupon, and low at the waterline. */
export const STEP_VIEWS: readonly HomeView[] = [
  { toward: [0.9, 0, 0], zoom: 0.52, azimuthDeg: -24, elevationDeg: 32 },
  { toward: [0, 0.95, 0], zoom: 0.42, azimuthDeg: -20, elevationDeg: 22 },
  { toward: [0, 0, 0.9], zoom: 0.62, azimuthDeg: -34, elevationDeg: 13 },
];

/**
 * Where in each step the camera holds on that step's test, as shares of the step: it has arrived by the first and
 * leaves after the second. The first step gives the camera longer to come in from the whole bench, and the last holds
 * to the end.
 */
export const STEP_HOLD: readonly (readonly [number, number])[] = [
  [0.3, 0.8],
  [0.2, 0.8],
  [0.2, 1],
];

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const ramp = (value: number, from: number, to: number): number => clamp01((value - from) / (to - from));
const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The camera view for a progress: from the whole bench at the start to each step's view through its hold, eased between. */
export function homeView(progress: number): HomeView {
  const p = clamp01(progress);
  const keys = [
    { at: 0, view: OVERVIEW },
    ...STEP_VIEWS.flatMap((view, index) => STEP_HOLD[index]!.map((share) => ({ at: (index + share) / STEPS, view }))),
  ];
  const last = keys[keys.length - 1]!;
  if (p >= last.at) return last.view;
  let index = 0;
  while (index < keys.length - 2 && p >= keys[index + 1]!.at) index += 1;
  const a = keys[index]!;
  const b = keys[index + 1]!;
  const t = smooth((p - a.at) / (b.at - a.at));
  return {
    toward: [lerp(a.view.toward[0], b.view.toward[0], t), lerp(a.view.toward[1], b.view.toward[1], t), lerp(a.view.toward[2], b.view.toward[2], t)],
    zoom: lerp(a.view.zoom, b.view.zoom, t),
    azimuthDeg: lerp(a.view.azimuthDeg, b.view.azimuthDeg, t),
    elevationDeg: lerp(a.view.elevationDeg, b.view.elevationDeg, t),
  };
}

export function homePose(progress: number): HomePose {
  const p = clamp01(progress);
  const step = Math.min(STEPS - 1, Math.floor(p * STEPS));
  const t = clamp01(p * STEPS - step);
  // 01: the beaker lifts and tips once the camera has settled, pours through the middle, then goes back to the bench.
  const pour = step === 0 ? smooth(ramp(t, 0.3, 0.42)) * (1 - smooth(ramp(t, 0.7, 0.88))) : 0;
  const stream = step === 0 ? smooth(ramp(t, 0.38, 0.5)) * (1 - smooth(ramp(t, 0.56, 0.68))) : 0;
  // The simulant stays at the test line once poured: the piece is tested full.
  const fill = step === 0 ? smooth(ramp(t, 0.4, 0.52)) : 1;
  // 02: the coupon lifts out of the wall, turns its section to the camera, and goes back before the bath.
  const couponBack = step === 1 ? 1 - smooth(ramp(t, 0.84, 0.96)) : 0;
  const couponOut = step === 1 ? smooth(ramp(t, 0.2, 0.34)) * couponBack : 0;
  const couponTurn = step === 1 ? smooth(ramp(t, 0.3, 0.5)) * couponBack : 0;
  // 03: the bath fills around the piece and stays.
  const bath = step === 2 ? smooth(ramp(t, 0.2, 0.5)) : 0;
  return { view: homeView(p), pour, stream, fill, couponOut, couponTurn, bath };
}
