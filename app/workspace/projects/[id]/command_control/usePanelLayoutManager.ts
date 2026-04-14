"use client";

import { useMemo, useState } from "react";
import type {
  OpenPanelInput,
  PanelState,
  PanelViewport,
} from "./panelTypes";
import { createPanelState } from "./panelActions";
import {
  createEmptyPanelRegistry,
  getPanelCollisionBoxes,
  getRegisteredPanels,
  registerPanel,
  unregisterPanel,
  updateRegisteredPanel,
  type PanelRegistryState,
} from "./panelRegistry";
import {
  getDefaultProtectedZones,
  type ProtectedZone,
} from "./panelProtectedZones";
import {
  clampPanelBoundsToViewport,
  clampPanelPositionToViewport,
  findSafePanelPosition,
} from "./panelBoundsEngine";

function getViewport(): PanelViewport {
  if (typeof window === "undefined") {
    return {
      width: 1280,
      height: 800,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function usePanelLayoutManager() {
  const [registry, setRegistry] = useState<PanelRegistryState>(
    createEmptyPanelRegistry()
  );

  const viewport = getViewport();

  const protectedZones: ProtectedZone[] = useMemo(() => {
    return getDefaultProtectedZones(viewport);
  }, [viewport.width, viewport.height]);

  function openManagedPanel(input: OpenPanelInput): PanelState {
    const nextBase = createPanelState(input, viewport);
    const clampedBounds = clampPanelBoundsToViewport(nextBase.bounds, viewport);

    const otherBoxes = getPanelCollisionBoxes(registry, nextBase.id);

    const safePosition = findSafePanelPosition({
      id: nextBase.id,
      desiredPosition: clampPanelPositionToViewport(
        nextBase.position,
        clampedBounds,
        viewport
      ),
      bounds: clampedBounds,
      viewport,
      otherBoxes,
      protectedZones,
    });

    const nextPanel: PanelState = {
      ...nextBase,
      bounds: clampedBounds,
      position: safePosition,
    };

    setRegistry((current) => registerPanel(current, nextPanel));
    return nextPanel;
  }

  function closeManagedPanel(panelId: string) {
    setRegistry((current) => unregisterPanel(current, panelId));
  }

  function updateManagedPanel(panel: PanelState) {
    const clampedBounds = clampPanelBoundsToViewport(panel.bounds, viewport);
    const otherBoxes = getPanelCollisionBoxes(registry, panel.id);

    const safePosition = findSafePanelPosition({
      id: panel.id,
      desiredPosition: clampPanelPositionToViewport(
        panel.position,
        clampedBounds,
        viewport
      ),
      bounds: clampedBounds,
      viewport,
      otherBoxes,
      protectedZones,
    });

    const nextPanel: PanelState = {
      ...panel,
      bounds: clampedBounds,
      position: safePosition,
    };

    setRegistry((current) => updateRegisteredPanel(current, nextPanel));
    return nextPanel;
  }

  function getPanels(): PanelState[] {
    return getRegisteredPanels(registry);
  }

  return {
    viewport,
    protectedZones,
    openManagedPanel,
    closeManagedPanel,
    updateManagedPanel,
    getPanels,
  };
}