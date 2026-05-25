"use client";

import { TRACK_MATCHER_FINDER_SAVED_SEARCHES } from "./trackMatcherFinderSavedSearchSeed";
import type { TrackMatcherFinderQuery } from "./trackMatcherFinderTypes";

type Props = {
  onSelectQuery: (query: TrackMatcherFinderQuery) => void;
};

export default function TrackMatcherFinderSavedSearchRail({
  onSelectQuery,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs uppercase tracking-[0.28em] text-white/50">
        Saved Searches
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {TRACK_MATCHER_FINDER_SAVED_SEARCHES.map((search) => (
          <button
            key={search.id}
            type="button"
            onClick={() => onSelectQuery(search.query)}
            title={search.description}
            className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs text-white/70 transition hover:scale-105 hover:text-white"
          >
            {search.label}
          </button>
        ))}
      </div>
    </div>
  );
}