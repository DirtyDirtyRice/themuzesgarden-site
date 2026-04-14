import type {
  OpenPanelInput,
  PanelState,
  PanelViewport,
} from "./panelTypes";
import { getPanelBoundsForPreset, centerPanelPosition } from "./panelSizing";

export function createPanelState(
  input: OpenPanelInput,
  viewport: PanelViewport
): PanelState {
  const preset = input.sizePreset ?? "lg";
  const bounds = getPanelBoundsForPreset(preset, viewport);
  const position = centerPanelPosition(bounds, viewport);

  return {
    id: input.id,
    kind: input.kind,
    mode: input.mode ?? "modal",
    title: input.title,
    subtitle: input.subtitle ?? null,
    isOpen: true,
    sizePreset: preset,
    bounds,
    position,
    resizePolicy: {
      resizable: true,
      draggable: true,
      collisionPolicy: "avoid-overlap",
      clampToViewport: true,
      stopAtOtherPanels: true,
    },
    permissions: {
      canView: true,
      canEdit: true,
      canResize: true,
      canMove: true,
      canClose: true,
      canPromoteToPage: true,
      adminOverride: true,
    },
    ownerScope: input.ownerScope ?? "project",
    target: input.target ?? {},
  };
}