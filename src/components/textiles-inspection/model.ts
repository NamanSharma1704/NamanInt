/**
 * Builds the Textiles & Materials inspection model from its geometry: one fabric roll with layered end faces on its
 * cardboard tube, one continuous sheet unrolled from it, and the three inspection elements on that sheet.
 *
 * The three elements are named groups (`inspection-oeko-tex`, `inspection-colour-fastness`, `inspection-tear-test`),
 * each carrying `userData.inspection` with its protocol index and an invisible hit area, so a raycaster can target
 * them individually. Every mesh is named.
 *
 * `animate` puts the elements in a pose from `textilesPose`: the tag pivots on its eyelet end, each swatch lifts on its
 * front edge, and the fabric tears. The sheet is built with the finished tear already cut, its two edges closed onto
 * the tear's line wherever the tear has not run, so running it rewrites only the vertices around the tear and the
 * loose fibres, and only when the run changes.
 */
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Path,
  RingGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type Material,
  type Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import {
  INSPECTION_AREAS,
  ROLL,
  SWATCHES,
  SWATCH_SIZE,
  TAG,
  insideTear,
  nearTear,
  sheetCentre,
  sheetFrame,
  snapToTear,
  sheetLength,
  sheetPoint,
  tearFibres,
  tearHalfOpening,
  tearLine,
  tornPosition,
  type Vec3,
} from '@/lib/textiles-inspection/geometry';
import { SWATCH_RISE, type TextilesPose } from '@/lib/textiles-inspection/motion';

import { createTextilesMaterials } from './materials';

export interface TextilesModel {
  readonly root: Group;
  /** The three inspection groups, in protocol order. */
  readonly inspections: readonly Group[];
  /** The centre of each inspection area on the sheet, in protocol order, for the camera to move toward. */
  readonly areaCentres: readonly Vector3[];
  /** Points that outline the model, for framing the camera. */
  readonly outline: readonly Vector3[];
  /** Puts the inspection elements in a pose. */
  animate(pose: TextilesPose): void;
  dispose(): void;
}

const SHEET_COLUMNS = 200;
const SHEET_ROWS = 300;
const FIBRE_SEGMENTS = 10;
const FIBRE_SIDES = 5;
const DEG = Math.PI / 180;

const vector = (point: Vec3): Vector3 => new Vector3(point[0], point[1], point[2]);

interface Sheet {
  readonly geometry: BufferGeometry;
  /** Runs the tear to `run`, from 0 (the sheet whole) to 1 (torn as far as it goes). */
  tear(run: number): void;
}

/**
 * The sheet as a closed slab: its top face and underside sampled on a grid across the width and along each column's
 * length, with the finished tear's triangles left out, and walls standing on every open edge, the tear's included.
 * The walls have vertices of their own, so they neither round the faces' shading at the sheet's edges nor mark the
 * tear's line where its edges are still closed.
 */
function createSheet(): Sheet {
  const rows = SHEET_ROWS + 1;
  const count = (SHEET_COLUMNS + 1) * rows;
  const grid = new Float32Array(count * 2 * 3);
  const gridUv = new Float32Array(count * 2 * 2);
  const params = new Float32Array(count * 2);
  const placed = new Float64Array(count);
  const columnX = (i: number): number => -ROLL.width / 2 + (ROLL.width * i) / SHEET_COLUMNS;
  for (let i = 0; i <= SHEET_COLUMNS; i += 1) {
    const x = columnX(i);
    const length = sheetLength(x);
    for (let j = 0; j < rows; j += 1) {
      const s = (length * j) / SHEET_ROWS;
      const v = i * rows + j;
      params.set([x, s], v * 2);
      // Samples beside the tear sit on its ragged edge; the tear test below still uses the grid's own position.
      placed[v] = snapToTear(x, s, (0.6 * length) / SHEET_ROWS);
    }
  }

  const index: number[] = [];
  const edges = new Map<number, { a: number; b: number; c: number; uses: number }>();
  const edgeKey = (p: number, q: number): number => (p < q ? p * count + q : q * count + p);
  /** Corners of the triangles left out for the gap. */
  const gapCorners = new Uint8Array(count);
  function addTriangle(a: number, b: number, c: number): void {
    const x = (params[a * 2]! + params[b * 2]! + params[c * 2]!) / 3;
    const s = (params[a * 2 + 1]! + params[b * 2 + 1]! + params[c * 2 + 1]!) / 3;
    if (insideTear(x, s)) {
      gapCorners[a] = 1;
      gapCorners[b] = 1;
      gapCorners[c] = 1;
      return;
    }
    index.push(a, b, c, a + count, c + count, b + count);
    for (const [p, q, r] of [
      [a, b, c],
      [b, c, a],
      [c, a, b],
    ] as const) {
      const key = edgeKey(p, q);
      const edge = edges.get(key);
      if (edge) edge.uses += 1;
      else edges.set(key, { a: p, b: q, c: r, uses: 1 });
    }
  }
  for (let i = 0; i < SHEET_COLUMNS; i += 1) {
    for (let j = 0; j < SHEET_ROWS; j += 1) {
      const a = i * rows + j;
      const b = (i + 1) * rows + j;
      const c = a + 1;
      const d = b + 1;
      // Wound so the top face's normals point up and away from the roll.
      addTriangle(a, c, b);
      addTriangle(b, c, d);
    }
  }

  /** Top-face vertices the tear moves: their column, their place along the sheet on the finished tear, and their side of its line. */
  const torn: Array<{ vertex: number; x: number; s: number; side: 1 | -1 }> = [];
  for (let i = 0; i <= SHEET_COLUMNS; i += 1) {
    const x = columnX(i);
    const line = tearLine(x);
    const half = tearHalfOpening(x);
    for (let j = 0; j < rows; j += 1) {
      const v = i * rows + j;
      // Every corner of a triangle left out for the gap goes onto the gap's edge too, even where the ragged edge runs
      // narrower at its column than across the triangle, so the closed tear leaves no pinholes.
      let edge = placed[v]!;
      if (gapCorners[v] && Math.abs(edge - line) > half + 1e-9) edge = line + (edge < line ? -half : half);
      const along = tornPosition(x, edge, 0);
      grid.set(sheetPoint(x, along, 1), v * 3);
      grid.set(sheetPoint(x, along, -1), (v + count) * 3);
      gridUv.set([x + ROLL.width / 2, along], v * 2);
      gridUv.set([x + ROLL.width / 2, along], (v + count) * 2);
      if (nearTear(x, edge)) torn.push({ vertex: v, x, s: edge, side: edge >= line ? 1 : -1 });
    }
  }

  // The faces' normals, from the faces alone.
  const faces = new BufferGeometry();
  faces.setAttribute('position', new Float32BufferAttribute(grid, 3));
  faces.setIndex(index);
  faces.computeVertexNormals();
  const gridNormal = faces.getAttribute('normal').array as Float32Array;

  // A wall on every edge used by one triangle, turned to face away from that triangle. Which way is away is read in
  // the sheet's own (x, s) parameters, where no two samples coincide.
  const at = (vertex: number): Vector3 => new Vector3(grid[vertex * 3]!, grid[vertex * 3 + 1]!, grid[vertex * 3 + 2]!);
  const walls: Array<readonly [number, number]> = [];
  for (const { a, b, c, uses } of edges.values()) {
    if (uses !== 1) continue;
    const middle = (params[a * 2 + 1]! + params[b * 2 + 1]!) / 2;
    const across = (params[a * 2]! + params[b * 2]!) / 2 - params[c * 2]!;
    const along = middle - params[c * 2 + 1]!;
    const centre = sheetCentre(middle);
    const outward = new Vector3(across, along * centre.ty, along * centre.tz);
    const facing = new Vector3().crossVectors(at(b).sub(at(a)), at(b + count).sub(at(a)));
    walls.push(facing.dot(outward) >= 0 ? [a, b] : [b, a]);
  }

  const wallStart = count * 2;
  const total = wallStart + walls.length * 4;
  const position = new Float32Array(total * 3);
  position.set(grid);
  const normal = new Float32Array(total * 3);
  normal.set(gridNormal);
  const uv = new Float32Array(total * 2);
  uv.set(gridUv);
  walls.forEach((_, k) => {
    const w = wallStart + k * 4;
    index.push(w, w + 1, w + 2, w, w + 2, w + 3);
  });

  const corner = new Vector3();
  const edgeA = new Vector3();
  const edgeB = new Vector3();
  /** Copies a wall's corners from the faces it joins, and gives it its own flat normal. */
  function writeWall(k: number): void {
    const [p, q] = walls[k]!;
    const w = wallStart + k * 4;
    [p, q, q + count, p + count].forEach((source, offset) => {
      position.copyWithin((w + offset) * 3, source * 3, source * 3 + 3);
      uv.copyWithin((w + offset) * 2, source * 2, source * 2 + 2);
    });
    corner.fromArray(position, w * 3);
    edgeA.fromArray(position, (w + 1) * 3).sub(corner);
    edgeB.fromArray(position, (w + 2) * 3).sub(corner);
    edgeA.cross(edgeB).normalize();
    for (let offset = 0; offset < 4; offset += 1) edgeA.toArray(normal, (w + offset) * 3);
  }
  walls.forEach((_, k) => writeWall(k));

  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(position, 3);
  const normalAttribute = new BufferAttribute(normal, 3);
  const uvAttribute = new BufferAttribute(uv, 2);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setAttribute('uv', uvAttribute);
  geometry.setIndex(index);

  const tornVertices = new Set(torn.map(({ vertex }) => vertex));
  const tornWalls = walls.flatMap(([p, q], k) => (tornVertices.has(p) || tornVertices.has(q) ? [k] : []));
  const low = Math.min(...tornVertices);
  const high = Math.max(...tornVertices);
  /** The vertex spans the tear rewrites: its top faces, their undersides and its walls. Only these are uploaded again. */
  const spans = [
    [low, high],
    [low + count, high + count],
    [wallStart + Math.min(...tornWalls) * 4, wallStart + Math.max(...tornWalls) * 4 + 3],
  ] as const;

  const step = 0.002;
  const tangent = new Vector3();
  const bitangent = new Vector3();
  let current = Number.NaN;
  return {
    geometry,
    tear(run) {
      if (run === current) return;
      current = run;
      for (const { vertex, x, s, side } of torn) {
        const along = tornPosition(x, s, run);
        const top = sheetPoint(x, along, 1, run);
        // The face's normal from steps across the sheet and along it, into its own side of the tear.
        const ahead = sheetPoint(x, along + side * step, 1, run);
        const right = sheetPoint(x + step, along, 1, run);
        const left = sheetPoint(x - step, along, 1, run);
        tangent.set(side * (ahead[0] - top[0]), side * (ahead[1] - top[1]), side * (ahead[2] - top[2]));
        bitangent.set(right[0] - left[0], right[1] - left[1], right[2] - left[2]);
        tangent.cross(bitangent).normalize();
        position.set(top, vertex * 3);
        position.set(sheetPoint(x, along, -1, run), (vertex + count) * 3);
        tangent.toArray(normal, vertex * 3);
        tangent.negate().toArray(normal, (vertex + count) * 3);
        uv[vertex * 2 + 1] = along;
        uv[(vertex + count) * 2 + 1] = along;
      }
      for (const k of tornWalls) writeWall(k);
      for (const attribute of [positionAttribute, normalAttribute, uvAttribute]) {
        attribute.clearUpdateRanges();
        for (const [from, to] of spans) attribute.addUpdateRange(from * attribute.itemSize, (to - from + 1) * attribute.itemSize);
        attribute.needsUpdate = true;
      }
    },
  };
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

interface Fibres {
  readonly geometry: BufferGeometry;
  /** Rebuilds the fibres for the tear at `run`. */
  update(run: number): void;
}

/** The tear's loose fibres as thin tubes tapering to their tips, rebuilt from `tearFibres` whenever the run changes. */
function createFibres(): Fibres {
  const count = tearFibres(0).length;
  const rings = FIBRE_SEGMENTS + 1;
  const perFibre = rings * FIBRE_SIDES;
  const position = new Float32Array(count * perFibre * 3);
  const normal = new Float32Array(count * perFibre * 3);
  const index: number[] = [];
  for (let f = 0; f < count; f += 1) {
    for (let i = 0; i < FIBRE_SEGMENTS; i += 1) {
      for (let j = 0; j < FIBRE_SIDES; j += 1) {
        const a = f * perFibre + i * FIBRE_SIDES + j;
        const b = f * perFibre + i * FIBRE_SIDES + ((j + 1) % FIBRE_SIDES);
        index.push(a, b, a + FIBRE_SIDES, b, b + FIBRE_SIDES, a + FIBRE_SIDES);
      }
    }
  }
  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(position, 3);
  const normalAttribute = new BufferAttribute(normal, 3);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setIndex(index);

  const centres = Array.from({ length: rings }, () => new Vector3());
  const tangent = new Vector3();
  const side = new Vector3();
  const binormal = new Vector3();
  const direction = new Vector3();
  const up = new Vector3(0, 1, 0);
  const across = new Vector3(1, 0, 0);
  let current = Number.NaN;
  return {
    geometry,
    update(run) {
      if (run === current) return;
      current = run;
      tearFibres(run).forEach((fibre, f) => {
        centres.forEach((centre, i) => catmullRom(fibre.points, i / FIBRE_SEGMENTS, centre));
        for (let i = 0; i < rings; i += 1) {
          tangent.subVectors(centres[Math.min(FIBRE_SEGMENTS, i + 1)]!, centres[Math.max(0, i - 1)]!);
          if (tangent.lengthSq() < 1e-14) tangent.copy(across);
          tangent.normalize();
          // Fibres lie close to level, so the ring's frame is taken from the vertical and never flips between runs.
          side.crossVectors(tangent, up);
          if (side.lengthSq() < 1e-6) side.crossVectors(tangent, across);
          side.normalize();
          binormal.crossVectors(tangent, side);
          const radius = fibre.radius * (1 - (0.45 * i) / FIBRE_SEGMENTS);
          for (let j = 0; j < FIBRE_SIDES; j += 1) {
            const angle = (2 * Math.PI * j) / FIBRE_SIDES;
            const vertex = f * perFibre + i * FIBRE_SIDES + j;
            direction.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
            direction.toArray(normal, vertex * 3);
            direction.multiplyScalar(radius).add(centres[i]!).toArray(position, vertex * 3);
          }
        }
      });
      positionAttribute.needsUpdate = true;
      normalAttribute.needsUpdate = true;
    },
  };
}

/** A cylinder's surface along the X axis, its UVs in metres (around, along). */
function cylinderAlongX(radius: number, length: number, segments: number): BufferGeometry {
  const geometry = new CylinderGeometry(radius, radius, length, segments, 1, true);
  const uv = geometry.getAttribute('uv');
  for (let k = 0; k < uv.count; k += 1) uv.setXY(k, uv.getX(k) * 2 * Math.PI * radius, uv.getY(k) * length);
  return geometry.applyMatrix4(new Matrix4().makeRotationZ(-Math.PI / 2)).translate(0, ROLL.radius, 0);
}

/** A flat ring facing out of the roll's end at `side` (-1 near, +1 far), at `offset` along the axis. */
function endRing(inner: number, outer: number, side: -1 | 1, offset: number, segments = 160): BufferGeometry {
  return new RingGeometry(inner, outer, segments, 1)
    .rotateY((side * Math.PI) / 2)
    .translate(side * offset, ROLL.radius, 0);
}

/** A placement on the sheet's top face: the shape's X across (turned by `turnDeg`), its Y toward the roll, its Z out of the face. */
function onSheet(x: number, s: number, turnDeg: number, clearance: number): Matrix4 {
  const frame = sheetFrame(x, s);
  const across = vector(frame.across);
  const back = vector(frame.along).negate();
  const normal = vector(frame.normal);
  const turn = turnDeg * DEG;
  const axisX = across.clone().multiplyScalar(Math.cos(turn)).addScaledVector(back, Math.sin(turn));
  const axisY = across.clone().multiplyScalar(-Math.sin(turn)).addScaledVector(back, Math.cos(turn));
  return new Matrix4().makeBasis(axisX, axisY, normal).setPosition(vector(frame.origin).addScaledVector(normal, clearance));
}

function roundedRect(width: number, height: number, corner: number): Shape {
  const shape = new Shape();
  const w = width / 2;
  const h = height / 2;
  shape.moveTo(-w + corner, -h);
  shape.lineTo(w - corner, -h);
  shape.quadraticCurveTo(w, -h, w, -h + corner);
  shape.lineTo(w, h - corner);
  shape.quadraticCurveTo(w, h, w - corner, h);
  shape.lineTo(-w + corner, h);
  shape.quadraticCurveTo(-w, h, -w, h - corner);
  shape.lineTo(-w, -h + corner);
  shape.quadraticCurveTo(-w, -h, -w + corner, -h);
  return shape;
}

/** A rectangle cut with pinking shears: teeth along every side, their notches `depth` inside the outline. */
function pinkedRect(width: number, length: number, depth: number, pitch: number): Shape {
  const points: Vector2[] = [];
  const side = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number): void => {
    const teeth = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / pitch));
    for (let k = 0; k < teeth; k += 1) {
      const t = k / teeth;
      const mid = (k + 0.5) / teeth;
      points.push(new Vector2(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t));
      points.push(new Vector2(x0 + (x1 - x0) * mid + nx * depth, y0 + (y1 - y0) * mid + ny * depth));
    }
  };
  const w = width / 2;
  const l = length / 2;
  side(-w, -l, w, -l, 0, 1);
  side(w, -l, w, l, -1, 0);
  side(w, l, -w, l, 0, -1);
  side(-w, l, -w, -l, 1, 0);
  return new Shape(points);
}

export function buildTextilesModel(maxAnisotropy: number): TextilesModel {
  const materials = createTextilesMaterials(maxAnisotropy);
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
  root.name = 'fabric-roll-inspection-model';

  // The roll: its outer wrap, a wound-layer face at each end over a dark backing, and the cardboard tube through it.
  const half = ROLL.width / 2;
  const roll = new Group();
  roll.name = 'fabric-roll';
  roll.add(mesh('roll-body', cylinderAlongX(ROLL.radius, ROLL.width, 160), materials.fabric));
  const layerTone = (() => {
    let state = 97;
    return () => {
      state = (state * 16807) % 2147483647;
      return state / 2147483647;
    };
  })();
  for (const side of [-1, 1] as const) {
    const end = side < 0 ? 'near' : 'far';
    const layers: BufferGeometry[] = [];
    for (let i = 0; i < ROLL.layers; i += 1) {
      const inner = ROLL.tubeOuter + ((ROLL.radius - ROLL.tubeOuter) * i) / ROLL.layers;
      const outer = ROLL.tubeOuter + ((ROLL.radius - ROLL.tubeOuter) * (i + 1)) / ROLL.layers - 0.0006;
      // Each wound layer sits a fraction proud of or behind its neighbours, and takes its own shade.
      const ring = endRing(inner, outer, side, half + (layerTone() - 0.5) * 0.0024);
      const shade = 0.72 + layerTone() * 0.5;
      ring.setAttribute('color', new Float32BufferAttribute(new Array(ring.getAttribute('position').count * 3).fill(shade), 3));
      layers.push(ring);
    }
    roll.add(mesh(`roll-layered-edge-${end}`, mergeGeometries(layers), materials.fabricEdge));
    for (const layer of layers) layer.dispose();
    roll.add(mesh(`roll-edge-backing-${end}`, endRing(ROLL.tubeOuter, ROLL.radius, side, half - 0.003), materials.fabricBacking));
  }
  const tube = new Group();
  tube.name = 'cardboard-tube';
  const tubeLength = ROLL.width + 2 * ROLL.tubeProtrude;
  tube.add(mesh('tube-outer', cylinderAlongX(ROLL.tubeOuter, tubeLength, 128), materials.kraftOuter));
  tube.add(mesh('tube-bore', cylinderAlongX(ROLL.tubeInner, tubeLength, 128), materials.kraftInner));
  for (const side of [-1, 1] as const) {
    tube.add(mesh(`tube-end-${side < 0 ? 'near' : 'far'}`, endRing(ROLL.tubeInner, ROLL.tubeOuter, side, half + ROLL.tubeProtrude, 128), materials.kraftOuter));
  }
  roll.add(tube);
  root.add(roll);

  const sheet = createSheet();
  root.add(mesh('unrolled-sheet', sheet.geometry, materials.fabric));

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

  // 01: the certification tag, lying on the sheet near the roll, tied through the sheet's edge by a cord.
  const oekoTex = inspection('oeko-tex', 0);
  const tagShape = roundedRect(TAG.length, TAG.breadth, TAG.corner);
  const holeX = -TAG.length / 2 + TAG.hole.inset;
  tagShape.holes.push(new Path().absarc(holeX, 0, TAG.hole.radius, 0, Math.PI * 2, true));
  const card = new ExtrudeGeometry(tagShape, { depth: TAG.thickness, bevelEnabled: false, curveSegments: 10 });
  // The printed face maps the whole card outline onto the print.
  const cardUv = card.getAttribute('uv');
  const cardPosition = card.getAttribute('position');
  for (let k = 0; k < cardUv.count; k += 1) {
    cardUv.setXY(k, (cardPosition.getX(k) + TAG.length / 2) / TAG.length, (cardPosition.getY(k) + TAG.breadth / 2) / TAG.breadth);
  }
  const tagPlacement = onSheet(TAG.x, TAG.s, TAG.turnDeg, 0.0015);
  const tag = new Group();
  tag.name = 'certification-tag';
  tag.matrixAutoUpdate = false;
  tag.matrix.copy(tagPlacement);
  // The card pivots on its eyelet end, which rests on the fabric, so its far end lifts clear.
  const tilted = new Group();
  tilted.position.set(holeX, 0, 0);
  tilted.rotation.y = -TAG.tiltDeg * DEG;
  tilted.updateMatrix();
  const cardMesh = mesh('tag-card', card.translate(-holeX, 0, 0), [materials.tagPrint, materials.tagEdge]);
  const eyeletRing = mesh('tag-eyelet', new TorusGeometry(TAG.hole.radius + 0.0014, 0.0014, 8, 28), materials.eyelet);
  eyeletRing.position.set(0, 0, TAG.thickness);
  tilted.add(cardMesh, eyeletRing);
  tag.add(tilted);
  oekoTex.add(tag);
  // The eyelet sits on the pivot, so the cord still meets it as the card lifts.
  const hole = new Vector3(0, 0, TAG.thickness).applyMatrix4(tilted.matrix).applyMatrix4(tagPlacement);
  const anchorFrame = sheetFrame(TAG.cordAnchor.x, TAG.cordAnchor.s);
  const anchor = vector(anchorFrame.origin);
  const anchorNormal = vector(anchorFrame.normal);
  const lift = new Vector3(0, 1, 0);
  const cordPoints = [
    anchor.clone().addScaledVector(anchorNormal, -0.004),
    anchor.clone().addScaledVector(anchorNormal, 0.005),
    anchor.clone().lerp(hole, 0.35).addScaledVector(lift, 0.02),
    anchor.clone().lerp(hole, 0.75).addScaledVector(lift, 0.016),
    hole.clone().addScaledVector(lift, 0.006),
    hole.clone().addScaledVector(lift, -0.002),
  ];
  oekoTex.add(mesh('tag-cord', new TubeGeometry(new CatmullRomCurve3(cordPoints), 64, 0.0012, 6), materials.cord));
  hitArea(oekoTex, INSPECTION_AREAS[0]);

  // 02: five pinked textile swatches lying on the sheet in spectrum order.
  const colourFastness = inspection('colour-fastness', 1);
  const swatchShape = pinkedRect(SWATCH_SIZE.width, SWATCH_SIZE.length, SWATCH_SIZE.pinkDepth, SWATCH_SIZE.pinkPitch);
  const swatches = SWATCHES.map((swatch) => {
    const piece = mesh(
      `swatch-${swatch.name}`,
      new ExtrudeGeometry(swatchShape, { depth: SWATCH_SIZE.thickness, bevelEnabled: false }),
      materials.swatch(swatch.colour),
    );
    const placement = onSheet(swatch.x, swatch.s, swatch.turnDeg, 0.0012);
    piece.matrixAutoUpdate = false;
    piece.matrix.copy(placement);
    colourFastness.add(piece);
    return { piece, placement };
  });
  hitArea(colourFastness, INSPECTION_AREAS[1]);

  // 03: the tear runs into the sheet itself; its loose fibres grow out of both torn sides and trail off the edge.
  const tearTest = inspection('tear-test', 2);
  const fibres = createFibres();
  const fibreMesh = mesh('tear-fibres', fibres.geometry, materials.fibre);
  // The fibres grow far from where they start, so their first bounds would cull them wrongly.
  fibreMesh.frustumCulled = false;
  tearTest.add(fibreMesh);
  hitArea(tearTest, INSPECTION_AREAS[2]);

  root.traverse((object: Object3D) => {
    const item = object as Mesh;
    if (!item.isMesh || item.material === hitMaterial) return;
    item.castShadow = true;
    item.receiveShadow = true;
  });

  const outline: Vector3[] = [];
  for (const x of [-half - ROLL.tubeProtrude, half + ROLL.tubeProtrude]) {
    for (const y of [ROLL.radius - ROLL.tubeOuter, ROLL.radius + ROLL.tubeOuter]) {
      for (const z of [-ROLL.tubeOuter, ROLL.tubeOuter]) outline.push(new Vector3(x, y, z));
    }
  }
  for (const x of [-half, half]) {
    for (const y of [0, 2 * ROLL.radius]) {
      for (const z of [-ROLL.radius, ROLL.radius]) outline.push(new Vector3(x, y, z));
    }
    const length = sheetLength(x);
    for (let s = 0; s <= length + 1e-9; s += 0.05) outline.push(vector(sheetPoint(x, Math.min(s, length), 1)));
  }

  // A swatch lifts on its front edge, the one toward the viewer, so its face tilts up toward the camera.
  const toFrontEdge = new Matrix4();
  const tilt = new Matrix4();
  const fromFrontEdge = new Matrix4().makeTranslation(0, SWATCH_SIZE.length / 2, 0);

  return {
    root,
    inspections: [oekoTex, colourFastness, tearTest],
    areaCentres: INSPECTION_AREAS.map((area) => vector(area.centre)),
    outline,
    animate(pose) {
      tilted.rotation.y = -pose.tagTiltDeg * DEG;
      swatches.forEach(({ piece, placement }, index) => {
        const rise = pose.swatchRise[index] ?? 0;
        piece.matrix
          .copy(placement)
          .multiply(toFrontEdge.makeTranslation(0, -SWATCH_SIZE.length / 2, SWATCH_RISE.height * rise))
          .multiply(tilt.makeRotationX(SWATCH_RISE.tiltDeg * DEG * rise))
          .multiply(fromFrontEdge);
        piece.matrixWorldNeedsUpdate = true;
      });
      sheet.tear(pose.tearRun);
      fibres.update(pose.tearRun);
      fibreMesh.visible = pose.tearRun > 0;
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      hitMaterial.dispose();
      materials.dispose();
    },
  };
}
