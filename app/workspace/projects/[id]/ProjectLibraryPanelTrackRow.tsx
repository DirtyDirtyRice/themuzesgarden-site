"use client";

import type {
  AnyTrack,
  LocalVisibility,
} from "./projectLibraryPanelTypes";
import {
  getEffectiveVisibility,
  getEffectiveVisibilityLabel,
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

export default function ProjectLibraryPanelTrackRow({
  track,
  isLinked,
  isSelected,
  linkBusyId,
  visibilityOverrides,
  setQ,
  onMouseEnter,
  onPrimaryAction,
  onPlayTrackById,
  onToggleTrackVisibility,
  onLinkTrack,
  onUnlinkTrack,
}: Props) {
  const tid = String(track.id);
  const tags = getTrackTags(track);
  const playable = hasPlayableSource(track);
  const visibilityLabel = getEffectiveVisibilityLabel(track, visibilityOverrides);
  const isPrivate =
    getEffectiveVisibility(track, visibilityOverrides) === "private";

  return (
    <div
      className={[
        "rounded border border-white bg-black p-3 flex items-center justify-between gap-3",
        isSelected ? "shadow-[inset_0_0_0_1px_white]" : "",
      ].join(" ")}
      onMouseEnter={onMouseEnter}
    >
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => onPrimaryAction(tid)}
        title={isLinked ? "Click row to unlink" : "Click row to link"}
      >
        <div className="truncate text-sm font-medium text-white">
          {isSelected ? "↵ " : ""}
          {track.title ?? "Untitled"}
        </div>

        {track.artist ? (
          <div className="truncate text-xs text-white">{track.artist}</div>
        ) : null}

        <div className="mt-1 text-[10px] text-white">
          Source: {getSourceLabel(track)} • Visibility: {visibilityLabel}
        </div>

        {tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.slice(0, 6).map((tag) => (
              <button
                key={`${tid}:${tag}`}
                type="button"
                className="rounded border border-white bg-black px-2 py-0.5 text-[10px] text-white"
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
        className="flex shrink-0 items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="rounded border border-white bg-black px-3 py-2 text-xs text-white disabled:opacity-50"
          onClick={() => onPlayTrackById(tid)}
          disabled={!playable}
          title={
            playable ? "Play in Global Player" : "This track has no playable source"
          }
        >
          Play
        </button>

        <button
          type="button"
          className="rounded border border-white bg-black px-3 py-2 text-xs text-white disabled:opacity-60"
          onClick={() => onToggleTrackVisibility(track)}
          disabled={linkBusyId === tid}
          title={
            isPrivate
              ? "Change this track back to public"
              : "Mark this track private in the local control layer"
          }
        >
          {isPrivate ? "Make Public" : "Make Private"}
        </button>

        {isLinked ? (
          <button
            type="button"
            className="rounded border border-white bg-black px-3 py-2 text-xs text-white disabled:opacity-60"
            onClick={() => onUnlinkTrack(tid)}
            disabled={linkBusyId === tid}
            title="Remove from this project"
          >
            {linkBusyId === tid ? "..." : "Unlink"}
          </button>
        ) : (
          <button
            type="button"
            className="rounded border border-white bg-black px-3 py-2 text-xs text-white disabled:opacity-60"
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