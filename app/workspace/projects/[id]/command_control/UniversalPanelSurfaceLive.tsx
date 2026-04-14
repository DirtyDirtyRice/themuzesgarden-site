"use client";

import type { ReactNode } from "react";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelManagerReturn } from "./useUniversalPanelManager";
import { buildUniversalPanelSurfaceLiveConfig } from "./panelSurfaceLiveConfig";
import { useUniversalPanelSurfaceLiveBindings } from "./panelSurfaceLiveBindings";
import { useUniversalPanelSurfaceController } from "./useUniversalPanelSurfaceController";
import { buildUniversalPanelSurfaceRenderModel } from "./panelSurfaceRenderModel";
import UniversalPanelSurfaceFrame from "./UniversalPanelSurfaceFrame";
import UniversalPanelSurfaceContent from "./UniversalPanelSurfaceContent";

type Props = {
  panel: UniversalPanelInstance;
  manager: UseUniversalPanelManagerReturn;
  children: ReactNode;
  active?: boolean;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  showTitleBar?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  onFocus?: () => void;
};

export default function UniversalPanelSurfaceLive({
  panel,
  manager,
  children,
  active = false,
  footer,
  className,
  bodyClassName,
  showTitleBar = true,
  showCloseButton = true,
  onClose,
  onFocus,
}: Props) {
  const liveConfig = buildUniversalPanelSurfaceLiveConfig({
    showTitleBar,
    showCloseButton,
  });

  const liveBindings = useUniversalPanelSurfaceLiveBindings({
    panel,
    manager,
    onClose,
    onFocus,
  });

  const surfaceController = useUniversalPanelSurfaceController({
    panel,
    manager,
    onFocus: liveBindings.onFocus,
  });

  const model = buildUniversalPanelSurfaceRenderModel({
    panel,
    children,
    footer,
    active,
    className,
    bodyClassName,
    showTitleBar: liveConfig.showTitleBar,
    showCloseButton: liveConfig.showCloseButton,
    surfaceController,
    onClose: liveBindings.onClose,
    onFocus: liveBindings.onFocus,
  });

  return (
    <UniversalPanelSurfaceFrame {...model.frameProps}>
      <UniversalPanelSurfaceContent {...model.contentProps} />
    </UniversalPanelSurfaceFrame>
  );
}