import type {
  PanelBounds,
  PanelSizePreset,
  PanelViewport,
} from "./panelTypes";

export function getPanelBoundsForPreset(
  preset: PanelSizePreset,
  viewport: PanelViewport
): PanelBounds {
  const vw = viewport.width;
  const vh = viewport.height;

  switch (preset) {
    case "sm":
      return {
        width: Math.min(480, vw * 0.9),
        height: Math.min(320, vh * 0.6),
        minWidth: 320,
        minHeight: 240,
      };

    case "md":
      return {
        width: Math.min(720, vw * 0.9),
        height: Math.min(480, vh * 0.7),
        minWidth: 480,
        minHeight: 320,
      };

    case "lg":
      return {
        width: Math.min(960, vw * 0.95),
        height: Math.min(640, vh * 0.8),
        minWidth: 640,
        minHeight: 480,
      };

    case "xl":
      return {
        width: Math.min(1200, vw * 0.95),
        height: Math.min(800, vh * 0.85),
        minWidth: 720,
        minHeight: 520,
      };

    case "full":
      return {
        width: vw,
        height: vh,
        minWidth: vw,
        minHeight: vh,
      };

    default:
      return {
        width: 720,
        height: 480,
        minWidth: 480,
        minHeight: 320,
      };
  }
}

export function centerPanelPosition(bounds: PanelBounds, viewport: PanelViewport) {
  return {
    x: Math.max(0, (viewport.width - bounds.width) / 2),
    y: Math.max(0, (viewport.height - bounds.height) / 2),
  };
}