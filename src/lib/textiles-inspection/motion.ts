/**
 * The Textiles & Materials scene's scroll choreography: where the camera looks, and how the three inspection elements
 * move, at every point of the inspection process.
 *
 * The camera starts on the whole roll and moves with the steps to a closer three-quarter view of each element in turn,
 * then holds still through most of the step so the element's own movement is what moves. Each element moves only
 * during its own step: the tag lifts off the fabric on its eyelet end and settles back as the next step begins; the
 * swatches lift and tilt toward the viewer one after another, then lie back down; and the fabric tears in from its
 * edge, staying torn to the end. There are no callouts: the elements themselves move.
 *
 * Pure arithmetic with no Three.js or DOM, so the scene and the tests share it. Every movement starts as the camera
 * settles and is complete by its step's middle, where the page settles progress under reduced motion, so that held
 * pose shows it done.
 */
import { SWATCHES, TAG, TEXTILES_VIEW } from './geometry';

/** A camera view: how far the target moves from the whole model toward each inspection area, the distance as a share
 * of the whole-model distance, and the direction the camera looks from. */
export interface TextilesView {
  readonly toward: readonly [number, number, number];
  readonly zoom: number;
  readonly azimuthDeg: number;
  readonly elevationDeg: number;
}

export interface TextilesPose {
  readonly view: TextilesView;
  /** The tag's lift off the fabric, about its eyelet end. */
  readonly tagTiltDeg: number;
  /** Each swatch's rise off the sheet, from 0 (lying flat) to 1 (lifted and tilted toward the viewer). */
  readonly swatchRise: readonly number[];
  /** How far the tear has run, from 0 (the sheet whole) to 1 (torn as far as it goes). */
  readonly tearRun: number;
}

const STEPS = 3;

/** The whole model, from the three-quarter view. */
export const OVERVIEW: TextilesView = { toward: [0, 0, 0], zoom: 1, azimuthDeg: TEXTILES_VIEW.azimuthDeg, elevationDeg: TEXTILES_VIEW.elevationDeg };

/** One closer view per step: the tag from above the near edge, the swatches from in front, the tear side on. */
export const STEP_VIEWS: readonly TextilesView[] = [
  { toward: [0.95, 0, 0], zoom: 0.34, azimuthDeg: -30, elevationDeg: 36 },
  { toward: [0, 0.95, 0], zoom: 0.42, azimuthDeg: -16, elevationDeg: 42 },
  { toward: [0, 0, 0.95], zoom: 0.25, azimuthDeg: -46, elevationDeg: 36 },
];

/**
 * Where in each step the camera holds on that step's element, as shares of the step: it has arrived by the first and
 * leaves after the second. The first step gives the camera longer to come in from the whole model, and the last holds
 * to the end.
 */
export const STEP_HOLD: readonly (readonly [number, number])[] = [
  [0.3, 0.8],
  [0.2, 0.8],
  [0.2, 1],
];

/** How far the tag lifts when presented. */
export const TAG_LIFT_DEG = 38;
/** How high the swatches rise and how far they tilt toward the viewer, and the delay between neighbours. */
export const SWATCH_RISE = { height: 0.045, tiltDeg: 26, stagger: 0.0425 } as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const ramp = (value: number, from: number, to: number): number => clamp01((value - from) / (to - from));
const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The camera view for a progress: from the whole model at the start to each step's view through its hold, eased between. */
export function textilesView(progress: number): TextilesView {
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

export function textilesPose(progress: number): TextilesPose {
  const p = clamp01(progress);
  const step = Math.min(STEPS - 1, Math.floor(p * STEPS));
  const t = clamp01(p * STEPS - step);
  // The tag lifts once the camera has settled on it, and settles back as the camera leaves early in the second step.
  const tagLift = step === 0 ? smooth(ramp(t, 0.3, 0.48)) : step === 1 ? 1 - smooth(ramp(t, 0, 0.2)) : 0;
  // The swatches rise one after another, all up by the middle, and lie back down as the camera leaves.
  const swatchRise = SWATCHES.map((_, index) => {
    if (step !== 1) return 0;
    const delay = index * SWATCH_RISE.stagger;
    return smooth(ramp(t, 0.2 + delay, 0.33 + delay)) * (1 - smooth(ramp(t, 0.8, 0.95)));
  });
  // The fabric tears in from its edge and stays torn.
  const tearRun = step === 2 ? smooth(ramp(t, 0.2, 0.5)) : 0;
  return {
    view: textilesView(p),
    tagTiltDeg: TAG.tiltDeg + (TAG_LIFT_DEG - TAG.tiltDeg) * tagLift,
    swatchRise,
    tearRun,
  };
}
