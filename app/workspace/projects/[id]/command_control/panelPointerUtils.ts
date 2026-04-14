import type { UniversalPointerPoint } from "./panelInteractionTypes";

export type UniversalPointerLikeEvent = {
  clientX: number;
  clientY: number;
  pointerId?: number;
  currentTarget?: EventTarget | null;
  target?: EventTarget | null;
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export function makeUniversalPointerPoint(
  clientX: number,
  clientY: number
): UniversalPointerPoint {
  return {
    clientX: Number(clientX) || 0,
    clientY: Number(clientY) || 0,
  };
}

export function getUniversalPointerPointFromEvent(
  event: UniversalPointerLikeEvent
): UniversalPointerPoint {
  return makeUniversalPointerPoint(event.clientX, event.clientY);
}

export function safelyPreventPointerDefault(
  event: UniversalPointerLikeEvent
): void {
  event.preventDefault?.();
  event.stopPropagation?.();
}

export function safelyCapturePointer(
  event: UniversalPointerLikeEvent
): void {
  const pointerId =
    typeof event.pointerId === "number" ? event.pointerId : null;

  if (pointerId == null) return;

  const currentTarget = event.currentTarget as
    | { setPointerCapture?: (pointerId: number) => void }
    | null
    | undefined;

  currentTarget?.setPointerCapture?.(pointerId);
}

export function safelyReleasePointer(
  event: UniversalPointerLikeEvent
): void {
  const pointerId =
    typeof event.pointerId === "number" ? event.pointerId : null;

  if (pointerId == null) return;

  const currentTarget = event.currentTarget as
    | { releasePointerCapture?: (pointerId: number) => void }
    | null
    | undefined;

  currentTarget?.releasePointerCapture?.(pointerId);
}

export function isPrimaryPointerButtonLike(
  event: { button?: number | null }
): boolean {
  return event.button == null || event.button === 0;
}