import {
  decorateLibraryTracks,
  type DecoratedLibraryTrack,
} from "./libraryTrackDecorators";

function inferTrackSource(track: Record<string, unknown>): unknown {
  const explicitSource = track.source ?? track.librarySource ?? track.origin;
  if (explicitSource != null) return explicitSource;

  const url = String(track.url ?? "").toLowerCase();
  const id = String(track.id ?? "").toLowerCase();

  if (url.includes("supabase") || url.includes("storage")) return "supabase";
  if (id.startsWith("upload_") || id.startsWith("uploaded_")) return "upload";
  if (id.startsWith("project_")) return "project";

  return "seed";
}

function inferTrackVisibility(track: Record<string, unknown>): unknown {
  return track.visibility ?? track.libraryVisibility ?? "public";
}

function inferSharedWithMemberIds(track: Record<string, unknown>): unknown {
  return track.sharedWithMemberIds ?? track.sharedWith ?? [];
}

export function buildLibraryGroundworkTracks<
  TTrack extends Record<string, unknown>
>(tracks: TTrack[]): Array<DecoratedLibraryTrack<TTrack>> {
  return decorateLibraryTracks(tracks, (track) => ({
    source: inferTrackSource(track),
    visibility: inferTrackVisibility(track),
    sharedWithMemberIds: inferSharedWithMemberIds(track),
  }));
}