"use client";

import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

import {
  formatContextValue,
  getPreviewText,
  getRecordLabel,
  getScoreLabel,
} from "./relationshipExplorerUtils";

import { getConfidenceLabel } from "./RelationshipExplorerDetailPanels";
import { getSmartSummaryLine } from "./RelationshipRecordCardHelpers";

export function RecordCardHeader({
  signal,
  breakdown,
}: {
  signal: RelatedRecordSignal;
  breakdown: any;
}) {
  const record = signal.record;
  const preview = getPreviewText(record);

  return (
    <>
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-white">
          {getRecordLabel(record)}
        </span>

        <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] text-white/55">
          {getScoreLabel(signal.score)}
        </span>

        <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] text-white/55">
          {getConfidenceLabel(breakdown.confidence)}
        </span>
      </span>

      <span className="mt-1 block text-xs text-white/55">
        {formatContextValue(record.shelf)} ·{" "}
        {formatContextValue(record.section)}
      </span>

      <span className="mt-1 block text-[10px] text-white/40">
        {getSmartSummaryLine(breakdown)}
      </span>

      {preview && (
        <span className="mt-2 block text-xs text-white/65">{preview}</span>
      )}
    </>
  );
}