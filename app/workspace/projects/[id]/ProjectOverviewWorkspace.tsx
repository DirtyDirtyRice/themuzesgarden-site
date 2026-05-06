"use client";

import MetadataPanel from "../../../../player/MetadataPanel";
import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";
import type { Project } from "./projectDetailsTypes";

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

function normalizeMetadataTargetType(t: any): MetadataTargetType {
  if (t === "track" || t === "section" || t === "moment") return t;
  return "track";
}

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

function getMetadataContextLabel(metadataTargetType: MetadataTargetType) {
  if (metadataTargetType === "moment") return "Moment metadata target";
  if (metadataTargetType === "section") return "Section metadata target";
  return "Track metadata target";
}

function getTrackById(
  tid: string | null,
  tracks: TrackLike[]
): TrackLike | null {
  if (!tid) return null;
  return tracks.find((track) => String(track.id) === tid) ?? null;
}

function StatusPill({ label }: { label: string }) {
  return (
    <span
      className="rounded border border-white bg-black px-2 py-1 text-[11px] font-medium"
      style={{ color: "var(--text-strong)" }}
    >
      {label}
    </span>
  );
}

type TrackActionRowProps = {
  tid: string;
  onPlayTrackById: (tid: string) => void;
  onPreviewTrack: (tid: string) => void;
  onSelectTrackMetadataTarget: (tid: string) => void;
};

function TrackActionRow({
  tid,
  onPlayTrackById,
  onPreviewTrack,
  onSelectTrackMetadataTarget,
}: TrackActionRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="rounded border border-white bg-black px-3 py-2 text-xs"
        style={{ color: "var(--text-normal)" }}
        onClick={() => onPlayTrackById(tid)}
      >
        Play
      </button>

      <button
        className="rounded border border-white bg-black px-3 py-2 text-xs"
        style={{ color: "var(--text-normal)" }}
        onClick={() => onSelectTrackMetadataTarget(tid)}
      >
        Metadata
      </button>

      <button
        className="rounded border border-white bg-black px-3 py-2 text-xs"
        style={{ color: "var(--text-normal)" }}
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

  const safeMetadataTargetType = normalizeMetadataTargetType(metadataTargetType);

  const allKnownTracks = [
    ...linkedTracks,
    ...orderedLinkedTracks,
    ...topLinkedTracks,
    ...(nowPlayingTrack ? [nowPlayingTrack] : []),
  ];

  const selectedMetadataTrack = getTrackById(metadataTargetId, allKnownTracks);
  const selectedMetadataTrackTitle = getTrackTitle(selectedMetadataTrack);
  const selectedMetadataTrackArtist = getTrackArtist(selectedMetadataTrack);

  return (
    <div className="space-y-4">
      {/* OVERVIEW PANEL */}
      <div className="space-y-3 rounded-lg border border-white bg-black p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div
              className="text-sm font-medium"
              style={{ color: "var(--text-strong)" }}
            >
              Overview
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--text-normal)" }}
            >
              {project?.title ?? "Untitled Project"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded border border-white bg-black px-3 py-2 text-xs"
              style={{ color: "var(--text-normal)" }}
              onClick={onRefreshOverview}
              disabled={overviewLoading}
            >
              {overviewLoading ? "Refreshing…" : "Refresh"}
            </button>

            <button
              className="rounded border border-white bg-black px-3 py-2 text-xs"
              style={{ color: "var(--text-normal)" }}
              onClick={onPlayProject}
              disabled={linkedTracks.length === 0}
            >
              Play Project
            </button>

            <button
              className="rounded border border-white bg-black px-3 py-2 text-xs"
              style={{ color: "var(--text-normal)" }}
              onClick={onStopPlayer}
              disabled={!nowPlayingId}
            >
              Stop
            </button>
          </div>
        </div>

        {overviewErr && (
          <div
            className="rounded border border-white bg-black p-3 text-sm"
            style={{ color: "var(--text-normal)" }}
          >
            {overviewErr}
          </div>
        )}

        {playerErr && (
          <div
            className="rounded border border-white bg-black p-3 text-sm"
            style={{ color: "var(--text-normal)" }}
          >
            {playerErr}
          </div>
        )}

        <div
          className="rounded border border-white bg-black p-3 text-sm"
          style={{ color: "var(--text-normal)" }}
        >
          Linked tracks: {linkedTracks.length} • Ordered tracks:{" "}
          {orderedLinkedTracks.length}
        </div>

        <div className="rounded border border-white bg-black p-3">
          <div
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--text-strong)" }}
          >
            Metadata workspace context
          </div>

          {!metadataTargetId ? (
            <div
              className="mt-2 text-sm"
              style={{ color: "var(--text-normal)" }}
            >
              No metadata target selected yet. Use any <strong>Metadata</strong>{" "}
              or <strong>Inspect</strong> button below to focus the metadata
              panel on a specific track.
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <div
                className="text-sm"
                style={{ color: "var(--text-normal)" }}
              >
                {getMetadataContextLabel(safeMetadataTargetType)}
              </div>

              {safeMetadataTargetType === "track" ? (
                <div className="space-y-1">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--text-strong)" }}
                  >
                    {selectedMetadataTrackTitle}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-normal)" }}
                  >
                    {selectedMetadataTrackArtist}
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm"
                  style={{ color: "var(--text-normal)" }}
                >
                  Target ID: {metadataTargetId}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NOW PLAYING */}
      <div
        ref={nowPlayingCardRef}
        className="space-y-3 rounded-lg border border-white bg-black p-4"
      >
        <div
          className="text-sm font-medium"
          style={{ color: "var(--text-strong)" }}
        >
          Now Playing
        </div>

        {!nowPlayingTrack ? (
          <div
            className="text-sm"
            style={{ color: "var(--text-normal)" }}
          >
            Nothing playing yet.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <StatusPill label="NOW PLAYING" />
              {isMetadataTargetTrack(
                String(nowPlayingTrack.id),
                safeMetadataTargetType,
                metadataTargetId
              ) && <StatusPill label="METADATA TARGET" />}
            </div>

            <div className="space-y-1">
              <div
                className="text-base font-medium"
                style={{ color: "var(--text-strong)" }}
              >
                {getTrackTitle(nowPlayingTrack)}
              </div>
              <div
                className="text-sm"
                style={{ color: "var(--text-normal)" }}
              >
                {getTrackArtist(nowPlayingTrack)}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded border border-white bg-black px-3 py-2 text-xs"
                style={{ color: "var(--text-normal)" }}
                onClick={() => onPlayTrackById(String(nowPlayingTrack.id))}
              >
                Replay
              </button>

              <button
                className="rounded border border-white bg-black px-3 py-2 text-xs"
                style={{ color: "var(--text-normal)" }}
                onClick={() =>
                  onSelectTrackMetadataTarget(String(nowPlayingTrack.id))
                }
              >
                Metadata
              </button>

              <button
                className="rounded border border-white bg-black px-3 py-2 text-xs"
                style={{ color: "var(--text-normal)" }}
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

      {/* TOP TRACKS */}
      <div className="space-y-2 rounded-lg border border-white bg-black p-4">
        <div
          className="text-sm font-medium"
          style={{ color: "var(--text-strong)" }}
        >
          Top Linked Tracks
        </div>

        {topLinkedTracks.length === 0 ? (
          <div
            className="text-sm"
            style={{ color: "var(--text-normal)" }}
          >
            No linked tracks yet.
          </div>
        ) : (
          <div className="space-y-2">
            {topLinkedTracks.map((track) => {
              const tid = String(track.id);
              const isPreview = previewTrackId === tid;
              const isNow = nowPlayingId === tid;
              const isMetadataTarget = isMetadataTargetTrack(
                tid,
                safeMetadataTargetType,
                metadataTargetId
              );

              return (
                <div
                  key={tid}
                  className="space-y-3 rounded border border-white bg-black p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {isNow && <StatusPill label="NOW PLAYING" />}
                        {isPreview && <StatusPill label="PREVIEW" />}
                        {isMetadataTarget && (
                          <StatusPill label="METADATA TARGET" />
                        )}
                      </div>

                      <div>
                        <div
                          className="text-sm font-medium"
                          style={{ color: "var(--text-strong)" }}
                        >
                          {getTrackTitle(track)}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-normal)" }}
                        >
                          {getTrackArtist(track)}
                        </div>
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

      {/* SETLIST */}
      <div className="space-y-2 rounded-lg border border-white bg-black p-4">
        <div
          className="text-sm font-medium"
          style={{ color: "var(--text-strong)" }}
        >
          Setlist Order
        </div>

        {orderedLinkedTracks.length === 0 ? (
          <div
            className="text-sm"
            style={{ color: "var(--text-normal)" }}
          >
            No ordered tracks yet.
          </div>
        ) : (
          <div className="space-y-2">
            {orderedLinkedTracks.map((track, idx) => {
              const tid = String(track.id);
              const isPreview = previewTrackId === tid;
              const isNow = nowPlayingId === tid;
              const isMetadataTarget = isMetadataTargetTrack(
                tid,
                safeMetadataTargetType,
                metadataTargetId
              );

              return (
                <div
                  key={tid}
                  className="space-y-3 rounded border border-white bg-black p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <StatusPill label={`POSITION ${idx + 1}`} />
                        {isNow && <StatusPill label="NOW PLAYING" />}
                        {isPreview && <StatusPill label="PREVIEW" />}
                        {isMetadataTarget && (
                          <StatusPill label="METADATA TARGET" />
                        )}
                      </div>

                      <div>
                        <div
                          className="text-sm font-medium"
                          style={{ color: "var(--text-strong)" }}
                        >
                          {idx + 1}. {getTrackTitle(track)}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-normal)" }}
                        >
                          {getTrackArtist(track)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <TrackActionRow
                        tid={tid}
                        onPlayTrackById={onPlayTrackById}
                        onPreviewTrack={onPreviewTrack}
                        onSelectTrackMetadataTarget={
                          onSelectTrackMetadataTarget
                        }
                      />

                      <button
                        className="rounded border border-white bg-black px-2 py-1 text-xs"
                        style={{ color: "var(--text-normal)" }}
                        onClick={() => onMoveSetlistItem(tid, "up")}
                        disabled={idx === 0}
                      >
                        Up
                      </button>

                      <button
                        className="rounded border border-white bg-black px-2 py-1 text-xs"
                        style={{ color: "var(--text-normal)" }}
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

      {/* METADATA */}
      {metadataTargetId && (
        <div className="space-y-3 rounded-lg border border-white bg-black p-4">
          <div className="space-y-1">
            <div
              className="text-sm font-medium"
              style={{ color: "var(--text-strong)" }}
            >
              Metadata
            </div>

            <div
              className="text-xs"
              style={{ color: "var(--text-normal)" }}
            >
              {safeMetadataTargetType === "track"
                ? `${selectedMetadataTrackTitle} • ${selectedMetadataTrackArtist}`
                : `${getMetadataContextLabel(safeMetadataTargetType)} • ${metadataTargetId}`}
            </div>
          </div>

          <MetadataPanel
            targetType={safeMetadataTargetType}
            targetId={metadataTargetId}
          />
        </div>
      )}
    </div>
  );
}