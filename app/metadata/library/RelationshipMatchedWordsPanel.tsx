"use client";

import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

import { getRelationshipReasonBreakdown } from "./relationshipExplorerUtils";
import { RelationshipMiniMetric } from "./RelationshipDetailAtoms";

export function MatchedWordsPanel({
  signal,
  activeRecord,
}: {
  signal: RelatedRecordSignal;
  activeRecord?: MetadataLibraryRecordSummary | null;
}) {
  const comparison = activeRecord ?? signal.record;
  const breakdown = getRelationshipReasonBreakdown(comparison, signal.record);

  const words = breakdown.matchedWords;

  return (
    <div className="mt-3 rounded-lg border border-white/20 bg-black p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
        Matched words
      </p>

      <RelationshipMiniMetric label="words" value={String(words.length)} />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {words.map((word: string) => (
          <span key={word} className="text-[10px] text-white/55">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}