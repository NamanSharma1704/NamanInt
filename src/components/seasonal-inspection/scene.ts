/**
 * WebGL renderer for the Seasonal & Promotional inspection process: one realistic scene of a kraft shipping carton
 * packed with printed retail gift boxes, beside the timber pallet it ships from.
 *
 * Scrolling drives it through `seasonalPose` on the shared inspection stage: the camera moves from the whole bench to
 * each act and holds there while it is carried out (the carton is lifted onto the pallet, a sample of gift boxes is
 * drawn out with one lid off, the carton is closed, taped and labelled). There are no callouts.
 *
 * Loaded on demand when the visitor chooses Inspection process, so Three.js stays out of the page bundle.
 */
import type { InspectionScene, InspectionSceneOptions } from '@/components/inspection-drawing/scene';
import { createInspectionStage } from '@/components/inspection-3d/stage';
import { SEASONAL_VIEW } from '@/lib/seasonal-inspection/geometry';
import { seasonalPose, seasonalView } from '@/lib/seasonal-inspection/motion';

import { buildSeasonalModel } from './model';

export type SeasonalSceneOptions = Omit<InspectionSceneOptions, 'drawing' | 'effects'>;

export function createSeasonalScene(options: SeasonalSceneOptions): InspectionScene {
  return createInspectionStage({
    ...options,
    view: SEASONAL_VIEW,
    // The tin is tinplate: it needs something to reflect.
    environment: 0.35,
    build(maxAnisotropy) {
      const model = buildSeasonalModel(maxAnisotropy);
      return { ...model, animate: (progress: number) => model.animate(seasonalPose(progress)) };
    },
    camera: seasonalView,
  });
}
