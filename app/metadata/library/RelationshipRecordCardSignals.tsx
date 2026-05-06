"use client";

import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

import { RelationshipSignalPill } from "./RelationshipExplorerDetailPanels";
import { getCompactCardStatus } from "./RelationshipRecordCardHelpers";

export function RecordCardSignals({
  signal,
  breakdown,
}: {
  signal: RelatedRecordSignal;
  breakdown: any;
}) {
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      <RelationshipSignalPill label="shelf" active={signal.shelfMatch} />
      <RelationshipSignalPill label="section" active={signal.sectionMatch} />
      <RelationshipSignalPill label="language" active={signal.titleMatch} />

      <RelationshipSignalPill
        label={breakdown.dominantSignal}
        active={true}
      />

      <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] text-white/55">
        score {signal.score}
      </span>

      <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] text-white/55">
        {getCompactCardStatus(signal)}
      </span>
    </span>
  );
}