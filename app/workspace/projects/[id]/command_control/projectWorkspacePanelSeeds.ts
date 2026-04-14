import type { UniversalPanelRegistrySeed } from "./panelInstanceTypes";
import { UNIVERSAL_PANEL_RENDER_SEEDS } from "./panelRenderRegistry";

export function getProjectWorkspacePanelSeeds(): UniversalPanelRegistrySeed[] {
  return UNIVERSAL_PANEL_RENDER_SEEDS.map((seed) => ({
    ...seed,
    defaultRect: {
      ...seed.defaultRect,
    },
    constraints: seed.constraints
      ? {
          ...seed.constraints,
        }
      : undefined,
    permissions: seed.permissions
      ? {
          ...seed.permissions,
        }
      : undefined,
    cosmetics: seed.cosmetics
      ? {
          ...seed.cosmetics,
        }
      : undefined,
    metadata: seed.metadata
      ? {
          ...seed.metadata,
        }
      : undefined,
  }));
}