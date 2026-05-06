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

function normalizeTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

// 🔥 NEW: extract tags from title
function extractTagsFromTitle(title: string): string[] {
  const words = title.toLowerCase().split(/[\s_-]+/);

  const knownTags = [
    "rock",
    "funk",
    "hiphop",
    "trap",
    "jazz",
    "edm",
    "house",
    "techno",
    "ambient",
    "lofi",
  ];

  return Array.from(new Set(words.filter((w) => knownTags.includes(w))));
}

function enrichTrackWithGeneratedTags<TTrack extends Record<string, unknown>>(
  track: TTrack
): TTrack {
  const existing = normalizeTagIds(track.tags);
  const title = String(track.title ?? "");

  const generated = extractTagsFromTitle(title);

  if (!generated.length) return track;

  return {
    ...track,
    tags: Array.from(new Set([...existing, ...generated])),
  };
}

export function buildLibraryGroundworkTracks<
  TTrack extends Record<string, unknown>
>(tracks: TTrack[]): Array<DecoratedLibraryTrack<TTrack>> {
  return decorateLibraryTracks(
    tracks.map((track) => enrichTrackWithGeneratedTags(track)),
    (track) => ({
      source: inferTrackSource(track),
      visibility: inferTrackVisibility(track),
      sharedWithMemberIds: inferSharedWithMemberIds(track),
    })
  );
}