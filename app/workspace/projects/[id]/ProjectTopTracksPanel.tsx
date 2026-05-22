"use client";

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
  topLinkedTracks: TrackLike[];
  previewTrackId: string | null;
  nowPlayingId: string | null;
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

function getFeaturedTrackLabel(index: number) {
  if (index === 0) return "PRIMARY";
  if (index === 1) return "SECONDARY";
  if (index === 2) return "THIRD";
  return `TOP ${index + 1}`;
}

function getTopTracksSummary(topLinkedTracks: TrackLike[]) {
  if (topLinkedTracks.length === 0) {
    return "No top tracks have been linked to this project yet.";
  }

  if (topLinkedTracks.length === 1) {
    return "1 top linked track is ready for playback, inspection, and metadata focus.";
  }

  return `${topLinkedTracks.length} top linked tracks are ready for playback, inspection, and metadata focus.`;
}

function getCurrentFocusSummary(options: {
  previewTrackId: string | null;
  nowPlayingId: string | null;
  metadataTargetId: string | null;
}) {
  const activeCount = [
    options.previewTrackId,
    options.nowPlayingId,
    options.metadataTargetId,
  ].filter(Boolean).length;

  if (activeCount === 0) return "No preview, playback, or metadata focus is active.";
  if (activeCount === 1) return "One track focus signal is active.";
  return `${activeCount} track focus signals are active.`;
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
      {label}
    </span>
  );
}

function TrackActionRow({
  tid,
  onPlayTrackById,
  onPreviewTrack,
  onSelectTrackMetadataTarget,
}: {
  tid: string;
  onPlayTrackById: (tid: string) => void;
  onPreviewTrack: (tid: string) => void;
  onSelectTrackMetadataTarget: (tid: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className={actionButtonClass} onClick={() => onPlayTrackById(tid)}>
        Play
      </button>

      <button
        className={actionButtonClass}
        onClick={() => onSelectTrackMetadataTarget(tid)}
      >
        Metadata
      </button>

      <button
        className={actionButtonClass}
        onClick={() => {
          onPreviewTrack(tid);
          onSelectTrackMetadataTarget(tid);
        }}
      >
        Inspect
      </button>
    </div>
  );
}

export default function ProjectTopTracksPanel({
  topLinkedTracks,
  previewTrackId,
  nowPlayingId,
  metadataContext,
  onPlayTrackById,
  onPreviewTrack,
  onSelectTrackMetadataTarget,
}: Props) {
  const hasTopTracks = topLinkedTracks.length > 0;
  const focusedTrackCount = topLinkedTracks.filter((track) => {
    const tid = String(track.id);

    return (
      previewTrackId === tid ||
      nowPlayingId === tid ||
      isMetadataTargetTrack(
        tid,
        metadataContext.safeMetadataTargetType,
        metadataContext.metadataTargetId
      )
    );
  }).length;

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className={titleClass}>Top Linked Tracks</div>
          <div className={tinyTextClass}>{getTopTracksSummary(topLinkedTracks)}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${topLinkedTracks.length} TRACKS`} />
          <StatusPill label={`${focusedTrackCount} FOCUSED`} />
        </div>
      </div>

      <div className={insetPanelClass}>
        <div className={eyebrowClass}>Top track workspace</div>
        <div className="mt-2 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
          <div>
            <span className="font-bold text-white">Playback:</span>{" "}
            {nowPlayingId ? "active" : "idle"}
          </div>
          <div>
            <span className="font-bold text-white">Preview:</span>{" "}
            {previewTrackId ? "active" : "idle"}
          </div>
          <div>
            <span className="font-bold text-white">Metadata:</span>{" "}
            {metadataContext.metadataTargetId ? "selected" : "not selected"}
          </div>
        </div>
        <div className="mt-2 text-xs text-white/70">
          {getCurrentFocusSummary({
            previewTrackId,
            nowPlayingId,
            metadataTargetId: metadataContext.metadataTargetId,
          })}
        </div>
      </div>

      {!hasTopTracks ? (
        <div className={insetPanelClass}>
          <div className={subTextClass}>
            No linked tracks yet. Add tracks to the project, then this panel will
            show the strongest project-linked candidates for quick playback,
            metadata work, and inspection.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {topLinkedTracks.map((track, index) => {
            const tid = String(track.id);
            const isPreview = previewTrackId === tid;
            const isNow = nowPlayingId === tid;
            const isMetadataTarget = isMetadataTargetTrack(
              tid,
              metadataContext.safeMetadataTargetType,
              metadataContext.metadataTargetId
            );
            const trackTitle = getTrackTitle(track);
            const trackArtist = getTrackArtist(track);

            return (
              <div key={tid} className={`${insetPanelClass} space-y-3`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={getFeaturedTrackLabel(index)} />
                      {isNow && <StatusPill label="NOW PLAYING" />}
                      {isPreview && <StatusPill label="PREVIEW" />}
                      {isMetadataTarget && <StatusPill label="METADATA TARGET" />}
                    </div>

                    <div>
                      <div className="break-words text-sm font-bold text-white">
                        {trackTitle}
                      </div>
                      <div className="break-words text-xs text-white/70">
                        {trackArtist}
                      </div>
                    </div>

                    <div className="text-xs text-white/70">
                      Track ID: <span className="font-bold text-white">{tid}</span>
                    </div>
                  </div>

                  <TrackActionRow
                    tid={tid}
                    onPlayTrackById={onPlayTrackById}
                    onPreviewTrack={onPreviewTrack}
                    onSelectTrackMetadataTarget={onSelectTrackMetadataTarget}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}