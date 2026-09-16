/**
 * WebGL renderer for the Textiles & Materials inspection process: one realistic scene of the fabric roll, the sheet
 * unrolled from it and the three inspection elements on that sheet.
 *
 * Scrolling drives it through `textilesPose` on the shared inspection stage: the camera starts on the whole roll and
 * moves with the steps to a closer three-quarter view of each element and holds there while that element moves (the
 * tag lifts, the swatches rise one after another, the fabric tears in from its edge). There are no callouts. The
 * inspection groups are named and carry hit areas, so hover and click can target them later.
 *
 * Loaded on demand when the visitor chooses Inspection process, so Three.js stays out of the page bundle. It shares
 * the inspection scene interface with the line drawings, so the page drives it the same way.
 */
import type { InspectionScene, InspectionSceneOptions } from '@/components/inspection-drawing/scene';
import { createInspectionStage } from '@/components/inspection-3d/stage';
import { TEXTILES_VIEW } from '@/lib/textiles-inspection/geometry';
import { textilesPose, textilesView } from '@/lib/textiles-inspection/motion';

import { buildTextilesModel } from './model';

export type TextilesSceneOptions = Omit<InspectionSceneOptions, 'drawing' | 'effects'>;

export function createTextilesScene(options: TextilesSceneOptions): InspectionScene {
  return createInspectionStage({
    ...options,
    view: TEXTILES_VIEW,
    build(maxAnisotropy) {
      const model = buildTextilesModel(maxAnisotropy);
      return { ...model, animate: (progress: number) => model.animate(textilesPose(progress)) };
    },
    camera: textilesView,
  });
}
