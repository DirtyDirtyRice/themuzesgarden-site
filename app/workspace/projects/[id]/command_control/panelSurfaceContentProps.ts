import type { ReactNode } from "react";
import type { ComponentProps } from "react";
import UniversalPanelSurfaceContent from "./UniversalPanelSurfaceContent";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UniversalPanelSurfaceComposition } from "./panelSurfaceComposition";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";

export type UniversalPanelSurfaceContentPropsModel = Pick<
  ComponentProps<typeof UniversalPanelSurfaceContent>,
  | "panel"
  | "children"
  | "footer"
  | "bodyId"
  | "titleId"
  | "bodyClassName"
  | "showTitleBar"
  | "showCloseButton"
  | "surfaceController"
  | "onClose"
>;

type BuildUniversalPanelSurfaceContentPropsInput = {
  panel: UniversalPanelInstance;
  composition: UniversalPanelSurfaceComposition;
  children: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  surfaceController: UseUniversalPanelSurfaceControllerReturn;
  onClose?: () => void;
};

export function buildUniversalPanelSurfaceContentProps(
  input: BuildUniversalPanelSurfaceContentPropsInput
): UniversalPanelSurfaceContentPropsModel {
  return {
    panel: input.panel,
    children: input.children,
    footer: input.footer,
    bodyId: input.composition.accessibility.bodyId,
    titleId: input.composition.accessibility.titleId,
    bodyClassName: input.bodyClassName,
    showTitleBar: input.composition.layoutState.showTitleBar,
    showCloseButton: input.composition.titleBarActions.canClose,
    surfaceController: input.surfaceController,
    onClose: input.onClose,
  };
}