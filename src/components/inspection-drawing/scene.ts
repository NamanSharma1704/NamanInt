/**
 * WebGL renderer shared by the Categories inspection sequences.
 *
 * Loaded on demand when a visitor reaches a sequence, and the only module in these features that
 * imports Three.js, so the library stays out of the page bundle. Parts are drawn as a hidden-line
 * technical drawing: every solid is filled with the page ground colour so it hides the edges behind
 * it, and only crease edges are stroked. Printed marks can be filled with the line colour instead. No
 * lights, textures, shadows or post-processing.
 *
 * Scrolling sets the sequence progress: the drawing turns toward each step's inspection point and the
 * drawing's effects play that step out. A slow idle sway runs on top while the drawing is on screen.
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
  applyFrame,
  modelHullPoints,
  sequenceYaw,
  solidBounds,
  stepForProgress,
  stepProgress as progressWithinStep,
  type InspectionDrawing,
  type Point2,
  type Solid,
} from '@/lib/inspection-drawing/solids';

export type Rgb = readonly [number, number, number];

export interface InspectionPalette {
  /** Crease edges and printed marks: the --foreground token. */
  readonly line: Rgb;
  /** Solid fill that hides edges behind it: the ground colour behind the figure. */
  readonly ground: Rgb;
  /** Edges of the parts a highlighted protocol applies to, and drawn effects: the gold ink. */
  readonly accent: Rgb;
}

export interface MarkerPosition {
  readonly protocol: number;
  /** Canvas pixels from the top-left corner. */
  readonly x: number;
  readonly y: number;
}

export interface EffectContext {
  /** Model space: anything added here turns with the drawing. */
  readonly model: Group;
  readonly colors: { readonly line: Color; readonly ground: Color; readonly accent: Color };
  /** Each solid's holder group by id, for effects that move a part, such as a carton lowered for a drop. */
  readonly parts: ReadonlyMap<string, Group>;
}

export interface EffectFrame {
  /** Seconds the render loop has run. It stands still off screen and under reduced motion. */
  readonly time: number;
  /** Sequence progress in [0, 1], set by scrolling. */
  readonly progress: number;
  readonly step: number;
  /** Progress within the current step, in [0, 1]. */
  readonly stepProgress: number;
  readonly highlight: number | null;
  readonly reducedMotion: boolean;
}

export interface SceneEffects {
  /** Runs before every drawn frame. */
  update(frame: EffectFrame): void;
  dispose(): void;
}

export interface InspectionSceneOptions {
  readonly canvas: HTMLCanvasElement;
  readonly drawing: InspectionDrawing;
  readonly palette: InspectionPalette;
  readonly reducedMotion: boolean;
  readonly maxPixelRatio: number;
  /** Called after every drawn frame with each marker's position on the canvas. */
  readonly onMarkers: (positions: readonly MarkerPosition[]) => void;
  readonly onContextLost: () => void;
  /** Animated annotation drawn into the model, such as impact rings or a scan line. */
  readonly effects?: (context: EffectContext) => SceneEffects;
}

export interface InspectionScene {
  resize(width: number, height: number): void;
  setHighlight(protocol: number | null): void;
  /** Sequence progress in [0, 1]. The caller settles it on step middles under reduced motion. */
  setProgress(progress: number): void;
  setReducedMotion(reduced: boolean): void;
  /** On screen and in a visible tab. The idle sway only runs while this is true. */
  setActive(active: boolean): void;
  dispose(): void;
}

/** Crease angle in degrees above which an edge is stroked; smooth bore and rod walls stay clean. */
const EDGE_THRESHOLD = 24;
const MAX_FRAME_DELTA = 0.1;
/** Space kept around the drawing, as a fraction of its projected size; enough for the marker balloons at its edges. */
const FRAME_PADDING = 1.14;
const DEG = Math.PI / 180;

function toColor([r, g, b]: Rgb): Color {
  return new Color().setRGB(r, g, b, SRGBColorSpace);
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

/** Plan outlines are (x, z); the slab is built in a plane rotated -90 degrees about X, where local y is world -z. */
const planPoint = ([x, z]: Point2): [number, number] => [x, -z];
/** Side outlines are (z, y); the slab is built in a plane rotated +90 degrees about Y, where local x is world -z. */
const sidePoint = ([z, y]: Point2): [number, number] => [-z, y];

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
    case 'side-prism': {
      const shape = toShape(solid.outline, sidePoint);
      shape.holes = solid.holes.map((hole) => toPath(hole, sidePoint));
      const geometry = new ExtrudeGeometry(shape, { depth: solid.width, bevelEnabled: false, steps: 1, curveSegments: 1 });
      return {
        geometry,
        place: (group) => {
          group.rotation.y = Math.PI / 2;
          group.position.x = solid.x;
        },
      };
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

interface BuiltSolid {
  readonly id: string;
  readonly lineMaterial: LineBasicMaterial;
  /** Only for line-filled solids, whose fill follows the highlight too. */
  readonly inkMaterial: MeshBasicMaterial | null;
}

export function createInspectionScene(options: InspectionSceneOptions): InspectionScene {
  const { canvas, drawing, palette, maxPixelRatio, onMarkers, onContextLost } = options;
  const { stepYawDeg, idleSwayDeg, idlePeriodSeconds } = drawing.sequence;
  const stepCount = Math.max(1, stepYawDeg.length);
  let reducedMotion = options.reducedMotion;
  let active = false;
  let disposed = false;
  let highlight: number | null = null;
  let progress = 0;
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
  // The drawing turns about its centre: the pivot turns, the model inside it is offset so its bounds
  // are centred on the pivot.
  const pivot = new Group();
  const model = new Group();
  pivot.add(model);
  scene.add(pivot);

  const bounds = solidBounds(drawing.solids, drawing.framingPoints);
  const center = new Vector3(
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  );
  model.position.copy(center).multiplyScalar(-1);

  // Offset the fills away from the camera in depth, so edges lying on a face draw over them.
  const fillOptions = { side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 } as const;
  const fill = own(new MeshBasicMaterial({ color: colors.ground, ...fillOptions }));
  const parts = new Map<string, Group>();

  const built: BuiltSolid[] = drawing.solids.map((solid) => {
    const { geometry, place } = solidGeometry(solid);
    own(geometry);
    const holder = new Group();
    if (solid.frame) {
      holder.position.set(...solid.frame.position);
      holder.rotation.set(...solid.frame.rotation);
    }
    const group = new Group();
    place(group);
    const inkMaterial = solid.fill === 'line' ? own(new MeshBasicMaterial({ color: colors.line.clone(), ...fillOptions })) : null;
    const lineMaterial = own(new LineBasicMaterial({ color: colors.line.clone() }));
    group.add(new Mesh(geometry, inkMaterial ?? fill));
    // A printed mark is already filled with the line colour; stroking its outline as well would
    // thicken bars that are only a pixel or two wide until they merge.
    if (!inkMaterial) group.add(new LineSegments(own(new EdgesGeometry(geometry, EDGE_THRESHOLD)), lineMaterial));
    holder.add(group);
    model.add(holder);
    parts.set(solid.id, holder);
    return { id: solid.id, lineMaterial, inkMaterial };
  });

  const effects = options.effects?.({ model, colors, parts }) ?? null;

  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const viewDirection = new Vector3(
    Math.sin(drawing.view.azimuthDeg * DEG) * Math.cos(drawing.view.elevationDeg * DEG),
    Math.sin(drawing.view.elevationDeg * DEG),
    Math.cos(drawing.view.azimuthDeg * DEG) * Math.cos(drawing.view.elevationDeg * DEG),
  );
  camera.position.copy(viewDirection).multiplyScalar(20);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  /** Projected half-size of the drawing across every turn the sequence and sway reach, so turning never clips it. */
  const projectedHalfSize = (() => {
    // The solids' own hull points rather than their bounding box's corners: a turned box's corners reach well past
    // the part, which left the drawing small in its frame.
    const corners = modelHullPoints(drawing.solids, drawing.framingPoints).map(([x, y, z]) => new Vector3(x, y, z).sub(center));
    const toView = camera.matrixWorldInverse;
    const lowest = Math.min(...stepYawDeg, 0) - idleSwayDeg;
    const highest = Math.max(...stepYawDeg, 0) + idleSwayDeg;
    let halfX = 0;
    let halfY = 0;
    // The projected extent does not peak only at the ends of the swing, so sample across it.
    for (let yaw = lowest; ; yaw = Math.min(highest, yaw + 2)) {
      for (const corner of corners) {
        const p = corner.clone().applyAxisAngle(new Vector3(0, 1, 0), yaw * DEG).applyMatrix4(toView);
        halfX = Math.max(halfX, Math.abs(p.x));
        halfY = Math.max(halfY, Math.abs(p.y));
      }
      if (yaw >= highest) break;
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
    const highlighted = highlight === null ? [] : drawing.protocolParts[highlight] ?? [];
    for (const solid of built) {
      const colour = highlighted.includes(solid.id) ? colors.accent : colors.line;
      solid.lineMaterial.color.copy(colour);
      solid.inkMaterial?.color.copy(colour);
    }
  }

  const marker = new Vector3();
  function reportMarkers(): void {
    pivot.updateMatrixWorld();
    onMarkers(
      drawing.markers.map(({ protocol, anchor, frame }) => {
        // A framed body can be moved by an effect, so its anchor follows the body's holder rather than its authored frame.
        const holder = frame ? built.find((_, index) => drawing.solids[index]?.frame === frame) : undefined;
        if (frame && holder) {
          const group = parts.get(holder.id)!;
          marker.set(anchor[0], anchor[1], anchor[2]).applyMatrix4(group.matrixWorld);
        } else {
          const point = frame ? applyFrame(anchor, frame) : anchor;
          marker.set(point[0], point[1], point[2]).applyMatrix4(model.matrixWorld);
        }
        marker.project(camera);
        return { protocol, x: ((marker.x + 1) / 2) * width, y: ((1 - marker.y) / 2) * height };
      }),
    );
  }

  function draw(): void {
    if (disposed) return;
    const idle = reducedMotion ? 0 : idleSwayDeg * Math.sin((2 * Math.PI * time) / idlePeriodSeconds);
    pivot.rotation.y = (sequenceYaw(stepYawDeg, progress) + idle) * DEG;
    effects?.update({
      time,
      progress,
      step: stepForProgress(progress, stepCount),
      stepProgress: progressWithinStep(progress, stepCount),
      highlight,
      reducedMotion,
    });
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
    setProgress(next) {
      progress = Math.min(1, Math.max(0, next));
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
      effects?.dispose();
      for (const item of owned) item.dispose();
      renderer.dispose();
    },
  };
}
