import {
  decorateLibraryTracks,
  type DecoratedLibraryTrack,
} from "./libraryTrackDecorators";

function inferTrackSource(track: Record<string, unknown>): unknown {
  const explicitSource = track.source ?? track.librarySource ?? track.origin;
  if (explicitSource != null) return explicitSource;

  const url = String(track.url ?? "").toLowerCase();
  const wav = String(track.wav ?? "").toLowerCase();
  const mp3 = String(track.mp3 ?? "").toLowerCase();
  const original = String(
    track.original ?? track.originalUpload ?? track.original_upload ?? ""
  ).toLowerCase();
  const id = String(track.id ?? "").toLowerCase();

  if (
    url.includes("supabase") ||
    wav.includes("supabase") ||
    mp3.includes("supabase") ||
    original.includes("supabase") ||
    url.includes("storage") ||
    wav.includes("storage") ||
    mp3.includes("storage") ||
    original.includes("storage")
  ) {
    return "supabase";
  }

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

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function getFirstCleanString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const clean = cleanString(value);
    if (clean) return clean;
  }

  return undefined;
}

function inferAudioAssetFields(track: Record<string, unknown>) {
  const wav = getFirstCleanString(
    track.wav,
    track.wav_url,
    track.wavUrl,
    track.master_wav,
    track.masterWav
  );

  const mp3 = getFirstCleanString(
    track.mp3,
    track.mp3_url,
    track.mp3Url,
    track.preview_mp3,
    track.previewMp3
  );

  const flac = getFirstCleanString(track.flac, track.flac_url, track.flacUrl);

  const aiff = getFirstCleanString(
    track.aiff,
    track.aif,
    track.aiff_url,
    track.aif_url,
    track.aiffUrl,
    track.aifUrl
  );

  const original = getFirstCleanString(
    track.original,
    track.original_url,
    track.originalUrl,
    track.original_upload,
    track.originalUpload
  );

  return {
    wav,
    mp3,
    flac,
    aiff,
    original,
    originalUpload: original,
    masterAudio: wav ?? original ?? flac ?? aiff ?? mp3,
    previewAudio: mp3 ?? wav ?? original ?? flac ?? aiff,
    preferredDownloadFormat: "wav",
  };
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

function enrichTrackWithAudioAssets<TTrack extends Record<string, unknown>>(
  track: TTrack
): TTrack {
  return {
    ...track,
    ...inferAudioAssetFields(track),
  };
}

export function buildLibraryGroundworkTracks<
  TTrack extends Record<string, unknown>
>(tracks: TTrack[]): Array<DecoratedLibraryTrack<TTrack>> {
  return decorateLibraryTracks(
    tracks.map((track) =>
      enrichTrackWithAudioAssets(enrichTrackWithGeneratedTags(track))
    ),
    (track) => ({
      source: inferTrackSource(track),
      visibility: inferTrackVisibility(track),
      sharedWithMemberIds: inferSharedWithMemberIds(track),
    })
  );
}