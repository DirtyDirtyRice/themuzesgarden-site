import {
  getMomentHitSummary,
  getMomentReasonLabel,
  formatMomentTime,
} from "./playerUtils";

import {
  getHeatLabel,
  getMomentPreviewTitle,
  getResultStrengthLabel,
  isStrongMatchLabel,
  normalizeSearchValue,
  type SearchMatchedMoment,
  type SearchSuggestionRow,
} from "./searchTabHelpers";

import MomentDensityBar from "./MomentDensityBar";

export default function SearchResultCard(props: {
  row: SearchSuggestionRow;
  idx: number;
  selected: boolean;
  normalizedQuery: string;
  trimmedQuery: string;
  onHover: () => void;
  onPlayTrack: () => void;
  onPlayMoment: (moment: SearchMatchedMoment) => void;
  onTagClick: (tag: string) => void;
}) {
  const {
    row,
    idx,
    selected,
    normalizedQuery,
    trimmedQuery,
    onHover,
    onPlayTrack,
    onPlayMoment,
    onTagClick,
  } = props;

  const t = row.t;
  const tid = String(t.id);
  const tags = row.tags;
  const matchSummary = row.matchSummary;
  const matchedMoments = row.matchedMoments;
  const matchedMomentCount = row.matchedMomentCount;
  const primaryMoment = row.primaryMoment;

  const rankLabel = `#${idx + 1}`;
  const isTopResult = idx === 0;

  const strongMatch = isStrongMatchLabel(matchSummary);
  const heatLabel = getHeatLabel(row.score, matchedMomentCount);

  const strengthLabel = getResultStrengthLabel(
    row.score,
    matchedMomentCount,
    strongMatch
  );

  const displayTitle = t.title ?? "Untitled";
  const displayArtist = t.artist ?? "Supabase";

  const hasTypedQuery = Boolean(trimmedQuery);
  const visibleMoments = matchedMoments.slice(0, 3);
  const matchReasons = Array.isArray(row.matchReasons) ? row.matchReasons : [];

  return (
    <div
      className={[
        "flex cursor-pointer items-start justify-between gap-2 rounded border p-2 transition-colors",
        selected
          ? "border-blue-400 bg-blue-50/70 ring-2 ring-blue-200 shadow-sm"
          : "border-zinc-200 bg-white hover:bg-zinc-50",
      ].join(" ")}
      onMouseEnter={onHover}
      onClick={onPlayTrack}
      title={`Play track: ${displayTitle}`}
    >
      <div className="min-w-0 flex-1">
        {selected ? (
          <div className="mb-1.5 flex flex-wrap items-center gap-1">
            <span className="rounded border border-blue-300 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-700">
              Active Result
            </span>

            <span className="rounded border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] text-blue-800">
              Keyboard locked
            </span>

            <span className="rounded border border-white bg-white px-2 py-0.5 text-[10px] text-zinc-700">
              Result {idx + 1}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-1">
          <span
            className={[
              "rounded border px-1.5 py-0.5 text-[10px]",
              selected
                ? "border-blue-300 bg-white text-blue-700"
                : "border-zinc-200 bg-zinc-50 text-zinc-600",
            ].join(" ")}
          >
            {rankLabel}
          </span>

          {isTopResult && (
            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">
              Best Match
            </span>
          )}

          {strengthLabel && (
            <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-700">
              {strengthLabel}
            </span>
          )}

          {heatLabel && (
            <span className="rounded border border-yellow-200 bg-yellow-50 px-1.5 py-0.5 text-[10px] text-yellow-800">
              {heatLabel}
            </span>
          )}

          {row.hasDiscoverySupport && (
            <span className="rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-700">
              Discovery Engine
            </span>
          )}

          {row.hasMomentEngineSupport && (
            <span className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-700">
              Moment Engine
            </span>
          )}

          {matchedMomentCount > 0 && (
            <span className="rounded border border-yellow-200 bg-yellow-50 px-1.5 py-0.5 text-[10px] text-yellow-800">
              {getMomentHitSummary(matchedMomentCount)}
            </span>
          )}
        </div>

        <div
          className={[
            "mt-1 truncate text-sm font-medium",
            selected ? "text-blue-900" : "text-zinc-900",
          ].join(" ")}
        >
          {selected ? "↵ " : ""}
          {displayTitle}
        </div>

        <div className="truncate text-xs text-zinc-500">{displayArtist}</div>

        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span
            className={[
              "inline-flex rounded border px-2 py-0.5 text-[11px]",
              selected
                ? "border-blue-200 bg-white text-blue-800"
                : "bg-zinc-50 text-zinc-600",
            ].join(" ")}
          >
            {matchSummary}
          </span>

          <span className="inline-flex rounded border bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500">
            Score {row.score}
          </span>
        </div>

        {hasTypedQuery && (
          <div className="mt-1 text-[11px] text-zinc-500">
            Query: <span className="font-medium text-zinc-700">{trimmedQuery}</span>
          </div>
        )}

        {matchReasons.length > 0 && (
          <div className="mt-1.5 rounded border border-zinc-200 bg-zinc-50 px-2 py-1">
            <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Why this matched
            </div>

            <div className="mt-1 space-y-0.5">
              {matchReasons.slice(0, 3).map((reason, i) => (
                <div
                  key={`${tid}:reason:${i}`}
                  className="text-[11px] text-zinc-700"
                >
                  {reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {matchedMoments.length > 0 && (
          <MomentDensityBar
            moments={matchedMoments}
            onPlayMoment={onPlayMoment}
            selected={selected}
          />
        )}

        {primaryMoment && (
          <div className="mt-1.5">
            <div className="mb-1 flex flex-wrap items-center gap-1 text-[11px] font-medium text-yellow-800">
              <span>{getMomentPreviewTitle(matchedMomentCount)}</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {visibleMoments.map((moment, momentIdx) => {
                const isPrimaryMoment = momentIdx === 0;

                return (
                  <button
                    key={`${tid}:${moment.sectionId}:${moment.startTime}`}
                    type="button"
                    className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2 py-0.5 text-[11px] text-yellow-800 hover:bg-yellow-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayMoment(moment);
                    }}
                  >
                    <span>
                      {moment.label} — {formatMomentTime(moment.startTime)}
                    </span>

                    <span className="rounded bg-yellow-50 px-1 text-[10px] text-yellow-700">
                      {getMomentReasonLabel(moment.reason)}
                    </span>

                    {isPrimaryMoment && (
                      <span className="rounded bg-white px-1 text-[10px] text-yellow-700">
                        top
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.slice(0, 5).map((tag) => {
              const normalizedTag = normalizeSearchValue(tag);

              const tagMatches =
                normalizedQuery &&
                (normalizedTag === normalizedQuery ||
                  normalizedTag.startsWith(normalizedQuery) ||
                  normalizedTag.includes(normalizedQuery));

              return (
                <button
                  key={`${tid}:${tag}`}
                  type="button"
                  className={[
                    "rounded border px-2 py-0.5 text-[10px] hover:bg-zinc-100",
                    tagMatches
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "bg-zinc-50 text-zinc-600",
                  ].join(" ")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick(tag);
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col gap-1">
        {primaryMoment && (
          <button
            className="rounded border border-yellow-200 bg-white px-3 py-1.5 text-xs text-yellow-800 hover:bg-yellow-50"
            onClick={(e) => {
              e.stopPropagation();
              onPlayMoment(primaryMoment);
            }}
          >
            Play Moment
          </button>
        )}

        <button
          className={[
            "rounded px-3 py-1.5 text-xs text-white",
            selected ? "bg-blue-700 shadow-sm" : "bg-black",
          ].join(" ")}
          onClick={(e) => {
            e.stopPropagation();
            onPlayTrack();
          }}
        >
          {selected ? "Play Track" : "Play"}
        </button>
      </div>
    </div>
  );
}