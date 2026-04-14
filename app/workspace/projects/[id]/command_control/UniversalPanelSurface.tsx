"use client";

import type { ReactNode } from "react";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelManagerReturn } from "./useUniversalPanelManager";
import UniversalPanelSurfaceLive from "./UniversalPanelSurfaceLive";

type Props = {
  panel: UniversalPanelInstance;
  manager: UseUniversalPanelManagerReturn;
  children: ReactNode;
  active?: boolean;
  showTitleBar?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  onClose?: () => void;
  onFocus?: () => void;
};

export default function UniversalPanelSurface({
  panel,
  manager,
  children,
  active = false,
  showTitleBar = true,
  showCloseButton = true,
  footer,
  className,
  bodyClassName,
  onClose,
  onFocus,
}: Props) {
  return (
    <UniversalPanelSurfaceLive
      panel={panel}
      manager={manager}
      active={active}
      footer={footer}
      className={className}
      bodyClassName={bodyClassName}
      showTitleBar={showTitleBar}
      showCloseButton={showCloseButton}
      onClose={onClose}
      onFocus={onFocus}
    >
      {children}
    </UniversalPanelSurfaceLive>
  );
}