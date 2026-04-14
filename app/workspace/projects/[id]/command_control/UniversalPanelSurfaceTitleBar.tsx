"use client";

import type { ReactNode, PointerEvent as ReactPointerEvent } from "react";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import { buildUniversalPanelContentTextStyle } from "./panelSurfaceStyleUtils";
import { getUniversalPanelSurfaceTitleBarClassName } from "./panelSurfaceClassNames";
import UniversalPanelDragHandle from "./UniversalPanelDragHandle";

type Props = {
  panel: UniversalPanelInstance;
  titleId?: string;
  showCloseButton?: boolean;
  draggable?: boolean;
  dragging?: boolean;
  className?: string;
  rightSlot?: ReactNode;
  onClose?: () => void;
  onDragHandlePointerDown?: (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void;
};

export default function UniversalPanelSurfaceTitleBar({
  panel,
  titleId,
  showCloseButton = true,
  draggable = true,
  dragging = false,
  className,
  rightSlot,
  onClose,
  onDragHandlePointerDown,
}: Props) {
  const canClose = panel.permissions.canClose && showCloseButton;
  const canDrag = panel.permissions.canDrag && draggable && !panel.locked;

  return (
    <div
      className={getUniversalPanelSurfaceTitleBarClassName({
        draggable: canDrag,
        className,
      })}
    >
      <div className="flex min-w-0 items-center gap-2">
        {canDrag ? (
          <UniversalPanelDragHandle
            active={dragging}
            onPointerDown={onDragHandlePointerDown}
          />
        ) : null}

        <div className="min-w-0">
          <div
            id={titleId}
            className={panel.cosmetics.textClassName
              ? `truncate text-sm font-medium ${panel.cosmetics.textClassName}`
              : "truncate text-sm font-medium"}
            style={buildUniversalPanelContentTextStyle({
              fontFamily: panel.cosmetics.fontFamily ?? null,
              fontSizePx: panel.cosmetics.fontSizePx ?? null,
            })}
          >
            {panel.title}
          </div>

          <div className="mt-0.5 text-[10px] text-zinc-400">
            {panel.kind} • {panel.accessLevel}
            {panel.locked ? " • locked" : ""}
            {panel.protectedZoneOverride ? " • override" : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rightSlot}
        {canClose ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={onClose}
          >
            Close
          </button>
        ) : null}
      </div>
    </div>
  );
}