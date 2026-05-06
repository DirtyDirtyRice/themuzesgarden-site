"use client";

import { useMemo, useState } from "react";

import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import RelationshipExplorerRecordCard from "./RelationshipExplorerRecordCard";
import RelationshipExplorerStrongestSignal from "./RelationshipExplorerStrongestSignal";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";
import {
  FILTER_OPTIONS,
  getActiveFilterDescription,
  getFilteredSignals,
  getFilterEmptyMessage,
  getRelationshipSignalSummary,
  getSignalCount,
  type SignalFilter,
} from "./relationshipExplorerQuickFilters";
import { RelationshipStatBox } from "./RelationshipExplorerDetailPanels";

type Props = {
  quickRelatedSignals: RelatedRecordSignal[];
  strongestSignal: RelatedRecordSignal | null;
  relatedSignalCount: number;
  showMoreQuickRecords: boolean;
  onToggleShowMoreQuickRecords: () => void;
  onOpenRecordInExplorer: (record: MetadataLibraryRecordSummary) => void;
};

export default function RelationshipExplorerQuickRecords({
  quickRelatedSignals,
  strongestSignal,
  relatedSignalCount,
  showMoreQuickRecords,
  onToggleShowMoreQuickRecords,
  onOpenRecordInExplorer,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<SignalFilter>("all");
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const filteredSignals = useMemo(
    () => getFilteredSignals(quickRelatedSignals, activeFilter),
    [quickRelatedSignals, activeFilter]
  );

  const signalSummary = useMemo(
    () => getRelationshipSignalSummary(quickRelatedSignals),
    [quickRelatedSignals]
  );

  function toggleExpandedRecord(recordId: string) {
    setExpandedRecordId((current) => (current === recordId ? null : recordId));
  }

  return (
    <>
      {strongestSignal ? (
        <RelationshipExplorerStrongestSignal
          strongestSignal={strongestSignal}
          onOpenRecordInExplorer={onOpenRecordInExplorer}
        />
      ) : null}

      <div className="mt-4 rounded-lg border border-white/25 bg-black p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/50">
              Quick related records
            </p>

            <p className="mt-1 text-xs leading-5 text-white/45">
              Filter the visible suggestions by the signal that made them
              related. Expand any card to see the reasoning behind the match.
            </p>

            <p className="mt-1 text-[10px] leading-4 text-white/35">
              {getActiveFilterDescription(activeFilter)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/45">
              {filteredSignals.length > 0
                ? `${filteredSignals.length} shown`
                : "none available"}
            </span>

            {relatedSignalCount > 6 ? (
              <button
                type="button"
                onClick={onToggleShowMoreQuickRecords}
                className="rounded-full border border-white/30 px-2 py-1 text-xs text-white/60 transition hover:border-white hover:text-white"
              >
                {showMoreQuickRecords ? "Show fewer" : "Show more"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <RelationshipStatBox
            label="Very strong"
            value={signalSummary.veryStrongCount}
            detail="90+ score"
          />

          <RelationshipStatBox
            label="Strong"
            value={signalSummary.strongCount}
            detail="55+ score"
          />

          <RelationshipStatBox
            label="Shelf"
            value={signalSummary.shelfCount}
            detail="same shelf"
          />

          <RelationshipStatBox
            label="Section"
            value={signalSummary.sectionCount}
            detail="same section"
          />

          <RelationshipStatBox
            label="Language"
            value={signalSummary.languageCount}
            detail="shared terms"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => {
            const count = getSignalCount(quickRelatedSignals, option.key);
            const selected = activeFilter === option.key;

            return (
              <button
                key={option.key}
                type="button"
                title={option.description}
                onClick={() => setActiveFilter(option.key)}
                className={[
                  "rounded-full border px-2.5 py-1 text-xs transition",
                  selected
                    ? "border-white bg-white text-black"
                    : "border-white/30 bg-black text-white/60 hover:border-white hover:text-white",
                ].join(" ")}
              >
                {option.label} ({count})
              </button>
            );
          })}
        </div>

        {filteredSignals.length > 0 ? (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {filteredSignals.map((signal) => (
              <RelationshipExplorerRecordCard
                key={signal.record.id}
                signal={signal}
                expanded={expandedRecordId === signal.record.id}
                onToggleExpanded={() => toggleExpandedRecord(signal.record.id)}
                onOpenRecordInExplorer={onOpenRecordInExplorer}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-white/60">
            {getFilterEmptyMessage(activeFilter)}
          </p>
        )}
      </div>
    </>
  );
}