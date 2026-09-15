/**
 * Procedural materials for the Textiles & Materials inspection model: a woven fabric, kraft board, a printed card
 * with a brass eyelet, cotton cord, loose fibres and dyed swatch cloth.
 *
 * Every map is drawn on a canvas when the scene loads, and each PBR channel has its own source: the woven fabric's
 * albedo varies per thread, its roughness per thread from a separate draw, and its normal map comes from a separate
 * height field of the plain weave; the kraft board's fibres, roughness and relief are three separate draws. No
 * channel reuses another's pixels.
 */
import {
  BackSide,
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type Texture,
} from 'three';

export interface TextilesMaterials {
  /** The roll's outer wrap and the unrolled sheet. UVs are in metres. */
  readonly fabric: MeshPhysicalMaterial;
  /** The wound layers on the roll's end faces, shaded per layer by vertex colour. */
  readonly fabricEdge: MeshStandardMaterial;
  /** A dark backing behind the layers, which shows in the fine gaps between them. */
  readonly fabricBacking: MeshStandardMaterial;
  readonly kraftOuter: MeshStandardMaterial;
  /** The tube's bore, seen from inside. */
  readonly kraftInner: MeshStandardMaterial;
  readonly tagPrint: MeshStandardMaterial;
  readonly tagEdge: MeshStandardMaterial;
  readonly eyelet: MeshStandardMaterial;
  readonly cord: MeshStandardMaterial;
  readonly fibre: MeshStandardMaterial;
  /** Dyed swatch cloth in a given colour. Swatch UVs are in metres. */
  swatch(colour: string): MeshPhysicalMaterial;
  dispose(): void;
}

/** The fabric: a deep indigo linen, so the swatches and the cream tag read against it. */
const FABRIC_COLOUR = '#34425F';
/** Metres of fabric per repeat of the weave maps. */
const WEAVE_TILE = 0.05;
const KRAFT_TILE = 0.22;

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

/** Plain weave: warp and weft threads alternating over and under, each thread with its own tone, sheen and slub. */
function weaveMaps(): { albedo: CanvasTexture; roughness: CanvasTexture; normal: CanvasTexture } {
  const size = 256;
  const period = 16;
  const threads = size / period;
  const tones = seeded(11);
  const rough = seeded(23);
  const slubs = seeded(37);
  // Tone varies only a few percent per thread: more reads as a checked grid once the tile repeats.
  const warpTone = Array.from({ length: threads }, () => 0.95 + tones() * 0.05);
  const weftTone = Array.from({ length: threads }, () => 0.92 + tones() * 0.05);
  const warpRough = Array.from({ length: threads }, () => 0.8 + rough() * 0.16);
  const weftRough = Array.from({ length: threads }, () => 0.84 + rough() * 0.14);
  const warpSlub = Array.from({ length: threads }, () => 0.8 + slubs() * 0.4);
  const weftSlub = Array.from({ length: threads }, () => 0.8 + slubs() * 0.4);
  const albedo = canvas(size);
  const roughness = canvas(size);
  const albedoImage = albedo.context.createImageData(size, size);
  const roughnessImage = roughness.context.createImageData(size, size);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = Math.floor(x / period);
      const j = Math.floor(y / period);
      const fx = ((x % period) + 0.5) / period;
      const fy = ((y % period) + 0.5) / period;
      const warpOver = (i + j) % 2 === 0;
      const offset = y * size + x;
      height[offset] = warpOver
        ? Math.sin(Math.PI * fx) * warpSlub[i]! * (0.7 + 0.3 * Math.sin(Math.PI * fy))
        : Math.sin(Math.PI * fy) * weftSlub[j]! * (0.7 + 0.3 * Math.sin(Math.PI * fx));
      const tone = Math.round((warpOver ? warpTone[i]! : weftTone[j]!) * 255);
      const r = Math.round((warpOver ? warpRough[i]! : weftRough[j]!) * 255);
      albedoImage.data.set([tone, tone, tone, 255], offset * 4);
      roughnessImage.data.set([r, r, r, 255], offset * 4);
    }
  }
  albedo.context.putImageData(albedoImage, 0, 0);
  roughness.context.putImageData(roughnessImage, 0, 0);
  const repeat = 1 / WEAVE_TILE;
  return {
    albedo: texture(albedo.element, true, repeat),
    roughness: texture(roughness.element, false, repeat),
    normal: normalFromHeight(height, size, 2.2, repeat),
  };
}

/** Kraft board: machine-direction fibres and specks for albedo, a separate mottled roughness, and a separate relief. */
function kraftMaps(): { albedo: CanvasTexture; roughness: CanvasTexture; normal: CanvasTexture } {
  const size = 512;
  const fibres = seeded(101);
  const albedo = canvas(size);
  albedo.context.fillStyle = '#B58D5E';
  albedo.context.fillRect(0, 0, size, size);
  for (let k = 0; k < 2600; k += 1) {
    const x = fibres() * size;
    const y = fibres() * size;
    const angle = (fibres() - 0.5) * 0.5;
    const length = 4 + fibres() * 16;
    const light = fibres() > 0.5;
    albedo.context.strokeStyle = light ? `rgba(214, 180, 132, ${0.25 + fibres() * 0.3})` : `rgba(120, 86, 50, ${0.2 + fibres() * 0.3})`;
    albedo.context.lineWidth = 0.6 + fibres() * 0.9;
    albedo.context.beginPath();
    albedo.context.moveTo(x, y);
    albedo.context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    albedo.context.stroke();
  }
  for (let k = 0; k < 700; k += 1) {
    albedo.context.fillStyle = `rgba(90, 62, 36, ${0.2 + fibres() * 0.35})`;
    albedo.context.fillRect(fibres() * size, fibres() * size, 1 + fibres(), 1 + fibres());
  }

  const mottle = seeded(211);
  const roughness = canvas(size);
  roughness.context.fillStyle = 'rgb(214, 214, 214)';
  roughness.context.fillRect(0, 0, size, size);
  for (let k = 0; k < 500; k += 1) {
    const value = Math.round(190 + mottle() * 55);
    roughness.context.fillStyle = `rgba(${value}, ${value}, ${value}, 0.25)`;
    roughness.context.beginPath();
    roughness.context.arc(mottle() * size, mottle() * size, 6 + mottle() * 26, 0, Math.PI * 2);
    roughness.context.fill();
  }

  const relief = seeded(307);
  const height = new Float32Array(size * size);
  for (let k = 0; k < 900; k += 1) {
    const cx = Math.floor(relief() * size);
    const cy = Math.floor(relief() * size);
    const length = 6 + Math.floor(relief() * 20);
    const amount = (relief() - 0.4) * 0.8;
    for (let t = 0; t < length; t += 1) {
      for (let w = -1; w <= 1; w += 1) {
        const index = (((cy + w + size) % size) * size + ((cx + t) % size)) % (size * size);
        height[index] = height[index]! + amount * (w === 0 ? 1 : 0.5);
      }
    }
  }
  const repeat = 1 / KRAFT_TILE;
  return {
    albedo: texture(albedo.element, true, repeat),
    roughness: texture(roughness.element, false, repeat),
    normal: normalFromHeight(height, size, 0.9, repeat),
  };
}

/**
 * The tag's printed face: a navy band with light text bars, a gold check emblem and grey text lines, on cream card.
 * The left end is left clear for the eyelet. It carries no certification body's logo or wording.
 */
function tagPrint(): CanvasTexture {
  const width = 512;
  const height = 311;
  const { element, context } = canvas(width, height);
  context.fillStyle = '#F5F1E6';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#16284A';
  context.fillRect(width * 0.18, 0, width * 0.82, height * 0.28);
  context.fillStyle = 'rgba(255, 255, 255, 0.92)';
  context.fillRect(width * 0.24, height * 0.08, width * 0.38, height * 0.055);
  context.fillRect(width * 0.24, height * 0.17, width * 0.24, height * 0.035);
  context.strokeStyle = '#B38A2E';
  context.lineWidth = 9;
  context.beginPath();
  context.arc(width * 0.8, height * 0.62, height * 0.17, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = 11;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(width * 0.745, height * 0.63);
  context.lineTo(width * 0.79, height * 0.7);
  context.lineTo(width * 0.865, height * 0.53);
  context.stroke();
  context.fillStyle = '#6B7280';
  for (const [row, length] of [
    [0.42, 0.36],
    [0.52, 0.3],
    [0.62, 0.34],
    [0.72, 0.22],
  ] as const) {
    context.fillRect(width * 0.24, height * row, width * length, height * 0.035);
  }
  context.fillStyle = '#B38A2E';
  context.fillRect(width * 0.24, height * 0.86, width * 0.66, 3);
  const map = new CanvasTexture(element);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

export function createTextilesMaterials(maxAnisotropy: number): TextilesMaterials {
  const weave = weaveMaps();
  const kraft = kraftMaps();
  const print = tagPrint();
  const textures: Texture[] = [weave.albedo, weave.roughness, weave.normal, kraft.albedo, kraft.roughness, kraft.normal, print];
  for (const map of textures) map.anisotropy = Math.min(8, maxAnisotropy);

  // Sheen darkens the base by 0.157 of its strength, so the base colour is lifted by the same share to hold its value.
  const sheen = 0.45;
  const lifted = (hex: string): Color => new Color(hex).multiplyScalar(1 / (1 - 0.157 * sheen));

  const fabric = new MeshPhysicalMaterial({
    color: lifted(FABRIC_COLOUR),
    map: weave.albedo,
    roughnessMap: weave.roughness,
    roughness: 1,
    normalMap: weave.normal,
    normalScale: new Vector2(0.4, 0.4),
    sheen,
    sheenColor: new Color('#A9B4D0'),
    sheenRoughness: 0.85,
  });
  // Cut layer edges show more fibre than the woven face, so they read a step lighter.
  const fabricEdge = new MeshStandardMaterial({
    color: new Color('#4D5D82'),
    vertexColors: true,
    roughness: 0.95,
    normalMap: weave.normal,
    normalScale: new Vector2(0.35, 0.35),
  });
  const fabricBacking = new MeshStandardMaterial({ color: new Color('#161D2C'), roughness: 1 });
  const kraftOuter = new MeshStandardMaterial({
    color: new Color('#FFFFFF'),
    map: kraft.albedo,
    roughnessMap: kraft.roughness,
    roughness: 1,
    normalMap: kraft.normal,
    normalScale: new Vector2(0.4, 0.4),
  });
  const kraftInner = kraftOuter.clone();
  kraftInner.color = new Color('#8C7157');
  kraftInner.side = BackSide;
  const tagPrintMaterial = new MeshStandardMaterial({ map: print, roughness: 0.62 });
  const tagEdge = new MeshStandardMaterial({ color: new Color('#EDE6D6'), roughness: 0.7 });
  const eyelet = new MeshStandardMaterial({ color: new Color('#C29A45'), metalness: 0.75, roughness: 0.32 });
  const cord = new MeshStandardMaterial({ color: new Color('#E6DAC2'), roughness: 0.85 });
  const fibre = new MeshStandardMaterial({ color: new Color('#46536F'), roughness: 0.92 });

  const swatches: MeshPhysicalMaterial[] = [];
  const swatchWeave = { normal: weave.normal.clone(), roughness: weave.roughness.clone() };
  // Swatch UVs are in metres too, but the cloth is finer, so its weave repeats more often.
  for (const map of Object.values(swatchWeave)) map.repeat.set(1 / 0.05, 1 / 0.05);
  textures.push(swatchWeave.normal, swatchWeave.roughness);

  return {
    fabric,
    fabricEdge,
    fabricBacking,
    kraftOuter,
    kraftInner,
    tagPrint: tagPrintMaterial,
    tagEdge,
    eyelet,
    cord,
    fibre,
    swatch(colour) {
      const material = new MeshPhysicalMaterial({
        color: lifted(colour),
        roughnessMap: swatchWeave.roughness,
        roughness: 1,
        normalMap: swatchWeave.normal,
        normalScale: new Vector2(0.5, 0.5),
        sheen,
        sheenColor: new Color('#FFFFFF').lerp(new Color(colour), 0.4),
        sheenRoughness: 0.8,
      });
      swatches.push(material);
      return material;
    },
    dispose() {
      for (const material of [fabric, fabricEdge, fabricBacking, kraftOuter, kraftInner, tagPrintMaterial, tagEdge, eyelet, cord, fibre, ...swatches]) {
        material.dispose();
      }
      for (const map of textures) map.dispose();
    },
  };
}
