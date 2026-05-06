"use client";

export default function PlayerSearchStatusPanel(props: {
  compact: boolean;
  isSearchTab: boolean;
  trimmedQuery: string;
  searchResultCount: number;
  searchInsights: {
    rankedCount: number;
    hotCount: number;
    warmCount: number;
    bestScore: number;
  };
}) {
  const { compact, isSearchTab, trimmedQuery, searchResultCount, searchInsights } = props;

  if (compact || !isSearchTab) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-[11px] text-white/70">
      <div className="flex items-center justify-between">
        <span className="font-medium text-white">Search Status</span>
        <span>
          {trimmedQuery
            ? `${searchResultCount} results`
            : "Waiting"}
        </span>
      </div>

      {trimmedQuery ? (
        <>
          <div className="mt-1 text-white/60">
            Query:{" "}
            <span className="font-medium text-white">
              {trimmedQuery}
            </span>
          </div>

          <div className="mt-1 text-white/60">
            <span className="text-white">
              {searchInsights.hotCount} hot
            </span>
            {" • "}
            <span className="text-white">
              {searchInsights.warmCount} warm
            </span>
            {" • "}
            <span className="text-white">
              score {searchInsights.bestScore}
            </span>
          </div>
        </>
      ) : (
        <div className="mt-1 text-white/60">
          Search by title, tag, or sound
        </div>
      )}
    </div>
  );
}