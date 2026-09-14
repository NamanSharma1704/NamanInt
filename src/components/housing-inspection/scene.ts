/**
 * WebGL renderer for the Precision Hardware inspection sequence: the shared inspection scene given the
 * housing's solids, markers, camera and turns, plus its drawn effects.
 *
 * Loaded on demand when the sequence nears the viewport, so Three.js stays out of the page bundle.
 */
import { createInspectionScene, type InspectionScene, type InspectionSceneOptions } from '@/components/inspection-drawing/scene';
import { HOUSING_DRAWING } from '@/lib/housing-inspection/geometry';

import { createHousingEffects } from './effects';

export type { InspectionPalette, MarkerPosition, Rgb } from '@/components/inspection-drawing/scene';

export type HousingSceneOptions = Omit<InspectionSceneOptions, 'drawing' | 'effects'>;
export type HousingScene = InspectionScene;

export function createHousingScene(options: HousingSceneOptions): HousingScene {
  return createInspectionScene({ ...options, drawing: HOUSING_DRAWING, effects: createHousingEffects });
}
