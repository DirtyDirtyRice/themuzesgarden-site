import type { CSSProperties } from "react";
import type {
  UniversalPanelInstance,
  UniversalPanelRect,
} from "./panelInstanceTypes";

export function buildUniversalPanelSurfaceStyle(input: {
  panel: UniversalPanelInstance;
  rectOverride?: UniversalPanelRect | null;
}): CSSProperties {
  const rect = input.rectOverride ?? input.panel.rect;

  return {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    zIndex: 100 + input.panel.order,
  };
}

export function buildUniversalPanelContentTextStyle(input: {
  fontFamily?: string | null;
  fontSizePx?: number | null;
}): CSSProperties {
  return {
    fontFamily: input.fontFamily ?? undefined,
    fontSize:
      typeof input.fontSizePx === "number" ? input.fontSizePx : undefined,
  };
}