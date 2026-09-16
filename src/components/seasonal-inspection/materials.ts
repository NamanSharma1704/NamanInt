/**
 * Procedural materials for the Seasonal & Promotional inspection model: kraft corrugated board, printed gift-box card,
 * decorative tinplate, a moulded insert, pallet timber, packing tape and a dispatch label.
 *
 * Every map is drawn on a canvas when the scene loads, and each PBR channel has its own source: the board's fibres and
 * its roughness are separate draws, and so are the timber's grain and its roughness. The printed card and the label
 * carry no brand: a gold band and ruled lines stand in for whatever a programme prints there.
 */
import {
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';

export interface SeasonalMaterials {
  /** The shipping carton, outside and in. UVs are in metres. */
  readonly kraft: MeshStandardMaterial;
  readonly kraftInner: MeshStandardMaterial;
  /** The printed retail gift boxes. Their UVs run 0 to 1 over each face. */
  readonly card: MeshStandardMaterial;
  /** The shallow sides and underside of a gift box's lid: plain card with a gold rule, so a lid never repeats the print. */
  readonly cardEdge: MeshStandardMaterial;
  /** The decorative tin inside a gift box, and the moulded tray it sits in. */
  readonly tin: MeshStandardMaterial;
  readonly moulding: MeshStandardMaterial;
  readonly pallet: MeshStandardMaterial;
  readonly tape: MeshPhysicalMaterial;
  /** The dispatch label, printed on one face. */
  readonly label: MeshStandardMaterial;
  dispose(): void;
}

const KRAFT_TILE = 0.12;
const TIMBER_TILE = 0.3;

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

function texture(element: HTMLCanvasElement, colour: boolean, repeat: number, anisotropy: number): CanvasTexture {
  const map = new CanvasTexture(element);
  map.colorSpace = colour ? SRGBColorSpace : NoColorSpace;
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.anisotropy = anisotropy;
  return map;
}

/** Kraft board: machine-direction fibres and specks for albedo, and a separate mottled roughness. */
function kraftMaps(tone: string): { albedo: HTMLCanvasElement; roughness: HTMLCanvasElement } {
  const size = 256;
  const albedo = canvas(size);
  const fibres = seeded(107);
  albedo.context.fillStyle = tone;
  albedo.context.fillRect(0, 0, size, size);
  // Paper, not timber: short faint fibres and a fine speck, so the board never reads as grain.
  for (let k = 0; k < 1100; k += 1) {
    const x = fibres() * size;
    const y = fibres() * size;
    const light = fibres() > 0.5;
    albedo.context.strokeStyle = light ? `rgba(226, 198, 154, ${0.06 + fibres() * 0.12})` : `rgba(122, 92, 56, ${0.05 + fibres() * 0.11})`;
    albedo.context.lineWidth = 0.4 + fibres() * 0.6;
    albedo.context.beginPath();
    albedo.context.moveTo(x, y);
    albedo.context.lineTo(x + (fibres() - 0.5) * 12, y + (fibres() - 0.5) * 12);
    albedo.context.stroke();
  }
  for (let k = 0; k < 1400; k += 1) {
    albedo.context.fillStyle = `rgba(96, 70, 40, ${0.15 + fibres() * 0.3})`;
    albedo.context.fillRect(fibres() * size, fibres() * size, 1 + fibres(), 1 + fibres());
  }
  const rough = canvas(size);
  const matte = seeded(151);
  const image = rough.context.createImageData(size, size);
  for (let k = 0; k < size * size; k += 1) {
    const value = 0.82 + matte() * 0.14;
    const offset = k * 4;
    image.data[offset] = value * 255;
    image.data[offset + 1] = value * 255;
    image.data[offset + 2] = value * 255;
    image.data[offset + 3] = 255;
  }
  rough.context.putImageData(image, 0, 0);
  return { albedo: albedo.element, roughness: rough.element };
}

/** The printed card: an ivory box with a gold band and a navy panel, the way a seasonal pack is printed. */
function cardPrint(): HTMLCanvasElement {
  const size = 256;
  const { element, context } = canvas(size);
  context.fillStyle = '#F4EEE2';
  context.fillRect(0, 0, size, size);
  context.fillStyle = '#E4B23F';
  context.fillRect(0, size * 0.56, size, size * 0.12);
  context.fillStyle = '#1B2335';
  context.fillRect(size * 0.12, size * 0.2, size * 0.34, size * 0.22);
  context.strokeStyle = '#E4B23F';
  context.lineWidth = 2;
  context.strokeRect(size * 0.08, size * 0.1, size * 0.84, size * 0.78);
  const ink = seeded(191);
  context.fillStyle = 'rgba(27, 35, 53, 0.5)';
  for (let k = 0; k < 5; k += 1) context.fillRect(size * 0.14, size * (0.74 + k * 0.035), size * (0.2 + ink() * 0.34), 2);
  return element;
}

/** The dispatch label: a white slip with a ruled block and a bolder line where a date goes. */
function labelPrint(): HTMLCanvasElement {
  const width = 256;
  const height = 176;
  const { element, context } = canvas(width, height);
  context.fillStyle = '#FBFAF7';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = 'rgba(27, 35, 53, 0.45)';
  context.lineWidth = 2;
  context.strokeRect(6, 6, width - 12, height - 12);
  context.fillStyle = 'rgba(27, 35, 53, 0.75)';
  context.fillRect(18, 22, 96, 10);
  context.fillRect(18, 44, 150, 6);
  context.fillRect(18, 58, 120, 6);
  context.fillStyle = 'rgba(27, 35, 53, 0.9)';
  context.fillRect(18, 86, 118, 14);
  const bars = seeded(211);
  for (let x = 18; x < width - 24; x += 5) {
    context.fillStyle = `rgba(27, 35, 53, ${bars() > 0.45 ? 0.85 : 0.2})`;
    context.fillRect(x, 118, 2 + bars() * 2, 40);
  }
  return element;
}

/** Pallet timber: sawn grain along the slats, and a duller roughness across them. */
function timberMaps(): { albedo: HTMLCanvasElement; roughness: HTMLCanvasElement } {
  const size = 256;
  const albedo = canvas(size);
  const grain = seeded(233);
  albedo.context.fillStyle = '#C6AE88';
  albedo.context.fillRect(0, 0, size, size);
  for (let k = 0; k < 900; k += 1) {
    const y = grain() * size;
    albedo.context.strokeStyle = grain() > 0.5 ? `rgba(233, 216, 186, ${0.1 + grain() * 0.2})` : `rgba(122, 95, 60, ${0.08 + grain() * 0.22})`;
    albedo.context.lineWidth = 0.7 + grain() * 1.6;
    albedo.context.beginPath();
    albedo.context.moveTo(-10, y);
    albedo.context.bezierCurveTo(size * 0.3, y + (grain() - 0.5) * 8, size * 0.7, y + (grain() - 0.5) * 8, size + 10, y);
    albedo.context.stroke();
  }
  const rough = canvas(size);
  const matte = seeded(241);
  const image = rough.context.createImageData(size, size);
  for (let k = 0; k < size * size; k += 1) {
    const value = 0.78 + matte() * 0.18;
    const offset = k * 4;
    image.data[offset] = value * 255;
    image.data[offset + 1] = value * 255;
    image.data[offset + 2] = value * 255;
    image.data[offset + 3] = 255;
  }
  rough.context.putImageData(image, 0, 0);
  return { albedo: albedo.element, roughness: rough.element };
}

export function createSeasonalMaterials(maxAnisotropy: number): SeasonalMaterials {
  const maps: CanvasTexture[] = [];
  const anisotropy = Math.min(8, maxAnisotropy);
  const keep = (element: HTMLCanvasElement, colour: boolean, tile: number): CanvasTexture => {
    const map = texture(element, colour, 1 / tile, anisotropy);
    maps.push(map);
    return map;
  };

  const board = kraftMaps('#C2A173');
  const kraft = new MeshStandardMaterial({
    color: new Color('#FFFFFF'),
    map: keep(board.albedo, true, KRAFT_TILE),
    roughnessMap: keep(board.roughness, false, KRAFT_TILE),
    roughness: 1,
    metalness: 0,
  });
  const inner = kraftMaps('#A98A5F');
  const kraftInner = new MeshStandardMaterial({
    color: new Color('#FFFFFF'),
    map: keep(inner.albedo, true, KRAFT_TILE),
    roughnessMap: keep(inner.roughness, false, KRAFT_TILE),
    roughness: 1,
    metalness: 0,
  });

  const card = new MeshStandardMaterial({
    color: new Color('#FFFFFF'),
    map: keep(cardPrint(), true, 1),
    roughness: 0.62,
    metalness: 0,
  });

  // Decorative tinplate with a warm lacquer, in the same gold as the print.
  const edge = canvas(64);
  edge.context.fillStyle = '#F4EEE2';
  edge.context.fillRect(0, 0, 64, 64);
  edge.context.fillStyle = '#E4B23F';
  edge.context.fillRect(0, 40, 64, 8);
  const cardEdge = new MeshStandardMaterial({ color: new Color('#FFFFFF'), map: keep(edge.element, true, 1), roughness: 0.62, metalness: 0 });

  const tin = new MeshStandardMaterial({ color: new Color('#C9A86A'), roughness: 0.28, metalness: 0.85 });
  const moulding = new MeshStandardMaterial({ color: new Color('#242C3D'), roughness: 0.72, metalness: 0 });

  const timber = timberMaps();
  const pallet = new MeshStandardMaterial({
    color: new Color('#FFFFFF'),
    map: keep(timber.albedo, true, TIMBER_TILE),
    roughnessMap: keep(timber.roughness, false, TIMBER_TILE),
    roughness: 1,
    metalness: 0,
  });

  const tape = new MeshPhysicalMaterial({
    color: new Color('#D8C9A8'),
    roughness: 0.22,
    metalness: 0,
    transparent: true,
    opacity: 0.86,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
  });

  const label = new MeshStandardMaterial({ color: new Color('#FFFFFF'), map: keep(labelPrint(), true, 1), roughness: 0.78, metalness: 0 });

  return {
    kraft,
    kraftInner,
    card,
    cardEdge,
    tin,
    moulding,
    pallet,
    tape,
    label,
    dispose() {
      for (const map of maps) map.dispose();
      for (const material of [kraft, kraftInner, card, cardEdge, tin, moulding, pallet, tape, label]) material.dispose();
    },
  };
}
