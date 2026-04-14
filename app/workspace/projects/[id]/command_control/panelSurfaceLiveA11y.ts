import type { UniversalPanelSurfaceRenderModel } from "./panelSurfaceRenderModel";

export type UniversalPanelSurfaceLiveA11y = {
  titleId: string;
  bodyId: string;
  surfaceProps: UniversalPanelSurfaceRenderModel["frameProps"]["surfaceProps"];
};

export function getUniversalPanelSurfaceLiveA11y(
  model: UniversalPanelSurfaceRenderModel
): UniversalPanelSurfaceLiveA11y {
  return {
    titleId: model.composition.accessibility.titleId,
    bodyId: model.composition.accessibility.bodyId,
    surfaceProps: model.composition.accessibility.surfaceProps,
  };
}