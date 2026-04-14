import type { ReactNode } from "react";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";
import { getUniversalPanelSurfaceAccessibility } from "./panelSurfaceAccessibility";
import { buildUniversalPanelSurfaceInteractionState } from "./panelSurfaceInteractionState";
import { buildUniversalPanelSurfaceLayoutState } from "./panelSurfaceLayout";
import { getUniversalPanelSurfacePreviewState } from "./panelSurfacePreviewState";
import { buildUniversalPanelSurfaceResizeConfig } from "./panelSurfaceResizeConfig";
import { buildUniversalPanelSurfaceTitleBarActions } from "./panelSurfaceTitleBarActions";

export type UniversalPanelSurfaceComposition = {
  accessibility: ReturnType<typeof getUniversalPanelSurfaceAccessibility>;
  interactionState: ReturnType<typeof buildUniversalPanelSurfaceInteractionState>;
  layoutState: ReturnType<typeof buildUniversalPanelSurfaceLayoutState>;
  previewState: ReturnType<typeof getUniversalPanelSurfacePreviewState>;
  resizeConfig: ReturnType<typeof buildUniversalPanelSurfaceResizeConfig>;
  titleBarActions: ReturnType<typeof buildUniversalPanelSurfaceTitleBarActions>;
};

type BuildUniversalPanelSurfaceCompositionInput = {
  panel: UniversalPanelInstance;
  surfaceController?: UseUniversalPanelSurfaceControllerReturn | null;
  children?: ReactNode;
  footer?: ReactNode;
  showTitleBar?: boolean;
  showCloseButton?: boolean;
};

export function buildUniversalPanelSurfaceComposition(
  input: BuildUniversalPanelSurfaceCompositionInput
): UniversalPanelSurfaceComposition {
  const surfaceController = input.surfaceController ?? null;

  return {
    accessibility: getUniversalPanelSurfaceAccessibility(input.panel),
    interactionState: buildUniversalPanelSurfaceInteractionState({
      panel: input.panel,
      surfaceController,
    }),
    layoutState: buildUniversalPanelSurfaceLayoutState({
      showTitleBar: input.showTitleBar,
      footer: input.footer,
      children: input.children,
    }),
    previewState: getUniversalPanelSurfacePreviewState({
      panel: input.panel,
      interactionSnapshot:
        surfaceController?.interactionSnapshot ?? {
          mode: "idle",
          activeInstanceId: null,
          activeEdge: null,
          pointerStart: null,
          pointerCurrent: null,
          rectStart: null,
          rectCurrent: null,
          isInteracting: false,
        },
    }),
    resizeConfig: buildUniversalPanelSurfaceResizeConfig({
      panel: input.panel,
      surfaceController,
    }),
    titleBarActions: buildUniversalPanelSurfaceTitleBarActions({
      panel: input.panel,
      showCloseButton: input.showCloseButton,
      surfaceController,
    }),
  };
}