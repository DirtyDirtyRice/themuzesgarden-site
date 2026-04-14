"use client";

import type { HTMLAttributes, ReactNode } from "react";
import type {
  UniversalPanelInstance,
  UniversalPanelRect,
} from "./panelInstanceTypes";
import { buildUniversalPanelSurfaceStyle } from "./panelSurfaceStyleUtils";
import { getUniversalPanelSurfaceShellClassName } from "./panelSurfaceClassNames";

type Props = {
  panel: UniversalPanelInstance;
  rectOverride?: UniversalPanelRect | null;
  active?: boolean;
  interacting?: boolean;
  className?: string;
  children: ReactNode;
  surfaceProps?: HTMLAttributes<HTMLElement>;
  onMouseDown?: HTMLAttributes<HTMLElement>["onMouseDown"];
  onPointerMove?: HTMLAttributes<HTMLElement>["onPointerMove"];
  onPointerUp?: HTMLAttributes<HTMLElement>["onPointerUp"];
  onPointerCancel?: HTMLAttributes<HTMLElement>["onPointerCancel"];
};

export default function UniversalPanelSurfaceFrame({
  panel,
  rectOverride,
  active = false,
  interacting = false,
  className,
  children,
  surfaceProps,
  onMouseDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: Props) {
  const style = buildUniversalPanelSurfaceStyle({
    panel,
    rectOverride,
  });

  const shellClassName = getUniversalPanelSurfaceShellClassName({
    panel,
    active,
    interacting,
    className,
  });

  return (
    <section
      {...surfaceProps}
      style={style}
      className={shellClassName}
      onMouseDown={onMouseDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
        {children}
      </div>
    </section>
  );
}