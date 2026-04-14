import type { PanelCollisionBox } from "./panelTypes";
import type { ProtectedZone } from "./panelProtectedZones";

export function boxesOverlap(
  a: PanelCollisionBox,
  b: PanelCollisionBox
): boolean {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  if (aRight <= b.x) return false;
  if (bRight <= a.x) return false;
  if (aBottom <= b.y) return false;
  if (bBottom <= a.y) return false;

  return true;
}

export function findFirstPanelCollision(
  candidate: PanelCollisionBox,
  boxes: PanelCollisionBox[]
): PanelCollisionBox | null {
  for (const box of boxes) {
    if (boxesOverlap(candidate, box)) {
      return box;
    }
  }

  return null;
}

export function findFirstProtectedZoneCollision(
  candidate: PanelCollisionBox,
  zones: ProtectedZone[]
): ProtectedZone | null {
  for (const zone of zones) {
    if (boxesOverlap(candidate, zone)) {
      return zone;
    }
  }

  return null;
}

export function hasAnyCollision(
  candidate: PanelCollisionBox,
  boxes: PanelCollisionBox[],
  zones: ProtectedZone[]
): boolean {
  return (
    !!findFirstPanelCollision(candidate, boxes) ||
    !!findFirstProtectedZoneCollision(candidate, zones)
  );
}