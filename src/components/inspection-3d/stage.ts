/**
 * The shared stage for the realistic inspection scenes: a WebGL renderer on the figure's own off-white ground, soft
 * studio light, and one perspective camera that scroll progress moves from the whole model to each inspection area.
 *
 * A scene gives the stage its model (a root, the points that outline it, the centre of each inspection area, and how
 * to pose it for a progress) and where the camera looks at each progress. Everything else is the same between them:
 * the lights sized to the model, the shadow catcher, the fit along a fixed direction, and drawing only when the pose
 * or the size changes, since nothing moves on its own.
 */
import {
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  NeutralToneMapping,
  Object3D,
  PCFShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShadowMaterial,
  Vector3,
  WebGLRenderer,
  type WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import type { InspectionScene, InspectionSceneOptions } from '@/components/inspection-drawing/scene';

/** Where the camera looks: how far its target moves toward each inspection area, how close it comes as a share of the
 * whole-model distance, and the direction it looks from. */
export interface StageView {
  readonly toward: readonly number[];
  readonly zoom: number;
  readonly azimuthDeg: number;
  readonly elevationDeg: number;
}

export interface StageModel {
  readonly root: Object3D;
  /** Points that outline the model, for framing the camera. */
  readonly outline: readonly Vector3[];
  /** The centre of each inspection area, in protocol order. */
  readonly areaCentres: readonly Vector3[];
  /** Poses the model for a scroll progress. */
  animate(progress: number): void;
  dispose(): void;
}

export type StageOptions = Omit<InspectionSceneOptions, 'drawing' | 'effects'> & {
  /** The opening three-quarter view of the whole model. */
  readonly view: { readonly fovDeg: number; readonly azimuthDeg: number; readonly elevationDeg: number };
  /**
   * How strongly a studio environment lights the model, for scenes with metal or glass in them: without one, a metal
   * has nothing to reflect and renders black. Left out, the lights below are the only light.
   */
  readonly environment?: number;
  build(maxAnisotropy: number): StageModel;
  camera(progress: number): StageView;
};

const DEG = Math.PI / 180;
/** Space kept around the whole model in the opening view, as a share of the view. */
const MARGIN = 1.1;

function direction(azimuthDeg: number, elevationDeg: number): Vector3 {
  return new Vector3(
    Math.sin(azimuthDeg * DEG) * Math.cos(elevationDeg * DEG),
    Math.sin(elevationDeg * DEG),
    Math.cos(azimuthDeg * DEG) * Math.cos(elevationDeg * DEG),
  ).normalize();
}

export function createInspectionStage(options: StageOptions): InspectionScene {
  const { canvas, palette, maxPixelRatio, onContextLost, view, build, camera: cameraFor } = options;
  let width = Math.max(1, canvas.clientWidth);
  let height = Math.max(1, canvas.clientHeight);
  let progress = 0;
  let active = false;
  let disposed = false;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  // A liquid is clipped at its own surface, so each vessel holds a level of its own.
  renderer.localClippingEnabled = true;

  const scene = new Scene();
  let environment: WebGLRenderTarget | null = null;
  if (options.environment) {
    const generator = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = generator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = options.environment;
    room.dispose();
    generator.dispose();
  }
  const model = build(renderer.capabilities.getMaxAnisotropy());
  scene.add(model.root);

  const centre = new Vector3();
  for (const point of model.outline) centre.add(point);
  centre.divideScalar(model.outline.length);
  /** How far the model reaches from its centre: the lights, the shadows and the camera are all sized from this. */
  const reach = Math.max(0.05, ...model.outline.map((point) => point.distanceTo(centre)));

  const ground = new Color().setRGB(palette.ground[0], palette.ground[1], palette.ground[2], SRGBColorSpace);

  // The figure's own ground shows through the canvas; this plane only catches the shadows on it.
  const shadowCatcher = new Mesh(new PlaneGeometry(20 * reach, 20 * reach), new ShadowMaterial({ color: new Color('#1B2335'), opacity: 0.17 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  // Soft studio light: a warm key from above the near end casting the shadows, a cool fill from the far side, a rim
  // from behind to part the model from the ground, and a hemisphere tinted by the figure's ground.
  scene.add(new HemisphereLight(new Color('#FFF8EE'), ground.clone().multiplyScalar(0.8), 1.15));
  const key = new DirectionalLight(new Color('#FFF1DE'), 2.3);
  key.position.copy(centre).addScaledVector(new Vector3(-0.47, 0.71, 0.51), 3.2 * reach);
  key.target.position.copy(centre);
  key.castShadow = true;
  const shadowSize = maxPixelRatio < 2 ? 1024 : 2048;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  const span = 1.15 * reach;
  Object.assign(key.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 0.3 * reach, far: 7 * reach });
  // Blurred edges, so the shadows on the ground stay soft.
  key.shadow.radius = 5;
  key.shadow.bias = -0.00025 * reach;
  key.shadow.normalBias = 0.008 * reach;
  scene.add(key, key.target);
  const fill = new DirectionalLight(new Color('#E6ECFA'), 0.6);
  fill.position.copy(centre).addScaledVector(new Vector3(0.72, 0.39, 0.57), 2.4 * reach);
  scene.add(fill);
  const rim = new DirectionalLight(new Color('#FFFFFF'), 0.85);
  rim.position.copy(centre).addScaledVector(new Vector3(0.16, 0.6, -0.87), 2.5 * reach);
  scene.add(rim);

  const camera = new PerspectiveCamera(view.fovDeg, width / height, 0.02 * reach, 30 * reach);
  /** The opening view of the whole model, for the current size: the point it looks at and its distance. */
  const overview = { target: centre.clone(), distance: 1 };

  /** Fits the whole model along the opening three-quarter direction, as close as it allows, centred. */
  function fitOverview(): void {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const toCamera = direction(view.azimuthDeg, view.elevationDeg);
    const tanV = Math.tan((camera.fov * DEG) / 2);
    const tanH = tanV * camera.aspect;
    const forward = toCamera.clone().negate();
    const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
    const up = new Vector3().crossVectors(right, forward);
    const target = centre.clone();
    let distance = 1;
    for (let pass = 0; pass < 3; pass += 1) {
      distance = 0;
      for (const point of model.outline) {
        const offset = point.clone().sub(target);
        const toward = offset.dot(toCamera);
        distance = Math.max(distance, toward + (MARGIN * Math.abs(offset.dot(right))) / tanH, toward + (MARGIN * Math.abs(offset.dot(up))) / tanV);
      }
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const point of model.outline) {
        const offset = point.clone().sub(target);
        const depth = distance - offset.dot(toCamera);
        minX = Math.min(minX, offset.dot(right) / depth);
        maxX = Math.max(maxX, offset.dot(right) / depth);
        minY = Math.min(minY, offset.dot(up) / depth);
        maxY = Math.max(maxY, offset.dot(up) / depth);
      }
      target.addScaledVector(right, ((minX + maxX) / 2) * distance).addScaledVector(up, ((minY + maxY) / 2) * distance);
    }
    overview.target.copy(target);
    overview.distance = distance;
  }

  const target = new Vector3();
  /** Puts the model and the camera in the pose for the current progress. */
  function applyPose(): void {
    model.animate(progress);
    const { toward, zoom, azimuthDeg, elevationDeg } = cameraFor(progress);
    const moved = toward.reduce((sum, weight) => sum + weight, 0);
    target.copy(overview.target).multiplyScalar(1 - moved);
    model.areaCentres.forEach((area, index) => target.addScaledVector(area, toward[index] ?? 0));
    camera.position.copy(target).addScaledVector(direction(azimuthDeg, elevationDeg), overview.distance * zoom);
    camera.lookAt(target);
  }

  function draw(): void {
    if (disposed) return;
    renderer.render(scene, camera);
  }

  function applySize(): void {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    renderer.setSize(width, height, false);
    fitOverview();
    applyPose();
  }

  function handleContextLost(event: Event): void {
    event.preventDefault();
    onContextLost();
  }
  canvas.addEventListener('webglcontextlost', handleContextLost);

  applySize();
  draw();

  return {
    resize(nextWidth, nextHeight) {
      if (disposed || nextWidth < 1 || nextHeight < 1) return;
      width = nextWidth;
      height = nextHeight;
      applySize();
      draw();
    },
    // The step list names each element; the scene shows the step through the pose, so the highlight adds nothing.
    setHighlight() {},
    setProgress(next) {
      const clamped = Math.min(1, Math.max(0, next));
      if (clamped === progress || disposed) return;
      progress = clamped;
      applyPose();
      draw();
    },
    // The page already settles progress on each step's middle under reduced motion, and nothing moves on its own.
    setReducedMotion() {},
    setActive(next) {
      if (next && !active) draw();
      active = next;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      scene.clear();
      scene.environment = null;
      environment?.dispose();
      model.dispose();
      shadowCatcher.geometry.dispose();
      (shadowCatcher.material as ShadowMaterial).dispose();
      renderer.dispose();
    },
  };
}
