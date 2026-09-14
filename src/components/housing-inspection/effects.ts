/**
 * Drawn effects for the Precision Hardware inspection sequence, one per step, each played out by scrolling:
 * a CMM probe coming down onto the top bore's rim, a screening plane sweeping down through the base
 * block, and salt spray travelling from a nozzle onto the side fitting.
 *
 * They are lines in the gold ink drawn into the model, so they turn with the part and hide behind
 * the solids in front of them. Each shows only during its own step. Under reduced motion each step
 * settles on one frame, so each effect holds a readable pose instead.
 */
import { BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineLoop, LineSegments } from 'three';

import type { EffectContext, EffectFrame, SceneEffects } from '@/components/inspection-drawing/scene';
import { HOUSING_EFFECT_ANCHORS } from '@/lib/housing-inspection/geometry';

const STEPS = 3;
const RING_SEGMENTS = 40;
/** Where each spray path lands on the fitting, as multiples of the spray spread in y and z. */
const SPRAY_PATHS: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.7, 0.7],
  [-0.7, 0.7],
  [0.7, -0.7],
  [-0.7, -0.7],
];
const DROPLETS_PER_PATH = 4;
/** Length of one droplet streak, as a share of its path. */
const DROPLET_LENGTH = 0.11;
/** The spray fan's outline lands this many spreads out from the fitting's axis. */
const FAN_REACH = 1.8;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const ramp = (value: number, from: number, to: number): number => clamp01((value - from) / (to - from));
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

function lineGeometry(points: readonly (readonly [number, number, number])[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points.flat(), 3));
  return geometry;
}

function ringGeometry(plane: 'xy' | 'zy' | 'xz'): BufferGeometry {
  return lineGeometry(
    Array.from({ length: RING_SEGMENTS }, (_, i): [number, number, number] => {
      const a = Math.cos((i / RING_SEGMENTS) * Math.PI * 2);
      const b = Math.sin((i / RING_SEGMENTS) * Math.PI * 2);
      if (plane === 'xy') return [a, b, 0];
      if (plane === 'zy') return [0, b, a];
      return [a, 0, b];
    }),
  );
}

/** How present an effect is: 1 inside its own step, easing in and out at the step's edges (the first holds at the start, the last at the end). */
function presence(frame: EffectFrame, step: number): number {
  if (frame.step !== step) return 0;
  const fadeIn = step === 0 ? 1 : ramp(frame.stepProgress, 0, 0.12);
  const fadeOut = step === STEPS - 1 ? 1 : 1 - ramp(frame.stepProgress, 0.88, 1);
  return Math.min(fadeIn, fadeOut);
}

export function createHousingEffects({ model, colors }: EffectContext): SceneEffects {
  const group = new Group();
  model.add(group);
  const geometries: BufferGeometry[] = [];
  const materials: LineBasicMaterial[] = [];
  const material = (): LineBasicMaterial => {
    const next = new LineBasicMaterial({ color: colors.accent.clone(), transparent: true, opacity: 0, depthWrite: false });
    materials.push(next);
    return next;
  };
  const keep = <T extends BufferGeometry>(geometry: T): T => {
    geometries.push(geometry);
    return geometry;
  };
  const setOpacity = (object: LineSegments | LineLoop, opacity: number): void => {
    (object.material as LineBasicMaterial).opacity = opacity;
    object.visible = opacity > 0.001;
  };

  // Step 1, CMM: a stylus with a ball tip, and a ring spreading where it touches.
  const { probe } = HOUSING_EFFECT_ANCHORS;
  const stylus = new Group();
  const shaft = new LineSegments(
    keep(lineGeometry([
      [0, probe.ballRadius * 2, 0],
      [0, probe.ballRadius * 2 + probe.shaft, 0],
    ])),
    material(),
  );
  const ballFront = new LineLoop(keep(ringGeometry('xy')), material());
  const ballSide = new LineLoop(keep(ringGeometry('zy')), material());
  for (const ball of [ballFront, ballSide]) {
    ball.scale.setScalar(probe.ballRadius);
    ball.position.y = probe.ballRadius;
  }
  stylus.add(shaft, ballFront, ballSide);
  group.add(stylus);
  const contactRing = new LineLoop(keep(ringGeometry('xz')), material());
  contactRing.position.set(...probe.contact);
  group.add(contactRing);

  // Step 2, RoHS & REACH: a rectangle in the horizontal plane, lowered through the base block.
  const { screening } = HOUSING_EFFECT_ANCHORS;
  const plane = new LineLoop(
    keep(lineGeometry([
      [screening.x[0], 0, screening.z[0]],
      [screening.x[1], 0, screening.z[0]],
      [screening.x[1], 0, screening.z[1]],
      [screening.x[0], 0, screening.z[1]],
    ])),
    material(),
  );
  group.add(plane);

  // Step 3, salt spray: a nozzle, a faint fan outlining the spray, and streaks travelling along it onto the fitting.
  const { spray } = HOUSING_EFFECT_ANCHORS;
  const direction = spray.target.map((value, axis) => value - spray.nozzle[axis]!);
  const length = Math.hypot(...direction);
  const back = direction.map((value) => -value / length);
  const nozzleBody = new LineSegments(
    keep(lineGeometry([
      [spray.nozzle[0], spray.nozzle[1], spray.nozzle[2]],
      [spray.nozzle[0] + back[0]! * 0.09, spray.nozzle[1] + back[1]! * 0.09, spray.nozzle[2] + back[2]! * 0.09],
    ])),
    material(),
  );
  const nozzleMouth = new LineLoop(keep(ringGeometry('zy')), material());
  nozzleMouth.position.set(...spray.nozzle);
  nozzleMouth.scale.setScalar(0.014);
  const fanEnds = [
    [0, FAN_REACH],
    [0, -FAN_REACH],
    [FAN_REACH, 0],
    [-FAN_REACH, 0],
  ] as const;
  const fan = new LineSegments(
    keep(lineGeometry(
      fanEnds.flatMap(([dy, dz]): [number, number, number][] => [
        [spray.nozzle[0], spray.nozzle[1], spray.nozzle[2]],
        [spray.target[0], spray.target[1] + dy * spray.spread, spray.target[2] + dz * spray.spread],
      ]),
    )),
    material(),
  );
  group.add(nozzleBody, nozzleMouth, fan);
  const streakPositions = new Float32Array(SPRAY_PATHS.length * DROPLETS_PER_PATH * 6);
  const streakGeometry = keep(new BufferGeometry());
  streakGeometry.setAttribute('position', new Float32BufferAttribute(streakPositions, 3));
  const streaks = new LineSegments(streakGeometry, material());
  streaks.frustumCulled = false;
  group.add(streaks);

  return {
    update(frame) {
      const { stepProgress, reducedMotion } = frame;

      // The stylus comes down over the first 60% of the step, rests on the rim, and lifts away as the next step begins.
      let descent: number;
      if (reducedMotion) descent = frame.step === 0 ? 1 : 0;
      else if (frame.step === 0) descent = ramp(stepProgress, 0.05, 0.6);
      else if (frame.step === 1) descent = 1 - ramp(stepProgress, 0, 0.45);
      else descent = 0;
      stylus.position.set(probe.contact[0], probe.contact[1] + probe.travel * (1 - easeOut(descent)), probe.contact[2]);
      const stylusOpacity = frame.step === 0 ? 1 : frame.step === 1 ? 1 - ramp(stepProgress, 0.1, 0.45) : 0;
      for (const line of [shaft, ballFront, ballSide]) setOpacity(line, stylusOpacity);
      const contact = frame.step !== 0 ? 0 : reducedMotion ? 0.45 : ramp(stepProgress, 0.6, 1);
      contactRing.scale.set(0.02 + 0.11 * contact, 1, 0.02 + 0.11 * contact);
      setOpacity(contactRing, contact > 0 ? presence(frame, 0) * (1 - 0.75 * contact) : 0);

      const sweep = reducedMotion ? 0.5 : ramp(stepProgress, 0.08, 0.92);
      plane.position.y = screening.y[0] + (screening.y[1] - screening.y[0]) * sweep;
      setOpacity(plane, presence(frame, 1));

      const flow = reducedMotion ? 0.35 : stepProgress * 2.4;
      let offset = 0;
      SPRAY_PATHS.forEach(([dy, dz], pathIndex) => {
        const target = [spray.target[0], spray.target[1] + dy * spray.spread, spray.target[2] + dz * spray.spread];
        for (let droplet = 0; droplet < DROPLETS_PER_PATH; droplet += 1) {
          const head = (flow + droplet / DROPLETS_PER_PATH + pathIndex * 0.137) % 1;
          const tail = Math.max(0, head - DROPLET_LENGTH);
          for (const share of [tail, head]) {
            for (let axis = 0; axis < 3; axis += 1) {
              streakPositions[offset] = spray.nozzle[axis]! + (target[axis]! - spray.nozzle[axis]!) * share;
              offset += 1;
            }
          }
        }
      });
      streakGeometry.attributes.position!.needsUpdate = true;
      const sprayPresence = presence(frame, 2);
      setOpacity(streaks, sprayPresence);
      setOpacity(nozzleBody, sprayPresence);
      setOpacity(nozzleMouth, sprayPresence);
      setOpacity(fan, sprayPresence * 0.35);
    },
    dispose() {
      model.remove(group);
      for (const geometry of geometries) geometry.dispose();
      for (const item of materials) item.dispose();
    },
  };
}
