/**
 * WebGL renderer for the Home & Living Utility inspection process: one realistic scene of a glazed pitcher standing in
 * its steel test bath, with the beaker of food simulant beside it.
 *
 * Scrolling drives it through `homePose` on the shared inspection stage: the camera moves from the whole bench to each
 * test and holds there while it is carried out (the beaker pours the simulant in, the coupon lifts out of the wall and
 * turns its section to the camera, the bath fills and ripples). There are no callouts.
 *
 * Loaded on demand when the visitor chooses Inspection process, so Three.js stays out of the page bundle.
 */
import type { InspectionScene, InspectionSceneOptions } from '@/components/inspection-drawing/scene';
import { createInspectionStage } from '@/components/inspection-3d/stage';
import { HOME_VIEW } from '@/lib/home-inspection/geometry';
import { homePose, homeView } from '@/lib/home-inspection/motion';

import { buildHomeModel } from './model';

export type HomeSceneOptions = Omit<InspectionSceneOptions, 'drawing' | 'effects'>;

export function createHomeScene(options: HomeSceneOptions): InspectionScene {
  return createInspectionStage({
    ...options,
    view: HOME_VIEW,
    // The bath is steel and the beaker is glass: both need something to reflect.
    environment: 0.4,
    build(maxAnisotropy) {
      const model = buildHomeModel(maxAnisotropy);
      return { ...model, animate: (progress: number) => model.animate(homePose(progress)) };
    },
    camera: homeView,
  });
}
