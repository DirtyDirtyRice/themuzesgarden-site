"use client";

import { useCallback, useMemo } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  UniversalPanelEdge,
  UniversalPanelInstance,
  UniversalPanelRect,
} from "./panelInstanceTypes";
import type { UseUniversalPanelManagerReturn } from "./useUniversalPanelManager";
import { usePanelInteractionController } from "./usePanelInteractionController";
import {
  canStartUniversalPanelDrag,
  canStartUniversalPanelResize,
} from "./panelInteractionGuards";
import {
  isPrimaryPointerButtonLike,
  safelyCapturePointer,
  safelyPreventPointerDefault,
  safelyReleasePointer,
} from "./panelPointerUtils";

type UseUniversalPanelSurfaceControllerOptions = {
  panel: UniversalPanelInstance;
  manager: UseUniversalPanelManagerReturn;
  onFocus?: () => void;
};

export function useUniversalPanelSurfaceController(
  options: UseUniversalPanelSurfaceControllerOptions
) {
  const { panel, manager, onFocus } = options;

  const controller = usePanelInteractionController({
    viewport: manager.viewport,
    callbacks: {
      onMoveCommit: (instanceId, nextRect) => {
        manager.movePanel({
          instanceId,
          left: nextRect.left,
          top: nextRect.top,
        });
      },
      onResizeCommit: (instanceId, _edge, nextRect) => {
        manager.resizePanel({
          instanceId,
          edge: _edge,
          nextRect,
        });
      },
      onInteractionStart: (instanceId) => {
        manager.focusPanel(instanceId);
        onFocus?.();
      },
    },
  });

  const previewRect: UniversalPanelRect = useMemo(() => {
    if (
      controller.snapshot.isInteracting &&
      controller.snapshot.activeInstanceId === panel.instanceId &&
      controller.snapshot.rectCurrent
    ) {
      return controller.snapshot.rectCurrent;
    }

    return panel.rect;
  }, [controller.snapshot, panel.instanceId, panel.rect]);

  const handleSurfacePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!controller.isInteracting) return;
      safelyPreventPointerDefault(event);
      controller.updatePointer(event.clientX, event.clientY);
    },
    [controller]
  );

  const handleSurfacePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!controller.isInteracting) return;
      safelyPreventPointerDefault(event);
      safelyReleasePointer(event);
      controller.endInteraction();
    },
    [controller]
  );

  const handleSurfacePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!controller.isInteracting) return;
      safelyPreventPointerDefault(event);
      safelyReleasePointer(event);
      controller.cancelInteraction();
    },
    [controller]
  );

  const handleDragPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isPrimaryPointerButtonLike(event)) return;
      if (!canStartUniversalPanelDrag(panel, event.target)) return;

      safelyPreventPointerDefault(event);
      safelyCapturePointer(event);
      manager.focusPanel(panel.instanceId);
      onFocus?.();
      controller.beginDrag(panel, event.clientX, event.clientY);
    },
    [controller, manager, onFocus, panel]
  );

  const handleResizePointerDown = useCallback(
    (
      edge: UniversalPanelEdge,
      event: ReactPointerEvent<HTMLElement>
    ) => {
      if (!isPrimaryPointerButtonLike(event)) return;
      if (!canStartUniversalPanelResize(panel, event.target)) return;

      safelyPreventPointerDefault(event);
      safelyCapturePointer(event);
      manager.focusPanel(panel.instanceId);
      onFocus?.();
      controller.beginResize(panel, edge, event.clientX, event.clientY);
    },
    [controller, manager, onFocus, panel]
  );

  return {
    previewRect,
    interactionSnapshot: controller.snapshot,
    isInteracting: controller.isInteracting,
    isDragging: controller.isDragging,
    isResizing: controller.isResizing,
    handleDragPointerDown,
    handleResizePointerDown,
    handleSurfacePointerMove,
    handleSurfacePointerUp,
    handleSurfacePointerCancel,
  };
}

export type UseUniversalPanelSurfaceControllerReturn = ReturnType<
  typeof useUniversalPanelSurfaceController
>;