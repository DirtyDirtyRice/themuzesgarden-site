import type { PointerEvent as ReactPointerEvent } from "react";
import type { UniversalPanelEdge, UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";

export type UniversalPanelResizeHandleAdapterResult = {
  disabled: boolean;
  onResizePointerDown: (
    edge: UniversalPanelEdge,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void;
};

type BuildUniversalPanelResizeHandleAdapterInput = {
  panel: UniversalPanelInstance;
  surfaceController: UseUniversalPanelSurfaceControllerReturn;
};

export function buildUniversalPanelResizeHandleAdapter(
  input: BuildUniversalPanelResizeHandleAdapterInput
): UniversalPanelResizeHandleAdapterResult {
  const disabled =
    !input.panel.permissions.canResize ||
    input.panel.locked ||
    input.surfaceController.isDragging;

  return {
    disabled,
    onResizePointerDown: (edge, event) => {
      input.surfaceController.handleResizePointerDown(edge, event);
    },
  };
}