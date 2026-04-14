import type { UniversalPanelRect } from "./panelInstanceTypes";
import type { UniversalPanelSurfaceRenderModel } from "./panelSurfaceRenderModel";

export type UniversalPanelSurfaceLivePreview = {
  isPreviewing: boolean;
  rect: UniversalPanelRect;
};

export function getUniversalPanelSurfaceLivePreview(
  model: UniversalPanelSurfaceRenderModel
): UniversalPanelSurfaceLivePreview {
  return {
    isPreviewing: model.composition.previewState.isPreviewing,
    rect: {
      ...model.composition.previewState.rect,
    },
  };
}