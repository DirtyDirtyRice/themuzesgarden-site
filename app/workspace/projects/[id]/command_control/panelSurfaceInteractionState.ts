import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";

export type UniversalPanelSurfaceInteractionState = {
  interacting: boolean;
  dragging: boolean;
  resizing: boolean;
  previewing: boolean;
};

type BuildUniversalPanelSurfaceInteractionStateInput = {
  panel: UniversalPanelInstance;
  surfaceController?: UseUniversalPanelSurfaceControllerReturn | null;
};

export function buildUniversalPanelSurfaceInteractionState(
  input: BuildUniversalPanelSurfaceInteractionStateInput
): UniversalPanelSurfaceInteractionState {
  const snapshot = input.surfaceController?.interactionSnapshot;

  const isThisPanelActive =
    snapshot?.activeInstanceId === input.panel.instanceId;

  const interacting = Boolean(snapshot?.isInteracting && isThisPanelActive);
  const dragging = Boolean(input.surfaceController?.isDragging && isThisPanelActive);
  const resizing = Boolean(input.surfaceController?.isResizing && isThisPanelActive);
  const previewing = Boolean(
    interacting && snapshot?.rectCurrent && isThisPanelActive
  );

  return {
    interacting,
    dragging,
    resizing,
    previewing,
  };
}