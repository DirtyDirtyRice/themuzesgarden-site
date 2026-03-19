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
    <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">Search Status</span>
        <span>
          {trimmedQuery
            ? `${searchResultCount} ranked result${searchResultCount === 1 ? "" : "s"}`
            : "Waiting for query"}
        </span>
      </div>

      {trimmedQuery ? (
        <>
          <div className="mt-1 text-zinc-600">
            Current query:{" "}
            <span className="font-medium text-zinc-800">{trimmedQuery}</span>
          </div>

          <div className="mt-1 text-zinc-600">
            Heat engine:{" "}
            <span className="font-medium text-zinc-800">{searchInsights.hotCount} hot</span>
            {" • "}
            <span className="font-medium text-zinc-800">{searchInsights.warmCount} warm</span>
            {" • "}
            <span className="font-medium text-zinc-800">
              best score {searchInsights.bestScore}
            </span>
          </div>
        </>
      ) : (
        <div className="mt-1 text-zinc-600">
          Search by title, artist, tag, or sound moment.
        </div>
      )}
    </div>
  );
}