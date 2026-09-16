/**
 * Builds the Seasonal & Promotional inspection model from its geometry: a kraft shipping carton packed with printed
 * retail gift boxes, and the timber pallet it ships from.
 *
 * The three elements are named groups (`inspection-shipping-window`, `inspection-aql`, `inspection-pre-cartoned`),
 * each carrying `userData.inspection` with its protocol index and an invisible hit area, so a raycaster can target
 * them individually. Every mesh is named.
 *
 * `animate` puts the bench in a pose from `seasonalPose`: the carton is lifted onto the pallet, the front row of gift
 * boxes is drawn out as the sample with the middle one's lid lifted off its tin, and the flaps fold in under a run of
 * tape and a dispatch label. Everything is a rigid part on its own pivot, so a pose is a handful of transforms.
 */
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
  type Material,
  type Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import {
  CARTON,
  GIFT,
  INSPECTION_AREAS,
  LABEL,
  PALLET,
  SAMPLE,
  TAPE,
  TIN,
  cartonPlacement,
  flapAngles,
  giftSlot,
  labelPlacement,
  samplePlacement,
  sampleSlots,
  tapeSpan,
  type Vec3,
} from '@/lib/seasonal-inspection/geometry';
import type { SeasonalPose } from '@/lib/seasonal-inspection/motion';

import { createSeasonalMaterials } from './materials';

export interface SeasonalModel {
  readonly root: Group;
  /** The three inspection groups, in protocol order. */
  readonly inspections: readonly Group[];
  /** Where the camera holds for each inspection area, in protocol order. */
  readonly areaCentres: readonly Vector3[];
  /** Points that outline the model, for framing the camera. */
  readonly outline: readonly Vector3[];
  /** Puts the bench in a pose. */
  animate(pose: SeasonalPose): void;
  dispose(): void;
}

const DEG = Math.PI / 180;
/** The sampled box whose lid comes off: the middle of the three. */
const OPENED = 1;
/** How far that lid swings open on its back edge, like a lidded gift box. */
const LID_OPEN_DEG = 105;
/** Walls of the opened gift box, which has to be hollow to show the tin. */
const CARD = 0.0025;

const vector = (point: Vec3): Vector3 => new Vector3(point[0], point[1], point[2]);

/** A box whose UVs are in metres on every face, so board and timber maps keep one scale whatever the part's size. */
function metricBox(width: number, height: number, depth: number): BoxGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  const uv = geometry.getAttribute('uv');
  // BoxGeometry's faces run +x, -x, +y, -y, +z, -z, four vertices each.
  const faces: Array<readonly [number, number]> = [
    [depth, height],
    [depth, height],
    [width, depth],
    [width, depth],
    [width, height],
    [width, height],
  ];
  for (let k = 0; k < uv.count; k += 1) {
    const [u, v] = faces[Math.floor(k / 4)]!;
    uv.setXY(k, uv.getX(k) * u, uv.getY(k) * v);
  }
  return geometry;
}

/** The pallet: five deck boards across three bearers. */
function palletGeometry(): BufferGeometry {
  const { width, depth, height, deck, slats, bearers } = PALLET;
  const board = 0.085;
  const bearer = 0.07;
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < slats; i += 1) {
    parts.push(metricBox(board, deck, depth).translate((i - (slats - 1) / 2) * ((width - board) / (slats - 1)), height - deck / 2, 0));
  }
  for (let j = 0; j < bearers; j += 1) {
    parts.push(metricBox(width, height - deck, bearer).translate(0, (height - deck) / 2, (j - (bearers - 1) / 2) * ((depth - bearer) / (bearers - 1))));
  }
  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  return merged.translate(PALLET.at[0], PALLET.at[1], PALLET.at[2]);
}

export function buildSeasonalModel(maxAnisotropy: number): SeasonalModel {
  const materials = createSeasonalMaterials(maxAnisotropy);
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
  root.name = 'seasonal-dispatch-model';

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

  // 01: the dispatch pallet, and the carton that is lifted onto it.
  const shippingWindow = inspection('shipping-window', 0);
  shippingWindow.add(mesh('dispatch-pallet', palletGeometry(), materials.pallet));

  const carton = new Group();
  carton.name = 'shipping-carton';
  const { width, depth, height, board } = CARTON;
  // Each wall shows plain board inside and the outer liner outside.
  const inside = (face: number): Material[] => Array.from({ length: 6 }, (_, index) => (index === face ? materials.kraftInner : materials.kraft));
  carton.add(mesh('carton-floor', metricBox(width, board, depth).translate(0, board / 2, 0), inside(2)));
  carton.add(mesh('carton-front', metricBox(width, height, board).translate(0, height / 2, (depth - board) / 2), inside(5)));
  carton.add(mesh('carton-back', metricBox(width, height, board).translate(0, height / 2, -(depth - board) / 2), inside(4)));
  carton.add(mesh('carton-right', metricBox(board, height, depth - 2 * board).translate((width - board) / 2, height / 2, 0), inside(1)));
  carton.add(mesh('carton-left', metricBox(board, height, depth - 2 * board).translate(-(width - board) / 2, height / 2, 0), inside(0)));

  // The flaps, each on a pivot along its hinge. The minor pair folds under the major pair, which meets in the middle.
  const flap = (name: string, geometry: BufferGeometry, pivot: Vec3): Group => {
    const hinge = new Group();
    hinge.name = `${name}-hinge`;
    hinge.position.copy(vector(pivot));
    hinge.add(mesh(name, geometry, inside(3)));
    carton.add(hinge);
    return hinge;
  };
  const front = flap('flap-major-front', metricBox(width, board, CARTON.major).translate(0, board / 2, -CARTON.major / 2), [0, height + board, depth / 2]);
  const back = flap('flap-major-back', metricBox(width, board, CARTON.major).translate(0, board / 2, CARTON.major / 2), [0, height + board, -depth / 2]);
  const right = flap('flap-minor-right', metricBox(CARTON.minor, board, depth - 2 * board).translate(-CARTON.minor / 2, board / 2, 0), [width / 2, height, 0]);
  const left = flap('flap-minor-left', metricBox(CARTON.minor, board, depth - 2 * board).translate(CARTON.minor / 2, board / 2, 0), [-width / 2, height, 0]);
  shippingWindow.add(carton);
  hitArea(shippingWindow, INSPECTION_AREAS[0]);

  // 02: the gift boxes packed in the carton; the front row is the AQL sample.
  const aql = inspection('aql', 1);
  const lidHeight = GIFT.lid.height;
  const lidWidth = GIFT.width + 2 * GIFT.lid.over;
  const lidDepth = GIFT.depth + 2 * GIFT.lid.over;
  const baseHeight = GIFT.height - lidHeight / 2;
  const samples = sampleSlots();
  const sampled: Group[] = [];
  let openLid: Group | null = null;
  for (let index = 0; index < GIFT.columns * GIFT.rows; index += 1) {
    const gift = new Group();
    gift.name = `gift-box-${index + 1}`;
    gift.position.copy(vector(giftSlot(index)));
    const order = samples.indexOf(index);
    if (order === OPENED) {
      // The opened box is hollow: four card walls round a floor, with a moulded tray and the tin standing in it.
      const walls = [
        new BoxGeometry(GIFT.width, CARD, GIFT.depth).translate(0, CARD / 2, 0),
        new BoxGeometry(GIFT.width, baseHeight, CARD).translate(0, baseHeight / 2, (GIFT.depth - CARD) / 2),
        new BoxGeometry(GIFT.width, baseHeight, CARD).translate(0, baseHeight / 2, -(GIFT.depth - CARD) / 2),
        new BoxGeometry(CARD, baseHeight, GIFT.depth - 2 * CARD).translate((GIFT.width - CARD) / 2, baseHeight / 2, 0),
        new BoxGeometry(CARD, baseHeight, GIFT.depth - 2 * CARD).translate(-(GIFT.width - CARD) / 2, baseHeight / 2, 0),
      ];
      gift.add(mesh('gift-box-opened-base', mergeGeometries(walls), materials.card));
      for (const wall of walls) wall.dispose();
      gift.add(mesh('gift-tray', new BoxGeometry(GIFT.width - 2 * CARD, TIN.tray, GIFT.depth - 2 * CARD).translate(0, CARD + TIN.tray / 2, 0), materials.moulding));
      const tinParts = [
        new CylinderGeometry(TIN.radius, TIN.radius, TIN.height, 48).translate(0, TIN.height / 2, 0),
        new CylinderGeometry(TIN.radius + 0.0015, TIN.radius + 0.0015, TIN.rim, 48).translate(0, TIN.height - TIN.rim / 2 + 0.0008, 0),
      ];
      gift.add(mesh('decorative-tin', mergeGeometries(tinParts).translate(0, CARD + TIN.tray * 0.6, 0), materials.tin));
      for (const part of tinParts) part.dispose();
    } else {
      gift.add(mesh(`gift-box-${index + 1}-base`, new BoxGeometry(GIFT.width, baseHeight, GIFT.depth).translate(0, baseHeight / 2, 0), materials.card));
    }
    // The lid hangs on its back edge, printed on top only, with plain card on its sides and underside.
    const lid = new Group();
    lid.name = `gift-box-${index + 1}-lid`;
    lid.position.set(0, GIFT.height, -lidDepth / 2);
    const lidFaces = [materials.cardEdge, materials.cardEdge, materials.card, materials.cardEdge, materials.cardEdge, materials.cardEdge];
    lid.add(mesh(`gift-box-${index + 1}-lid-card`, new BoxGeometry(lidWidth, lidHeight, lidDepth).translate(0, -lidHeight / 2, lidDepth / 2), lidFaces));
    gift.add(lid);
    if (order === OPENED) openLid = lid;
    if (order >= 0) sampled[order] = gift;
    carton.add(gift);
  }
  hitArea(aql, INSPECTION_AREAS[1]);

  // 03: the tape along the seam, with a tab down each end wall, and the dispatch label that lands beside it.
  const preCartoned = inspection('pre-cartoned', 2);
  const topOfFlaps = height + 2 * board;
  const tapeStrip = mesh('seam-tape', new BoxGeometry(1, TAPE.thickness, TAPE.width).translate(0.5, TAPE.thickness / 2, 0), materials.tape);
  tapeStrip.position.set(-width / 2, topOfFlaps, 0);
  const tabHeight = TAPE.overhang * 2.2;
  const tab = (side: -1 | 1): Mesh => {
    const piece = mesh(`seam-tape-tab-${side < 0 ? 'near' : 'far'}`, new BoxGeometry(TAPE.thickness, tabHeight, TAPE.width), materials.tape);
    piece.position.set(side * (width / 2 + TAPE.thickness / 2), topOfFlaps - tabHeight / 2, 0);
    return piece;
  };
  const nearTab = tab(-1);
  const farTab = tab(1);
  carton.add(tapeStrip, nearTab, farTab);
  const label = new Group();
  label.name = 'dispatch-label';
  label.add(mesh('dispatch-label-print', new PlaneGeometry(LABEL.width, LABEL.height).rotateX(-Math.PI / 2), materials.label));
  carton.add(label);
  hitArea(preCartoned, INSPECTION_AREAS[2]);

  root.traverse((object: Object3D) => {
    const item = object as Mesh;
    if (!item.isMesh) return;
    const clear = item.material === hitMaterial || item.material === materials.tape;
    item.castShadow = !clear;
    item.receiveShadow = item.material !== hitMaterial;
  });

  const outline: Vector3[] = [];
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      outline.push(new Vector3(PALLET.at[0] + (x * PALLET.width) / 2, 0, PALLET.at[2] + (z * PALLET.depth) / 2));
      // The flaps fold down against the walls, so the carton's top is its rim wherever it stands.
      for (const slide of [0, 1]) {
        const at = cartonPlacement(slide);
        outline.push(new Vector3(at[0] + (x * width) / 2, at[1], at[2] + (z * depth) / 2));
        outline.push(new Vector3(at[0] + (x * width) / 2, at[1] + height, at[2] + (z * depth) / 2));
      }
    }
  }
  const shipped = cartonPlacement(1);
  for (let order = 0; order < SAMPLE.count; order += 1) {
    const set = samplePlacement(order, 1).position;
    outline.push(new Vector3(shipped[0] + set[0], 0, shipped[2] + set[2] + GIFT.depth / 2));
  }

  return {
    root,
    inspections: [shippingWindow, aql, preCartoned],
    areaCentres: INSPECTION_AREAS.map((area) => vector('look' in area ? area.look : area.centre)),
    outline,
    animate(pose) {
      carton.position.copy(vector(cartonPlacement(pose.slide)));
      const flaps = flapAngles(pose.close);
      front.rotation.x = flaps.major;
      back.rotation.x = -flaps.major;
      right.rotation.z = -flaps.minor;
      left.rotation.z = flaps.minor;

      sampled.forEach((gift, order) => {
        const place = samplePlacement(order, pose.sample[order] ?? 0);
        gift.position.copy(vector(place.position));
        gift.rotation.y = place.turnDeg * DEG;
      });
      if (openLid) openLid.rotation.x = -LID_OPEN_DEG * DEG * pose.lid;

      const span = Math.min(width, tapeSpan(pose.tape) - TAPE.overhang);
      tapeStrip.visible = span > 0.001;
      tapeStrip.scale.x = Math.max(0.001, span);
      nearTab.visible = pose.tape > 0.02;
      farTab.visible = pose.tape > 0.97;

      const laid = labelPlacement(pose.label);
      label.visible = pose.label > 0.01;
      label.position.copy(vector(laid.position));
      label.position.y += 2 * board;
      label.rotation.x = laid.tiltDeg * DEG;
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      hitMaterial.dispose();
      materials.dispose();
    },
  };
}
