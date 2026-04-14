import type { HTMLAttributes } from "react";
import type { UniversalPanelInstance } from "./panelInstanceTypes";

export type UniversalPanelSurfaceAccessibility = {
  surfaceProps: HTMLAttributes<HTMLElement>;
  titleId: string;
  bodyId: string;
};

function cleanDomIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9\-_:.]/g, "-");
}

export function getUniversalPanelSurfaceAccessibility(
  panel: UniversalPanelInstance
): UniversalPanelSurfaceAccessibility {
  const baseId = cleanDomIdPart(panel.instanceId || "panel");

  const titleId = `${baseId}__title`;
  const bodyId = `${baseId}__body`;

  return {
    titleId,
    bodyId,
    surfaceProps: {
      role: "dialog",
      "aria-modal": false,
      "aria-labelledby": titleId,
      "aria-describedby": bodyId,
    },
  };
}