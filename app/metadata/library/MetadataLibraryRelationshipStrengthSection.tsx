"use client";

import { useState } from "react";

import MetadataLibraryRelationshipCard from "./MetadataLibraryRelationshipCard";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  MetadataLibraryRelationshipSource,
  MetadataLibraryRelationshipStrength,
  MetadataLibraryScoredRelationshipRecord,
} from "./MetadataLibraryRelationshipTypes";

type Props = {
  title: string;
  records: MetadataLibraryScoredRelationshipRecord[];
  strength: MetadataLibraryRelationshipStrength;
  source: MetadataLibraryRelationshipSource;
  openRecord: MetadataLibraryRecordSummary;
  activeQuery: string;
  onOpenRelatedRecord: (record: MetadataLibraryRecordSummary) => void;
};

export default function MetadataLibraryRelationshipStrengthSection({
  title,
  records,
  strength,
  source,
  openRecord,
  activeQuery,
  onOpenRelatedRecord,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? records : records.slice(0, 3);
  const hiddenCount = Math.max(records.length - visible.length, 0);
  const topScore = records[0]?.score.confidenceScore ?? 0;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-white/50">
            {title} ({records.length})
          </p>

          <p className="mt-1 text-xs leading-5 text-white/40">
            {strength === "strong"
              ? "Highest-confidence structural matches."
              : strength === "medium"
                ? "Useful related records in the same larger structure."
                : "Lower-confidence links that may still be useful."}
          </p>

          {records.length > 0 && (
            <p className="mt-1 text-xs leading-5 text-white/50">
              Smart sorted by confidence. Top score: {topScore}/100.
            </p>
          )}
        </div>

        {records.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="shrink-0 rounded-full border border-white/30 px-2 py-1 text-xs text-white/60 hover:border-white hover:text-white"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="mt-2 rounded-lg border border-white/20 px-3 py-2 text-xs text-white/40">
          No records found in this relationship group yet.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {visible.map(({ record, score }) => (
            <MetadataLibraryRelationshipCard
              key={record.id}
              activeQuery={activeQuery}
              record={record}
              strength={strength}
              source={source}
              openRecord={openRecord}
              score={score}
              onOpenRelatedRecord={onOpenRelatedRecord}
            />
          ))}
        </div>
      )}

      {hiddenCount > 0 && !expanded && (
        <p className="mt-2 text-xs text-white/50">
          + {hiddenCount} more hidden in this group
        </p>
      )}
    </div>
  );
}