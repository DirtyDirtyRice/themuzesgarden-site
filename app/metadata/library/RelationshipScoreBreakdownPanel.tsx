"use client";

import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

import { getRelationshipReasonBreakdown } from "./relationshipExplorerUtils";

type Props = {
  signal: RelatedRecordSignal;
  activeRecord?: MetadataLibraryRecordSummary | null;
};

function getComparisonRecord(signal: RelatedRecordSignal, activeRecord?: MetadataLibraryRecordSummary | null) {
  return activeRecord ?? signal.record;
}

function getItems(signal: RelatedRecordSignal, breakdown: any) {
  return [
    { label: "Shelf", value: signal.shelfMatch ? 35 : 0, active: signal.shelfMatch },
    { label: "Section", value: signal.sectionMatch ? 35 : 0, active: signal.sectionMatch },
    { label: "Language", value: signal.titleMatch ? 18 : 0, active: signal.titleMatch },
    { label: "Preview", value: breakdown.previewMatch ? 12 : 0, active: breakdown.previewMatch },
    { label: "Slug", value: breakdown.slugMatch ? 10 : 0, active: breakdown.slugMatch },
    { label: "Visibility", value: breakdown.sameVisibility ? 5 : 0, active: breakdown.sameVisibility },
  ];
}

export function ScoreBreakdownPanel({ signal, activeRecord }: Props) {
  const comparison = getComparisonRecord(signal, activeRecord);
  const breakdown = getRelationshipReasonBreakdown(comparison, signal.record);

  const items = getItems(signal, breakdown);

  return (
    <div className="mt-3 rounded-lg border border-white/20 bg-black p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
        Score breakdown
      </p>

      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-[10px]">
            <span>{item.label}</span>
            <span>+{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}