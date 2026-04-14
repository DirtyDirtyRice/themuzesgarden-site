import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";

export type UniversalPanelSurfaceResizeConfig = {
  showResizeHandles: boolean;
  resizeDisabled: boolean;
};

type BuildUniversalPanelSurfaceResizeConfigInput = {
  panel: UniversalPanelInstance;
  surfaceController?: UseUniversalPanelSurfaceControllerReturn | null;
};

export function buildUniversalPanelSurfaceResizeConfig(
  input: BuildUniversalPanelSurfaceResizeConfigInput
): UniversalPanelSurfaceResizeConfig {
  const showResizeHandles = input.panel.permissions.canResize;
  const resizeDisabled = Boolean(
    !input.panel.permissions.canResize ||
      input.panel.locked ||
      input.surfaceController?.isDragging
  );

  return {
    showResizeHandles,
    resizeDisabled,
  };
}