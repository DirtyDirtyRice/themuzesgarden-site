import type {
  UniversalPanelEdge,
  UniversalPanelRect,
  UniversalViewportRect,
} from "./panelInstanceTypes";

export type UniversalPointerPoint = {
  clientX: number;
  clientY: number;
};

export type UniversalPointerDelta = {
  deltaX: number;
  deltaY: number;
};

export type UniversalPanelInteractionMode =
  | "idle"
  | "dragging"
  | "resizing";

export type UniversalPanelDragSession = {
  mode: "dragging";
  instanceId: string;
  pointerStart: UniversalPointerPoint;
  rectStart: UniversalPanelRect;
};

export type UniversalPanelResizeSession = {
  mode: "resizing";
  instanceId: string;
  edge: UniversalPanelEdge;
  pointerStart: UniversalPointerPoint;
  rectStart: UniversalPanelRect;
};

export type UniversalPanelInteractionSession =
  | UniversalPanelDragSession
  | UniversalPanelResizeSession
  | null;

export type UniversalPanelInteractionSnapshot = {
  mode: UniversalPanelInteractionMode;
  activeInstanceId: string | null;
  activeEdge: UniversalPanelEdge | null;
  pointerStart: UniversalPointerPoint | null;
  pointerCurrent: UniversalPointerPoint | null;
  rectStart: UniversalPanelRect | null;
  rectCurrent: UniversalPanelRect | null;
  isInteracting: boolean;
};

export type UniversalPanelMoveComputationRequest = {
  rectStart: UniversalPanelRect;
  pointerStart: UniversalPointerPoint;
  pointerCurrent: UniversalPointerPoint;
  viewport: UniversalViewportRect;
};

export type UniversalPanelResizeComputationRequest = {
  rectStart: UniversalPanelRect;
  edge: UniversalPanelEdge;
  pointerStart: UniversalPointerPoint;
  pointerCurrent: UniversalPointerPoint;
  minWidth: number;
  minHeight: number;
  maxWidth?: number | null;
  maxHeight?: number | null;
  viewport: UniversalViewportRect;
};

export function cloneUniversalPointerPoint(
  point: UniversalPointerPoint
): UniversalPointerPoint {
  return {
    clientX: Number(point.clientX) || 0,
    clientY: Number(point.clientY) || 0,
  };
}

export function getUniversalPointerDelta(
  pointerStart: UniversalPointerPoint,
  pointerCurrent: UniversalPointerPoint
): UniversalPointerDelta {
  return {
    deltaX: (Number(pointerCurrent.clientX) || 0) - (Number(pointerStart.clientX) || 0),
    deltaY: (Number(pointerCurrent.clientY) || 0) - (Number(pointerStart.clientY) || 0),
  };
}

export function getIdleUniversalPanelInteractionSnapshot(): UniversalPanelInteractionSnapshot {
  return {
    mode: "idle",
    activeInstanceId: null,
    activeEdge: null,
    pointerStart: null,
    pointerCurrent: null,
    rectStart: null,
    rectCurrent: null,
    isInteracting: false,
  };
}

export function isUniversalPanelDragSession(
  value: UniversalPanelInteractionSession
): value is UniversalPanelDragSession {
  return Boolean(value && value.mode === "dragging");
}

export function isUniversalPanelResizeSession(
  value: UniversalPanelInteractionSession
): value is UniversalPanelResizeSession {
  return Boolean(value && value.mode === "resizing");
}