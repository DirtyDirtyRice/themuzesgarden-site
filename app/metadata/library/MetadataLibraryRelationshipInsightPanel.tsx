"use client";

import type { MetadataRelationshipInsightSummary } from "./MetadataLibraryRelationshipIntelligence";

type Props = {
  summary: MetadataRelationshipInsightSummary | null;
};

export default function MetadataLibraryRelationshipInsightPanel({
  summary,
}: Props) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-white bg-black p-3">
        <p className="text-sm font-semibold text-white">
          Relationship Insight Summary
        </p>

        <p className="mt-2 text-sm leading-6 text-white/60">
          No relationship insight is available yet. Open a record with
          structure candidates to generate top-candidate guidance.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white bg-black p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            Relationship Insight Summary
          </p>

          <p className="mt-2 text-sm leading-6 text-white/70">
            The system now reads the scored relationship pool and recommends
            where to start before you open individual relationship cards.
          </p>
        </div>

        <span className="rounded-full border border-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
          Thinking Layer
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Top Candidate
          </p>

          <p className="mt-1 text-sm font-semibold leading-6 text-white">
            {summary.topTitle}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/65">
            Best current relationship signal.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Top Score
          </p>

          <p className="mt-1 text-sm font-semibold leading-6 text-white">
            {summary.topScore}/100
          </p>

          <p className="mt-1 text-xs leading-5 text-white/65">
            Highest confidence score in the visible pool.
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Score Range
          </p>

          <p className="mt-1 text-sm font-semibold leading-6 text-white">
            {summary.scoreRange}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/65">
            Spread between weakest and strongest visible candidates.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/30 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
          Recommended Action
        </p>

        <p className="mt-1 text-sm leading-6 text-white/75">
          {summary.recommendation}
        </p>
      </div>
    </div>
  );
}