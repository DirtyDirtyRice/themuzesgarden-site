import type {
  UniversalPanelEdge,
  UniversalPanelRect,
  UniversalViewportRect,
} from "./panelInstanceTypes";
import type {
  UniversalPanelResizeComputationRequest,
  UniversalPointerDelta,
} from "./panelInteractionTypes";
import { getUniversalPointerDelta } from "./panelInteractionTypes";

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function includesLeft(edge: UniversalPanelEdge): boolean {
  return edge === "left" || edge === "top-left" || edge === "bottom-left";
}

function includesRight(edge: UniversalPanelEdge): boolean {
  return edge === "right" || edge === "top-right" || edge === "bottom-right";
}

function includesTop(edge: UniversalPanelEdge): boolean {
  return edge === "top" || edge === "top-left" || edge === "top-right";
}

function includesBottom(edge: UniversalPanelEdge): boolean {
  return edge === "bottom" || edge === "bottom-left" || edge === "bottom-right";
}

export function clampUniversalPanelSizeConstraints(input: {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number | null;
  maxHeight?: number | null;
  viewport: UniversalViewportRect;
}): {
  width: number;
  height: number;
} {
  const maxWidth =
    typeof input.maxWidth === "number"
      ? input.maxWidth
      : input.viewport.width;

  const maxHeight =
    typeof input.maxHeight === "number"
      ? input.maxHeight
      : input.viewport.height;

  return {
    width: clampNumber(
      input.width,
      input.minWidth,
      Math.max(input.minWidth, maxWidth)
    ),
    height: clampNumber(
      input.height,
      input.minHeight,
      Math.max(input.minHeight, maxHeight)
    ),
  };
}

export function buildUniversalPanelResizeRect(input: {
  rectStart: UniversalPanelRect;
  edge: UniversalPanelEdge;
  delta: UniversalPointerDelta;
  minWidth: number;
  minHeight: number;
  maxWidth?: number | null;
  maxHeight?: number | null;
  viewport: UniversalViewportRect;
}): UniversalPanelRect {
  const { rectStart, edge, delta, viewport } = input;

  let left = rectStart.left;
  let top = rectStart.top;
  let width = rectStart.width;
  let height = rectStart.height;

  if (includesRight(edge)) {
    width = rectStart.width + delta.deltaX;
  }

  if (includesBottom(edge)) {
    height = rectStart.height + delta.deltaY;
  }

  if (includesLeft(edge)) {
    const proposedLeft = rectStart.left + delta.deltaX;
    const proposedWidth = rectStart.width - delta.deltaX;
    left = proposedLeft;
    width = proposedWidth;
  }

  if (includesTop(edge)) {
    const proposedTop = rectStart.top + delta.deltaY;
    const proposedHeight = rectStart.height - delta.deltaY;
    top = proposedTop;
    height = proposedHeight;
  }

  const constrainedSize = clampUniversalPanelSizeConstraints({
    width,
    height,
    minWidth: input.minWidth,
    minHeight: input.minHeight,
    maxWidth: input.maxWidth,
    maxHeight: input.maxHeight,
    viewport,
  });

  width = constrainedSize.width;
  height = constrainedSize.height;

  if (includesLeft(edge)) {
    left = rectStart.left + (rectStart.width - width);
  }

  if (includesTop(edge)) {
    top = rectStart.top + (rectStart.height - height);
  }

  left = clampNumber(left, 0, Math.max(0, viewport.width - width));
  top = clampNumber(top, 0, Math.max(0, viewport.height - height));

  if (left + width > viewport.width) {
    width = Math.max(input.minWidth, viewport.width - left);
  }

  if (top + height > viewport.height) {
    height = Math.max(input.minHeight, viewport.height - top);
  }

  return {
    left,
    top,
    width: clampNumber(width, input.minWidth, Math.max(input.minWidth, viewport.width)),
    height: clampNumber(height, input.minHeight, Math.max(input.minHeight, viewport.height)),
  };
}

export function computeUniversalPanelResizeRect(
  request: UniversalPanelResizeComputationRequest
): UniversalPanelRect {
  const delta = getUniversalPointerDelta(
    request.pointerStart,
    request.pointerCurrent
  );

  return buildUniversalPanelResizeRect({
    rectStart: request.rectStart,
    edge: request.edge,
    delta,
    minWidth: request.minWidth,
    minHeight: request.minHeight,
    maxWidth: request.maxWidth,
    maxHeight: request.maxHeight,
    viewport: request.viewport,
  });
}