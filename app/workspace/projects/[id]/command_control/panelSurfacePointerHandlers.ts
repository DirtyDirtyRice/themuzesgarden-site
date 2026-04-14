import type { PointerEvent as ReactPointerEvent } from "react";
import type { UniversalPanelEdge } from "./panelInstanceTypes";

export type UniversalPanelSurfacePointerHandlers = {
  onSurfacePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onSurfacePointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onSurfacePointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  onDragHandlePointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onResizeHandlePointerDown: (
    edge: UniversalPanelEdge,
    event: ReactPointerEvent<HTMLElement>
  ) => void;
};

type BuildUniversalPanelSurfacePointerHandlersInput = {
  handleSurfacePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  handleSurfacePointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  handleSurfacePointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  handleDragPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  handleResizePointerDown: (
    edge: UniversalPanelEdge,
    event: ReactPointerEvent<HTMLElement>
  ) => void;
};

export function buildUniversalPanelSurfacePointerHandlers(
  input: BuildUniversalPanelSurfacePointerHandlersInput
): UniversalPanelSurfacePointerHandlers {
  return {
    onSurfacePointerMove: input.handleSurfacePointerMove,
    onSurfacePointerUp: input.handleSurfacePointerUp,
    onSurfacePointerCancel: input.handleSurfacePointerCancel,
    onDragHandlePointerDown: input.handleDragPointerDown,
    onResizeHandlePointerDown: input.handleResizePointerDown,
  };
}