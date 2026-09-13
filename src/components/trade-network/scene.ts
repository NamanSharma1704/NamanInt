/**
 * WebGL renderer for the trade-network drawing.
 *
 * Loaded on demand by TradeNetwork.tsx and the only module that imports
 * Three.js, so the library ships in its own chunk and never in the main bundle.
 *
 * Deliberately small: hairline LineSegments for the structure, one InstancedMesh
 * per unit system for everything that moves, an orthographic camera, and no
 * textures, lights, shadows or post-processing. The loop only runs while the
 * drawing is on screen in a visible tab; under reduced motion it draws a single
 * still frame and redraws only when something changes.
 */
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three';

import {
  OPACITY,
  STATIC_TIME,
  buildModel,
  cameraBasis,
  unitStates,
  type Layout,
  type Segment,
  type TradeNetworkModel,
} from '@/lib/trade-network/model';

export type Rgb = readonly [number, number, number];

export interface ScenePalette {
  /** Structure lines and goods — the --foreground token. */
  readonly structure: Rgb;
  /** Floor lane guides — the --muted-foreground token. */
  readonly guide: Rgb;
  /** Information flow and highlight — the --accent token. */
  readonly accent: Rgb;
}

export interface TradeNetworkSceneOptions {
  readonly canvas: HTMLCanvasElement;
  readonly layout: Layout;
  readonly palette: ScenePalette;
  readonly reducedMotion: boolean;
  readonly maxPixelRatio: number;
  readonly onContextLost: () => void;
}

export interface TradeNetworkScene {
  resize(width: number, height: number): void;
  setLayout(layout: Layout): void;
  setHighlight(step: number | null): void;
  setReducedMotion(reduced: boolean): void;
  /** On screen and in a visible tab. The loop only runs while this is true. */
  setActive(active: boolean): void;
  dispose(): void;
}

interface Colors {
  readonly structure: Color;
  readonly guide: Color;
  readonly accent: Color;
}

interface Graph {
  readonly model: TradeNetworkModel;
  readonly stationMaterials: readonly LineBasicMaterial[];
  readonly meshes: readonly InstancedMesh[];
  dispose(): void;
}

/** Longest step the clock takes in one frame, so a stalled tab doesn't jump. */
const MAX_FRAME_DELTA = 0.1;

function toColor([r, g, b]: Rgb): Color {
  return new Color().setRGB(r, g, b, SRGBColorSpace);
}

function lineGeometry(segments: readonly Segment[]): BufferGeometry {
  const positions = new Float32Array(segments.length * 6);
  segments.forEach(([a, b], i) => {
    positions.set(a, i * 6);
    positions.set(b, i * 6 + 3);
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}

function buildGraph(scene: Scene, layout: Layout, colors: Colors): Graph {
  const model = buildModel(layout);
  const owned: Array<{ dispose(): unknown }> = [];
  const added: Object3D[] = [];
  const own = <T extends { dispose(): unknown }>(item: T): T => {
    owned.push(item);
    return item;
  };
  const add = <T extends Object3D>(object: T): T => {
    scene.add(object);
    added.push(object);
    return object;
  };
  // Depth testing is off throughout: this is a line drawing, so every hairline
  // stays visible rather than being hidden behind a nearer one.
  const lineMaterial = (color: Color, opacity: number): LineBasicMaterial =>
    own(new LineBasicMaterial({ color: color.clone(), transparent: true, opacity, depthTest: false, depthWrite: false }));

  add(new LineSegments(own(lineGeometry(model.floorGuides)), lineMaterial(colors.guide, OPACITY.guide)));
  const stationMaterials = model.stations.map((station) => {
    const material = lineMaterial(colors.structure, OPACITY.station);
    add(new LineSegments(own(lineGeometry(station.segments)), material));
    return material;
  });
  add(new LineSegments(own(lineGeometry(model.infoGuides)), lineMaterial(colors.accent, OPACITY.info)));

  const box = own(new BoxGeometry(1, 1, 1));
  const fills = {
    structure: own(
      new MeshBasicMaterial({
        color: colors.structure.clone(),
        transparent: true,
        opacity: OPACITY.goods,
        depthTest: false,
        depthWrite: false,
      }),
    ),
    accent: own(new MeshBasicMaterial({ color: colors.accent.clone(), depthTest: false, depthWrite: false })),
  };
  const meshes = unitStates(model, STATIC_TIME).map((group) => {
    const mesh = own(new InstancedMesh(box, fills[group.system.tone], group.instances.length));
    mesh.frustumCulled = false;
    // Drawn after the hairlines, so goods sit over the structure they cross.
    mesh.renderOrder = 1;
    return add(mesh);
  });

  return {
    model,
    stationMaterials,
    meshes,
    dispose() {
      for (const object of added) scene.remove(object);
      for (const item of owned) item.dispose();
    },
  };
}

export function createTradeNetworkScene(options: TradeNetworkSceneOptions): TradeNetworkScene {
  const { canvas, palette, maxPixelRatio, onContextLost } = options;
  let reducedMotion = options.reducedMotion;
  let highlight: number | null = null;
  let active = false;
  let disposed = false;
  let frameId = 0;
  let lastNow = 0;
  let time = STATIC_TIME;
  let width = Math.max(1, canvas.clientWidth);
  let height = Math.max(1, canvas.clientHeight);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);

  const colors: Colors = {
    structure: toColor(palette.structure),
    guide: toColor(palette.guide),
    accent: toColor(palette.accent),
  };
  const scene = new Scene();
  let graph = buildGraph(scene, options.layout, colors);

  const basis = cameraBasis();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  const dummy = new Object3D();

  function aimCamera(): void {
    const [cx, cy, cz] = graph.model.center;
    camera.position.set(cx + basis.z[0] * 120, cy + basis.z[1] * 120, cz + basis.z[2] * 120);
    camera.up.set(0, 1, 0);
    camera.lookAt(cx, cy, cz);
  }

  /** Fits the model's projected bounds into the canvas without distortion. */
  function fitCamera(): void {
    const { minX, maxX, minY, maxY } = graph.model.view;
    const viewWidth = maxX - minX;
    const viewHeight = maxY - minY;
    const aspect = width / height;
    let halfWidth = viewWidth / 2;
    let halfHeight = viewHeight / 2;
    if (aspect > viewWidth / viewHeight) halfWidth = halfHeight * aspect;
    else halfHeight = halfWidth / aspect;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    camera.left = midX - halfWidth;
    camera.right = midX + halfWidth;
    camera.top = midY + halfHeight;
    camera.bottom = midY - halfHeight;
    camera.updateProjectionMatrix();
  }

  function applySize(): void {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    renderer.setSize(width, height, false);
    fitCamera();
  }

  function applyHighlight(): void {
    graph.stationMaterials.forEach((material, index) => {
      const on = highlight === index;
      material.color.copy(on ? colors.accent : colors.structure);
      material.opacity = highlight === null ? OPACITY.station : on ? 1 : OPACITY.stationDim;
    });
  }

  function placeUnits(t: number): void {
    unitStates(graph.model, t).forEach((group, groupIndex) => {
      const mesh = graph.meshes[groupIndex]!;
      group.instances.forEach((unit, i) => {
        dummy.position.set(unit.position[0], unit.position[1], unit.position[2]);
        // A zero scale gives a singular matrix; keep a hair of size instead.
        dummy.scale.set(Math.max(unit.scale[0], 1e-4), Math.max(unit.scale[1], 1e-4), Math.max(unit.scale[2], 1e-4));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }

  function draw(): void {
    if (disposed) return;
    placeUnits(time);
    renderer.render(scene, camera);
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
    if (reducedMotion) time = STATIC_TIME;
    draw();
  }

  function handleContextLost(event: Event): void {
    event.preventDefault();
    stopLoop();
    onContextLost();
  }
  canvas.addEventListener('webglcontextlost', handleContextLost);

  aimCamera();
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
    setLayout(layout) {
      if (disposed || layout === graph.model.layout) return;
      graph.dispose();
      graph = buildGraph(scene, layout, colors);
      aimCamera();
      applyHighlight();
      fitCamera();
      if (frameId === 0) draw();
    },
    setHighlight(step) {
      highlight = step;
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
      graph.dispose();
      renderer.dispose();
    },
  };
}
