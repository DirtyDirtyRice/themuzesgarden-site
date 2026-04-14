import { buildUniversalPanelSurfacePointerHandlers } from "./panelSurfacePointerHandlers";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";

export type UniversalPanelSurfaceControllerAdapters = {
  pointerHandlers: ReturnType<typeof buildUniversalPanelSurfacePointerHandlers>;
  isInteracting: boolean;
  isDragging: boolean;
  isResizing: boolean;
};

export function buildUniversalPanelSurfaceControllerAdapters(
  surfaceController: UseUniversalPanelSurfaceControllerReturn
): UniversalPanelSurfaceControllerAdapters {
  return {
    pointerHandlers: buildUniversalPanelSurfacePointerHandlers({
      handleSurfacePointerMove: surfaceController.handleSurfacePointerMove,
      handleSurfacePointerUp: surfaceController.handleSurfacePointerUp,
      handleSurfacePointerCancel: surfaceController.handleSurfacePointerCancel,
      handleDragPointerDown: surfaceController.handleDragPointerDown,
      handleResizePointerDown: surfaceController.handleResizePointerDown,
    }),
    isInteracting: surfaceController.isInteracting,
    isDragging: surfaceController.isDragging,
    isResizing: surfaceController.isResizing,
  };
}