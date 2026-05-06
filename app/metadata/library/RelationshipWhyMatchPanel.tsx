"use client";

import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

import {
  getRankedRelationshipReasons,
  getRelationshipReasonBreakdown,
  getWhyThisMatchText,
} from "./relationshipExplorerUtils";

import {
  getConfidenceLabel,
  getConfidenceDescription,
} from "./RelationshipDetailHelpers";

export function WhyThisMatchPanel({
  signal,
  activeRecord,
}: {
  signal: RelatedRecordSignal;
  activeRecord?: MetadataLibraryRecordSummary | null;
}) {
  const comparison = activeRecord ?? signal.record;
  const breakdown = getRelationshipReasonBreakdown(comparison, signal.record);

  const ranked = getRankedRelationshipReasons(breakdown);

  return (
    <div className="mt-3 rounded-lg border border-white/20 bg-black p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
        Why this match
      </p>

      <p className="mt-2 text-xs text-white/60">
        {getWhyThisMatchText(breakdown)}
      </p>

      <p className="mt-1 text-xs text-white/45">
        {getConfidenceDescription(breakdown.confidence)}
      </p>

      {ranked.map((r) => (
        <p key={r} className="text-[10px] text-white/50">
          {r}
        </p>
      ))}
    </div>
  );
}