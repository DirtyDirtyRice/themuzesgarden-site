"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  UniversalPanelDragSession,
  UniversalPanelInteractionSession,
  UniversalPanelInteractionSnapshot,
  UniversalPanelResizeSession,
  UniversalPointerPoint,
} from "./panelInteractionTypes";
import {
  cloneUniversalPointerPoint,
  getIdleUniversalPanelInteractionSnapshot,
  isUniversalPanelDragSession,
  isUniversalPanelResizeSession,
} from "./panelInteractionTypes";
import { computeUniversalPanelMoveRect } from "./panelMoveMath";
import { computeUniversalPanelResizeRect } from "./panelResizeMath";
import type {
  UniversalPanelEdge,
  UniversalPanelInstance,
  UniversalPanelRect,
  UniversalViewportRect,
} from "./panelInstanceTypes";

export type UniversalPanelInteractionCallbacks = {
  onMovePreview?: (instanceId: string, nextRect: UniversalPanelRect) => void;
  onMoveCommit?: (instanceId: string, nextRect: UniversalPanelRect) => void;
  onResizePreview?: (
    instanceId: string,
    edge: UniversalPanelEdge,
    nextRect: UniversalPanelRect
  ) => void;
  onResizeCommit?: (
    instanceId: string,
    edge: UniversalPanelEdge,
    nextRect: UniversalPanelRect
  ) => void;
  onInteractionStart?: (instanceId: string) => void;
  onInteractionEnd?: (instanceId: string) => void;
};

export type UsePanelInteractionControllerOptions = {
  viewport: UniversalViewportRect;
  callbacks?: UniversalPanelInteractionCallbacks;
};

function makePointerPoint(
  clientX: number,
  clientY: number
): UniversalPointerPoint {
  return {
    clientX: Number(clientX) || 0,
    clientY: Number(clientY) || 0,
  };
}

export function usePanelInteractionController(
  options: UsePanelInteractionControllerOptions
) {
  const [session, setSession] = useState<UniversalPanelInteractionSession>(null);
  const [pointerCurrent, setPointerCurrent] =
    useState<UniversalPointerPoint | null>(null);
  const [rectCurrent, setRectCurrent] = useState<UniversalPanelRect | null>(null);

  const beginDrag = useCallback(
    (panel: UniversalPanelInstance, clientX: number, clientY: number) => {
      if (!panel.permissions.canDrag || panel.locked) return;

      const nextSession: UniversalPanelDragSession = {
        mode: "dragging",
        instanceId: panel.instanceId,
        pointerStart: makePointerPoint(clientX, clientY),
        rectStart: { ...panel.rect },
      };

      setSession(nextSession);
      setPointerCurrent(cloneUniversalPointerPoint(nextSession.pointerStart));
      setRectCurrent({ ...panel.rect });
      options.callbacks?.onInteractionStart?.(panel.instanceId);
    },
    [options.callbacks]
  );

  const beginResize = useCallback(
    (
      panel: UniversalPanelInstance,
      edge: UniversalPanelEdge,
      clientX: number,
      clientY: number
    ) => {
      if (!panel.permissions.canResize || panel.locked) return;

      const nextSession: UniversalPanelResizeSession = {
        mode: "resizing",
        instanceId: panel.instanceId,
        edge,
        pointerStart: makePointerPoint(clientX, clientY),
        rectStart: { ...panel.rect },
      };

      setSession(nextSession);
      setPointerCurrent(cloneUniversalPointerPoint(nextSession.pointerStart));
      setRectCurrent({ ...panel.rect });
      options.callbacks?.onInteractionStart?.(panel.instanceId);
    },
    [options.callbacks]
  );

  const updatePointer = useCallback(
    (clientX: number, clientY: number) => {
      setSession((current) => {
        if (!current) return current;

        const nextPointer = makePointerPoint(clientX, clientY);
        setPointerCurrent(nextPointer);

        if (isUniversalPanelDragSession(current)) {
          const nextRect = computeUniversalPanelMoveRect({
            rectStart: current.rectStart,
            pointerStart: current.pointerStart,
            pointerCurrent: nextPointer,
            viewport: options.viewport,
          });

          setRectCurrent(nextRect);
          options.callbacks?.onMovePreview?.(current.instanceId, nextRect);
          return current;
        }

        if (isUniversalPanelResizeSession(current)) {
          const nextRect = computeUniversalPanelResizeRect({
            rectStart: current.rectStart,
            edge: current.edge,
            pointerStart: current.pointerStart,
            pointerCurrent: nextPointer,
            minWidth: 1,
            minHeight: 1,
            viewport: options.viewport,
          });

          setRectCurrent(nextRect);
          options.callbacks?.onResizePreview?.(
            current.instanceId,
            current.edge,
            nextRect
          );
          return current;
        }

        return current;
      });
    },
    [options.callbacks, options.viewport]
  );

  const endInteraction = useCallback(() => {
    setSession((current) => {
      if (!current) return current;

      const finalRect = rectCurrent ?? current.rectStart;

      if (isUniversalPanelDragSession(current)) {
        options.callbacks?.onMoveCommit?.(current.instanceId, finalRect);
        options.callbacks?.onInteractionEnd?.(current.instanceId);
      }

      if (isUniversalPanelResizeSession(current)) {
        options.callbacks?.onResizeCommit?.(
          current.instanceId,
          current.edge,
          finalRect
        );
        options.callbacks?.onInteractionEnd?.(current.instanceId);
      }

      return null;
    });

    setPointerCurrent(null);
    setRectCurrent(null);
  }, [options.callbacks, rectCurrent]);

  const cancelInteraction = useCallback(() => {
    setSession((current) => {
      if (current) {
        options.callbacks?.onInteractionEnd?.(current.instanceId);
      }
      return null;
    });

    setPointerCurrent(null);
    setRectCurrent(null);
  }, [options.callbacks]);

  const snapshot = useMemo<UniversalPanelInteractionSnapshot>(() => {
    if (!session) return getIdleUniversalPanelInteractionSnapshot();

    return {
      mode: session.mode,
      activeInstanceId: session.instanceId,
      activeEdge: isUniversalPanelResizeSession(session) ? session.edge : null,
      pointerStart: cloneUniversalPointerPoint(session.pointerStart),
      pointerCurrent: pointerCurrent
        ? cloneUniversalPointerPoint(pointerCurrent)
        : cloneUniversalPointerPoint(session.pointerStart),
      rectStart: { ...session.rectStart },
      rectCurrent: rectCurrent ? { ...rectCurrent } : { ...session.rectStart },
      isInteracting: true,
    };
  }, [pointerCurrent, rectCurrent, session]);

  return {
    session,
    snapshot,
    isDragging: session?.mode === "dragging",
    isResizing: session?.mode === "resizing",
    isInteracting: Boolean(session),
    beginDrag,
    beginResize,
    updatePointer,
    endInteraction,
    cancelInteraction,
  };
}

export type UsePanelInteractionControllerReturn = ReturnType<
  typeof usePanelInteractionController
>;