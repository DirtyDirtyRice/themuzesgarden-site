"use client";

export default function PlayerStatusBadges(props: {
  isSearchTab: boolean;
  isProjectTab: boolean;
  hasNow: boolean;
  compact: boolean;
  trimmedQuery: string;
  getSearchModeLabel: (query: string) => string;
}) {
  const { isSearchTab, isProjectTab, hasNow, compact, trimmedQuery, getSearchModeLabel } = props;

  const searchActive = Boolean(trimmedQuery);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* SEARCH STATUS */}
      <span
        className={[
          "rounded-full border px-2 py-0.5 text-[10px]",
          isSearchTab
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-600",
        ].join(" ")}
      >
        {isSearchTab ? "Search Active" : "Search Idle"}
      </span>

      {/* PROJECT STATUS */}
      <span
        className={[
          "rounded-full border px-2 py-0.5 text-[10px]",
          isProjectTab
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-600",
        ].join(" ")}
      >
        {isProjectTab ? "Project Active" : "Project Idle"}
      </span>

      {/* AUDIO STATUS */}
      <span
        className={[
          "rounded-full border px-2 py-0.5 text-[10px]",
          hasNow
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-600",
        ].join(" ")}
      >
        {hasNow ? "Audio Live" : "Audio Idle"}
      </span>

      {/* SEARCH ENGINE MODE */}
      {!compact && isSearchTab ? (
        <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[10px] text-yellow-800">
          Search Engine: {getSearchModeLabel(trimmedQuery)}
        </span>
      ) : null}

      {/* DISCOVERY ENGINE */}
      {!compact && isSearchTab && searchActive ? (
        <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700">
          Discovery Engine
        </span>
      ) : null}

      {/* MOMENT ENGINE */}
      {!compact && isSearchTab && searchActive ? (
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700">
          Moment Engine
        </span>
      ) : null}
    </div>
  );
}