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
  orderedLinkedTracks: TrackLike[];
  previewTrackId: string | null;
  nowPlayingId: string | null;
  metadataContext: MetadataContext;
  onPlayTrackById: (tid: string) => void;
  onPreviewTrack: (tid: string) => void;
  onSelectTrackMetadataTarget: (tid: string) => void;
  onMoveSetlistItem: (tid: string, dir: "up" | "down") => void;
};

const panelClass = "space-y-4 rounded-2xl border border-white/25 bg-black p-4";
const insetPanelClass = "rounded-2xl border border-white/25 bg-black p-3";
const titleClass = "text-sm font-bold text-white";
const subTextClass = "text-sm text-white/70";
const tinyTextClass = "text-xs text-white/70";
const eyebrowClass = "text-xs font-bold uppercase tracking-wide text-white";

const actionButtonClass =
  "inline-flex min-h-9 min-w-[92px] items-center justify-center rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const smallActionButtonClass =
  "inline-flex min-h-8 min-w-[64px] items-center justify-center rounded-xl border border-white/25 bg-black px-2 py-1 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

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

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
      {label}
    </span>
  );
}

function TrackActionRow({
  tid,
  isNowPlaying,
  onPlayTrackById,
  onPreviewTrack,
  onSelectTrackMetadataTarget,
}: {
  tid: string;
  isNowPlaying: boolean;
  onPlayTrackById: (tid: string) => void;
  onPreviewTrack: (tid: string) => void;
  onSelectTrackMetadataTarget: (tid: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={actionButtonClass}
        onClick={() => {
          onPreviewTrack(tid);
          onSelectTrackMetadataTarget(tid);
        }}
      >
        Select Song
      </button>

      <button
        type="button"
        className={actionButtonClass}
        onClick={() => onPlayTrackById(tid)}
      >
        {isNowPlaying ? "Play Again" : "Play"}
      </button>

      <button
        type="button"
        className={actionButtonClass}
        onClick={() => onSelectTrackMetadataTarget(tid)}
      >
        Metadata
      </button>

      <button
        type="button"
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

export default function ProjectSetlistWorkspace({
  orderedLinkedTracks,
  previewTrackId,
  nowPlayingId,
  metadataContext,
  onPlayTrackById,
  onPreviewTrack,
  onSelectTrackMetadataTarget,
  onMoveSetlistItem,
}: Props) {
  const firstTrack = orderedLinkedTracks[0];
  const lastTrack = orderedLinkedTracks[orderedLinkedTracks.length - 1];

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={titleClass}>Setlist Order</div>
          <div className={tinyTextClass}>
            Organize playback order for this project.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${orderedLinkedTracks.length} TRACKS`} />
          <StatusPill label={nowPlayingId ? "PLAYING" : "IDLE"} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className={insetPanelClass}>
          <div className={eyebrowClass}>Setlist status</div>
          <div className="mt-2 text-sm font-bold text-white">
            {orderedLinkedTracks.length > 0 ? "Ready" : "Empty"}
          </div>
          <div className="mt-1 text-xs text-white/70">
            {orderedLinkedTracks.length > 0
              ? "Tracks are available for ordered playback."
              : "Send tracks from Library to begin building a setlist."}
          </div>
        </div>

        <div className={insetPanelClass}>
          <div className={eyebrowClass}>First track</div>
          <div className="mt-2 text-sm font-bold text-white">
            {firstTrack ? getTrackTitle(firstTrack) : "None"}
          </div>
          <div className="mt-1 text-xs text-white/70">
            {firstTrack ? getTrackArtist(firstTrack) : "No tracks available"}
          </div>
        </div>

        <div className={insetPanelClass}>
          <div className={eyebrowClass}>Last track</div>
          <div className="mt-2 text-sm font-bold text-white">
            {lastTrack ? getTrackTitle(lastTrack) : "None"}
          </div>
          <div className="mt-1 text-xs text-white/70">
            {lastTrack ? getTrackArtist(lastTrack) : "No tracks available"}
          </div>
        </div>
      </div>

      <div className={insetPanelClass}>
        <div className={eyebrowClass}>Quick route</div>

        <div className="mt-2 text-sm text-white/70">
          Add songs to this setlist:
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill label="Library" />
          <span className="text-white/70">↓</span>
          <StatusPill label="Select Tracks" />
          <span className="text-white/70">↓</span>
          <StatusPill label="Choose Project" />
          <span className="text-white/70">↓</span>
          <StatusPill label="Send To" />
        </div>
      </div>

      {orderedLinkedTracks.length === 0 ? (
        <div className={insetPanelClass}>
          <div className={subTextClass}>No ordered tracks yet.</div>

          <div className="mt-2 text-xs text-white/70">
            Upload songs, send them from Library into this project, then return
            here to arrange playback order.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {orderedLinkedTracks.map((track, idx) => {
            const tid = String(track.id);

            const isPreview = previewTrackId === tid;
            const isNow = nowPlayingId === tid;

            const isMetadataTarget = isMetadataTargetTrack(
              tid,
              metadataContext.safeMetadataTargetType,
              metadataContext.metadataTargetId
            );

            return (
              <div key={tid} className={`${insetPanelClass} space-y-3`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={`POSITION ${idx + 1}`} />

                      {isNow ? <StatusPill label="NOW PLAYING" /> : null}

                      {isPreview ? <StatusPill label="SELECTED SONG" /> : null}

                      {isMetadataTarget ? (
                        <StatusPill label="METADATA TARGET" />
                      ) : null}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white">
                        {idx + 1}. {getTrackTitle(track)}
                      </div>

                      <div className="text-xs text-white/70">
                        {getTrackArtist(track)}
                      </div>

                      <div className="mt-1 text-xs text-white/70">
                        Track ID: {tid}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <TrackActionRow
                      tid={tid}
                      isNowPlaying={isNow}
                      onPlayTrackById={onPlayTrackById}
                      onPreviewTrack={onPreviewTrack}
                      onSelectTrackMetadataTarget={
                        onSelectTrackMetadataTarget
                      }
                    />

                    <button
                      type="button"
                      className={smallActionButtonClass}
                      onClick={() => onMoveSetlistItem(tid, "up")}
                      disabled={idx === 0}
                    >
                      Up
                    </button>

                    <button
                      type="button"
                      className={smallActionButtonClass}
                      onClick={() => onMoveSetlistItem(tid, "down")}
                      disabled={idx === orderedLinkedTracks.length - 1}
                    >
                      Down
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}