"use client";

import type { ReactNode } from "react";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import { buildUniversalPanelContentTextStyle } from "./panelSurfaceStyleUtils";
import { getUniversalPanelSurfaceBodyClassName } from "./panelSurfaceClassNames";

type Props = {
  panel: UniversalPanelInstance;
  bodyId?: string;
  className?: string;
  children: ReactNode;
};

export default function PanelSurfaceBody({
  panel,
  bodyId,
  className,
  children,
}: Props) {
  return (
    <div
      id={bodyId}
      className={getUniversalPanelSurfaceBodyClassName({
        className,
      })}
      style={buildUniversalPanelContentTextStyle({
        fontFamily: panel.cosmetics.fontFamily ?? null,
        fontSizePx: panel.cosmetics.fontSizePx ?? null,
      })}
    >
      {children}
    </div>
  );
}