import type {
  UniversalPanelRect,
  UniversalViewportRect,
} from "./panelInstanceTypes";
import type {
  UniversalPanelMoveComputationRequest,
  UniversalPointerDelta,
} from "./panelInteractionTypes";
import { getUniversalPointerDelta } from "./panelInteractionTypes";

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function clampUniversalPanelRectToViewport(
  rect: UniversalPanelRect,
  viewport: UniversalViewportRect
): UniversalPanelRect {
  const width = clampNumber(rect.width, 1, Math.max(1, viewport.width));
  const height = clampNumber(rect.height, 1, Math.max(1, viewport.height));
  const maxLeft = Math.max(0, viewport.width - width);
  const maxTop = Math.max(0, viewport.height - height);

  return {
    left: clampNumber(rect.left, 0, maxLeft),
    top: clampNumber(rect.top, 0, maxTop),
    width,
    height,
  };
}

export function buildUniversalPanelMoveRect(
  rectStart: UniversalPanelRect,
  delta: UniversalPointerDelta
): UniversalPanelRect {
  return {
    ...rectStart,
    left: rectStart.left + delta.deltaX,
    top: rectStart.top + delta.deltaY,
  };
}

export function computeUniversalPanelMoveRect(
  request: UniversalPanelMoveComputationRequest
): UniversalPanelRect {
  const delta = getUniversalPointerDelta(
    request.pointerStart,
    request.pointerCurrent
  );

  const rawRect = buildUniversalPanelMoveRect(request.rectStart, delta);

  return clampUniversalPanelRectToViewport(rawRect, request.viewport);
}

export function getUniversalPanelMoveDistance(
  pointerStart: { clientX: number; clientY: number },
  pointerCurrent: { clientX: number; clientY: number }
): number {
  const deltaX =
    (Number(pointerCurrent.clientX) || 0) - (Number(pointerStart.clientX) || 0);
  const deltaY =
    (Number(pointerCurrent.clientY) || 0) - (Number(pointerStart.clientY) || 0);

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}