/**
 * WebGL renderer for the Packaging & Retail inspection sequence: the shared inspection scene given the
 * display tray's solids, markers, camera and turns, plus its drawn effects.
 *
 * Loaded on demand when the sequence nears the viewport, so Three.js stays out of the page bundle.
 */
import { createInspectionScene, type InspectionScene, type InspectionSceneOptions } from '@/components/inspection-drawing/scene';
import { PACKAGING_DRAWING } from '@/lib/packaging-inspection/geometry';

import { createPackagingEffects } from './effects';

export type { InspectionPalette, MarkerPosition, Rgb } from '@/components/inspection-drawing/scene';

export type PackagingSceneOptions = Omit<InspectionSceneOptions, 'drawing' | 'effects'>;
export type PackagingScene = InspectionScene;

export function createPackagingScene(options: PackagingSceneOptions): PackagingScene {
  return createInspectionScene({ ...options, drawing: PACKAGING_DRAWING, effects: createPackagingEffects });
}
