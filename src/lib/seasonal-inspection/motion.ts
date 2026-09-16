/**
 * The Seasonal & Promotional scene's scroll choreography: where the camera looks, and what is done to the carton, at
 * every point of the inspection process.
 *
 * The camera starts on the whole bench and moves with the steps to each act, then holds still while it is carried out.
 * The packed carton is lifted onto the dispatch pallet and stays there. A sample of gift boxes is drawn out and set
 * down in front, one with its lid off, then goes back. The flaps fold in, the tape runs along the seam and the
 * dispatch label lands on the top, where they stay. There are no callouts: the bench does the showing.
 *
 * Pure arithmetic with no Three.js or DOM, so the scene and the tests share it. Each act reads at its step's middle,
 * where the page settles progress under reduced motion.
 */
import { SEASONAL_VIEW } from './geometry';

/** A camera view: how far the target moves from the whole bench toward each inspection area, the distance as a share
 * of the whole-bench distance, and the direction the camera looks from. */
export interface SeasonalView {
  readonly toward: readonly [number, number, number];
  readonly zoom: number;
  readonly azimuthDeg: number;
  readonly elevationDeg: number;
}

export interface SeasonalPose {
  readonly view: SeasonalView;
  /** The carton's move from the packing bench onto the dispatch pallet, where it stays. */
  readonly slide: number;
  /** Each sample box, from its slot in the carton to set down in front. */
  readonly sample: readonly number[];
  /** The lid off the sampled box, showing the tin inside. */
  readonly lid: number;
  /** The flaps folded in over the load. */
  readonly close: number;
  /** The tape run along the seam. */
  readonly tape: number;
  /** The dispatch label laid on the top. */
  readonly label: number;
}

const STEPS = 3;
const SAMPLES = 3;

/** The whole bench, from the three-quarter view. */
export const OVERVIEW: SeasonalView = { toward: [0, 0, 0], zoom: 1, azimuthDeg: SEASONAL_VIEW.azimuthDeg, elevationDeg: SEASONAL_VIEW.elevationDeg };

/** One closer view per step: the pallet as the carton lands, the sample set down in front, and the top as it is closed. */
export const STEP_VIEWS: readonly SeasonalView[] = [
  { toward: [0.85, 0, 0], zoom: 0.72, azimuthDeg: -30, elevationDeg: 24 },
  { toward: [0, 0.95, 0], zoom: 0.54, azimuthDeg: -24, elevationDeg: 28 },
  { toward: [0, 0, 0.9], zoom: 0.5, azimuthDeg: -36, elevationDeg: 40 },
];

/**
 * Where in each step the camera holds on that step's act, as shares of the step: it has arrived by the first and
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
export function seasonalView(progress: number): SeasonalView {
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

export function seasonalPose(progress: number): SeasonalPose {
  const p = clamp01(progress);
  const step = Math.min(STEPS - 1, Math.floor(p * STEPS));
  const t = clamp01(p * STEPS - step);
  // 01: the carton is lifted onto the pallet once the camera has settled, and ships from there.
  const slide = step === 0 ? smooth(ramp(t, 0.3, 0.5)) : 1;
  // 02: the sample is drawn out one box after another, its lid comes off, and it all goes back before the carton is closed.
  const back = step === 1 ? 1 - smooth(ramp(t, 0.84, 0.96)) : 0;
  const sample = Array.from({ length: SAMPLES }, (_, index) => (step === 1 ? smooth(ramp(t, 0.2 + index * 0.05, 0.36 + index * 0.05)) * back : 0));
  const lid = step === 1 ? smooth(ramp(t, 0.38, 0.5)) * back : 0;
  // 03: the flaps fold in, the tape runs, and the label lands, and they stay for the rest of the process.
  const close = step === 2 ? smooth(ramp(t, 0.2, 0.32)) : 0;
  const tape = step === 2 ? smooth(ramp(t, 0.28, 0.4)) : 0;
  const label = step === 2 ? smooth(ramp(t, 0.36, 0.48)) : 0;
  return { view: seasonalView(p), slide, sample, lid, close, tape, label };
}
