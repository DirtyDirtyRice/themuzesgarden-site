export type UniversalPanelSurfaceLiveConfig = {
  showTitleBar: boolean;
  showCloseButton: boolean;
};

type BuildUniversalPanelSurfaceLiveConfigInput = {
  showTitleBar?: boolean;
  showCloseButton?: boolean;
};

export function buildUniversalPanelSurfaceLiveConfig(
  input?: BuildUniversalPanelSurfaceLiveConfigInput
): UniversalPanelSurfaceLiveConfig {
  return {
    showTitleBar: input?.showTitleBar !== false,
    showCloseButton: input?.showCloseButton !== false,
  };
}