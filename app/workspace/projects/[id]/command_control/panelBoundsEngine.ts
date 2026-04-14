import type {
  PanelBounds,
  PanelCollisionBox,
  PanelPosition,
  PanelViewport,
} from "./panelTypes";
import type { ProtectedZone } from "./panelProtectedZones";
import { hasAnyCollision } from "./panelCollision";

export function clampPanelBoundsToViewport(
  bounds: PanelBounds,
  viewport: PanelViewport
): PanelBounds {
  const safeMaxWidth = Math.max(bounds.minWidth, viewport.width - 24);
  const safeMaxHeight = Math.max(bounds.minHeight, viewport.height - 24);

  return {
    ...bounds,
    width: Math.min(bounds.width, safeMaxWidth),
    height: Math.min(bounds.height, safeMaxHeight),
  };
}

export function clampPanelPositionToViewport(
  position: PanelPosition,
  bounds: PanelBounds,
  viewport: PanelViewport
): PanelPosition {
  const maxX = Math.max(0, viewport.width - bounds.width);
  const maxY = Math.max(0, viewport.height - bounds.height);

  return {
    x: Math.max(0, Math.min(position.x, maxX)),
    y: Math.max(0, Math.min(position.y, maxY)),
  };
}

export function toCollisionBox(
  id: string,
  position: PanelPosition,
  bounds: PanelBounds
): PanelCollisionBox {
  return {
    id,
    x: position.x,
    y: position.y,
    width: bounds.width,
    height: bounds.height,
  };
}

export function findSafePanelPosition(args: {
  id: string;
  desiredPosition: PanelPosition;
  bounds: PanelBounds;
  viewport: PanelViewport;
  otherBoxes: PanelCollisionBox[];
  protectedZones: ProtectedZone[];
  step?: number;
  maxAttempts?: number;
}): PanelPosition {
  const {
    id,
    desiredPosition,
    bounds,
    viewport,
    otherBoxes,
    protectedZones,
    step = 24,
    maxAttempts = 400,
  } = args;

  const clampedStart = clampPanelPositionToViewport(
    desiredPosition,
    bounds,
    viewport
  );

  const startCandidate = toCollisionBox(id, clampedStart, bounds);

  if (!hasAnyCollision(startCandidate, otherBoxes, protectedZones)) {
    return clampedStart;
  }

  let attempts = 0;

  for (let y = 0; y <= viewport.height; y += step) {
    for (let x = 0; x <= viewport.width; x += step) {
      attempts += 1;
      if (attempts > maxAttempts) break;

      const nextPos = clampPanelPositionToViewport({ x, y }, bounds, viewport);
      const candidate = toCollisionBox(id, nextPos, bounds);

      if (!hasAnyCollision(candidate, otherBoxes, protectedZones)) {
        return nextPos;
      }
    }

    if (attempts > maxAttempts) break;
  }

  return clampedStart;
}