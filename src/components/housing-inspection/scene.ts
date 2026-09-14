/**
 * WebGL renderer for the Precision Hardware inspection drawing.
 *
 * Loaded on demand by HousingInspection.tsx when a visitor switches the category photograph to
 * the inspection view, and the only module in that feature that imports Three.js, so the library
 * stays out of the page bundle. The housing is drawn as a hidden-line technical drawing: every
 * solid is filled with the page ground colour so it hides the edges behind it, and only crease
 * edges are stroked. No lights, textures, shadows or post-processing.
 */
import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Path,
  Quaternion,
  SRGBColorSpace,
  Scene,
  Shape,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

import {
  HOUSING_SOLIDS,
  INSPECTION_MARKERS,
  REFERENCE_VIEW,
  housingBounds,
  type Point2,
  type Solid,
} from '@/lib/housing-inspection/geometry';

export type Rgb = readonly [number, number, number];

export interface InspectionPalette {
  /** Crease edges — the --foreground token. */
  readonly line: Rgb;
  /** Solid fill that hides edges behind it — the ground colour behind the figure. */
  readonly ground: Rgb;
  /** Edges of the part a highlighted protocol applies to — the --accent token. */
  readonly accent: Rgb;
}

export interface MarkerPosition {
  readonly protocol: number;
  /** Canvas pixels from the top-left corner. */
  readonly x: number;
  readonly y: number;
}

export interface HousingSceneOptions {
  readonly canvas: HTMLCanvasElement;
  readonly palette: InspectionPalette;
  readonly reducedMotion: boolean;
  readonly maxPixelRatio: number;
  /** Called after every drawn frame with each marker's position on the canvas. */
  readonly onMarkers: (positions: readonly MarkerPosition[]) => void;
  readonly onContextLost: () => void;
}

export interface HousingScene {
  resize(width: number, height: number): void;
  setHighlight(protocol: number | null): void;
  setReducedMotion(reduced: boolean): void;
  /** On screen and in a visible tab. The sway only runs while this is true. */
  setActive(active: boolean): void;
  dispose(): void;
}

/** Parts whose edges turn accent while their protocol is highlighted. */
const PROTOCOL_PARTS: Readonly<Record<number, readonly string[]>> = {
  0: ['top-plate', 'top-rim'],
  1: ['base-block', 'base-deck-left', 'base-deck-right'],
  2: ['fitting-collar', 'fitting-nipple'],
};

/** Crease angle in degrees above which an edge is stroked; smooth bore and rod walls stay clean. */
const EDGE_THRESHOLD = 24;
/**
 * Idle sway about the vertical axis. It centres on a resting turn, because at the photograph's own
 * angle the side fitting (the third inspection point) is edge-on; the rest is also the still frame
 * under reduced motion, so the fitting reads either way.
 */
const SWAY = { restDeg: -14, amplitudeDeg: 12, periodSeconds: 18 } as const;
const MAX_FRAME_DELTA = 0.1;
/** Space kept around the drawing, as a fraction of its projected size. */
const FRAME_PADDING = 1.1;
const DEG = Math.PI / 180;

function toColor([r, g, b]: Rgb): Color {
  return new Color().setRGB(r, g, b, SRGBColorSpace);
}

/** Plan outlines are (x, z); the slab is built in a plane rotated -90 degrees about X, where local y is world -z. */
function planPoint([x, z]: Point2): [number, number] {
  return [x, -z];
}

function toShape(outline: readonly Point2[], map: (point: Point2) => [number, number]): Shape {
  const shape = new Shape();
  outline.forEach((point, index) => {
    const [a, b] = map(point);
    if (index === 0) shape.moveTo(a, b);
    else shape.lineTo(a, b);
  });
  shape.closePath();
  return shape;
}

function toPath(loop: readonly Point2[], map: (point: Point2) => [number, number]): Path {
  const path = new Path();
  loop.forEach((point, index) => {
    const [a, b] = map(point);
    if (index === 0) path.moveTo(a, b);
    else path.lineTo(a, b);
  });
  path.closePath();
  return path;
}

interface BuiltSolid {
  readonly id: string;
  readonly lineMaterial: LineBasicMaterial;
}

function solidGeometry(solid: Solid): { geometry: BufferGeometry; place: (group: Group) => void } {
  switch (solid.kind) {
    case 'plan-prism': {
      const shape = toShape(solid.outline, planPoint);
      shape.holes = solid.holes.map((hole) => toPath(hole, planPoint));
      const geometry = new ExtrudeGeometry(shape, { depth: solid.height, bevelEnabled: false, steps: 1, curveSegments: 1 });
      return {
        geometry,
        place: (group) => {
          group.rotation.x = -Math.PI / 2;
          group.position.y = solid.y;
        },
      };
    }
    case 'front-prism': {
      const shape = toShape(solid.outline, ([x, y]) => [x, y]);
      const geometry = new ExtrudeGeometry(shape, { depth: solid.depth, bevelEnabled: false, steps: 1, curveSegments: 1 });
      return { geometry, place: (group) => group.position.set(0, 0, solid.z) };
    }
    case 'z-lathe': {
      const points = solid.profile.map(([radius, z]) => new Vector2(Math.max(radius, 1e-4), z));
      const geometry = new LatheGeometry(points, 64);
      return {
        geometry,
        // LatheGeometry revolves about local Y; +90 degrees about X turns that axis toward the viewer.
        place: (group) => {
          group.rotation.x = Math.PI / 2;
          group.position.set(solid.x, solid.y, 0);
        },
      };
    }
    case 'rod': {
      const start = new Vector3(...solid.start);
      const end = new Vector3(...solid.end);
      const direction = end.clone().sub(start);
      const geometry = new CylinderGeometry(solid.radius, solid.radius, direction.length(), 32);
      return {
        geometry,
        place: (group) => {
          group.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
          group.position.copy(start.clone().add(end).multiplyScalar(0.5));
        },
      };
    }
  }
}

export function createHousingScene(options: HousingSceneOptions): HousingScene {
  const { canvas, palette, maxPixelRatio, onMarkers, onContextLost } = options;
  let reducedMotion = options.reducedMotion;
  let active = false;
  let disposed = false;
  let highlight: number | null = null;
  let frameId = 0;
  let lastNow = 0;
  let time = 0;
  let width = Math.max(1, canvas.clientWidth);
  let height = Math.max(1, canvas.clientHeight);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);

  const colors = { line: toColor(palette.line), ground: toColor(palette.ground), accent: toColor(palette.accent) };
  const owned: Array<{ dispose(): unknown }> = [];
  const own = <T extends { dispose(): unknown }>(item: T): T => {
    owned.push(item);
    return item;
  };

  const scene = new Scene();
  // The sway pivots about the part's centre: the pivot turns, the model inside it is offset so its
  // bounds are centred on the pivot.
  const pivot = new Group();
  const model = new Group();
  pivot.add(model);
  scene.add(pivot);

  const bounds = housingBounds();
  const center = new Vector3(
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  );
  model.position.copy(center).multiplyScalar(-1);

  // Offset the fill away from the camera in depth, so edges lying on a face draw over it.
  const fill = own(
    new MeshBasicMaterial({ color: colors.ground, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  );

  const built: BuiltSolid[] = HOUSING_SOLIDS.map((solid) => {
    const { geometry, place } = solidGeometry(solid);
    own(geometry);
    const group = new Group();
    place(group);
    const mesh = new Mesh(geometry, fill);
    const lineMaterial = own(new LineBasicMaterial({ color: colors.line.clone() }));
    const lines = new LineSegments(own(new EdgesGeometry(geometry, EDGE_THRESHOLD)), lineMaterial);
    group.add(mesh, lines);
    model.add(group);
    return { id: solid.id, lineMaterial };
  });

  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const viewDirection = new Vector3(
    Math.sin(REFERENCE_VIEW.azimuthDeg * DEG) * Math.cos(REFERENCE_VIEW.elevationDeg * DEG),
    Math.sin(REFERENCE_VIEW.elevationDeg * DEG),
    Math.cos(REFERENCE_VIEW.azimuthDeg * DEG) * Math.cos(REFERENCE_VIEW.elevationDeg * DEG),
  );
  camera.position.copy(viewDirection).multiplyScalar(20);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  /** Projected half-size of the part across the whole sway, so turning never clips it. */
  const projectedHalfSize = (() => {
    const corners: Vector3[] = [];
    for (const x of [bounds.min[0], bounds.max[0]]) {
      for (const y of [bounds.min[1], bounds.max[1]]) {
        for (const z of [bounds.min[2], bounds.max[2]]) corners.push(new Vector3(x, y, z).sub(center));
      }
    }
    const toView = camera.matrixWorldInverse;
    let halfX = 0;
    let halfY = 0;
    // A box's projected extent does not peak only at the ends of the swing, so sample across it.
    for (let yaw = SWAY.restDeg - SWAY.amplitudeDeg; yaw <= SWAY.restDeg + SWAY.amplitudeDeg; yaw += 2) {
      for (const corner of corners) {
        const p = corner.clone().applyAxisAngle(new Vector3(0, 1, 0), yaw * DEG).applyMatrix4(toView);
        halfX = Math.max(halfX, Math.abs(p.x));
        halfY = Math.max(halfY, Math.abs(p.y));
      }
    }
    return { x: halfX * FRAME_PADDING, y: halfY * FRAME_PADDING };
  })();

  function fitCamera(): void {
    const aspect = width / height;
    let halfWidth = projectedHalfSize.x;
    let halfHeight = projectedHalfSize.y;
    if (aspect > halfWidth / halfHeight) halfWidth = halfHeight * aspect;
    else halfHeight = halfWidth / aspect;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  }

  function applySize(): void {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    renderer.setSize(width, height, false);
    fitCamera();
  }

  function applyHighlight(): void {
    const parts = highlight === null ? [] : PROTOCOL_PARTS[highlight] ?? [];
    for (const solid of built) solid.lineMaterial.color.copy(parts.includes(solid.id) ? colors.accent : colors.line);
  }

  const marker = new Vector3();
  function reportMarkers(): void {
    pivot.updateMatrixWorld();
    onMarkers(
      INSPECTION_MARKERS.map(({ protocol, anchor }) => {
        marker.set(anchor[0], anchor[1], anchor[2]).applyMatrix4(model.matrixWorld).project(camera);
        return { protocol, x: ((marker.x + 1) / 2) * width, y: ((1 - marker.y) / 2) * height };
      }),
    );
  }

  function draw(): void {
    if (disposed) return;
    const sway = reducedMotion ? 0 : SWAY.amplitudeDeg * Math.sin((2 * Math.PI * time) / SWAY.periodSeconds);
    pivot.rotation.y = (SWAY.restDeg + sway) * DEG;
    renderer.render(scene, camera);
    reportMarkers();
  }

  function frame(now: number): void {
    const delta = lastNow === 0 ? 0 : Math.min((now - lastNow) / 1000, MAX_FRAME_DELTA);
    lastNow = now;
    time += delta;
    draw();
    frameId = requestAnimationFrame(frame);
  }

  function stopLoop(): void {
    if (frameId !== 0) cancelAnimationFrame(frameId);
    frameId = 0;
    lastNow = 0;
  }

  function sync(): void {
    if (disposed) return;
    if (active && !reducedMotion) {
      if (frameId === 0) frameId = requestAnimationFrame(frame);
      return;
    }
    stopLoop();
    draw();
  }

  function handleContextLost(event: Event): void {
    event.preventDefault();
    stopLoop();
    onContextLost();
  }
  canvas.addEventListener('webglcontextlost', handleContextLost);

  applyHighlight();
  applySize();
  draw();

  return {
    resize(nextWidth, nextHeight) {
      if (disposed || nextWidth < 1 || nextHeight < 1) return;
      width = nextWidth;
      height = nextHeight;
      applySize();
      if (frameId === 0) draw();
    },
    setHighlight(protocol) {
      highlight = protocol;
      applyHighlight();
      if (frameId === 0) draw();
    },
    setReducedMotion(reduced) {
      reducedMotion = reduced;
      sync();
    },
    setActive(next) {
      active = next;
      sync();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopLoop();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      scene.remove(pivot);
      for (const item of owned) item.dispose();
      renderer.dispose();
    },
  };
}
