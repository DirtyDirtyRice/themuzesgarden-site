"use client";

import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

import { getRelationshipReasonBreakdown } from "./relationshipExplorerUtils";

import { RecordCardHeader } from "./RelationshipRecordCardHeader";
import { RecordCardSignals } from "./RelationshipRecordCardSignals";
import { RecordCardFooter } from "./RelationshipRecordCardFooter";
import { RecordCardPanels } from "./RelationshipRecordCardPanels";

type Props = {
  signal: RelatedRecordSignal;
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenRecordInExplorer: (record: MetadataLibraryRecordSummary) => void;
};

export default function RelationshipExplorerRecordCard({
  signal,
  expanded,
  onToggleExpanded,
  onOpenRecordInExplorer,
}: Props) {
  const breakdown = getRelationshipReasonBreakdown(
    signal.record,
    signal.record
  );

  return (
    <div className="border border-white/30 p-3">
      <button onClick={() => onOpenRecordInExplorer(signal.record)}>
        <RecordCardHeader signal={signal} breakdown={breakdown} />
        <RecordCardSignals signal={signal} breakdown={breakdown} />
      </button>

      <RecordCardFooter
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
      />

      {expanded && <RecordCardPanels signal={signal} />}
    </div>
  );
}