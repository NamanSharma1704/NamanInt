/**
 * Builds the Home & Living Utility inspection model from its geometry: one fluted glazed pitcher standing in a steel
 * test bath, the borosilicate beaker of simulant beside it, and the coupon cut from the pitcher's wall.
 *
 * The three elements are named groups (`inspection-food-contact`, `inspection-lfgb`, `inspection-thermal-shock`),
 * each carrying `userData.inspection` with its protocol index and an invisible hit area, so a raycaster can target
 * them individually. Every mesh is named.
 *
 * `animate` puts them in a pose from `homePose`: the beaker lifts and tips over the mouth with the stream running, the
 * two liquids stand at their own surfaces (each clipped by its own plane, so a tipped beaker still holds a level
 * surface), the coupon lifts out of the wall and turns its section to the camera, and the bath fills and ripples.
 */
import {
  BufferAttribute,
  BufferGeometry,
  BoxGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Plane,
  RingGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type Material,
  type Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import {
  BEAKER,
  COUPON,
  INSPECTION_AREAS,
  PITCHER,
  PITCHER_BASE_Y,
  TRAY,
  bathSurface,
  beakerPlacement,
  beakerSurfaceY,
  couponFrame,
  fillSurfaceY,
  handlePath,
  innerRadius,
  pitcherRadius,
  pitcherWallPoint,
  streamPoints,
  type Vec3,
} from '@/lib/home-inspection/geometry';
import type { HomePose } from '@/lib/home-inspection/motion';

import { createHomeMaterials } from './materials';

export interface HomeModel {
  readonly root: Group;
  /** The three inspection groups, in protocol order. */
  readonly inspections: readonly Group[];
  /** The centre of each inspection area, in protocol order, for the camera to move toward. */
  readonly areaCentres: readonly Vector3[];
  /** Points that outline the model, for framing the camera. */
  readonly outline: readonly Vector3[];
  /** Puts the bench in a pose. */
  animate(pose: HomePose): void;
  dispose(): void;
}

/** Turns around the pitcher, and rings up its profile. The seam sits at the back, behind the handle. */
const SEGMENTS = 144;
const RINGS = 90;
const DEG = Math.PI / 180;
const STREAM = { rings: 14, sides: 6, radius: 0.0038 };

const vector = (point: Vec3): Vector3 => new Vector3(point[0], point[1], point[2]);
const angleAt = (i: number): number => -Math.PI + (2 * Math.PI * i) / SEGMENTS;

/** The profile heights the pitcher is built on, with the inner floor and the coupon's edges landing exactly on rings. */
function profileHeights(): number[] {
  const list = Array.from({ length: RINGS + 1 }, (_, j) => (PITCHER.height * j) / RINGS);
  for (const height of [PITCHER.floor, COUPON.fromY, COUPON.toY]) {
    let nearest = 1;
    for (let j = 1; j < list.length - 1; j += 1) if (Math.abs(list[j]! - height) < Math.abs(list[nearest]! - height)) nearest = j;
    list[nearest] = height;
  }
  return list;
}

interface Window {
  readonly i0: number;
  readonly i1: number;
  readonly j0: number;
  readonly j1: number;
}

/** The outward normal of the wall at a turn and height, from steps along the surface. */
function wallNormal(theta: number, y: number, depth: number, out: Vector3): Vector3 {
  const step = 0.0015;
  const a = vector(pitcherWallPoint(theta + step, y, depth));
  const b = vector(pitcherWallPoint(theta - step, y, depth));
  const c = vector(pitcherWallPoint(theta, Math.min(PITCHER.height, y + step), depth));
  const d = vector(pitcherWallPoint(theta, Math.max(0, y - step), depth));
  return out.crossVectors(a.sub(b), c.sub(d)).normalize();
}

/** A surface of revolution through the wall at `depth`, over a run of the profile, with the coupon's window left out. */
function revolve(depth: number, heights: readonly number[], from: number, to: number, window: Window | null, inward: boolean): BufferGeometry {
  const rows = to - from + 1;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const normal = new Vector3();
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const theta = angleAt(i);
    for (let j = from; j <= to; j += 1) {
      const y = heights[j]!;
      positions.push(...pitcherWallPoint(theta, y, depth));
      wallNormal(theta, y, depth, normal);
      if (inward) normal.negate();
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(theta * pitcherRadius(y), y);
    }
  }
  const index: number[] = [];
  for (let i = 0; i < SEGMENTS; i += 1) {
    for (let j = from; j < to; j += 1) {
      if (window && i >= window.i0 && i < window.i1 && j >= window.j0 && j < window.j1) continue;
      const a = i * rows + (j - from);
      const b = (i + 1) * rows + (j - from);
      if (inward) index.push(a, a + 1, b, b, a + 1, b + 1);
      else index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(index);
  return geometry;
}

/** A disc across the pitcher at a height: the base under it, or the floor inside it. */
function disc(y: number, radius: number, facing: 1 | -1): BufferGeometry {
  const positions: number[] = [0, y, 0];
  const normals: number[] = [0, facing, 0];
  const uvs: number[] = [0, 0];
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const theta = angleAt(i);
    positions.push(radius * Math.sin(theta), y, radius * Math.cos(theta));
    normals.push(0, facing, 0);
    uvs.push(radius * Math.sin(theta), radius * Math.cos(theta));
  }
  const index: number[] = [];
  for (let i = 0; i < SEGMENTS; i += 1) {
    if (facing > 0) index.push(0, i + 1, i + 2);
    else index.push(0, i + 2, i + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(index);
  return geometry;
}

/** The rim: the ring of wall between the outer and inner faces at the top, drawn out into the spout with them. */
function rimRing(heights: readonly number[]): BufferGeometry {
  const top = heights[heights.length - 1]!;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const theta = angleAt(i);
    for (const depth of [0, 1]) {
      const point = pitcherWallPoint(theta, top, depth);
      positions.push(...point);
      normals.push(0, 1, 0);
      uvs.push(theta * pitcherRadius(top), depth * PITCHER.wall);
    }
  }
  const index: number[] = [];
  for (let i = 0; i < SEGMENTS; i += 1) {
    const a = i * 2;
    index.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(index);
  return geometry;
}

/**
 * A slice of the wall over the coupon's window, between two depths through it: the coupon's own layers, or, turned
 * inward, the sides of the hole it leaves. `faces` adds the two surfaces, `sides` the four cut edges.
 */
function wallSlice(from: number, to: number, heights: readonly number[], window: Window, parts: { faces: boolean; sides: boolean; inward: boolean }): BufferGeometry {
  const columns = window.i1 - window.i0 + 1;
  const rows = window.j1 - window.j0 + 1;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  const normal = new Vector3();
  const add = (theta: number, y: number, depth: number, face: Vector3): number => {
    const point = pitcherWallPoint(theta, y, depth);
    positions.push(...point);
    normals.push(face.x, face.y, face.z);
    uvs.push(theta * pitcherRadius(y), y);
    return positions.length / 3 - 1;
  };
  // Both faces of the slice, sampled on the same grid as the wall they came from.
  const grids = [from, to].map((depth, layer) =>
    Array.from({ length: columns }, (_, column) =>
      Array.from({ length: rows }, (_, row) => {
        const theta = angleAt(window.i0 + column);
        const y = heights[window.j0 + row]!;
        wallNormal(theta, y, depth, normal);
        if ((layer === 1) !== parts.inward) normal.negate();
        return add(theta, y, depth, normal);
      }),
    ),
  );
  if (parts.faces) {
    for (const [layer, grid] of grids.entries()) {
      const flipped = (layer === 1) !== parts.inward;
      for (let column = 0; column < columns - 1; column += 1) {
        for (let row = 0; row < rows - 1; row += 1) {
          const a = grid[column]![row]!;
          const b = grid[column + 1]![row]!;
          const c = grid[column]![row + 1]!;
          const d = grid[column + 1]![row + 1]!;
          if (flipped) index.push(a, c, b, b, c, d);
          else index.push(a, b, c, b, d, c);
        }
      }
    }
  }
  if (parts.sides) {
    const strip = (points: Array<{ theta: number; y: number }>, face: Vector3): void => {
      const first = points.map(({ theta, y }) => add(theta, y, from, face));
      const second = points.map(({ theta, y }) => add(theta, y, to, face));
      for (let k = 0; k < points.length - 1; k += 1) {
        const a = first[k]!;
        const b = first[k + 1]!;
        const c = second[k]!;
        const d = second[k + 1]!;
        if (parts.inward) index.push(a, c, b, b, c, d);
        else index.push(a, b, c, b, d, c);
      }
    };
    const columnsRange = Array.from({ length: columns }, (_, column) => window.i0 + column);
    const rowsRange = Array.from({ length: rows }, (_, row) => window.j0 + row);
    const up = new Vector3(0, 1, 0);
    // The top and bottom edges, then the two upright edges, each with its own flat normal.
    strip(
      columnsRange.map((i) => ({ theta: angleAt(i), y: heights[window.j1]! })),
      up,
    );
    strip(
      columnsRange.map((i) => ({ theta: angleAt(i), y: heights[window.j0]! })).reverse(),
      up.clone().negate(),
    );
    for (const [edge, i] of [window.i1, window.i0].entries()) {
      const theta = angleAt(i);
      const across = new Vector3(Math.cos(theta), 0, -Math.sin(theta)).multiplyScalar(edge === 0 ? 1 : -1);
      const along = rowsRange.map((j) => ({ theta, y: heights[j]! }));
      strip(edge === 0 ? along : along.reverse(), across);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(index);
  return geometry;
}

/** The simulant inside the pitcher, a hair inside its wall, tall enough to be clipped at any level. */
function pitcherLiquid(heights: readonly number[], from: number): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const rows = heights.length - from;
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const theta = angleAt(i);
    for (let j = from; j < heights.length; j += 1) {
      const y = heights[j]!;
      const radius = innerRadius(y) - 0.0005;
      positions.push(radius * Math.sin(theta), PITCHER_BASE_Y + y, radius * Math.cos(theta));
      normals.push(Math.sin(theta), 0, Math.cos(theta));
      uvs.push(theta * radius, y);
    }
  }
  const index: number[] = [];
  for (let i = 0; i < SEGMENTS; i += 1) {
    for (let j = 0; j < rows - 1; j += 1) {
      const a = i * rows + j;
      const b = (i + 1) * rows + j;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(index);
  return geometry;
}

/** A point on a uniform Catmull-Rom spline through `points`, at `t` from 0 to 1. */
function catmullRom(points: readonly Vec3[], t: number, out: Vector3): Vector3 {
  const last = points.length - 1;
  const scaled = t * last;
  const k = Math.min(last - 1, Math.floor(scaled));
  const u = scaled - k;
  const p0 = points[Math.max(0, k - 1)]!;
  const p1 = points[k]!;
  const p2 = points[k + 1]!;
  const p3 = points[Math.min(last, k + 2)]!;
  const axis = (a: 0 | 1 | 2): number =>
    0.5 * (2 * p1[a] + (p2[a] - p0[a]) * u + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * u * u + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * u * u * u);
  return out.set(axis(0), axis(1), axis(2));
}

interface Stream {
  readonly geometry: BufferGeometry;
  /** Lays the stream along a path, at a thickness that fades in and out with the pour. */
  update(points: readonly Vec3[], thickness: number): void;
}

/** The stream of simulant: a tube of fixed topology, laid along the path from the lip each time the pour changes. */
function createStream(): Stream {
  const rings = STREAM.rings + 1;
  const position = new Float32Array(rings * STREAM.sides * 3);
  const normal = new Float32Array(rings * STREAM.sides * 3);
  const index: number[] = [];
  for (let i = 0; i < STREAM.rings; i += 1) {
    for (let j = 0; j < STREAM.sides; j += 1) {
      const a = i * STREAM.sides + j;
      const b = i * STREAM.sides + ((j + 1) % STREAM.sides);
      index.push(a, b, a + STREAM.sides, b, b + STREAM.sides, a + STREAM.sides);
    }
  }
  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(position, 3);
  const normalAttribute = new BufferAttribute(normal, 3);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setIndex(index);
  geometry.boundingSphere = null;

  const centres = Array.from({ length: rings }, () => new Vector3());
  const tangent = new Vector3();
  const side = new Vector3();
  const binormal = new Vector3();
  const direction = new Vector3();
  const across = new Vector3(1, 0, 0);
  return {
    geometry,
    update(points, thickness) {
      centres.forEach((centre, i) => catmullRom(points, i / STREAM.rings, centre));
      for (let i = 0; i < rings; i += 1) {
        tangent.subVectors(centres[Math.min(STREAM.rings, i + 1)]!, centres[Math.max(0, i - 1)]!);
        if (tangent.lengthSq() < 1e-12) tangent.set(0, -1, 0);
        tangent.normalize();
        side.crossVectors(tangent, across);
        if (side.lengthSq() < 1e-6) side.set(0, 0, 1);
        side.normalize();
        binormal.crossVectors(tangent, side);
        // The stream draws out as it falls, and lands narrower than it leaves the lip.
        const radius = thickness * (1 - (0.35 * i) / STREAM.rings);
        for (let j = 0; j < STREAM.sides; j += 1) {
          const angle = (2 * Math.PI * j) / STREAM.sides;
          const vertex = i * STREAM.sides + j;
          direction.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
          direction.toArray(normal, vertex * 3);
          direction.multiplyScalar(radius).add(centres[i]!).toArray(position, vertex * 3);
        }
      }
      positionAttribute.needsUpdate = true;
      normalAttribute.needsUpdate = true;
    },
  };
}

interface Bath {
  readonly geometry: BufferGeometry;
  /** Sets the bath's surface for a level, with the rings running out from the piece. */
  update(bath: number): void;
}

/** The bath's surface: a grid inside the tray's walls, lifted to the level and rippled. */
function createBath(): Bath {
  const columns = 56;
  const rows = 40;
  const width = TRAY.width - 2 * TRAY.wall;
  const depth = TRAY.depth - 2 * TRAY.wall;
  const position = new Float32Array((columns + 1) * (rows + 1) * 3);
  const normal = new Float32Array((columns + 1) * (rows + 1) * 3);
  const index: number[] = [];
  for (let i = 0; i <= columns; i += 1) {
    for (let j = 0; j <= rows; j += 1) {
      const vertex = i * (rows + 1) + j;
      position[vertex * 3] = -width / 2 + (width * i) / columns;
      position[vertex * 3 + 2] = -depth / 2 + (depth * j) / rows;
      normal[vertex * 3 + 1] = 1;
    }
  }
  for (let i = 0; i < columns; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      const a = i * (rows + 1) + j;
      const b = (i + 1) * (rows + 1) + j;
      index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(position, 3);
  const normalAttribute = new BufferAttribute(normal, 3);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setIndex(index);

  const slope = new Vector3();
  return {
    geometry,
    update(bath) {
      const step = 0.004;
      for (let vertex = 0; vertex < (columns + 1) * (rows + 1); vertex += 1) {
        const x = position[vertex * 3]!;
        const z = position[vertex * 3 + 2]!;
        position[vertex * 3 + 1] = bathSurface(x, z, bath);
        slope
          .set(-(bathSurface(x + step, z, bath) - bathSurface(x - step, z, bath)) / (2 * step), 1, -(bathSurface(x, z + step, bath) - bathSurface(x, z - step, bath)) / (2 * step))
          .normalize()
          .toArray(normal, vertex * 3);
      }
      positionAttribute.needsUpdate = true;
      normalAttribute.needsUpdate = true;
    },
  };
}

/** The steel test bath: a floor and four walls. */
function trayGeometry(): BufferGeometry {
  const { width, depth, height, wall, floor } = TRAY;
  const parts = [
    new BoxGeometry(width, floor, depth).translate(0, floor / 2, 0),
    new BoxGeometry(wall, height, depth).translate(-(width - wall) / 2, height / 2, 0),
    new BoxGeometry(wall, height, depth).translate((width - wall) / 2, height / 2, 0),
    new BoxGeometry(width - 2 * wall, height, wall).translate(0, height / 2, -(depth - wall) / 2),
    new BoxGeometry(width - 2 * wall, height, wall).translate(0, height / 2, (depth - wall) / 2),
  ];
  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  return merged;
}

/** The beaker: a straight glass with a rolled floor, and the simulant standing in it. */
function beakerGeometry(): BufferGeometry {
  const { radius, height, wall } = BEAKER;
  const parts = [
    new CylinderGeometry(radius, radius, height, 64, 1, true).translate(0, height / 2, 0),
    new CylinderGeometry(radius - wall, radius - wall, height - wall, 64, 1, true).translate(0, (height + wall) / 2, 0),
    new RingGeometry(radius - wall, radius, 64, 1).rotateX(-Math.PI / 2).translate(0, height, 0),
    new CircleGeometry(radius, 64).rotateX(Math.PI / 2),
    new CircleGeometry(radius - wall, 64).rotateX(-Math.PI / 2).translate(0, wall, 0),
  ];
  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  return merged;
}

export function buildHomeModel(maxAnisotropy: number): HomeModel {
  const materials = createHomeMaterials(maxAnisotropy);
  const geometries: BufferGeometry[] = [];
  const keep = <T extends BufferGeometry>(geometry: T): T => {
    geometries.push(geometry);
    return geometry;
  };
  const mesh = (name: string, geometry: BufferGeometry, material: Material | Material[]): Mesh => {
    const object = new Mesh(keep(geometry), material);
    object.name = name;
    return object;
  };

  const root = new Group();
  root.name = 'homeware-inspection-model';

  const heights = profileHeights();
  const floorRing = heights.indexOf(PITCHER.floor);
  const window: Window = {
    i0: Math.round((SEGMENTS * (180 + COUPON.atDeg - COUPON.halfWidthDeg)) / 360),
    i1: Math.round((SEGMENTS * (180 + COUPON.atDeg + COUPON.halfWidthDeg)) / 360),
    j0: heights.indexOf(COUPON.fromY),
    j1: heights.indexOf(COUPON.toY),
  };

  // The pitcher: its glazed outside and inside, its base and rim, the handle, and the raw body around the cut window.
  const pitcher = new Group();
  pitcher.name = 'glazed-pitcher';
  const shells = [
    revolve(0, heights, 0, heights.length - 1, window, false),
    revolve(1, heights, floorRing, heights.length - 1, window, true),
    disc(PITCHER_BASE_Y, pitcherRadius(0), -1),
    disc(PITCHER_BASE_Y + PITCHER.floor, innerRadius(PITCHER.floor), 1),
    rimRing(heights),
  ];
  pitcher.add(mesh('pitcher-glaze', mergeGeometries(shells), materials.glaze));
  for (const shell of shells) shell.dispose();
  pitcher.add(mesh('pitcher-handle', new TubeGeometry(new CatmullRomCurve3(handlePath().map(vector)), 64, PITCHER.handle.radius, 14), materials.glaze));
  const skin = COUPON.glaze / PITCHER.wall;
  const holeGlaze = [
    wallSlice(0, skin, heights, window, { faces: false, sides: true, inward: true }),
    wallSlice(1 - skin, 1, heights, window, { faces: false, sides: true, inward: true }),
  ];
  pitcher.add(mesh('pitcher-hole-glaze', mergeGeometries(holeGlaze), materials.glaze));
  for (const part of holeGlaze) part.dispose();
  pitcher.add(mesh('pitcher-hole-body', wallSlice(skin, 1 - skin, heights, window, { faces: false, sides: true, inward: true }), materials.biscuit));
  root.add(pitcher);

  const inspection = (id: string, protocol: number): Group => {
    const group = new Group();
    group.name = `inspection-${id}`;
    group.userData.inspection = { id, protocol };
    root.add(group);
    return group;
  };
  const hitMaterial = new MeshBasicMaterial({ visible: false });
  const hitArea = (group: Group, area: (typeof INSPECTION_AREAS)[number]): void => {
    const hit = mesh(`${area.id}-hit-area`, new SphereGeometry(area.radius, 16, 12), hitMaterial);
    hit.position.copy(vector(area.centre));
    hit.userData.inspection = { id: area.id, protocol: area.protocol };
    group.add(hit);
  };

  // 01: the beaker of simulant, the stream it pours, and the simulant standing in the pitcher.
  const foodContact = inspection('food-contact', 0);
  const beaker = new Group();
  beaker.name = 'simulant-beaker';
  beaker.add(mesh('beaker-glass', beakerGeometry(), materials.glass));
  const beakerSurface = new Plane(new Vector3(0, -1, 0), BEAKER.height);
  const beakerFill = mesh(
    'beaker-simulant',
    new CylinderGeometry(BEAKER.radius - BEAKER.wall - 0.0004, BEAKER.radius - BEAKER.wall - 0.0004, BEAKER.height - BEAKER.wall, 48, 1, false).translate(0, (BEAKER.height + BEAKER.wall) / 2, 0),
    materials.simulant(beakerSurface),
  );
  beaker.add(beakerFill);
  foodContact.add(beaker);
  const pitcherSurface = new Plane(new Vector3(0, -1, 0), fillSurfaceY(0));
  const liquid = mesh('pitcher-simulant', pitcherLiquid(heights, floorRing), materials.simulant(pitcherSurface));
  const liquidTopRadius = innerRadius(PITCHER.floor);
  const liquidTop = mesh('pitcher-simulant-surface', new CircleGeometry(liquidTopRadius, 64).rotateX(-Math.PI / 2), materials.simulant(null));
  foodContact.add(liquid, liquidTop);
  const stream = createStream();
  const streamMesh = mesh('simulant-stream', stream.geometry, materials.simulant(null));
  streamMesh.frustumCulled = false;
  foodContact.add(streamMesh);
  hitArea(foodContact, INSPECTION_AREAS[0]);

  // 02: the coupon cut from the wall, its glaze skins over the ceramic body.
  const lfgb = inspection('lfgb', 1);
  const frame = couponFrame();
  const anchor = new Group();
  anchor.name = 'coupon-anchor';
  anchor.position.copy(vector(frame.origin));
  anchor.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(vector(frame.across), vector(frame.up), vector(frame.outward)));
  const piece = new Group();
  piece.name = 'wall-coupon';
  const intoAnchor = new Matrix4().compose(anchor.position, anchor.quaternion, new Vector3(1, 1, 1)).invert();
  const skins = [
    wallSlice(0, skin, heights, window, { faces: true, sides: true, inward: false }),
    wallSlice(1 - skin, 1, heights, window, { faces: true, sides: true, inward: false }),
  ];
  piece.add(mesh('coupon-glaze', mergeGeometries(skins).applyMatrix4(intoAnchor), materials.glaze));
  for (const part of skins) part.dispose();
  piece.add(mesh('coupon-body', wallSlice(skin, 1 - skin, heights, window, { faces: false, sides: true, inward: false }).applyMatrix4(intoAnchor), materials.biscuit));
  anchor.add(piece);
  lfgb.add(anchor);
  hitArea(lfgb, INSPECTION_AREAS[1]);

  // 03: the steel bath and the water that fills it.
  const thermalShock = inspection('thermal-shock', 2);
  thermalShock.add(mesh('test-bath', trayGeometry(), materials.steel));
  const bath = createBath();
  const bathMesh = mesh('bath-water', bath.geometry, materials.water);
  bathMesh.frustumCulled = false;
  thermalShock.add(bathMesh);
  hitArea(thermalShock, INSPECTION_AREAS[2]);

  root.traverse((object: Object3D) => {
    const item = object as Mesh;
    if (!item.isMesh) return;
    // Glass, water and the simulant are clear: they take light but cast no shadow of their own.
    const clear = item.material === materials.glass || item.material === materials.water || item.name.includes('simulant') || item.material === hitMaterial;
    item.castShadow = !clear;
    item.receiveShadow = item.material !== hitMaterial;
  });

  const outline: Vector3[] = [];
  for (const corner of [-1, 1]) {
    for (const side of [-1, 1]) {
      outline.push(new Vector3((corner * TRAY.width) / 2, 0, (side * TRAY.depth) / 2));
      outline.push(new Vector3((corner * TRAY.width) / 2, TRAY.height, (side * TRAY.depth) / 2));
    }
  }
  for (let j = 0; j < heights.length; j += 6) {
    const y = heights[j]!;
    for (let i = 0; i < SEGMENTS; i += 12) outline.push(vector(pitcherWallPoint(angleAt(i), y, 0)));
  }
  for (const point of handlePath()) outline.push(vector(point));
  for (const y of [0, BEAKER.height]) {
    for (const turn of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      outline.push(new Vector3(BEAKER.rest.position[0] + BEAKER.radius * Math.sin(turn), y, BEAKER.rest.position[2] + BEAKER.radius * Math.cos(turn)));
    }
  }

  const placement = new Vector3();
  return {
    root,
    inspections: [foodContact, lfgb, thermalShock],
    areaCentres: INSPECTION_AREAS.map((area) => vector('look' in area ? area.look : area.centre)),
    outline,
    animate(pose) {
      const beakerAt = beakerPlacement(pose.pour);
      beaker.position.copy(placement.set(beakerAt.position[0], beakerAt.position[1], beakerAt.position[2]));
      beaker.rotation.z = -beakerAt.tiltDeg * DEG;
      beakerSurface.constant = beakerSurfaceY(pose.pour, pose.fill);
      beakerFill.visible = pose.fill < 0.995;

      const surface = fillSurfaceY(pose.fill);
      pitcherSurface.constant = surface;
      liquid.visible = pose.fill > 0.01;
      liquidTop.visible = liquid.visible;
      liquidTop.position.y = surface;
      liquidTop.scale.setScalar((innerRadius(surface - PITCHER_BASE_Y) - 0.0008) / liquidTopRadius);

      streamMesh.visible = pose.stream > 0.02;
      if (streamMesh.visible) stream.update(streamPoints(pose.pour, pose.fill), STREAM.radius * (0.55 + 0.45 * pose.stream));

      piece.position.set(COUPON.lift.across * pose.couponOut, COUPON.lift.up * pose.couponOut, COUPON.lift.out * pose.couponOut);
      piece.rotation.set(COUPON.lift.tiltDeg * DEG * pose.couponTurn, COUPON.lift.turnDeg * DEG * pose.couponTurn, 0);

      bathMesh.visible = pose.bath > 0.01;
      if (bathMesh.visible) bath.update(pose.bath);
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      hitMaterial.dispose();
      materials.dispose();
    },
  };
}
