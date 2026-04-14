import { useCallback, useMemo } from "react";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelManagerReturn } from "./useUniversalPanelManager";

export type UniversalPanelSurfaceLiveBindings = {
  onClose: () => void;
  onFocus: () => void;
};

type UseUniversalPanelSurfaceLiveBindingsOptions = {
  panel: UniversalPanelInstance;
  manager: UseUniversalPanelManagerReturn;
  onClose?: () => void;
  onFocus?: () => void;
};

export function useUniversalPanelSurfaceLiveBindings(
  options: UseUniversalPanelSurfaceLiveBindingsOptions
): UniversalPanelSurfaceLiveBindings {
  const { panel, manager, onClose, onFocus } = options;

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }

    manager.closePanel(panel.instanceId);
  }, [manager, onClose, panel.instanceId]);

  const handleFocus = useCallback(() => {
    manager.focusPanel(panel.instanceId);
    onFocus?.();
  }, [manager, onFocus, panel.instanceId]);

  return useMemo(
    () => ({
      onClose: handleClose,
      onFocus: handleFocus,
    }),
    [handleClose, handleFocus]
  );
}