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
    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/45">
          Saved
        </span>

        {TRACK_MATCHER_FINDER_SAVED_SEARCHES.map((search) => (
          <button
            key={search.id}
            type="button"
            onClick={() => onSelectQuery(search.query)}
            title={search.description}
            className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[0.68rem] font-bold leading-none text-white/70 transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.10] hover:text-white active:scale-[0.98]"
          >
            {search.label}
          </button>
        ))}
      </div>
    </div>
  );
}
