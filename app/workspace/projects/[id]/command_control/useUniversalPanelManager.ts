"use client";

import { useCallback, useMemo, useState } from "react";
import {
  cloneUniversalPanelRect,
  type UniversalPanelInstance,
  type UniversalPanelLayoutSnapshot,
  type UniversalPanelMoveRequest,
  type UniversalPanelOpenRequest,
  type UniversalPanelRect,
  type UniversalPanelRegistrySeed,
  type UniversalPanelResizeRequest,
  type UniversalProtectedZone,
  type UniversalViewportRect,
} from "./panelInstanceTypes";
import {
  bringUniversalPanelToFront,
  buildUniversalPanelRegistry,
  cloneUniversalPanelRegistry,
  closeUniversalPanelInRegistry,
  getOrderedUniversalPanels,
  openUniversalPanelInRegistry,
  updateUniversalPanelInRegistry,
} from "./panelInstanceRegistry";
import {
  clampRectToConstraints,
  clampRectToViewport,
  solveUniversalPanelLayout,
} from "./panelLayoutSolver";

type UseUniversalPanelManagerOptions = {
  seeds: UniversalPanelRegistrySeed[];
  viewport?: UniversalViewportRect;
  protectedZones?: UniversalProtectedZone[];
};

type SetViewportRequest = Partial<UniversalViewportRect>;
type SetProtectedZonesRequest = UniversalProtectedZone[];

function mergeRect(
  baseRect: UniversalPanelRect,
  patch?: Partial<UniversalPanelRect>
): UniversalPanelRect {
  return {
    left: typeof patch?.left === "number" ? patch.left : baseRect.left,
    top: typeof patch?.top === "number" ? patch.top : baseRect.top,
    width: typeof patch?.width === "number" ? patch.width : baseRect.width,
    height: typeof patch?.height === "number" ? patch.height : baseRect.height,
  };
}

function rectPatchWouldChange(
  currentRect: UniversalPanelRect | null | undefined,
  patchRect: Partial<UniversalPanelRect> | null | undefined
): boolean {
  if (!patchRect) return false;
  if (!currentRect) return true;

  if (
    typeof patchRect.left === "number" &&
    patchRect.left !== currentRect.left
  ) {
    return true;
  }

  if (typeof patchRect.top === "number" && patchRect.top !== currentRect.top) {
    return true;
  }

  if (
    typeof patchRect.width === "number" &&
    patchRect.width !== currentRect.width
  ) {
    return true;
  }

  if (
    typeof patchRect.height === "number" &&
    patchRect.height !== currentRect.height
  ) {
    return true;
  }

  return false;
}

function metadataPatchWouldChange(
  currentMetadata: UniversalPanelInstance["metadata"],
  patchMetadata: UniversalPanelInstance["metadata"] | undefined
): boolean {
  if (!patchMetadata) return false;
  if (!currentMetadata) return true;

  for (const key of Object.keys(patchMetadata)) {
    if (currentMetadata[key] !== patchMetadata[key]) {
      return true;
    }
  }

  return false;
}

function panelPatchWouldChange(
  current: UniversalPanelInstance,
  patch: Partial<UniversalPanelInstance>
): boolean {
  for (const key of Object.keys(patch) as Array<keyof UniversalPanelInstance>) {
    if (key === "rect") {
      if (
        rectPatchWouldChange(
          current.rect,
          patch.rect as Partial<UniversalPanelRect> | undefined
        )
      ) {
        return true;
      }
      continue;
    }

    if (key === "previousRect") {
      if (
        rectPatchWouldChange(
          current.previousRect,
          patch.previousRect as Partial<UniversalPanelRect> | null | undefined
        )
      ) {
        return true;
      }
      continue;
    }

    if (key === "metadata") {
      if (metadataPatchWouldChange(current.metadata, patch.metadata)) {
        return true;
      }
      continue;
    }

    if (patch[key] !== current[key]) {
      return true;
    }
  }

  return false;
}

export function useUniversalPanelManager(
  options: UseUniversalPanelManagerOptions
) {
  const [panels, setPanels] = useState<Record<string, UniversalPanelInstance>>(
    () => buildUniversalPanelRegistry(options.seeds)
  );

  const [viewport, setViewportState] = useState<UniversalViewportRect>(
    options.viewport ?? { width: 1280, height: 720 }
  );

  const [protectedZones, setProtectedZonesState] = useState<
    UniversalProtectedZone[]
  >(options.protectedZones ?? []);

  const orderedPanels = useMemo(() => {
    return getOrderedUniversalPanels(panels);
  }, [panels]);

  const openPanels = useMemo(() => {
    return orderedPanels.filter((panel) => panel.visibilityState === "open");
  }, [orderedPanels]);

  const getPanel = useCallback(
    (instanceId: string): UniversalPanelInstance | null => {
      return panels[instanceId] ?? null;
    },
    [panels]
  );

  const setViewport = useCallback((request: SetViewportRequest) => {
    setViewportState((current) => {
      const nextWidth =
        typeof request.width === "number" && request.width > 0
          ? request.width
          : current.width;

      const nextHeight =
        typeof request.height === "number" && request.height > 0
          ? request.height
          : current.height;

      if (nextWidth === current.width && nextHeight === current.height) {
        return current;
      }

      return {
        width: nextWidth,
        height: nextHeight,
      };
    });
  }, []);

  const setProtectedZones = useCallback(
    (nextProtectedZones: SetProtectedZonesRequest) => {
      setProtectedZonesState(
        Array.isArray(nextProtectedZones) ? nextProtectedZones : []
      );
    },
    []
  );

  const focusPanel = useCallback((instanceId: string) => {
    setPanels((current) => bringUniversalPanelToFront(current, instanceId));
  }, []);

  const openPanel = useCallback(
    (instanceId: string, request?: UniversalPanelOpenRequest) => {
      setPanels((current) => {
        const existing = current[instanceId];
        if (!existing) return current;

        let next = cloneUniversalPanelRegistry(current);
        next = openUniversalPanelInRegistry(next, instanceId);

        const panel = next[instanceId];
        const mergedRect = mergeRect(panel.rect, request?.requestedRect);

        const constrainedRect = clampRectToConstraints(
          mergedRect,
          panel.constraints,
          viewport
        );

        const clampedRect = clampRectToViewport(constrainedRect, viewport);

        const solved = solveUniversalPanelLayout({
          movingInstanceId: instanceId,
          candidateRect: clampedRect,
          existingPanels: Object.values(next),
          protectedZones,
          viewport,
          allowProtectedZoneOverride:
            request?.protectedZoneOverride ?? panel.protectedZoneOverride,
        });

        next = updateUniversalPanelInRegistry(next, instanceId, {
          previousRect: cloneUniversalPanelRect(panel.rect),
          rect: solved.rect,
          protectedZoneOverride:
            request?.protectedZoneOverride ?? panel.protectedZoneOverride,
          metadata: {
            ...(panel.metadata ?? {}),
            ...(request?.metadataPatch ?? {}),
          },
        });

        if (request?.focus !== false) {
          next = bringUniversalPanelToFront(next, instanceId);
        }

        return next;
      });
    },
    [protectedZones, viewport]
  );

  const closePanel = useCallback((instanceId: string) => {
    setPanels((current) => closeUniversalPanelInRegistry(current, instanceId));
  }, []);

  const togglePanel = useCallback(
    (instanceId: string, focus = true) => {
      const existing = panels[instanceId];
      if (!existing) return;

      if (existing.visibilityState === "open") {
        closePanel(instanceId);
        return;
      }

      openPanel(instanceId, { focus });
    },
    [closePanel, openPanel, panels]
  );

  const movePanel = useCallback(
    (request: UniversalPanelMoveRequest) => {
      setPanels((current) => {
        const existing = current[request.instanceId];
        if (!existing) return current;
        if (!existing.permissions.canDrag || existing.locked) return current;

        const nextCandidate = clampRectToViewport(
          {
            ...existing.rect,
            left: request.left,
            top: request.top,
          },
          viewport
        );

        const solved = solveUniversalPanelLayout({
          movingInstanceId: request.instanceId,
          candidateRect: nextCandidate,
          existingPanels: Object.values(current),
          protectedZones,
          viewport,
          allowProtectedZoneOverride:
            request.protectedZoneOverride ?? existing.protectedZoneOverride,
        });

        return updateUniversalPanelInRegistry(current, request.instanceId, {
          previousRect: cloneUniversalPanelRect(existing.rect),
          rect: solved.rect,
          protectedZoneOverride:
            request.protectedZoneOverride ?? existing.protectedZoneOverride,
        });
      });
    },
    [protectedZones, viewport]
  );

  const resizePanel = useCallback(
    (request: UniversalPanelResizeRequest) => {
      setPanels((current) => {
        const existing = current[request.instanceId];
        if (!existing) return current;
        if (!existing.permissions.canResize || existing.locked) return current;

        const constrainedRect = clampRectToConstraints(
          request.nextRect,
          existing.constraints,
          viewport
        );

        const clampedRect = clampRectToViewport(constrainedRect, viewport);

        const solved = solveUniversalPanelLayout({
          movingInstanceId: request.instanceId,
          candidateRect: clampedRect,
          existingPanels: Object.values(current),
          protectedZones,
          viewport,
          allowProtectedZoneOverride:
            request.protectedZoneOverride ?? existing.protectedZoneOverride,
        });

        return updateUniversalPanelInRegistry(current, request.instanceId, {
          previousRect: cloneUniversalPanelRect(existing.rect),
          rect: solved.rect,
          protectedZoneOverride:
            request.protectedZoneOverride ?? existing.protectedZoneOverride,
        });
      });
    },
    [protectedZones, viewport]
  );

  const patchPanel = useCallback(
    (instanceId: string, patch: Partial<UniversalPanelInstance>) => {
      setPanels((current) => {
        const existing = current[instanceId];
        if (!existing) return current;
        if (!panelPatchWouldChange(existing, patch)) return current;

        return updateUniversalPanelInRegistry(current, instanceId, patch);
      });
    },
    []
  );

  const resetPanelRect = useCallback(
    (instanceId: string) => {
      setPanels((current) => {
        const existing = current[instanceId];
        if (!existing) return current;

        const defaultRect = clampRectToViewport(
          clampRectToConstraints(
            existing.defaultRect,
            existing.constraints,
            viewport
          ),
          viewport
        );

        const solved = solveUniversalPanelLayout({
          movingInstanceId: instanceId,
          candidateRect: defaultRect,
          existingPanels: Object.values(current),
          protectedZones,
          viewport,
          allowProtectedZoneOverride: existing.protectedZoneOverride,
        });

        return updateUniversalPanelInRegistry(current, instanceId, {
          previousRect: cloneUniversalPanelRect(existing.rect),
          rect: solved.rect,
        });
      });
    },
    [protectedZones, viewport]
  );

  const snapshot = useMemo<UniversalPanelLayoutSnapshot>(() => {
    return {
      viewport,
      panels: cloneUniversalPanelRegistry(panels),
      protectedZones: [...protectedZones],
      updatedAt: Date.now(),
    };
  }, [panels, protectedZones, viewport]);

  const manager = useMemo(
    () => ({
      panels,
      orderedPanels,
      openPanels,
      viewport,
      protectedZones,
      snapshot,
      getPanel,
      setViewport,
      setProtectedZones,
      focusPanel,
      openPanel,
      closePanel,
      togglePanel,
      movePanel,
      resizePanel,
      patchPanel,
      resetPanelRect,
    }),
    [
      panels,
      orderedPanels,
      openPanels,
      viewport,
      protectedZones,
      snapshot,
      getPanel,
      setViewport,
      setProtectedZones,
      focusPanel,
      openPanel,
      closePanel,
      togglePanel,
      movePanel,
      resizePanel,
      patchPanel,
      resetPanelRect,
    ]
  );

  return manager;
}

export type UseUniversalPanelManagerReturn = ReturnType<
  typeof useUniversalPanelManager
>;