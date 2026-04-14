import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";

export type UniversalPanelSurfaceTitleBarActions = {
  canClose: boolean;
  canDrag: boolean;
  dragging: boolean;
};

type BuildUniversalPanelSurfaceTitleBarActionsInput = {
  panel: UniversalPanelInstance;
  showCloseButton?: boolean;
  surfaceController?: UseUniversalPanelSurfaceControllerReturn | null;
};

export function buildUniversalPanelSurfaceTitleBarActions(
  input: BuildUniversalPanelSurfaceTitleBarActionsInput
): UniversalPanelSurfaceTitleBarActions {
  const canClose = input.panel.permissions.canClose && input.showCloseButton !== false;
  const canDrag = input.panel.permissions.canDrag && !input.panel.locked;

  const dragging = Boolean(
    input.surfaceController?.isDragging &&
      input.surfaceController?.interactionSnapshot.activeInstanceId ===
        input.panel.instanceId
  );

  return {
    canClose,
    canDrag,
    dragging,
  };
}