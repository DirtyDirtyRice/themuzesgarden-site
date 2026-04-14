"use client";

import { useCallback, useMemo } from "react";
import type { MetadataTargetType } from "../../../../../lib/metadata/metadataTypes";
import type { UseUniversalPanelManagerReturn } from "./useUniversalPanelManager";
import { METADATA_INSPECT_PANEL_TYPE } from "./panelRenderRegistry";

export const METADATA_INSPECT_PRIMARY_INSTANCE_ID =
  "metadata_inspect__primary";

export type MetadataBridgeOpenRequest = {
  targetType: MetadataTargetType;
  targetId: string;
  targetLabel?: string | null;
  requestedLeft?: number | null;
  requestedTop?: number | null;
  requestedWidth?: number | null;
  requestedHeight?: number | null;
  focus?: boolean;
};

export type MetadataPanelBridge = {
  panelType: string;
  instanceId: string;
  isOpen: boolean;
  targetType: MetadataTargetType | null;
  targetId: string | null;
  targetLabel: string | null;
  openMetadataPanel: (request: MetadataBridgeOpenRequest) => void;
  closeMetadataPanel: () => void;
  focusMetadataPanel: () => void;
  syncMetadataSelection: (
    targetType: MetadataTargetType | null,
    targetId: string | null,
    targetLabel?: string | null
  ) => void;
  clearMetadataSelection: () => void;
};

function cleanNullableString(value: unknown): string | null {
  const clean = String(value ?? "").trim();
  return clean || null;
}

export function useMetadataPanelBridge(
  manager: UseUniversalPanelManagerReturn
): MetadataPanelBridge {
  const metadataPanel =
    manager.getPanel(METADATA_INSPECT_PRIMARY_INSTANCE_ID);

  const openMetadataPanel = useCallback(
    (request: MetadataBridgeOpenRequest) => {
      const targetType = request.targetType;
      const targetId = cleanNullableString(request.targetId);

      if (!targetType || !targetId) return;

      manager.openPanel(METADATA_INSPECT_PRIMARY_INSTANCE_ID, {
        focus: request.focus ?? true,
        requestedRect: {
          left:
            typeof request.requestedLeft === "number"
              ? request.requestedLeft
              : undefined,
          top:
            typeof request.requestedTop === "number"
              ? request.requestedTop
              : undefined,
          width:
            typeof request.requestedWidth === "number"
              ? request.requestedWidth
              : undefined,
          height:
            typeof request.requestedHeight === "number"
              ? request.requestedHeight
              : undefined,
        },
        metadataPatch: {
          targetType,
          targetId,
          targetLabel: cleanNullableString(request.targetLabel),
          source: "metadata_bridge_open",
          openedAt: Date.now(),
        },
      });
    },
    [manager]
  );

  const closeMetadataPanel = useCallback(() => {
    manager.closePanel(METADATA_INSPECT_PRIMARY_INSTANCE_ID);
  }, [manager]);

  const focusMetadataPanel = useCallback(() => {
    manager.focusPanel(METADATA_INSPECT_PRIMARY_INSTANCE_ID);
  }, [manager]);

  const syncMetadataSelection = useCallback(
    (
      targetType: MetadataTargetType | null,
      targetId: string | null,
      targetLabel?: string | null
    ) => {
      const existing = manager.getPanel(METADATA_INSPECT_PRIMARY_INSTANCE_ID);
      if (!existing) return;

      const nextTargetId = cleanNullableString(targetId);
      const nextTargetLabel = cleanNullableString(targetLabel);
      const currentTargetType =
        (existing.metadata?.targetType as MetadataTargetType | null) ?? null;
      const currentTargetId = cleanNullableString(existing.metadata?.targetId);
      const currentTargetLabel = cleanNullableString(
        existing.metadata?.targetLabel
      );

      if (
        currentTargetType === (targetType ?? null) &&
        currentTargetId === nextTargetId &&
        currentTargetLabel === nextTargetLabel
      ) {
        return;
      }

      manager.patchPanel(METADATA_INSPECT_PRIMARY_INSTANCE_ID, {
        metadata: {
          ...(existing.metadata ?? {}),
          targetType: targetType ?? null,
          targetId: nextTargetId,
          targetLabel: nextTargetLabel,
          syncedAt: Date.now(),
        },
      });
    },
    [manager]
  );

  const clearMetadataSelection = useCallback(() => {
    const existing = manager.getPanel(METADATA_INSPECT_PRIMARY_INSTANCE_ID);
    if (!existing) return;

    const currentTargetType =
      (existing.metadata?.targetType as MetadataTargetType | null) ?? null;
    const currentTargetId = cleanNullableString(existing.metadata?.targetId);
    const currentTargetLabel = cleanNullableString(
      existing.metadata?.targetLabel
    );

    if (
      currentTargetType === null &&
      currentTargetId === null &&
      currentTargetLabel === null
    ) {
      return;
    }

    manager.patchPanel(METADATA_INSPECT_PRIMARY_INSTANCE_ID, {
      metadata: {
        ...(existing.metadata ?? {}),
        targetType: null,
        targetId: null,
        targetLabel: null,
        clearedAt: Date.now(),
      },
    });
  }, [manager]);

  return useMemo(
    () => ({
      panelType: METADATA_INSPECT_PANEL_TYPE,
      instanceId: METADATA_INSPECT_PRIMARY_INSTANCE_ID,
      isOpen: metadataPanel?.visibilityState === "open",
      targetType:
        (metadataPanel?.metadata?.targetType as MetadataTargetType | null) ??
        null,
      targetId: cleanNullableString(metadataPanel?.metadata?.targetId),
      targetLabel: cleanNullableString(metadataPanel?.metadata?.targetLabel),
      openMetadataPanel,
      closeMetadataPanel,
      focusMetadataPanel,
      syncMetadataSelection,
      clearMetadataSelection,
    }),
    [
      clearMetadataSelection,
      closeMetadataPanel,
      focusMetadataPanel,
      metadataPanel,
      openMetadataPanel,
      syncMetadataSelection,
    ]
  );
}