/**
 * Procedural materials for the Home & Living Utility inspection model: a glazed ceramic, the unglazed body under it,
 * brushed stainless steel, borosilicate glass, and the two liquids.
 *
 * Every map is drawn on a canvas when the scene loads, and each PBR channel has its own source: the glaze's roughness
 * pools and its relief come from separate draws, and the body's grain and its roughness from another pair. The two
 * liquids are clipped by a plane at their own surface, so each material belongs to one vessel.
 */
import {
  CanvasTexture,
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  Plane,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
} from 'three';

export interface HomeMaterials {
  /** The pitcher's glazed surface. UVs are in metres. */
  readonly glaze: MeshPhysicalMaterial;
  /** The ceramic body under the glaze, seen in the cut edges of the coupon and the hole it leaves. */
  readonly biscuit: MeshStandardMaterial;
  /** The test bath. */
  readonly steel: MeshStandardMaterial;
  /** The beaker. */
  readonly glass: MeshPhysicalMaterial;
  /** The bath's surface. */
  readonly water: MeshPhysicalMaterial;
  /** The food simulant, clipped at its own surface in the vessel that holds it. */
  simulant(surface: Plane | null): MeshPhysicalMaterial;
  dispose(): void;
}

/** A celadon glaze, a homeware colour of its own beside the textiles indigo, so the pale body reads against it where
 * the coupon is cut. */
const GLAZE_COLOUR = '#6F857C';
const BODY_COLOUR = '#E4DACA';
/** Metres of surface per repeat of each set of maps. */
const GLAZE_TILE = 0.12;
const BODY_TILE = 0.05;
const STEEL_TILE = 0.3;

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(width: number, height = width): { element: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  const context = element.getContext('2d');
  if (!context) throw new Error('2D canvas unavailable');
  return { element, context };
}

function texture(element: HTMLCanvasElement, colour: boolean, repeat: number): CanvasTexture {
  const map = new CanvasTexture(element);
  map.colorSpace = colour ? SRGBColorSpace : NoColorSpace;
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.anisotropy = 8;
  return map;
}

/** A tangent-space normal map from a height field that wraps at its edges. */
function normalFromHeight(height: Float32Array, size: number, strength: number, repeat: number): CanvasTexture {
  const { element, context } = canvas(size);
  const image = context.createImageData(size, size);
  const at = (x: number, y: number): number => height[((y + size) % size) * size + ((x + size) % size)]!;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      // Canvas rows run down while texture V runs up, so the vertical slope flips sign.
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const length = Math.hypot(dx, dy, 1);
      const offset = (y * size + x) * 4;
      image.data[offset] = ((-dx / length) * 0.5 + 0.5) * 255;
      image.data[offset + 1] = ((-dy / length) * 0.5 + 0.5) * 255;
      image.data[offset + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return texture(element, false, repeat);
}

/** Soft blots, drawn into a wrapping height field: where a poured glaze runs thicker and where it thins. */
function blots(seed: number, count: number, size: number, radius: number, depth: number): Float32Array {
  const field = new Float32Array(size * size);
  const next = seeded(seed);
  for (let k = 0; k < count; k += 1) {
    const cx = next() * size;
    const cy = next() * size;
    const spread = radius * (0.6 + next() * 0.8);
    const weight = depth * (next() - 0.4);
    for (let y = Math.floor(cy - spread); y <= cy + spread; y += 1) {
      for (let x = Math.floor(cx - spread); x <= cx + spread; x += 1) {
        const fall = 1 - Math.hypot(x - cx, y - cy) / spread;
        if (fall <= 0) continue;
        field[((y + size) % size) * size + ((x + size) % size)]! += weight * fall * fall;
      }
    }
  }
  return field;
}

/** The glaze: a gloss that pools a little, over a surface with the faintest relief. */
function glazeMaps(): { roughness: CanvasTexture; normal: CanvasTexture } {
  const size = 256;
  const pools = blots(17, 90, size, 26, 1);
  const { element, context } = canvas(size);
  const image = context.createImageData(size, size);
  const speckle = seeded(29);
  for (let k = 0; k < size * size; k += 1) {
    // A glaze is glossy everywhere; it only slackens where it has pooled, with a fine dusting of matter in it.
    const value = 0.11 + Math.max(0, pools[k]!) * 0.16 + speckle() * 0.03;
    const offset = k * 4;
    image.data[offset] = value * 255;
    image.data[offset + 1] = value * 255;
    image.data[offset + 2] = value * 255;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return { roughness: texture(element, false, 1), normal: normalFromHeight(blots(43, 70, size, 30, 1), size, 1.1, 1) };
}

/** The ceramic body: a fine even grain, matte, a shade warmer than the glaze it sits under. */
function bodyMaps(): { albedo: CanvasTexture; roughness: CanvasTexture } {
  const size = 256;
  const albedo = canvas(size);
  const grain = seeded(53);
  albedo.context.fillStyle = BODY_COLOUR;
  albedo.context.fillRect(0, 0, size, size);
  for (let k = 0; k < 9000; k += 1) {
    const light = grain() > 0.5;
    albedo.context.fillStyle = light ? `rgba(255, 250, 240, ${0.1 + grain() * 0.25})` : `rgba(150, 132, 108, ${0.08 + grain() * 0.2})`;
    albedo.context.fillRect(grain() * size, grain() * size, 1 + grain(), 1 + grain());
  }
  const rough = canvas(size);
  const matte = seeded(71);
  const image = rough.context.createImageData(size, size);
  for (let k = 0; k < size * size; k += 1) {
    const value = 0.86 + matte() * 0.1;
    const offset = k * 4;
    image.data[offset] = value * 255;
    image.data[offset + 1] = value * 255;
    image.data[offset + 2] = value * 255;
    image.data[offset + 3] = 255;
  }
  rough.context.putImageData(image, 0, 0);
  return { albedo: texture(albedo.element, true, 1), roughness: texture(rough.element, false, 1) };
}

/** Brushed stainless: fine lines along the bath, and a duller grain across them. */
function steelRoughness(): CanvasTexture {
  const size = 256;
  const { element, context } = canvas(size);
  context.fillStyle = '#5a5a5a';
  context.fillRect(0, 0, size, size);
  const brush = seeded(89);
  for (let k = 0; k < 2600; k += 1) {
    const y = brush() * size;
    const light = brush() > 0.5;
    context.strokeStyle = light ? `rgba(255,255,255,${0.05 + brush() * 0.12})` : `rgba(0,0,0,${0.05 + brush() * 0.12})`;
    context.lineWidth = 0.6 + brush() * 1.1;
    context.beginPath();
    context.moveTo(brush() * size - size * 0.3, y);
    context.lineTo(brush() * size + size * 0.3, y + (brush() - 0.5) * 1.5);
    context.stroke();
  }
  return texture(element, false, 1);
}

export function createHomeMaterials(maxAnisotropy: number): HomeMaterials {
  const maps: CanvasTexture[] = [];
  const keep = <T extends CanvasTexture>(map: T, tile: number): T => {
    map.repeat.set(1 / tile, 1 / tile);
    map.anisotropy = Math.min(8, maxAnisotropy);
    maps.push(map);
    return map;
  };

  const glazed = glazeMaps();
  const glaze = new MeshPhysicalMaterial({
    color: new Color(GLAZE_COLOUR),
    roughnessMap: keep(glazed.roughness, GLAZE_TILE),
    roughness: 1,
    metalness: 0,
    normalMap: keep(glazed.normal, GLAZE_TILE),
    normalScale: new Vector2(0.25, 0.25),
    // A fired glaze is a thin glassy skin over the body: bright and a little uneven.
    clearcoat: 0.7,
    clearcoatRoughness: 0.1,
    sheen: 0,
  });

  const body = bodyMaps();
  const biscuit = new MeshStandardMaterial({
    color: new Color('#FFFFFF'),
    map: keep(body.albedo, BODY_TILE),
    roughnessMap: keep(body.roughness, BODY_TILE),
    roughness: 1,
    metalness: 0,
  });

  const steel = new MeshStandardMaterial({
    color: new Color('#D4D9DE'),
    roughnessMap: keep(steelRoughness(), STEEL_TILE),
    roughness: 1,
    metalness: 0.78,
  });

  const glass = new MeshPhysicalMaterial({
    color: new Color('#E8F1F4'),
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.17,
    side: DoubleSide,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  });

  const water = new MeshPhysicalMaterial({
    color: new Color('#BBD3DA'),
    roughness: 0.05,
    metalness: 0.05,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    clearcoat: 0.9,
    clearcoatRoughness: 0.04,
  });

  const simulants: MeshPhysicalMaterial[] = [];
  const simulant = (surface: Plane | null): MeshPhysicalMaterial => {
    const material = new MeshPhysicalMaterial({
      color: new Color('#CFE2DC'),
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.68,
      side: DoubleSide,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      clippingPlanes: surface ? [surface] : null,
    });
    simulants.push(material);
    return material;
  };

  return {
    glaze,
    biscuit,
    steel,
    glass,
    water,
    simulant,
    dispose() {
      for (const map of maps) map.dispose();
      for (const material of [glaze, biscuit, steel, glass, water, ...simulants]) material.dispose();
    },
  };
}
