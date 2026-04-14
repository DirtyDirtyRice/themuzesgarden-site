import { createElement } from "react";
import type { UniversalPanelRegistrationMap } from "./panelRenderTypes";
import MetadataUniversalPanel from "./MetadataUniversalPanel";
import { getUniversalPanelSeedList } from "./panelRenderTypes";

export const METADATA_INSPECT_PANEL_TYPE = "metadata_inspect";

export const UNIVERSAL_PANEL_RENDER_REGISTRY: UniversalPanelRegistrationMap = {
  [METADATA_INSPECT_PANEL_TYPE]: {
    panelType: METADATA_INSPECT_PANEL_TYPE,
    seed: {
      instanceId: "metadata_inspect__primary",
      panelType: METADATA_INSPECT_PANEL_TYPE,
      kind: "metadata_inspect",
      title: "Metadata Inspect",
      defaultRect: {
        left: 760,
        top: 96,
        width: 420,
        height: 520,
      },
      defaultVisibilityState: "closed",
      accessLevel: "member",
      constraints: {
        minWidth: 320,
        minHeight: 280,
        maxWidth: 640,
        maxHeight: 760,
      },
      permissions: {
        canClose: true,
        canResize: true,
        canDrag: true,
        canPersist: true,
        canAdminOverrideProtectedZones: true,
      },
      cosmetics: {
        backgroundClassName: "bg-white",
        borderClassName: "border-zinc-200",
        textClassName: "text-zinc-900",
        shadowClassName: "shadow-sm",
        radiusClassName: "rounded-2xl",
      },
      metadata: {
        targetType: null,
        targetId: null,
        targetLabel: null,
        source: "metadata_bridge",
      },
    },
    render: ({ panel, manager, active }) =>
      createElement(MetadataUniversalPanel, {
        panel,
        manager,
        active,
      }),
    getTitle: (panel) => {
      const targetLabel = String(panel.metadata?.targetLabel ?? "").trim();
      if (targetLabel) return `Metadata • ${targetLabel}`;
      return "Metadata Inspect";
    },
    activationPolicy: "bring_to_front",
    flags: {
      usesSurfaceWrapper: false,
      allowFooter: false,
      allowTitleBar: false,
      allowCloseButton: false,
      canMountMultiple: false,
    },
  },
};

export const UNIVERSAL_PANEL_RENDER_SEEDS =
  getUniversalPanelSeedList(UNIVERSAL_PANEL_RENDER_REGISTRY);

export function getDefaultUniversalPanelRenderRegistry() {
  return UNIVERSAL_PANEL_RENDER_REGISTRY;
}