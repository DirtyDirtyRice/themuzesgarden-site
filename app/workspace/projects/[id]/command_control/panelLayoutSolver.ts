import {
  cloneUniversalPanelRect,
  getUniversalPanelBottom,
  getUniversalPanelRight,
  type UniversalCollisionResult,
  type UniversalPanelInstance,
  type UniversalPanelLayoutSolveRequest,
  type UniversalPanelLayoutSolveResult,
  type UniversalPanelRect,
  type UniversalProtectedZone,
  type UniversalViewportRect,
} from "./panelInstanceTypes";

function rectsOverlap(a: UniversalPanelRect, b: UniversalPanelRect): boolean {
  return !(
    getUniversalPanelRight(a) <= b.left ||
    a.left >= getUniversalPanelRight(b) ||
    getUniversalPanelBottom(a) <= b.top ||
    a.top >= getUniversalPanelBottom(b)
  );
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function clampRectToViewport(
  rect: UniversalPanelRect,
  viewport: UniversalViewportRect
): UniversalPanelRect {
  const safeWidth = clampNumber(rect.width, 1, Math.max(1, viewport.width));
  const safeHeight = clampNumber(rect.height, 1, Math.max(1, viewport.height));

  const maxLeft = Math.max(0, viewport.width - safeWidth);
  const maxTop = Math.max(0, viewport.height - safeHeight);

  return {
    left: clampNumber(rect.left, 0, maxLeft),
    top: clampNumber(rect.top, 0, maxTop),
    width: safeWidth,
    height: safeHeight,
  };
}

export function clampRectToConstraints(
  rect: UniversalPanelRect,
  constraints: Pick<
    UniversalPanelInstance,
    "constraints"
  >["constraints"],
  viewport?: UniversalViewportRect
): UniversalPanelRect {
  const maxWidth =
    typeof constraints.maxWidth === "number"
      ? constraints.maxWidth
      : viewport?.width ?? Number.MAX_SAFE_INTEGER;

  const maxHeight =
    typeof constraints.maxHeight === "number"
      ? constraints.maxHeight
      : viewport?.height ?? Number.MAX_SAFE_INTEGER;

  return {
    ...rect,
    width: clampNumber(rect.width, constraints.minWidth, Math.max(constraints.minWidth, maxWidth)),
    height: clampNumber(
      rect.height,
      constraints.minHeight,
      Math.max(constraints.minHeight, maxHeight)
    ),
  };
}

export function detectPanelCollision(
  candidateRect: UniversalPanelRect,
  existingPanels: UniversalPanelInstance[],
  movingInstanceId?: string | null
): UniversalCollisionResult {
  const collidedWithIds = existingPanels
    .filter((panel) => panel.visibilityState === "open")
    .filter((panel) => panel.instanceId !== movingInstanceId)
    .filter((panel) => rectsOverlap(candidateRect, panel.rect))
    .map((panel) => panel.instanceId);

  return {
    hasCollision: collidedWithIds.length > 0,
    collidedWithIds,
  };
}

export function detectProtectedZoneHits(
  candidateRect: UniversalPanelRect,
  protectedZones: UniversalProtectedZone[]
): string[] {
  return protectedZones
    .filter((zone) => rectsOverlap(candidateRect, zone))
    .map((zone) => zone.id);
}

function buildCandidateOffsets(): Array<{ left: number; top: number }> {
  return [
    { left: 0, top: 0 },
    { left: 24, top: 0 },
    { left: 0, top: 24 },
    { left: 24, top: 24 },
    { left: -24, top: 0 },
    { left: 0, top: -24 },
    { left: 48, top: 0 },
    { left: 0, top: 48 },
    { left: -48, top: 0 },
    { left: 0, top: -48 },
    { left: 72, top: 0 },
    { left: 0, top: 72 },
    { left: 96, top: 0 },
    { left: 0, top: 96 },
    { left: 120, top: 0 },
    { left: 0, top: 120 },
    { left: 48, top: 48 },
    { left: 96, top: 96 },
    { left: 144, top: 24 },
    { left: 24, top: 144 },
  ];
}

function trySolveByOffsets(
  baseRect: UniversalPanelRect,
  request: UniversalPanelLayoutSolveRequest
): UniversalPanelLayoutSolveResult | null {
  const offsets = buildCandidateOffsets();

  for (const offset of offsets) {
    const candidate = clampRectToViewport(
      {
        ...baseRect,
        left: baseRect.left + offset.left,
        top: baseRect.top + offset.top,
      },
      request.viewport
    );

    const collision = detectPanelCollision(
      candidate,
      request.existingPanels,
      request.movingInstanceId
    );

    const protectedZoneHitIds = request.allowProtectedZoneOverride
      ? []
      : detectProtectedZoneHits(candidate, request.protectedZones);

    if (!collision.hasCollision && protectedZoneHitIds.length === 0) {
      return {
        rect: candidate,
        collision,
        protectedZoneHitIds,
        changed:
          candidate.left !== request.candidateRect.left ||
          candidate.top !== request.candidateRect.top ||
          candidate.width !== request.candidateRect.width ||
          candidate.height !== request.candidateRect.height,
      };
    }
  }

  return null;
}

export function solveUniversalPanelLayout(
  request: UniversalPanelLayoutSolveRequest
): UniversalPanelLayoutSolveResult {
  const baseRect = clampRectToViewport(
    cloneUniversalPanelRect(request.candidateRect),
    request.viewport
  );

  const firstCollision = detectPanelCollision(
    baseRect,
    request.existingPanels,
    request.movingInstanceId
  );

  const firstProtectedZoneHitIds = request.allowProtectedZoneOverride
    ? []
    : detectProtectedZoneHits(baseRect, request.protectedZones);

  if (!firstCollision.hasCollision && firstProtectedZoneHitIds.length === 0) {
    return {
      rect: baseRect,
      collision: firstCollision,
      protectedZoneHitIds: firstProtectedZoneHitIds,
      changed:
        baseRect.left !== request.candidateRect.left ||
        baseRect.top !== request.candidateRect.top ||
        baseRect.width !== request.candidateRect.width ||
        baseRect.height !== request.candidateRect.height,
    };
  }

  const solved = trySolveByOffsets(baseRect, request);
  if (solved) return solved;

  return {
    rect: baseRect,
    collision: firstCollision,
    protectedZoneHitIds: firstProtectedZoneHitIds,
    changed:
      baseRect.left !== request.candidateRect.left ||
      baseRect.top !== request.candidateRect.top ||
      baseRect.width !== request.candidateRect.width ||
      baseRect.height !== request.candidateRect.height,
  };
}