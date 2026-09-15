/**
 * WebGL renderer for the Textiles & Materials inspection process: one realistic scene of the fabric roll, the sheet
 * unrolled from it and the three inspection elements on that sheet, under a perspective camera on the figure's own
 * off-white ground, with soft shadows.
 *
 * Scrolling drives it through `textilesPose`: the camera starts on the whole roll and moves with the steps to a closer
 * three-quarter view of each element and holds there while that element moves (the tag lifts, the swatches rise one
 * after another, the fabric tears in from its edge). There are no callouts. It draws a frame whenever the pose or its size changes, and not
 * otherwise, since nothing moves on its own. The inspection groups are named and carry hit areas, so hover and click
 * can target them later.
 *
 * Loaded on demand when the visitor chooses Inspection process, so Three.js stays out of the page bundle. It shares
 * the inspection scene interface with the line drawings, so the page drives it the same way.
 */
import {
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  NeutralToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShadowMaterial,
  Vector3,
  WebGLRenderer,
} from 'three';

import type { InspectionScene, InspectionSceneOptions } from '@/components/inspection-drawing/scene';
import { TEXTILES_VIEW } from '@/lib/textiles-inspection/geometry';
import { textilesPose } from '@/lib/textiles-inspection/motion';

import { buildTextilesModel } from './model';

export type TextilesSceneOptions = Omit<InspectionSceneOptions, 'drawing' | 'effects'>;

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

export function createTextilesScene(options: TextilesSceneOptions): InspectionScene {
  const { canvas, palette, maxPixelRatio, onContextLost } = options;
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

  const scene = new Scene();
  const model = buildTextilesModel(renderer.capabilities.getMaxAnisotropy());
  scene.add(model.root);

  const ground = new Color().setRGB(palette.ground[0], palette.ground[1], palette.ground[2], SRGBColorSpace);

  // The figure's own ground shows through the canvas; this plane only catches the shadows on it.
  const shadowCatcher = new Mesh(new PlaneGeometry(10, 10), new ShadowMaterial({ color: new Color('#1B2335'), opacity: 0.17 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  const centre = new Vector3();
  for (const point of model.outline) centre.add(point);
  centre.divideScalar(model.outline.length);

  // Soft studio light: a warm key from above the near end casting the shadows, a cool fill from the far side, a rim
  // from behind to part the roll from the ground, and a hemisphere tinted by the figure's ground.
  scene.add(new HemisphereLight(new Color('#FFF8EE'), ground.clone().multiplyScalar(0.8), 1.15));
  const key = new DirectionalLight(new Color('#FFF1DE'), 2.3);
  key.position.copy(centre).add(new Vector3(-2.4, 3.6, 2.6));
  key.target.position.copy(centre);
  key.castShadow = true;
  const shadowSize = maxPixelRatio < 2 ? 1024 : 2048;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(key.shadow.camera, { left: -1.7, right: 1.7, top: 1.7, bottom: -1.7, near: 0.5, far: 12 });
  // Blurred edges, so the shadows on the ground stay soft.
  key.shadow.radius = 5;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.012;
  scene.add(key, key.target);
  const fill = new DirectionalLight(new Color('#E6ECFA'), 0.6);
  fill.position.copy(centre).add(new Vector3(2.8, 1.5, 2.2));
  scene.add(fill);
  const rim = new DirectionalLight(new Color('#FFFFFF'), 0.85);
  rim.position.copy(centre).add(new Vector3(0.6, 2.2, -3.2));
  scene.add(rim);

  const camera = new PerspectiveCamera(TEXTILES_VIEW.fovDeg, width / height, 0.05, 40);
  /** The opening view of the whole model, for the current size: the point it looks at and its distance. */
  const overview = { target: centre.clone(), distance: 1 };

  /** Fits the whole model along the opening three-quarter direction, as close as it allows, centred. */
  function fitOverview(): void {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const toCamera = direction(TEXTILES_VIEW.azimuthDeg, TEXTILES_VIEW.elevationDeg);
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
    const pose = textilesPose(progress);
    model.animate(pose);
    const { toward, zoom, azimuthDeg, elevationDeg } = pose.view;
    const moved = toward[0] + toward[1] + toward[2];
    target.copy(overview.target).multiplyScalar(1 - moved);
    model.areaCentres.forEach((area, index) => target.addScaledVector(area, toward[index]!));
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
      model.dispose();
      shadowCatcher.geometry.dispose();
      (shadowCatcher.material as ShadowMaterial).dispose();
      renderer.dispose();
    },
  };
}
