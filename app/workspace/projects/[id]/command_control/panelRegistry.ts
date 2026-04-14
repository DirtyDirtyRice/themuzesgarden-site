import type { PanelCollisionBox, PanelState } from "./panelTypes";

export type PanelRegistryState = {
  panels: Record<string, PanelState>;
};

export function createEmptyPanelRegistry(): PanelRegistryState {
  return {
    panels: {},
  };
}

export function registerPanel(
  registry: PanelRegistryState,
  panel: PanelState
): PanelRegistryState {
  return {
    panels: {
      ...registry.panels,
      [panel.id]: panel,
    },
  };
}

export function unregisterPanel(
  registry: PanelRegistryState,
  panelId: string
): PanelRegistryState {
  const nextPanels = { ...registry.panels };
  delete nextPanels[panelId];

  return {
    panels: nextPanels,
  };
}

export function updateRegisteredPanel(
  registry: PanelRegistryState,
  panel: PanelState
): PanelRegistryState {
  if (!registry.panels[panel.id]) {
    return registerPanel(registry, panel);
  }

  return {
    panels: {
      ...registry.panels,
      [panel.id]: panel,
    },
  };
}

export function getRegisteredPanels(
  registry: PanelRegistryState
): PanelState[] {
  return Object.values(registry.panels);
}

export function getPanelCollisionBoxes(
  registry: PanelRegistryState,
  excludePanelId?: string
): PanelCollisionBox[] {
  return Object.values(registry.panels)
    .filter((panel) => panel.isOpen)
    .filter((panel) => panel.id !== excludePanelId)
    .map((panel) => ({
      id: panel.id,
      x: panel.position.x,
      y: panel.position.y,
      width: panel.bounds.width,
      height: panel.bounds.height,
    }));
}