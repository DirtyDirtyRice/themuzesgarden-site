import type { ReactNode } from "react";

export type UniversalPanelSurfaceLayoutState = {
  showTitleBar: boolean;
  showFooter: boolean;
  hasChildren: boolean;
};

type BuildUniversalPanelSurfaceLayoutStateInput = {
  showTitleBar?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
};

export function buildUniversalPanelSurfaceLayoutState(
  input: BuildUniversalPanelSurfaceLayoutStateInput
): UniversalPanelSurfaceLayoutState {
  return {
    showTitleBar: input.showTitleBar !== false,
    showFooter: input.footer != null,
    hasChildren: input.children != null,
  };
}