/**
 * The Categories inspection processes, keyed by category id: the copy for each step and the drawing each
 * one scrolls through. A category without an entry shows no Inspection process view. The drawings'
 * Three.js modules load on demand, so only their markers (plain data) reach the page bundle.
 */
import type { SceneFactory } from '@/components/inspection-drawing/InspectionCanvas';
import { INSPECTION_MARKERS } from '@/lib/housing-inspection/geometry';
import type { InspectionMarker } from '@/lib/inspection-drawing/solids';
import { PACKAGING_MARKERS } from '@/lib/packaging-inspection/geometry';

export interface InspectionStep {
  readonly title: string;
  readonly text: string;
}

export interface CategorySequence {
  /** Opening sentence of the drawing's text description. */
  readonly subject: string;
  /** One step per inspection protocol, in the order the category lists them. */
  readonly steps: readonly InspectionStep[];
  readonly markers: readonly InspectionMarker[];
  readonly loadScene: () => Promise<SceneFactory>;
}

export const CATEGORY_SEQUENCES: Readonly<Partial<Record<string, CategorySequence>>> = {
  hardware: {
    subject: 'Inspection drawing of a machined aluminium housing, like the one in the category photograph.',
    steps: [
      {
        title: 'CMM 3D coordinate inspection',
        text: 'A coordinate measuring machine probes the bores and machined faces, and every critical dimension is held to the drawing within ±0.05 mm.',
      },
      {
        title: 'RoHS & REACH compliance',
        text: 'The alloy and its surface finish are screened for restricted substances, and each production lot is matched to its material declarations.',
      },
      {
        title: 'Salt spray corrosion test, 96 hours',
        text: 'Finished parts sit in a neutral salt fog for 96 hours, then the finish is checked for corrosion before it is approved.',
      },
    ],
    markers: INSPECTION_MARKERS,
    loadScene: () => import('@/components/housing-inspection/scene').then((module) => module.createHousingScene),
  },
  packaging: {
    subject: 'Inspection drawing of a shelf-ready display tray, with a product carton lowered onto its corner for a drop test.',
    steps: [
      {
        title: 'ISTA-3A drop and transit testing',
        text: 'The packed shipper is dropped on its faces, edges and corners, as it would be handled in parcel transit, then checked for damage.',
      },
      {
        title: 'Edge crush test (ECT)',
        text: 'A strip of the corrugated board is crushed on its edge to confirm its rating, which sets how high the cartons can be stacked.',
      },
      {
        title: 'GS1 / UPC barcode readability scan',
        text: 'Every retail barcode is scanned and graded for readability before the cartons are sealed.',
      },
    ],
    markers: PACKAGING_MARKERS,
    loadScene: () => import('@/components/packaging-inspection/scene').then((module) => module.createPackagingScene),
  },
};
