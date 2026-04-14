"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type {
  UniversalPanelEdge,
  UniversalPanelInstance,
} from "./panelInstanceTypes";
import type { UseUniversalPanelSurfaceControllerReturn } from "./useUniversalPanelSurfaceController";
import UniversalPanelSurfaceTitleBar from "./UniversalPanelSurfaceTitleBar";
import UniversalPanelResizeHandles from "./UniversalPanelResizeHandles";
import PanelSurfaceBody from "./panelSurfaceBody";
import PanelSurfaceFooter from "./panelSurfaceFooter";
import { buildUniversalPanelSurfaceLayoutState } from "./panelSurfaceLayout";
import { buildUniversalPanelSurfaceTitleBarActions } from "./panelSurfaceTitleBarActions";
import { buildUniversalPanelSurfaceResizeConfig } from "./panelSurfaceResizeConfig";

type Props = {
  panel: UniversalPanelInstance;
  children: ReactNode;
  footer?: ReactNode;
  bodyId?: string;
  titleId?: string;
  bodyClassName?: string;
  showTitleBar?: boolean;
  showCloseButton?: boolean;
  surfaceController?: UseUniversalPanelSurfaceControllerReturn | null;
  onClose?: () => void;
};

export default function UniversalPanelSurfaceContent({
  panel,
  children,
  footer,
  bodyId,
  titleId,
  bodyClassName,
  showTitleBar = true,
  showCloseButton = true,
  surfaceController = null,
  onClose,
}: Props) {
  const layoutState = buildUniversalPanelSurfaceLayoutState({
    showTitleBar,
    footer,
    children,
  });

  const titleBarActions = buildUniversalPanelSurfaceTitleBarActions({
    panel,
    showCloseButton,
    surfaceController,
  });

  const resizeConfig = buildUniversalPanelSurfaceResizeConfig({
    panel,
    surfaceController,
  });

  const handleDragPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => {
    surfaceController?.handleDragPointerDown(event);
  };

  const handleResizePointerDown = (
    edge: UniversalPanelEdge,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => {
    surfaceController?.handleResizePointerDown(edge, event);
  };

  return (
    <>
      {layoutState.showTitleBar ? (
        <UniversalPanelSurfaceTitleBar
          panel={panel}
          titleId={titleId}
          showCloseButton={titleBarActions.canClose}
          draggable={titleBarActions.canDrag}
          dragging={titleBarActions.dragging}
          onClose={onClose}
          onDragHandlePointerDown={handleDragPointerDown}
        />
      ) : null}

      <PanelSurfaceBody
        panel={panel}
        bodyId={bodyId}
        className={bodyClassName}
      >
        {children}
      </PanelSurfaceBody>

      {layoutState.showFooter ? (
        <PanelSurfaceFooter>{footer}</PanelSurfaceFooter>
      ) : null}

      {resizeConfig.showResizeHandles ? (
        <UniversalPanelResizeHandles
          disabled={resizeConfig.resizeDisabled}
          onResizePointerDown={handleResizePointerDown}
        />
      ) : null}
    </>
  );
}