"use client";

import type { CSSProperties } from "react";
import type { UniversalPanelEdge } from "./panelInstanceTypes";

type Props = {
  disabled?: boolean;
  onResizePointerDown?: (
    edge: UniversalPanelEdge,
    event: React.PointerEvent<HTMLButtonElement>
  ) => void;
};

type HandleDefinition = {
  edge: UniversalPanelEdge;
  className: string;
  style?: CSSProperties;
  ariaLabel: string;
};

const HANDLE_DEFINITIONS: HandleDefinition[] = [
  {
    edge: "top-left",
    className:
      "absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-full border bg-white",
    ariaLabel: "Resize top left",
  },
  {
    edge: "top",
    className:
      "absolute left-1/2 top-0 h-2 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize rounded-full border bg-white",
    ariaLabel: "Resize top",
  },
  {
    edge: "top-right",
    className:
      "absolute right-0 top-0 h-3 w-3 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize rounded-full border bg-white",
    ariaLabel: "Resize top right",
  },
  {
    edge: "right",
    className:
      "absolute right-0 top-1/2 h-12 w-2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border bg-white",
    ariaLabel: "Resize right",
  },
  {
    edge: "bottom-right",
    className:
      "absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border bg-white",
    ariaLabel: "Resize bottom right",
  },
  {
    edge: "bottom",
    className:
      "absolute bottom-0 left-1/2 h-2 w-12 -translate-x-1/2 translate-y-1/2 cursor-ns-resize rounded-full border bg-white",
    ariaLabel: "Resize bottom",
  },
  {
    edge: "bottom-left",
    className:
      "absolute bottom-0 left-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize rounded-full border bg-white",
    ariaLabel: "Resize bottom left",
  },
  {
    edge: "left",
    className:
      "absolute left-0 top-1/2 h-12 w-2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border bg-white",
    ariaLabel: "Resize left",
  },
];

export default function UniversalPanelResizeHandles({
  disabled = false,
  onResizePointerDown,
}: Props) {
  if (disabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {HANDLE_DEFINITIONS.map((handle) => (
        <button
          key={handle.edge}
          type="button"
          data-panel-allow-resize="true"
          aria-label={handle.ariaLabel}
          className={`${handle.className} pointer-events-auto`}
          style={handle.style}
          onPointerDown={(event) => onResizePointerDown?.(handle.edge, event)}
        />
      ))}
    </div>
  );
}