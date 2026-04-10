"use client";

import MetadataPanel from "./MetadataPanel";
import type { AnyTrack } from "./playerTypes";

export default function PlayerNowPlayingPanel(props: {
  nowLabel: string;
  nowId: string | null;
  compact: boolean;
  tab: "project" | "search";
  trackCountLabel: string;
  hasNow: boolean;
  canUseProject: boolean;
  hasProjectTracks: boolean;
  nowIdx: number;
  upNextIdx: number;
  projectTracksLength: number;
  remainingCount: number;
  trimmedQuery: string;
  nowTrack: AnyTrack | null;
}) {
  const {
    nowLabel,
    nowId,
    compact,
    tab,
    trackCountLabel,
    hasNow,
    canUseProject,
    hasProjectTracks,
    nowIdx,
    upNextIdx,
    projectTracksLength,
    remainingCount,
    trimmedQuery,
    nowTrack,
  } = props;

  const visibility = nowTrack?.visibility ?? null;

  const visibilityLabel =
    visibility === "private"
      ? "🔒 Private"
      : visibility === "public"
      ? "🌍 Public"
      : visibility === "shared"
      ? "👥 Shared"
      : null;

  return (
    <div
      className={[
        "rounded-2xl border px-3 py-3",
        nowLabel ? "bg-white text-zinc-900" : "bg-zinc-50 text-zinc-600",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-zinc-600">NOW PLAYING</div>
        {nowLabel ? (
          <div className="rounded-full border bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700">
            LIVE
          </div>
        ) : (
          <div className="rounded-full border bg-white px-2 py-0.5 text-[11px] text-zinc-600">
            IDLE
          </div>
        )}
      </div>

      <div className="mt-1 text-sm">
        <span className={nowLabel ? "font-semibold" : ""}>{nowLabel || "(none)"}</span>
      </div>

      {hasNow && visibilityLabel ? (
        <div className="mt-1 text-[11px] text-zinc-600">{visibilityLabel}</div>
      ) : null}

      {nowId ? <MetadataPanel targetType="track" targetId={nowId} /> : null}

      {compact && (
        <div className="mt-2 text-[11px] text-zinc-600">
          <span>{tab === "project" ? "Project" : "Search"}</span>
          {" • "}
          <span>{trackCountLabel}</span>
          {" • "}
          <span>{hasNow ? "Live" : "Idle"}</span>
        </div>
      )}

      {canUseProject && hasProjectTracks && (
        <div className="mt-2 text-[11px] text-zinc-600">
          <span className="font-medium">
            Now: {nowIdx >= 0 ? String(nowIdx + 1).padStart(2, "0") : "--"}
          </span>
          {" • "}
          <span>
            Up Next:{" "}
            {upNextIdx >= 0 && upNextIdx < projectTracksLength
              ? String(upNextIdx + 1).padStart(2, "0")
              : "--"}
          </span>
          {" • "}
          <span>Remaining: {remainingCount}</span>
        </div>
      )}

      {!compact && canUseProject && hasProjectTracks && !hasNow && (
        <div className="mt-2 text-[11px] text-zinc-600">
          Tip: Press <span className="font-medium">Play All</span> to start the setlist.
        </div>
      )}

      {!compact && tab === "search" && !hasNow && (
        <div className="mt-2 text-[11px] text-zinc-600">
          {trimmedQuery ? (
            <>
              Tip: Use <span className="font-medium">Enter</span> for the selected track or{" "}
              <span className="font-medium">Shift+Enter</span> for the selected first moment.
            </>
          ) : (
            <>Tip: Search for a track, tag, or sound moment below to begin.</>
          )}
        </div>
      )}
    </div>
  );
}