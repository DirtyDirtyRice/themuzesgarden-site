"use client";

import { useMemo } from "react";
import type { RefObject } from "react";
import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";
import type { Project } from "./projectDetailsTypes";
import ProjectMetadataWorkspace from "./ProjectMetadataWorkspace";
import ProjectNowPlayingPanel from "./ProjectNowPlayingPanel";
import ProjectOverviewHeader from "./ProjectOverviewHeader";
import ProjectSetlistWorkspace from "./ProjectSetlistWorkspace";
import ProjectTopTracksPanel from "./ProjectTopTracksPanel";

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
  nowPlayingCardRef: RefObject<HTMLDivElement | null>;
};

type MetadataContext = {
  safeMetadataTargetType: MetadataTargetType;
  metadataTargetId: string | null;
  selectedMetadataTrack: TrackLike | null;
  selectedMetadataTrackTitle: string;
  selectedMetadataTrackArtist: string;
};

function normalizeMetadataTargetType(t: MetadataTargetType): MetadataTargetType {
  if (t === "track" || t === "section" || t === "moment") return t;
  return "track";
}

function getTrackTitle(track: TrackLike | null | undefined) {
  return track?.title?.trim() || "Untitled";
}

function getTrackArtist(track: TrackLike | null | undefined) {
  return track?.artist?.trim() || "Supabase";
}

function getTrackById(
  tid: string | null,
  tracks: TrackLike[]
): TrackLike | null {
  if (!tid) return null;
  return tracks.find((track) => String(track.id) === tid) ?? null;
}

function createKnownTrackList(options: {
  linkedTracks: TrackLike[];
  orderedLinkedTracks: TrackLike[];
  topLinkedTracks: TrackLike[];
  nowPlayingTrack: TrackLike | null;
}) {
  const seen = new Set<string>();
  const next: TrackLike[] = [];

  for (const track of [
    ...options.linkedTracks,
    ...options.orderedLinkedTracks,
    ...options.topLinkedTracks,
    ...(options.nowPlayingTrack ? [options.nowPlayingTrack] : []),
  ]) {
    const id = String(track.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    next.push(track);
  }

  return next;
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

  const allKnownTracks = useMemo(
    () =>
      createKnownTrackList({
        linkedTracks,
        orderedLinkedTracks,
        topLinkedTracks,
        nowPlayingTrack,
      }),
    [linkedTracks, orderedLinkedTracks, topLinkedTracks, nowPlayingTrack]
  );

  const selectedMetadataTrack = useMemo(
    () => getTrackById(metadataTargetId, allKnownTracks),
    [metadataTargetId, allKnownTracks]
  );

  const metadataContext: MetadataContext = {
    safeMetadataTargetType,
    metadataTargetId,
    selectedMetadataTrack,
    selectedMetadataTrackTitle: getTrackTitle(selectedMetadataTrack),
    selectedMetadataTrackArtist: getTrackArtist(selectedMetadataTrack),
  };

  return (
    <div className="space-y-4">
      <ProjectOverviewHeader
        project={project}
        overviewLoading={overviewLoading}
        overviewErr={overviewErr}
        playerErr={playerErr}
        linkedTracks={linkedTracks}
        orderedLinkedTracks={orderedLinkedTracks}
        metadataContext={metadataContext}
        onRefreshOverview={onRefreshOverview}
        onPlayProject={onPlayProject}
        onStopPlayer={onStopPlayer}
        nowPlayingId={nowPlayingId}
      />

      <ProjectNowPlayingPanel
        nowPlayingCardRef={nowPlayingCardRef}
        nowPlayingTrack={nowPlayingTrack}
        metadataContext={metadataContext}
        onPlayTrackById={onPlayTrackById}
        onPreviewTrack={onPreviewTrack}
        onSelectTrackMetadataTarget={onSelectTrackMetadataTarget}
      />

      <ProjectTopTracksPanel
        topLinkedTracks={topLinkedTracks}
        previewTrackId={previewTrackId}
        nowPlayingId={nowPlayingId}
        metadataContext={metadataContext}
        onPlayTrackById={onPlayTrackById}
        onPreviewTrack={onPreviewTrack}
        onSelectTrackMetadataTarget={onSelectTrackMetadataTarget}
      />

      <ProjectSetlistWorkspace
        orderedLinkedTracks={orderedLinkedTracks}
        previewTrackId={previewTrackId}
        nowPlayingId={nowPlayingId}
        metadataContext={metadataContext}
        onPlayTrackById={onPlayTrackById}
        onPreviewTrack={onPreviewTrack}
        onSelectTrackMetadataTarget={onSelectTrackMetadataTarget}
        onMoveSetlistItem={onMoveSetlistItem}
      />

      <ProjectMetadataWorkspace metadataContext={metadataContext} />
    </div>
  );
}
