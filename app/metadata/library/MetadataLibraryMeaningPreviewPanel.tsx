"use client";

import { formatLabel } from "./metadataLibraryHelpers";
import type { MetadataRelationshipSnapshot } from "./MetadataLibraryRelationshipIntelligence";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

type Props = {
  activeQuery: string;
  openRecord: MetadataLibraryRecordSummary;
  relatedByShelfLength: number;
  relatedBySectionLength: number;
  relationshipSnapshot: MetadataRelationshipSnapshot;
};

export default function MetadataLibraryMeaningPreviewPanel({
  activeQuery,
  openRecord,
  relatedByShelfLength,
  relatedBySectionLength,
  relationshipSnapshot,
}: Props) {
  return (
    <div className="rounded-xl border border-white bg-black p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            Meaning Layer Preview
          </p>

          <p className="mt-2 text-sm leading-6 text-white/70">
            This preview does not change data yet. It prepares the workspace
            for meaning-based relationships once real meaning fields or
            semantic metadata are added.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-white/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
          UI Only
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-white/30 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
          Structure → Meaning Awareness
        </p>

        <p className="mt-1 text-xs leading-5 text-white/70">
          {relationshipSnapshot.structureSignal}
        </p>

        <p className="mt-1 text-xs leading-5 text-white/55">
          Those structural matches can become meaning candidates when intent,
          concept, semantic, and creative-purpose fields are introduced.
        </p>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Intent relationship
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            Later this can connect records that serve the same creative
            purpose, even if they live in different shelves or sections.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Concept relationship
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            Later this can connect lyric ideas, sounds, prompts, instruments,
            and records that describe the same underlying idea.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Semantic relationship
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            Later this can help the system understand related meaning even
            when the words, tags, shelves, or sections are different.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Meaning memory
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {relationshipSnapshot.layerMemoryLabel}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/55">
            {activeQuery.trim()
              ? `The active query “${activeQuery.trim()}” stays attached while meaning relationships are previewed.`
              : "No active query is shaping this meaning preview yet."}
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Current record readiness
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {formatLabel(openRecord.title)} is ready to be compared by meaning,
            intent, creative role, and semantic purpose once meaning fields are
            introduced.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Candidate pool
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            Meaning preview can start from {relatedByShelfLength} same-shelf
            candidates and {relatedBySectionLength} same-section candidates,
            then later widen beyond structure when semantic fields exist.
          </p>
        </div>
      </div>
    </div>
  );
}