"use client";

import { useMemo } from "react";

import { getFindItRelationshipSummariesForSearch } from "./findItRelationshipAdapter";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

export default function FindItMoreInfoPreview({
  searchValue = "",
  selectedResult = null,
}: {
  searchValue?: string;
  selectedResult?: NavigationSearchResult | null;
}) {
  const relationshipSummaries = useMemo(() => {
    if (!searchValue) return [];

    return getFindItRelationshipSummariesForSearch(searchValue).slice(0, 6);
  }, [searchValue]);

  return (
    <div className="rounded-xl border border-white/10 bg-black px-3 py-3">
      <button
        type="button"
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98]"
      >
        More info?
      </button>

      <p className="mt-2 text-sm leading-6 text-white/60">
        Find It connects navigation, metadata, and relationships. It shows not
        just where something is, but how it connects to other ideas.
      </p>

      {selectedResult ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
            Selected
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            {selectedResult.node.label}
          </p>
        </div>
      ) : null}

      {relationshipSummaries.length > 0 ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
            Related ideas
          </p>

          <div className="mt-2 flex flex-col gap-2">
            {relationshipSummaries.map((rel) => (
              <div
                key={`${rel.id}-${rel.sourceSlug}-${rel.targetLabel}`}
                className="rounded-md border border-white/10 bg-black/40 px-2 py-2"
              >
                <p className="text-xs text-white/70">
                  {rel.sourceLabel} → {rel.targetLabel}
                </p>

                <p className="text-[11px] text-white/45">
                  {rel.type}
                  {rel.note ? ` — ${rel.note}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}