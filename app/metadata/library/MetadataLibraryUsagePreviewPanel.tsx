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

export default function MetadataLibraryUsagePreviewPanel({
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
            Usage Layer Preview
          </p>

          <p className="mt-2 text-sm leading-6 text-white/70">
            This prepares the system to track where a record is used across the
            app without changing the data model yet.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-white/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
          UI Only
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-white/30 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
          Meaning → Usage Awareness
        </p>

        <p className="mt-1 text-xs leading-5 text-white/70">
          {relationshipSnapshot.meaningSignal}
        </p>

        <p className="mt-1 text-xs leading-5 text-white/55">
          Once meaning fields exist, usage can show where those meanings are
          actually reused in songs, prompts, workflows, instruments, and app
          tools.
        </p>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Track usage
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            Will show which tracks, prompts, or compositions use this record.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Workflow placement
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            Will show where this record appears in workflows or creation flows.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Cross-system linking
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            Will connect this record to future systems like player, prompts,
            instruments, and timeline tools.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Usage memory
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {relationshipSnapshot.layerMemoryLabel}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/55">
            {activeQuery.trim()
              ? `The active query “${activeQuery.trim()}” stays attached while usage relationships are previewed.`
              : "No active query is shaping this usage preview yet."}
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Current readiness
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {formatLabel(openRecord.title)} is ready to be tracked across usage
            contexts once usage data is introduced.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Candidate pool
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            Usage preview can inherit {relatedByShelfLength} same-shelf
            candidates and {relatedBySectionLength} same-section candidates,
            then later connect them to real player, prompt, timeline, and
            workflow usage events.
          </p>
        </div>
      </div>
    </div>
  );
}