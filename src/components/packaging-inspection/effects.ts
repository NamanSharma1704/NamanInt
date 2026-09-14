/**
 * Drawn effects for the Packaging & Retail inspection sequence, one per step, each played out by scrolling:
 * the carton lowered onto its capped corner until impact rings spread from it (ISTA-3A), arrows pressing
 * down on the top edge of the ECT cut-away in the corrugated wall, and a scan line sweeping the barcode (GS1).
 *
 * The rings, arrows and scan line are lines in the gold ink drawn into the model, so they turn with the
 * display and hide behind the parts in front of them. Each shows only during its own step. Under reduced
 * motion each step settles on one frame: the carton rests on its corner with the rings spread, the arrows
 * press, and the scan line crosses the middle of the bars.
 */
import { BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineLoop, LineSegments, Vector3 } from 'three';

import type { EffectContext, EffectFrame, SceneEffects } from '@/components/inspection-drawing/scene';
import { CARTON_DROP_HEIGHT, CARTON_PART_IDS, EFFECT_ANCHORS } from '@/lib/packaging-inspection/geometry';

const STEPS = 3;
const RING_COUNT = 3;
const RING_SEGMENTS = 48;
/** Share of the drop step at which the corner lands; the rings spread over the rest. */
const LANDING = 0.7;
/** Arrow tip height above the cut-away's top edge at the start and end of the press. */
const PRESS_LIFT = { high: 0.026, low: 0.005 } as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const ramp = (value: number, from: number, to: number): number => clamp01((value - from) / (to - from));

function lineGeometry(points: readonly (readonly [number, number, number])[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points.flat(), 3));
  return geometry;
}

/** How present an effect is: 1 inside its own step, easing in and out at the step's edges (the first holds at the start, the last at the end). */
function presence(frame: EffectFrame, step: number): number {
  if (frame.step !== step) return 0;
  const fadeIn = step === 0 ? 1 : ramp(frame.stepProgress, 0, 0.12);
  const fadeOut = step === STEPS - 1 ? 1 : 1 - ramp(frame.stepProgress, 0.88, 1);
  return Math.min(fadeIn, fadeOut);
}

export function createPackagingEffects({ model, colors, parts }: EffectContext): SceneEffects {
  const group = new Group();
  model.add(group);
  const geometries: BufferGeometry[] = [];
  const materials: LineBasicMaterial[] = [];
  const material = (): LineBasicMaterial => {
    const next = new LineBasicMaterial({ color: colors.accent.clone(), transparent: true, opacity: 0, depthWrite: false });
    materials.push(next);
    return next;
  };
  const setOpacity = (object: LineSegments | LineLoop, opacity: number): void => {
    (object.material as LineBasicMaterial).opacity = opacity;
    object.visible = opacity > 0.001;
  };

  // Step 1, ISTA-3A: the carton and its cap, and rings spreading from the corner once it lands.
  const carton = CARTON_PART_IDS.flatMap((id) => {
    const holder = parts.get(id);
    return holder ? [{ holder, rest: holder.position.clone() }] : [];
  });
  const unitCircle = lineGeometry(
    Array.from({ length: RING_SEGMENTS }, (_, i): [number, number, number] => {
      const angle = (i / RING_SEGMENTS) * Math.PI * 2;
      return [Math.cos(angle), 0, Math.sin(angle)];
    }),
  );
  geometries.push(unitCircle);
  const rings = Array.from({ length: RING_COUNT }, () => {
    const ring = new LineLoop(unitCircle, material());
    ring.position.set(...EFFECT_ANCHORS.impact.centre);
    group.add(ring);
    return ring;
  });

  // Step 2, ECT: two downward arrows on the wall's outer face, their heads opening along the wall so they
  // read from the front-right.
  const arrowShape = lineGeometry([
    [0, 0.065, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0.02, 0.013],
    [0, 0, 0],
    [0, 0.02, -0.013],
  ]);
  geometries.push(arrowShape);
  const { compression } = EFFECT_ANCHORS;
  const arrows = compression.z.map((z) => {
    const arrow = new LineSegments(arrowShape, material());
    arrow.position.set(compression.x, compression.edgeY + PRESS_LIFT.high, z);
    group.add(arrow);
    return arrow;
  });

  // Step 3, GS1: a vertical line across the bars, moved along the label.
  const { scan } = EFFECT_ANCHORS;
  const scanShape = lineGeometry([
    [0, scan.y[0], 0],
    [0, scan.y[1], 0],
  ]);
  geometries.push(scanShape);
  const scanLine = new LineSegments(scanShape, material());
  scanLine.position.x = scan.x;
  group.add(scanLine);

  const lift = new Vector3();

  return {
    update(frame) {
      const { stepProgress, reducedMotion } = frame;

      // The carton falls (accelerating) through the first part of the drop step and rests on its corner afterwards.
      const fall = reducedMotion || frame.step > 0 ? 1 : ramp(stepProgress, 0, LANDING);
      lift.set(0, CARTON_DROP_HEIGHT * (1 - fall * fall), 0);
      for (const { holder, rest } of carton) holder.position.copy(rest).add(lift);

      const impact = frame.step !== 0 ? 0 : reducedMotion ? 0.6 : ramp(stepProgress, LANDING, 1);
      const [r0, r1] = EFFECT_ANCHORS.impact.radii;
      rings.forEach((ring, index) => {
        const phase = clamp01(impact * 1.6 - index * 0.3);
        ring.scale.set(r0 + (r1 - r0) * phase, 1, r0 + (r1 - r0) * phase);
        setOpacity(ring, phase > 0 ? presence(frame, 0) * (1 - 0.8 * phase) : 0);
      });

      const press = reducedMotion ? 1 : ramp(stepProgress, 0.1, 0.7);
      for (const arrow of arrows) {
        arrow.position.y = compression.edgeY + PRESS_LIFT.high + (PRESS_LIFT.low - PRESS_LIFT.high) * press;
        setOpacity(arrow, presence(frame, 1));
      }

      const sweep = reducedMotion ? 0.5 : ramp(stepProgress, 0.08, 0.92);
      scanLine.position.z = scan.z[0] + (scan.z[1] - scan.z[0]) * sweep;
      setOpacity(scanLine, presence(frame, 2));
    },
    dispose() {
      for (const { holder, rest } of carton) holder.position.copy(rest);
      model.remove(group);
      for (const geometry of geometries) geometry.dispose();
      for (const item of materials) item.dispose();
    },
  };
}
