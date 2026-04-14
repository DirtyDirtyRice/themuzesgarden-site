import type { ReactNode } from "react";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";
import {
  buildUniversalPanelSurfaceComposition,
  type UniversalPanelSurfaceComposition,
} from "./panelSurfaceComposition";
import {
  buildUniversalPanelSurfaceControllerAdapters,
  type UniversalPanelSurfaceControllerAdapters,
} from "./panelSurfaceControllerAdapters";
import {
  buildUniversalPanelSurfaceFrameProps,
  type UniversalPanelSurfaceFramePropsModel,
} from "./panelSurfaceFrameProps";
import {
  buildUniversalPanelSurfaceContentProps,
  type UniversalPanelSurfaceContentPropsModel,
} from "./panelSurfaceContentProps";

export type UniversalPanelSurfaceRenderModel = {
  composition: UniversalPanelSurfaceComposition;
  controllerAdapters: UniversalPanelSurfaceControllerAdapters;
  frameProps: UniversalPanelSurfaceFramePropsModel;
  contentProps: UniversalPanelSurfaceContentPropsModel;
};

type BuildUniversalPanelSurfaceRenderModelInput = {
  panel: UniversalPanelInstance;
  children: ReactNode;
  footer?: ReactNode;
  active?: boolean;
  className?: string;
  bodyClassName?: string;
  showTitleBar?: boolean;
  showCloseButton?: boolean;
  surfaceController: UseUniversalPanelSurfaceControllerReturn;
  onClose?: () => void;
  onFocus?: () => void;
};

export function buildUniversalPanelSurfaceRenderModel(
  input: BuildUniversalPanelSurfaceRenderModelInput
): UniversalPanelSurfaceRenderModel {
  const composition = buildUniversalPanelSurfaceComposition({
    panel: input.panel,
    surfaceController: input.surfaceController,
    children: input.children,
    footer: input.footer,
    showTitleBar: input.showTitleBar,
    showCloseButton: input.showCloseButton,
  });

  const controllerAdapters = buildUniversalPanelSurfaceControllerAdapters(
    input.surfaceController
  );

  const frameProps = buildUniversalPanelSurfaceFrameProps({
    panel: input.panel,
    composition,
    controllerAdapters,
    active: input.active,
    className: input.className,
    onFocus: input.onFocus,
  });

  const contentProps = buildUniversalPanelSurfaceContentProps({
    panel: input.panel,
    composition,
    children: input.children,
    footer: input.footer,
    bodyClassName: input.bodyClassName,
    surfaceController: input.surfaceController,
    onClose: input.onClose,
  });

  return {
    composition,
    controllerAdapters,
    frameProps,
    contentProps,
  };
}