import type { ReactNode } from "react";
import type {
  UniversalPanelInstance,
  UniversalPanelRegistrySeed,
} from "./panelInstanceTypes";
import type { UseUniversalPanelManagerReturn } from "./useUniversalPanelManager";

export type UniversalPanelRenderContext = {
  panel: UniversalPanelInstance;
  manager: UseUniversalPanelManagerReturn;
};

export type UniversalPanelRendererProps = UniversalPanelRenderContext & {
  active: boolean;
};

export type UniversalPanelRenderer = (
  props: UniversalPanelRendererProps
) => ReactNode;

export type UniversalPanelTitleResolver = (
  panel: UniversalPanelInstance
) => string;

export type UniversalPanelActivationPolicy =
  | "bring_to_front"
  | "no_focus_change"
  | "focus_only_if_requested";

export type UniversalPanelRenderFlags = {
  usesSurfaceWrapper: boolean;
  allowFooter: boolean;
  allowTitleBar: boolean;
  allowCloseButton: boolean;
  reserveForAdmin?: boolean;
  canMountMultiple?: boolean;
};

export type UniversalPanelRegistration = {
  panelType: string;
  seed: UniversalPanelRegistrySeed;
  render: UniversalPanelRenderer;
  getTitle?: UniversalPanelTitleResolver;
  activationPolicy?: UniversalPanelActivationPolicy;
  flags?: Partial<UniversalPanelRenderFlags>;
};

export type UniversalPanelRegistrationMap = Record<
  string,
  UniversalPanelRegistration
>;

export const UNIVERSAL_PANEL_RENDER_FLAG_DEFAULTS: UniversalPanelRenderFlags = {
  usesSurfaceWrapper: true,
  allowFooter: true,
  allowTitleBar: true,
  allowCloseButton: true,
  reserveForAdmin: false,
  canMountMultiple: false,
};

export function resolveUniversalPanelTitle(
  registration: UniversalPanelRegistration | null | undefined,
  panel: UniversalPanelInstance
): string {
  if (registration?.getTitle) {
    const nextTitle = String(registration.getTitle(panel) ?? "").trim();
    if (nextTitle) return nextTitle;
  }

  return String(panel.title ?? "Panel").trim() || "Panel";
}

export function mergeUniversalPanelRenderFlags(
  flags?: Partial<UniversalPanelRenderFlags>
): UniversalPanelRenderFlags {
  return {
    ...UNIVERSAL_PANEL_RENDER_FLAG_DEFAULTS,
    ...(flags ?? {}),
  };
}

export function getUniversalPanelRegistration(
  map: UniversalPanelRegistrationMap,
  panelType: string
): UniversalPanelRegistration | null {
  const clean = String(panelType ?? "").trim();
  if (!clean) return null;
  return map[clean] ?? null;
}

export function getUniversalPanelSeedList(
  map: UniversalPanelRegistrationMap
): UniversalPanelRegistrySeed[] {
  return Object.values(map).map((entry) => entry.seed);
}