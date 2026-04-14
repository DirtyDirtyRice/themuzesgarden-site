import type { UniversalPanelInstance } from "./panelInstanceTypes";

function joinClassNames(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

export function getUniversalPanelSurfaceShellClassName(input: {
  panel: UniversalPanelInstance;
  active?: boolean;
  interacting?: boolean;
  className?: string;
}): string {
  const { panel, active = false, interacting = false, className } = input;

  return joinClassNames(
    "flex overflow-hidden border bg-white",
    "rounded-2xl shadow-sm",
    active ? "border-black" : "border-zinc-200",
    interacting && "select-none",
    panel.cosmetics.backgroundClassName,
    panel.cosmetics.borderClassName,
    panel.cosmetics.shadowClassName,
    panel.cosmetics.radiusClassName,
    className
  );
}

export function getUniversalPanelSurfaceTitleBarClassName(input?: {
  draggable?: boolean;
  className?: string;
}): string {
  return joinClassNames(
    "flex items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2",
    input?.draggable && "cursor-grab active:cursor-grabbing",
    input?.className
  );
}

export function getUniversalPanelSurfaceBodyClassName(input?: {
  className?: string;
}): string {
  return joinClassNames(
    "min-h-0 flex-1 overflow-auto p-3",
    input?.className
  );
}

export function getUniversalPanelSurfaceFooterClassName(input?: {
  className?: string;
}): string {
  return joinClassNames(
    "border-t border-zinc-200 px-3 py-2",
    input?.className
  );
}

export function getUniversalPanelDragHandleClassName(input?: {
  disabled?: boolean;
  active?: boolean;
  className?: string;
}): string {
  return joinClassNames(
    "inline-flex items-center gap-2 rounded border px-2 py-1 text-xs",
    input?.disabled
      ? "cursor-not-allowed opacity-50"
      : input?.active
      ? "cursor-grabbing"
      : "cursor-grab hover:bg-zinc-50 active:scale-[0.98]",
    input?.className
  );
}