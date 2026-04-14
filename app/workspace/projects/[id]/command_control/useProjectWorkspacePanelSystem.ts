"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { MetadataTargetType } from "../../../../../lib/metadata/metadataTypes";
import { useMetadataPanelBridge } from "./useMetadataPanelBridge";
import { getProjectWorkspacePanelSeeds } from "./projectWorkspacePanelSeeds";
import { buildProjectWorkspaceProtectedZones } from "./projectWorkspaceProtectedZones";
import {
  buildProjectWorkspaceMetadataLabel,
  isProjectWorkspaceProtectedZoneEqual,
  normalizeProjectWorkspaceViewport,
} from "./projectWorkspacePanelUtils";
import type { UniversalProtectedZone } from "./panelInstanceTypes";
import { useUniversalPanelManager } from "./useUniversalPanelManager";
import { UNIVERSAL_PANEL_RENDER_REGISTRY } from "./panelRenderRegistry";

export type ProjectWorkspacePanelSystemOptions = {
  viewport?: {
    width?: number;
    height?: number;
  } | null;
  protectedZones?: UniversalProtectedZone[] | null;
};

export type ProjectWorkspaceMetadataOpenRequest = {
  targetType: MetadataTargetType;
  targetId: string;
  targetLabel?: string | null;
  requestedLeft?: number | null;
  requestedTop?: number | null;
  requestedWidth?: number | null;
  requestedHeight?: number | null;
  focus?: boolean;
};

export function useProjectWorkspacePanelSystem(
  options?: ProjectWorkspacePanelSystemOptions
) {
  const viewportWidth = options?.viewport?.width;
  const viewportHeight = options?.viewport?.height;

  const normalizedViewport = useMemo(() => {
    return normalizeProjectWorkspaceViewport(
      options?.viewport ?? undefined
    );
  }, [viewportWidth, viewportHeight]);

  const initialProtectedZones = useMemo(() => {
    if (Array.isArray(options?.protectedZones) && options.protectedZones.length) {
      return options.protectedZones.map((zone) => ({ ...zone }));
    }

    return buildProjectWorkspaceProtectedZones(normalizedViewport);
  }, [normalizedViewport, options?.protectedZones]);

  const manager = useUniversalPanelManager({
    seeds: getProjectWorkspacePanelSeeds(),
    viewport: normalizedViewport,
    protectedZones: initialProtectedZones,
  });

  const metadataBridge = useMetadataPanelBridge(manager);

  const managerSetViewport = manager.setViewport;
  const managerSetProtectedZones = manager.setProtectedZones;
  const managerProtectedZones = manager.protectedZones;

  useEffect(() => {
    managerSetViewport(normalizedViewport);
  }, [managerSetViewport, normalizedViewport]);

  useEffect(() => {
    const nextZones =
      Array.isArray(options?.protectedZones) && options.protectedZones.length
        ? options.protectedZones.map((zone) => ({ ...zone }))
        : buildProjectWorkspaceProtectedZones(normalizedViewport);

    if (!isProjectWorkspaceProtectedZoneEqual(managerProtectedZones, nextZones)) {
      managerSetProtectedZones(nextZones);
    }
  }, [
    managerProtectedZones,
    managerSetProtectedZones,
    normalizedViewport,
    options?.protectedZones,
  ]);

  const openMetadataInspect = useCallback(
    (request: ProjectWorkspaceMetadataOpenRequest) => {
      metadataBridge.openMetadataPanel({
        ...request,
        targetLabel: buildProjectWorkspaceMetadataLabel({
          targetType: request.targetType,
          targetId: request.targetId,
          explicitLabel: request.targetLabel,
        }),
      });
    },
    [metadataBridge]
  );

  const syncMetadataSelection = useCallback(
    (
      targetType: MetadataTargetType | null,
      targetId: string | null,
      targetLabel?: string | null
    ) => {
      if (!targetType || !targetId) {
        metadataBridge.clearMetadataSelection();
        return;
      }

      metadataBridge.syncMetadataSelection(
        targetType,
        targetId,
        buildProjectWorkspaceMetadataLabel({
          targetType,
          targetId,
          explicitLabel: targetLabel,
        })
      );
    },
    [metadataBridge]
  );

  return {
    manager,
    metadataBridge,
    registry: UNIVERSAL_PANEL_RENDER_REGISTRY,
    openMetadataInspect,
    closeMetadataInspect: metadataBridge.closeMetadataPanel,
    focusMetadataInspect: metadataBridge.focusMetadataPanel,
    syncMetadataSelection,
  };
}

export type ProjectWorkspacePanelSystem = ReturnType<
  typeof useProjectWorkspacePanelSystem
>;