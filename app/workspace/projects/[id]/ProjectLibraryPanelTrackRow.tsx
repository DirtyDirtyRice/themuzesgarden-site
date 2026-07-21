"use client";

import type {
  AnyTrack,
  LocalVisibility,
} from "./projectLibraryPanelTypes";
import {
  getSourceLabel,
  getTrackTags,
  hasPlayableSource,
} from "./projectLibraryPanelUtils";

type Props = {
  track: AnyTrack;
  isLinked: boolean;
  isSelected: boolean;
  linkBusyId: string | null;
  visibilityOverrides: Record<string, LocalVisibility>;
  setQ: (value: string) => void;
  onMouseEnter: () => void;
  onPrimaryAction: (trackId: string) => void;
  onPlayTrackById: (trackId: string) => void;
  onToggleTrackVisibility: (track: AnyTrack) => void;
  onLinkTrack: (trackId: string) => void;
  onUnlinkTrack: (trackId: string) => void;
};

const actionButtonClass =
  "rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60";

const tagButtonClass =
  "rounded-xl border border-white/25 bg-black px-2 py-0.5 text-[10px] font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

export default function ProjectLibraryPanelTrackRow({
  track,
  isLinked,
  isSelected,
  linkBusyId,
  setQ,
  onMouseEnter,
  onPrimaryAction,
  onPlayTrackById,
  onLinkTrack,
  onUnlinkTrack,
}: Props) {
  const tid = String(track.id);
  const tags = getTrackTags(track);
  const playable = hasPlayableSource(track);

  return (
    <div
      className={[
        "flex items-center justify-between gap-3 rounded-2xl border border-white/25 bg-black p-3",
        isSelected ? "ring-1 ring-white/40" : "",
      ].join(" ")}
      onMouseEnter={onMouseEnter}
    >
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => onPrimaryAction(tid)}
        title={isLinked ? "Click row to unlink" : "Click row to link"}
      >
        <div className="truncate text-sm font-bold text-white">
          {isSelected ? "↵ " : ""}
          {track.title ?? "Untitled"}
        </div>

        {track.artist ? (
          <div className="truncate text-xs text-white/70">{track.artist}</div>
        ) : null}

        <div className="mt-1 text-[10px] text-white/70">
          Source: {getSourceLabel(track)}
        </div>

        {tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.slice(0, 6).map((tag) => (
              <button
                key={`${tid}:${tag}`}
                type="button"
                className={tagButtonClass}
                onClick={(e) => {
                  e.stopPropagation();
                  setQ(tag);
                }}
                title={`Search tag: ${tag}`}
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="flex shrink-0 flex-wrap items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={actionButtonClass}
          onClick={() => onPlayTrackById(tid)}
          disabled={!playable}
          title={
            playable ? "Play in Global Player" : "This track has no playable source"
          }
        >
          Play
        </button>


        {isLinked ? (
          <button
            type="button"
            className={actionButtonClass}
            onClick={() => onUnlinkTrack(tid)}
            disabled={linkBusyId === tid}
            title="Remove from this project"
          >
            {linkBusyId === tid ? "..." : "Unlink"}
          </button>
        ) : (
          <button
            type="button"
            className={actionButtonClass}
            onClick={() => onLinkTrack(tid)}
            disabled={linkBusyId === tid}
            title="Link into this project"
          >
            {linkBusyId === tid ? "..." : "Link"}
          </button>
        )}
      </div>
    </div>
  );
}