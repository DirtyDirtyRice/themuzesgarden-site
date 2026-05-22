"use client";

import type { RefObject } from "react";
import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";

type TrackLike = {
  id: string;
  title?: string | null;
  artist?: string | null;
};

type MetadataContext = {
  safeMetadataTargetType: MetadataTargetType;
  metadataTargetId: string | null;
  selectedMetadataTrack: TrackLike | null;
  selectedMetadataTrackTitle: string;
  selectedMetadataTrackArtist: string;
};

type Props = {
  nowPlayingCardRef: RefObject<HTMLDivElement | null>;
  nowPlayingTrack: TrackLike | null;
  metadataContext: MetadataContext;
  onPlayTrackById: (tid: string) => void;
  onPreviewTrack: (tid: string) => void;
  onSelectTrackMetadataTarget: (tid: string) => void;
};

const panelClass = "space-y-4 rounded-2xl border border-white/25 bg-black p-4";
const insetPanelClass = "rounded-2xl border border-white/25 bg-black p-3";
const titleClass = "text-sm font-bold text-white";
const subTextClass = "text-sm text-white/70";
const tinyTextClass = "text-xs text-white/70";
const eyebrowClass = "text-xs font-bold uppercase tracking-wide text-white";
const actionButtonClass =
  "inline-flex min-h-9 min-w-[92px] items-center justify-center rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

function getTrackTitle(track: TrackLike | null | undefined) {
  return track?.title?.trim() || "Untitled";
}

function getTrackArtist(track: TrackLike | null | undefined) {
  return track?.artist?.trim() || "Supabase";
}

function isMetadataTargetTrack(
  tid: string,
  metadataTargetType: MetadataTargetType,
  metadataTargetId: string | null
) {
  return metadataTargetType === "track" && metadataTargetId === tid;
}

function getMetadataTargetLabel(metadataTargetType: MetadataTargetType) {
  if (metadataTargetType === "moment") return "Moment target";
  if (metadataTargetType === "section") return "Section target";
  return "Track target";
}

function getNowPlayingFocusLabel(options: {
  isMetadataTarget: boolean;
  metadataTargetId: string | null;
}) {
  if (options.isMetadataTarget) {
    return "This playing track is also the active metadata target.";
  }

  if (options.metadataTargetId) {
    return "A different item is currently selected for metadata.";
  }

  return "No metadata target is selected yet.";
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
      {label}
    </span>
  );
}

export default function ProjectNowPlayingPanel({
  nowPlayingCardRef,
  nowPlayingTrack,
  metadataContext,
  onPlayTrackById,
  onPreviewTrack,
  onSelectTrackMetadataTarget,
}: Props) {
  const nowPlayingId = nowPlayingTrack ? String(nowPlayingTrack.id) : null;
  const nowPlayingTitle = getTrackTitle(nowPlayingTrack);
  const nowPlayingArtist = getTrackArtist(nowPlayingTrack);
  const isMetadataTarget =
    Boolean(nowPlayingId) &&
    isMetadataTargetTrack(
      String(nowPlayingId),
      metadataContext.safeMetadataTargetType,
      metadataContext.metadataTargetId
    );

  return (
    <div ref={nowPlayingCardRef} className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className={titleClass}>Now Playing</div>
          <div className={tinyTextClass}>
            {nowPlayingTrack
              ? `${nowPlayingTitle} • ${nowPlayingArtist}`
              : "Playback is idle."}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label={nowPlayingTrack ? "PLAYING" : "IDLE"} />
          {isMetadataTarget ? <StatusPill label="METADATA TARGET" /> : null}
        </div>
      </div>

      {!nowPlayingTrack || !nowPlayingId ? (
        <div className={insetPanelClass}>
          <div className={eyebrowClass}>Playback focus</div>
          <div className="mt-2 space-y-2">
            <div className={subTextClass}>Nothing playing yet.</div>
            <div className={tinyTextClass}>
              Use Play Project, Play, or Inspect on a linked track to load this
              panel with the current playback focus.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={insetPanelClass}>
            <div className="flex flex-wrap gap-2">
              <StatusPill label="NOW PLAYING" />
              {isMetadataTarget ? <StatusPill label="METADATA TARGET" /> : null}
              <StatusPill
                label={getMetadataTargetLabel(
                  metadataContext.safeMetadataTargetType
                )}
              />
            </div>

            <div className="mt-3 space-y-1">
              <div className="break-words text-base font-bold text-white">
                {nowPlayingTitle}
              </div>
              <div className={subTextClass}>{nowPlayingArtist}</div>
              <div className={tinyTextClass}>
                Track ID: <span className="font-bold text-white">{nowPlayingId}</span>
              </div>
            </div>
          </div>

          <div className={insetPanelClass}>
            <div className={eyebrowClass}>Playback and metadata focus</div>
            <div className="mt-2 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
              <div>
                <span className="font-bold text-white">Playback:</span> active
              </div>
              <div>
                <span className="font-bold text-white">Metadata:</span>{" "}
                {isMetadataTarget ? "same track" : "different target"}
              </div>
              <div>
                <span className="font-bold text-white">Target ID:</span>{" "}
                {metadataContext.metadataTargetId ?? "none"}
              </div>
            </div>
            <div className="mt-2 text-xs text-white/70">
              {getNowPlayingFocusLabel({
                isMetadataTarget,
                metadataTargetId: metadataContext.metadataTargetId,
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={actionButtonClass}
              onClick={() => onPlayTrackById(nowPlayingId)}
            >
              Replay
            </button>

            <button
              className={actionButtonClass}
              onClick={() => onSelectTrackMetadataTarget(nowPlayingId)}
            >
              Metadata
            </button>

            <button
              className={actionButtonClass}
              onClick={() => {
                onPreviewTrack(nowPlayingId);
                onSelectTrackMetadataTarget(nowPlayingId);
              }}
            >
              Inspect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}