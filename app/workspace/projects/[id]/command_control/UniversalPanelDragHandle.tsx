"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { getUniversalPanelDragHandleClassName } from "./panelSurfaceClassNames";

type Props = {
  disabled?: boolean;
  active?: boolean;
  className?: string;
  label?: string;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export default function UniversalPanelDragHandle({
  disabled = false,
  active = false,
  className,
  label = "Move",
  onPointerDown,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-panel-allow-drag="true"
      className={getUniversalPanelDragHandleClassName({
        disabled,
        active,
        className,
      })}
      onPointerDown={onPointerDown}
      aria-label="Move panel"
      title="Move panel"
    >
      <span aria-hidden="true">⋮⋮</span>
      <span>{label}</span>
    </button>
  );
}