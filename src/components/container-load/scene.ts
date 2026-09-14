/**
 * WebGL renderer for the Trade Services container load sequence.
 *
 * ContainerLoadSequence.tsx loads it on demand, and it is the only module in that feature that imports Three.js.
 *
 * The container is a hidden-line drawing, like the Categories inspection drawing. Every solid is filled with the
 * section's ground colour, so it hides the lines behind it, and only crease edges are stroked. Cartons are champagne.
 *
 * Scrolling drives it: the component hands over progress, and the scene draws at most one frame per animation frame.
 * There is no clock and no loop.
 */
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Path,
  Quaternion,
  SRGBColorSpace,
  Scene,
  Shape,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';

import {
  BODY_SOLIDS,
  CARTON,
  CARTON_COUNT,
  DOOR_LEAVES,
  DOOR_OPEN_DEG,
  FRAME_CENTRE,
  GROUND_MARKS,
  LOADING_PATH,
  RIG_LINES,
  RIG_SOLIDS,
  cameraBasis,
  cartonPose,
  cartonSlot,
  doorRotation,
  frameExtent,
  sequenceState,
  type Point2,
  type Segment3,
  type Solid,
  type Vec3,
} from '@/lib/container-load/geometry';

export type Rgb = readonly [number, number, number];

export interface LoadPalette {
  /** Structure edges: the --foreground token. */
  readonly line: Rgb;
  /** Solid fill that hides lines behind it: the section's own background. */
  readonly ground: Rgb;
  /** Carton fills: the --gold-soft token, a kraft champagne that reads as cardboard. */
  readonly accent: Rgb;
  /** Landing marks and the loading path: the --accent-on-tint gold ink, which holds up as a hairline on a light ground. */
  readonly accentLine: Rgb;
}

export interface ContainerLoadSceneOptions {
  readonly canvas: HTMLCanvasElement;
  readonly palette: LoadPalette;
  readonly maxPixelRatio: number;
  readonly onContextLost: () => void;
}

export interface ContainerLoadScene {
  resize(width: number, height: number): void;
  /** Scroll progress through the section, 0 to 1. */
  setProgress(progress: number): void;
  dispose(): void;
}

/**
 * Parts faded to phantom lines once loading starts, so the whole load stays visible, including after the doors close
 * on it.
 */
const CUTAWAY_IDS = new Set(['roof-panel', 'side-wall-near', 'top-side-rail-near']);
/**
 * The near door leaf fades with them only while it stands open, because folded back beside the near wall it hides the
 * cartons behind the door opening. It turns solid again as it closes, so the closed doors read with their bars.
 */
const CUTAWAY_LEAF_SIDE = 1;
const CUTAWAY_PHASE: readonly [number, number] = [0.42, 0.47];
/** Low enough that the near wall's corrugation creases don't hatch over the load. */
const PHANTOM_LINE_OPACITY = 0.12;
/** Cartons can be mid-slide at once; this bounds the per-frame edge buffer. */
const MAX_IN_FLIGHT = 24;
/** Crease angle, in degrees, above which an edge is stroked. The ring hooks stay clean. */
const EDGE_THRESHOLD = 20;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function toColor([r, g, b]: Rgb): Color {
  return new Color().setRGB(r, g, b, SRGBColorSpace);
}

function shapeFrom(points: readonly Point2[], map: (point: Point2) => [number, number]): Shape {
  const shape = new Shape();
  points.forEach((point, index) => {
    const [a, b] = map(point);
    if (index === 0) shape.moveTo(a, b);
    else shape.lineTo(a, b);
  });
  shape.closePath();
  return shape;
}

function pathFrom(points: readonly Point2[]): Path {
  const path = new Path();
  points.forEach(([a, b], index) => (index === 0 ? path.moveTo(a, b) : path.lineTo(a, b)));
  path.closePath();
  return path;
}

/** Geometry for one solid, already in container coordinates. */
function solidGeometry(solid: Solid): BufferGeometry {
  switch (solid.kind) {
    case 'box':
      return new BoxGeometry(...solid.size).translate(...solid.centre);
    case 'plan-prism':
      // A plan outline in (x, z) is drawn in (x, -z), extruded along +Z, then turned -90 degrees about X so the
      // extrusion points up.
      return new ExtrudeGeometry(shapeFrom(solid.outline, ([x, z]) => [x, -z]), { depth: solid.height, bevelEnabled: false, curveSegments: 1 })
        .rotateX(-Math.PI / 2)
        .translate(0, solid.y, 0);
    case 'side-prism': {
      const shape = shapeFrom(solid.outline, ([x, y]) => [x, y]);
      shape.holes = solid.holes.map(pathFrom);
      return new ExtrudeGeometry(shape, { depth: solid.depth, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, solid.z);
    }
    case 'ring':
      return new TorusGeometry(solid.radius, solid.tube, 6, 16).translate(...solid.centre);
  }
}

function segmentGeometry(segments: readonly Segment3[]): BufferGeometry {
  const positions = new Float32Array(segments.length * 6);
  segments.forEach(({ start, end }, index) => {
    positions.set(start, index * 6);
    positions.set(end, index * 6 + 3);
  });
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(positions, 3));
}

/** The 12 edges of a box as 24 vertices, written into `target` at `offset`. */
function writeBoxEdges(target: Float32Array, offset: number, [cx, cy, cz]: Vec3, [sx, sy, sz]: Vec3): void {
  const x = [cx - sx / 2, cx + sx / 2];
  const y = [cy - sy / 2, cy + sy / 2];
  const z = [cz - sz / 2, cz + sz / 2];
  const corners: Vec3[] = [];
  for (const i of [0, 1]) for (const j of [0, 1]) for (const k of [0, 1]) corners.push([x[i]!, y[j]!, z[k]!]);
  // Pairs of corner indices differing in exactly one axis.
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  edges.forEach(([a, b], index) => {
    target.set(corners[a!]!, offset + index * 6);
    target.set(corners[b!]!, offset + index * 6 + 3);
  });
}

export function createContainerLoadScene(options: ContainerLoadSceneOptions): ContainerLoadScene {
  const { canvas, palette, maxPixelRatio, onContextLost } = options;
  let disposed = false;
  let progress = 0;
  let frameId = 0;
  let width = Math.max(1, canvas.clientWidth);
  let height = Math.max(1, canvas.clientHeight);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);

  const colors = {
    line: toColor(palette.line),
    ground: toColor(palette.ground),
    accent: toColor(palette.accent),
    accentLine: toColor(palette.accentLine),
  };
  const owned: Array<{ dispose(): unknown }> = [];
  const own = <T extends { dispose(): unknown }>(item: T): T => {
    owned.push(item);
    return item;
  };

  const fillMaterial = (color: Color): MeshBasicMaterial =>
    own(new MeshBasicMaterial({ color, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
  const lineMaterial = (color: Color, opacity = 1): LineBasicMaterial =>
    own(new LineBasicMaterial({ color, transparent: opacity < 1, opacity }));

  const fill = fillMaterial(colors.ground);
  const edges = lineMaterial(colors.line);
  // Cutaway parts get their own materials, so they can fade to phantom lines without touching the rest.
  const cutawayFill = own(fill.clone());
  cutawayFill.transparent = true;
  const cutawayEdges = lineMaterial(colors.line, 1);
  cutawayEdges.transparent = true;
  const leafFill = own(fill.clone());
  leafFill.transparent = true;
  const leafEdges = lineMaterial(colors.line, 1);
  leafEdges.transparent = true;
  const finishes = {
    solid: [fill, edges],
    cutaway: [cutawayFill, cutawayEdges],
    leaf: [leafFill, leafEdges],
  } as const;

  const addSolid = (parent: Group, solid: Solid, finish: keyof typeof finishes = 'solid'): void => {
    const [fillMaterial, edgeMaterial] = finishes[finish];
    const geometry = own(solidGeometry(solid));
    parent.add(new Mesh(geometry, fillMaterial), new LineSegments(own(new EdgesGeometry(geometry, EDGE_THRESHOLD)), edgeMaterial));
  };

  const scene = new Scene();

  const container = new Group();
  for (const solid of BODY_SOLIDS) addSolid(container, solid, CUTAWAY_IDS.has(solid.id) ? 'cutaway' : 'solid');
  const hinges = DOOR_LEAVES.map((leaf) => {
    const hinge = new Group();
    hinge.position.set(...leaf.hinge);
    for (const solid of leaf.solids) addSolid(hinge, solid, leaf.side === CUTAWAY_LEAF_SIDE ? 'leaf' : 'solid');
    container.add(hinge);
    return { hinge, side: leaf.side };
  });
  scene.add(container);

  const rig = new Group();
  for (const solid of RIG_SOLIDS) addSolid(rig, solid);
  rig.add(new LineSegments(own(segmentGeometry(RIG_LINES)), edges));
  scene.add(rig);

  const marks = new LineSegments(own(segmentGeometry(GROUND_MARKS)), lineMaterial(colors.accentLine));
  const pathMaterial = lineMaterial(colors.accentLine, 1);
  pathMaterial.transparent = true;
  const loadingPath = new LineSegments(own(segmentGeometry(LOADING_PATH)), pathMaterial);
  scene.add(marks, loadingPath);

  // Cartons: champagne fills instanced in load order, with edges in the ground colour so stacked cartons read as blocks.
  // Placed cartons never move again, so their edges are written once in load order and revealed with a draw range.
  // Cartons still sliding in get a small buffer rewritten each frame.
  const cartonSize: Vec3 = [CARTON.length, CARTON.height, CARTON.width];
  const cartons = new InstancedMesh(own(new BoxGeometry(...cartonSize)), fillMaterial(colors.accent), CARTON_COUNT);
  cartons.count = 0;
  cartons.frustumCulled = false;
  scene.add(cartons);

  const placedPositions = new Float32Array(CARTON_COUNT * 24 * 3);
  for (let index = 0; index < CARTON_COUNT; index += 1) writeBoxEdges(placedPositions, index * 72, cartonSlot(index), cartonSize);
  const placedEdgeGeometry = own(new BufferGeometry().setAttribute('position', new Float32BufferAttribute(placedPositions, 3)));
  placedEdgeGeometry.setDrawRange(0, 0);
  const cartonEdgeMaterial = lineMaterial(colors.ground);
  const placedEdges = new LineSegments(placedEdgeGeometry, cartonEdgeMaterial);
  placedEdges.frustumCulled = false;

  // Float32BufferAttribute copies the array it is given, so per-frame writes go into the attribute's own array.
  const flightAttribute = new Float32BufferAttribute(new Float32Array(MAX_IN_FLIGHT * 24 * 3), 3);
  const flightPositions = flightAttribute.array as Float32Array;
  const flightEdgeGeometry = own(new BufferGeometry().setAttribute('position', flightAttribute));
  flightEdgeGeometry.setDrawRange(0, 0);
  const flightEdges = new LineSegments(flightEdgeGeometry, cartonEdgeMaterial);
  flightEdges.frustumCulled = false;
  scene.add(placedEdges, flightEdges);

  const basis = cameraBasis();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(...FRAME_CENTRE).addScaledVector(new Vector3(...basis.direction), 40);
  camera.up.set(0, 1, 0);
  camera.lookAt(...FRAME_CENTRE);
  camera.updateMatrixWorld();
  const extent = frameExtent(basis);

  /** Fit the frame box to the canvas, widening the shorter axis about its centre, as the SVG's `meet` does. */
  function fitCamera(): void {
    let { left, right, bottom, top } = extent;
    const frameAspect = (right - left) / (top - bottom);
    const aspect = width / height;
    if (aspect > frameAspect) {
      const extra = ((top - bottom) * aspect - (right - left)) / 2;
      left -= extra;
      right += extra;
    } else {
      const extra = ((right - left) / aspect - (top - bottom)) / 2;
      bottom -= extra;
      top += extra;
    }
    Object.assign(camera, { left, right, bottom, top });
    camera.updateProjectionMatrix();
  }

  const matrix = new Matrix4();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const position = new Vector3();

  function draw(): void {
    frameId = 0;
    if (disposed) return;
    const state = sequenceState(progress);
    const yaw = (state.yawDeg * Math.PI) / 180;

    container.position.y = state.containerY;
    container.rotation.y = yaw;
    rig.position.y = state.rigY;
    rig.rotation.y = yaw;
    for (const { hinge, side } of hinges) hinge.rotation.y = doorRotation(side, state.doorOpenDeg);

    const cut = clamp01((progress - CUTAWAY_PHASE[0]) / (CUTAWAY_PHASE[1] - CUTAWAY_PHASE[0]));
    cutawayFill.opacity = 1 - cut;
    cutawayFill.depthWrite = cut < 1;
    cutawayEdges.opacity = 1 - cut * (1 - PHANTOM_LINE_OPACITY);
    // The doors open before the cutaway starts and close after the load is in, so scaling the cutaway by the door angle
    // fades the near leaf only while it stands open during loading.
    const leafCut = cut * (state.doorOpenDeg / DOOR_OPEN_DEG);
    leafFill.opacity = 1 - leafCut;
    leafFill.depthWrite = leafCut < 1;
    leafEdges.opacity = 1 - leafCut * (1 - PHANTOM_LINE_OPACITY);
    pathMaterial.opacity = clamp01((state.doorOpenDeg / DOOR_OPEN_DEG) * 1.2) * (1 - clamp01((progress - 0.88) / 0.06));

    // Placed cartons, then the ones sliding in, which are always the next ones in load order.
    let visible = 0;
    for (let index = 0; index < state.cartonsPlaced; index += 1) {
      matrix.makeTranslation(...cartonSlot(index));
      cartons.setMatrixAt(visible, matrix);
      visible += 1;
    }
    let flying = 0;
    for (let index = state.cartonsPlaced; index < CARTON_COUNT && flying < MAX_IN_FLIGHT; index += 1) {
      const pose = cartonPose(index, progress);
      if (!pose) break;
      position.set(...pose.position);
      scale.setScalar(Math.max(pose.scale, 1e-3));
      matrix.compose(position, rotation, scale);
      cartons.setMatrixAt(visible, matrix);
      writeBoxEdges(flightPositions, flying * 72, pose.position, [cartonSize[0] * pose.scale, cartonSize[1] * pose.scale, cartonSize[2] * pose.scale]);
      visible += 1;
      flying += 1;
    }
    cartons.count = visible;
    cartons.instanceMatrix.needsUpdate = true;
    placedEdgeGeometry.setDrawRange(0, state.cartonsPlaced * 24);
    flightEdgeGeometry.setDrawRange(0, flying * 24);
    flightAttribute.needsUpdate = true;

    renderer.render(scene, camera);
  }

  function requestDraw(): void {
    if (!disposed && frameId === 0) frameId = requestAnimationFrame(draw);
  }

  function applySize(): void {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    renderer.setSize(width, height, false);
    fitCamera();
  }

  function handleContextLost(event: Event): void {
    event.preventDefault();
    if (frameId !== 0) cancelAnimationFrame(frameId);
    frameId = 0;
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
      requestDraw();
    },
    setProgress(next) {
      const clamped = clamp01(next);
      if (clamped === progress) return;
      progress = clamped;
      requestDraw();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frameId !== 0) cancelAnimationFrame(frameId);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      scene.clear();
      cartons.dispose();
      for (const item of owned) item.dispose();
      renderer.dispose();
    },
  };
}
