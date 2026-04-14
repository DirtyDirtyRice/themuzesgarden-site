import type { ComponentProps } from "react";
import UniversalPanelSurfaceFrame from "./UniversalPanelSurfaceFrame";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UniversalPanelSurfaceComposition } from "./panelSurfaceComposition";
import type { UniversalPanelSurfaceControllerAdapters } from "./panelSurfaceControllerAdapters";

export type UniversalPanelSurfaceFramePropsModel = Pick<
  ComponentProps<typeof UniversalPanelSurfaceFrame>,
  | "panel"
  | "rectOverride"
  | "active"
  | "interacting"
  | "className"
  | "surfaceProps"
  | "onMouseDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onPointerCancel"
>;

type BuildUniversalPanelSurfaceFramePropsInput = {
  panel: UniversalPanelInstance;
  composition: UniversalPanelSurfaceComposition;
  controllerAdapters: UniversalPanelSurfaceControllerAdapters;
  active?: boolean;
  className?: string;
  onFocus?: () => void;
};

export function buildUniversalPanelSurfaceFrameProps(
  input: BuildUniversalPanelSurfaceFramePropsInput
): UniversalPanelSurfaceFramePropsModel {
  return {
    panel: input.panel,
    rectOverride: input.composition.previewState.rect,
    active: input.active ?? false,
    interacting: input.controllerAdapters.isInteracting,
    className: input.className,
    surfaceProps: input.composition.accessibility.surfaceProps,
    onMouseDown: input.onFocus,
    onPointerMove: input.controllerAdapters.pointerHandlers.onSurfacePointerMove,
    onPointerUp: input.controllerAdapters.pointerHandlers.onSurfacePointerUp,
    onPointerCancel:
      input.controllerAdapters.pointerHandlers.onSurfacePointerCancel,
  };
}