import type {
  UniversalPanelInstance,
  UniversalPanelRect,
} from "./panelInstanceTypes";
import type { UniversalPanelInteractionSnapshot } from "./panelInteractionTypes";

export type UniversalPanelSurfacePreviewState = {
  isPreviewing: boolean;
  rect: UniversalPanelRect;
};

export function getUniversalPanelSurfacePreviewState(input: {
  panel: UniversalPanelInstance;
  interactionSnapshot: UniversalPanelInteractionSnapshot;
}): UniversalPanelSurfacePreviewState {
  const { panel, interactionSnapshot } = input;

  if (
    interactionSnapshot.isInteracting &&
    interactionSnapshot.activeInstanceId === panel.instanceId &&
    interactionSnapshot.rectCurrent
  ) {
    return {
      isPreviewing: true,
      rect: {
        ...interactionSnapshot.rectCurrent,
      },
    };
  }

  return {
    isPreviewing: false,
    rect: {
      ...panel.rect,
    },
  };
}