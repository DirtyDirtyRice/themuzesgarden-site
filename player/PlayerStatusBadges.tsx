"use client";

export default function PlayerStatusBadges(props: {
  isSearchTab: boolean;
  isProjectTab: boolean;
  hasNow: boolean;
  compact: boolean;
  trimmedQuery: string;
  getSearchModeLabel: (query: string) => string;
}) {
  const {
    isSearchTab,
    isProjectTab,
    hasNow,
    compact,
    trimmedQuery,
    getSearchModeLabel,
  } = props;

  const searchActive = Boolean(trimmedQuery);

  const badgeClassName =
    "rounded-full border border-white/20 bg-black px-2.5 py-0.5 text-[10px] text-[color:var(--text-normal)]";
  const activeBadgeClassName =
    "rounded-full border border-white bg-black px-2.5 py-0.5 text-[10px] text-[color:var(--text-strong)]";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={isSearchTab ? activeBadgeClassName : badgeClassName}>
        {isSearchTab ? "Search Active" : "Search Idle"}
      </span>

      <span className={isProjectTab ? activeBadgeClassName : badgeClassName}>
        {isProjectTab ? "Project Active" : "Project Idle"}
      </span>

      <span className={hasNow ? activeBadgeClassName : badgeClassName}>
        {hasNow ? "Audio Live" : "Audio Idle"}
      </span>

      {!compact && isSearchTab ? (
        <span className={badgeClassName}>
          Search Engine: {getSearchModeLabel(trimmedQuery)}
        </span>
      ) : null}

      {!compact && isSearchTab && searchActive ? (
        <span className={badgeClassName}>Discovery Engine</span>
      ) : null}

      {!compact && isSearchTab && searchActive ? (
        <span className={badgeClassName}>Moment Engine</span>
      ) : null}
    </div>
  );
}