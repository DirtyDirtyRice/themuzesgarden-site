"use client";

import MetadataPanel from "../../../../player/MetadataPanel";
import type { MetadataTargetType, Project } from "./projectDetailsTypes";

type TrackLike = {
  id: string;
  title?: string | null;
  artist?: string | null;
};

type Props = {
  project: Project | null;
  overviewLoading: boolean;
  overviewErr: string | null;
  linkedTracks: TrackLike[];
  orderedLinkedTracks: TrackLike[];
  topLinkedTracks: TrackLike[];
  nowPlayingId: string | null;
  nowPlayingTrack: TrackLike | null;
  previewTrackId: string | null;
  metadataTargetType: MetadataTargetType;
  metadataTargetId: string | null;
  playerErr: string | null;
  onRefreshOverview: () => void;
  onPlayProject: () => void;
  onPlayTrackById: (tid: string) => void;
  onPreviewTrack: (tid: string) => void;
  onSelectTrackMetadataTarget: (tid: string) => void;
  onMoveSetlistItem: (tid: string, dir: "up" | "down") => void;
  onStopPlayer: () => void;
  nowPlayingCardRef: React.RefObject<HTMLDivElement | null>;
};

export default function ProjectOverviewWorkspace(props: Props) {
  const {
    project,
    overviewLoading,
    overviewErr,
    linkedTracks,
    orderedLinkedTracks,
    topLinkedTracks,
    nowPlayingId,
    nowPlayingTrack,
    previewTrackId,
    metadataTargetType,
    metadataTargetId,
    playerErr,
    onRefreshOverview,
    onPlayProject,
    onPlayTrackById,
    onPreviewTrack,
    onSelectTrackMetadataTarget,
    onMoveSetlistItem,
    onStopPlayer,
    nowPlayingCardRef,
  } = props;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium">Overview</div>
            <div className="text-xs text-zinc-500">
              {project?.title ?? "Untitled Project"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded border px-3 py-2 text-xs disabled:opacity-60"
              onClick={onRefreshOverview}
              disabled={overviewLoading}
            >
              {overviewLoading ? "Refreshing…" : "Refresh"}
            </button>

            <button
              className="rounded border px-3 py-2 text-xs"
              onClick={onPlayProject}
              disabled={linkedTracks.length === 0}
            >
              Play Project
            </button>

            <button
              className="rounded border px-3 py-2 text-xs"
              onClick={onStopPlayer}
              disabled={!nowPlayingId}
            >
              Stop
            </button>
          </div>
        </div>

        {overviewErr ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {overviewErr}
          </div>
        ) : null}

        {playerErr ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {playerErr}
          </div>
        ) : null}

        <div className="text-sm text-zinc-600">
          Linked tracks: {linkedTracks.length} • Ordered tracks: {orderedLinkedTracks.length}
        </div>
      </div>

      <div ref={nowPlayingCardRef} className="rounded-lg border p-4 space-y-2">
        <div className="text-sm font-medium">Now Playing</div>

        {!nowPlayingTrack ? (
          <div className="text-sm text-zinc-600">Nothing playing yet.</div>
        ) : (
          <div className="space-y-2">
            <div className="text-base font-medium">{nowPlayingTrack.title ?? "Untitled"}</div>
            <div className="text-sm text-zinc-500">{nowPlayingTrack.artist ?? "Supabase"}</div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded border px-3 py-2 text-xs"
                onClick={() => onPlayTrackById(String(nowPlayingTrack.id))}
              >
                Replay
              </button>

              <button
                className="rounded border px-3 py-2 text-xs"
                onClick={() => {
                  const tid = String(nowPlayingTrack.id);
                  onPreviewTrack(tid);
                  onSelectTrackMetadataTarget(tid);
                }}
              >
                Inspect
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <div className="text-sm font-medium">Top Linked Tracks</div>

        {topLinkedTracks.length === 0 ? (
          <div className="text-sm text-zinc-600">No linked tracks yet.</div>
        ) : (
          <div className="space-y-2">
            {topLinkedTracks.map((track) => {
              const tid = String(track.id);
              const isPreview = previewTrackId === tid;
              const isNow = nowPlayingId === tid;

              return (
                <div
                  key={tid}
                  className={`rounded border p-3 flex items-center justify-between gap-3 ${
                    isPreview ? "bg-zinc-50 border-black" : "bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {isNow ? "▶ " : ""}
                      {track.title ?? "Untitled"}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {track.artist ?? "Supabase"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="rounded border px-3 py-2 text-xs"
                      onClick={() => onPlayTrackById(tid)}
                    >
                      Play
                    </button>

                    <button
                      className="rounded border px-3 py-2 text-xs"
                      onClick={() => {
                        onPreviewTrack(tid);
                        onSelectTrackMetadataTarget(tid);
                      }}
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <div className="text-sm font-medium">Setlist Order</div>

        {orderedLinkedTracks.length === 0 ? (
          <div className="text-sm text-zinc-600">No ordered tracks yet.</div>
        ) : (
          <div className="space-y-2">
            {orderedLinkedTracks.map((track, idx) => {
              const tid = String(track.id);

              return (
                <div
                  key={tid}
                  className="rounded border p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {idx + 1}. {track.title ?? "Untitled"}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {track.artist ?? "Supabase"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => onMoveSetlistItem(tid, "up")}
                      disabled={idx === 0}
                    >
                      Up
                    </button>

                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => onMoveSetlistItem(tid, "down")}
                      disabled={idx === orderedLinkedTracks.length - 1}
                    >
                      Down
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {metadataTargetId ? (
        <div className="rounded-lg border p-4 space-y-2">
          <div className="text-sm font-medium">Metadata</div>
          <MetadataPanel targetType={metadataTargetType} targetId={metadataTargetId} />
        </div>
      ) : null}
    </div>
  );
}