"use client";

import type { ReactNode } from "react";
import { getUniversalPanelSurfaceFooterClassName } from "./panelSurfaceClassNames";

type Props = {
  className?: string;
  children: ReactNode;
};

export default function PanelSurfaceFooter({
  className,
  children,
}: Props) {
  return (
    <div
      className={getUniversalPanelSurfaceFooterClassName({
        className,
      })}
    >
      {children}
    </div>
  );
}