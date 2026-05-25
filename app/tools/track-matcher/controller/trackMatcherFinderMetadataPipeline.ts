import {
  buildMetadataProfile,
  buildMetadataStatistics,
} from "./trackMatcherFinderMetadataHelpers";
import type {
  TrackMatcherMetadataProfile,
  TrackMatcherMetadataStatistics,
} from "./trackMatcherFinderMetadataTypes";
import type { TrackMatcherFinderLibraryTrackLike } from "./trackMatcherFinderLibraryAdapter";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((item) => clean(item)).filter(Boolean)),
  );
}

function buildDescription(track: TrackMatcherFinderLibraryTrackLike) {
  return [
    track.description,
    track.sourceProjectTitle,
    track.visibility,
    track.path,
    track.storage_path,
    track.file_path,
  ]
    .map(clean)
    .filter(Boolean)
    .join(" ");
}

export function buildMetadataProfileFromLibraryTrack(
  track: TrackMatcherFinderLibraryTrackLike,
): TrackMatcherMetadataProfile | null {
  const trackId = clean(track.id);
  if (!trackId) return null;

  const title = clean(track.title ?? track.name) || "Untitled";

  return buildMetadataProfile({
    trackId,
    title,
    description: buildDescription(track),
    tags: normalizeTags(track.tags),
  });
}

export function buildMetadataProfilesFromLibraryTracks(
  tracks: readonly TrackMatcherFinderLibraryTrackLike[],
): TrackMatcherMetadataProfile[] {
  return tracks
    .map((track) => buildMetadataProfileFromLibraryTrack(track))
    .filter(
      (profile): profile is TrackMatcherMetadataProfile => Boolean(profile),
    );
}

export function buildTrackMatcherMetadataPipelineResult(
  tracks: readonly TrackMatcherFinderLibraryTrackLike[],
): {
  profiles: TrackMatcherMetadataProfile[];
  statistics: TrackMatcherMetadataStatistics;
} {
  const profiles = buildMetadataProfilesFromLibraryTracks(tracks);

  return {
    profiles,
    statistics: buildMetadataStatistics(profiles),
  };
}