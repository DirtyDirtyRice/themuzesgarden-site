"use client";

import type { ReactNode } from "react";
import MetadataPanel from "../../../../../player/MetadataPanel";
import { getMetadataByTarget } from "../../../../../lib/metadata/metadataApi";
import type {
  MetadataEntry,
  MetadataTargetType,
} from "../../../../../lib/metadata/metadataTypes";
import type { UniversalPanelInstance } from "./panelInstanceTypes";
import type { UseUniversalPanelManagerReturn } from "./useUniversalPanelManager";
import UniversalPanelSurface from "./UniversalPanelSurface";

type Props = {
  panel: UniversalPanelInstance;
  manager: UseUniversalPanelManagerReturn;
  active?: boolean;
};

type MetadataSelectHandler = (entry: MetadataEntry) => void;

function cleanNullableString(value: unknown): string | null {
  const clean = String(value ?? "").trim();
  return clean || null;
}

function isMetadataTargetType(value: unknown): value is MetadataTargetType {
  return value === "track" || value === "project" || value === "member";
}

function getMetadataSelectHandler(
  value: unknown
): MetadataSelectHandler | null {
  return typeof value === "function"
    ? (value as MetadataSelectHandler)
    : null;
}

function getMetadataEntryLabel(entry: MetadataEntry): string {
  const label = cleanNullableString((entry as { label?: unknown }).label);
  if (label) return label;

  const name = cleanNullableString((entry as { name?: unknown }).name);
  if (name) return name;

  return cleanNullableString(entry.id) ?? "Metadata";
}

export default function MetadataUniversalPanel({
  panel,
  manager,
  active = false,
}: Props) {
  const rawTargetType = panel.metadata?.targetType;
  const targetType = isMetadataTargetType(rawTargetType)
    ? rawTargetType
    : null;
  const targetId = cleanNullableString(panel.metadata?.targetId);
  const targetLabel = cleanNullableString(panel.metadata?.targetLabel);
  const onMetadataSelect = getMetadataSelectHandler(
    panel.metadata?.onMetadataSelect
  );

  const canRenderMetadata = Boolean(targetType && targetId);
  const metadataEntries =
    targetType && targetId ? getMetadataByTarget(targetType, targetId) : [];

  let metadataContent: ReactNode = (
    <div className="rounded-lg border p-4 text-sm text-zinc-600">
      No metadata target is selected yet.
    </div>
  );

  if (targetType && targetId) {
    metadataContent = (
      <div className="space-y-3">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-500">Target Type</div>
          <div className="text-sm font-medium">{targetType}</div>

          <div className="mt-3 text-xs text-zinc-500">Target ID</div>
          <div className="text-sm break-all">{targetId}</div>

          {targetLabel ? (
            <>
              <div className="mt-3 text-xs text-zinc-500">Label</div>
              <div className="text-sm">{targetLabel}</div>
            </>
          ) : null}
        </div>

        {onMetadataSelect && metadataEntries.length > 0 ? (
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-sm font-medium">Metadata Filters</div>
            <div className="text-xs text-zinc-500">
              Click a metadata item to add or remove its filter chip in the
              workspace library panel.
            </div>

            <div className="flex flex-wrap gap-2">
              {metadataEntries.map((entry) => (
                <button
                  key={String(entry.id)}
                  type="button"
                  className="rounded-full border bg-white px-2 py-1 text-[11px] transition hover:bg-zinc-50 active:scale-[0.98]"
                  onClick={() => onMetadataSelect(entry)}
                >
                  {getMetadataEntryLabel(entry)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border p-3">
          <MetadataPanel targetType={targetType} targetId={targetId} />
        </div>
      </div>
    );
  }

  return (
    <UniversalPanelSurface
      manager={manager}
      panel={{
        ...panel,
        title: targetLabel ? `Metadata • ${targetLabel}` : "Metadata Inspect",
      }}
      active={active}
      onClose={() => manager.closePanel(panel.instanceId)}
      onFocus={() => manager.focusPanel(panel.instanceId)}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500">
            {canRenderMetadata
              ? "Universal metadata panel is active."
              : "No metadata target selected."}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-xs"
              onClick={() => manager.resetPanelRect(panel.instanceId)}
            >
              Reset Box
            </button>

            <button
              type="button"
              className="rounded border px-3 py-1.5 text-xs"
              onClick={() => manager.closePanel(panel.instanceId)}
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-sm font-medium">Metadata Inspect</div>
          <div className="mt-1 text-xs text-zinc-500">
            This panel now renders through the universal box system.
          </div>
        </div>

        {metadataContent}
      </div>
    </UniversalPanelSurface>
  );
}