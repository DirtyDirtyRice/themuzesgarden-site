import type { PanelCollisionBox, PanelViewport } from "./panelTypes";

export type ProtectedZoneKind =
  | "global-player"
  | "top-toolbar"
  | "left-rail"
  | "custom";

export type ProtectedZone = PanelCollisionBox & {
  kind: ProtectedZoneKind;
};

export function getDefaultProtectedZones(
  viewport: PanelViewport
): ProtectedZone[] {
  const zones: ProtectedZone[] = [];

  // Bottom protected area for Global Player / persistent bottom chrome
  zones.push({
    id: "protected-global-player",
    kind: "global-player",
    x: 0,
    y: Math.max(0, viewport.height - 112),
    width: viewport.width,
    height: 112,
  });

  // Top bar safety area
  zones.push({
    id: "protected-top-toolbar",
    kind: "top-toolbar",
    x: 0,
    y: 0,
    width: viewport.width,
    height: 64,
  });

  return zones;
}

export function mergeProtectedZones(
  baseZones: ProtectedZone[],
  extraZones: ProtectedZone[]
): ProtectedZone[] {
  return [...baseZones, ...extraZones];
}