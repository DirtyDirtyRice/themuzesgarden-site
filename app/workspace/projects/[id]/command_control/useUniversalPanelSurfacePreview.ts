"use client";

import { useMemo } from "react";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";
import { getUniversalPanelSurfacePreviewState } from "./panelSurfacePreviewState";

type UseUniversalPanelSurfacePreviewOptions = {
  panel: UniversalPanelInstance;
  surfaceController: UseUniversalPanelSurfaceControllerReturn;
};

export function useUniversalPanelSurfacePreview(
  options: UseUniversalPanelSurfacePreviewOptions
) {
  return useMemo(() => {
    return getUniversalPanelSurfacePreviewState({
      panel: options.panel,
      interactionSnapshot: options.surfaceController.interactionSnapshot,
    });
  }, [options.panel, options.surfaceController.interactionSnapshot]);
}

export type UseUniversalPanelSurfacePreviewReturn = ReturnType<
  typeof useUniversalPanelSurfacePreview
>;