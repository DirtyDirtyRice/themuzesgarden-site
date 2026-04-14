import type {
  UniversalProtectedZone,
  UniversalViewportRect,
} from "./panelInstanceTypes";
import {
  clampProjectWorkspaceNumber,
  cloneProjectWorkspaceProtectedZones,
  normalizeProjectWorkspaceViewport,
} from "./projectWorkspacePanelUtils";

export type ProjectWorkspaceProtectedZoneOptions = {
  includeGlobalPlayer?: boolean;
  includeBottomReservedStrip?: boolean;
  includeRightReservedRail?: boolean;
  globalPlayerHeight?: number;
  bottomReservedHeight?: number;
  rightReservedWidth?: number;
  topInset?: number;
  outerInset?: number;
};

export const PROJECT_WORKSPACE_PROTECTED_ZONE_DEFAULTS: Required<ProjectWorkspaceProtectedZoneOptions> =
  {
    includeGlobalPlayer: true,
    includeBottomReservedStrip: true,
    includeRightReservedRail: false,
    globalPlayerHeight: 124,
    bottomReservedHeight: 20,
    rightReservedWidth: 0,
    topInset: 0,
    outerInset: 0,
  };

export function buildProjectWorkspaceProtectedZones(
  viewportInput?: Partial<UniversalViewportRect> | null,
  options?: ProjectWorkspaceProtectedZoneOptions
): UniversalProtectedZone[] {
  const viewport = normalizeProjectWorkspaceViewport(viewportInput);
  const merged: Required<ProjectWorkspaceProtectedZoneOptions> = {
    ...PROJECT_WORKSPACE_PROTECTED_ZONE_DEFAULTS,
    ...(options ?? {}),
  };

  const zones: UniversalProtectedZone[] = [];
  const outerInset = clampProjectWorkspaceNumber(
    merged.outerInset,
    0,
    Math.max(viewport.width, viewport.height)
  );
  const topInset = clampProjectWorkspaceNumber(
    merged.topInset,
    0,
    viewport.height
  );

  if (merged.includeGlobalPlayer) {
    const height = clampProjectWorkspaceNumber(
      merged.globalPlayerHeight,
      40,
      viewport.height
    );

    zones.push({
      id: "global-player-zone",
      label: "Global Player",
      reason: "global_player",
      strict: true,
      left: outerInset,
      top: Math.max(topInset, viewport.height - height),
      width: Math.max(1, viewport.width - outerInset * 2),
      height,
    });
  }

  if (merged.includeBottomReservedStrip) {
    const height = clampProjectWorkspaceNumber(
      merged.bottomReservedHeight,
      0,
      viewport.height
    );

    if (height > 0) {
      zones.push({
        id: "bottom-reserved-strip",
        label: "Bottom Reserved UI",
        reason: "reserved_ui",
        strict: false,
        left: outerInset,
        top: Math.max(topInset, viewport.height - height),
        width: Math.max(1, viewport.width - outerInset * 2),
        height,
      });
    }
  }

  if (merged.includeRightReservedRail) {
    const width = clampProjectWorkspaceNumber(
      merged.rightReservedWidth,
      0,
      viewport.width
    );

    if (width > 0) {
      zones.push({
        id: "right-reserved-rail",
        label: "Right Reserved UI",
        reason: "reserved_ui",
        strict: false,
        left: Math.max(0, viewport.width - width),
        top: topInset,
        width,
        height: Math.max(1, viewport.height - topInset),
      });
    }
  }

  return cloneProjectWorkspaceProtectedZones(zones);
}