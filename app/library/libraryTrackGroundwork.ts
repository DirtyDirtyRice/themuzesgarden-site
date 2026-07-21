import {
  decorateLibraryTracks,
  type DecoratedLibraryTrack,
} from "./libraryTrackDecorators";

export type GroupedLibraryTrack<TTrack extends Record<string, unknown>> = {
  id: string;
  title: string;
  copyCount: number;
  tracks: Array<DecoratedLibraryTrack<TTrack>>;
  searchText: string;
};

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
  return track.visibility ?? track.libraryVisibility ?? "private";
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

  return Array.from(new Set(words.filter((word) => knownTags.includes(word))));
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

function getTrackTitle(track: Record<string, unknown>): string {
  return (
    getFirstCleanString(
      track.title,
      track.name,
      track.fileName,
      track.filename,
      track.originalName,
      track.original_name
    ) ?? "Untitled Track"
  );
}

function normalizeTitleForGrouping(title: string): string {
  return title
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripKnownCopyWords(title: string): string {
  const copyWords = [
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
    "keeper",
    "keeper1",
    "keeper2",
    "keeper3",
    "suno",
    "master",
    "mix",
    "demo",
    "draft",
    "final",
    "version",
    "v1",
    "v2",
    "v3",
    "v4",
    "v5",
    "wav",
    "mp3",
    "flac",
    "aiff",
    "stem",
    "stems",
    "instrumental",
    "vocal",
    "vocals",
    "drums",
    "bass",
    "guitar",
    "keys",
  ];

  const words = normalizeTitleForGrouping(title).split(" ");
  const keptWords = [...words];

  while (keptWords.length > 1) {
    const lastWord = keptWords[keptWords.length - 1]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (!copyWords.includes(lastWord)) break;

    keptWords.pop();
  }

  return keptWords.join(" ").trim() || title;
}

function getLibraryGroupTitle(track: Record<string, unknown>): string {
  const explicitGroupTitle = getFirstCleanString(
    track.groupTitle,
    track.libraryGroupTitle,
    track.songTitle,
    track.baseTitle
  );

  if (explicitGroupTitle) return normalizeTitleForGrouping(explicitGroupTitle);

  return stripKnownCopyWords(getTrackTitle(track));
}

function getLibraryGroupId(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildGroupSearchText<TTrack extends Record<string, unknown>>(
  title: string,
  tracks: Array<DecoratedLibraryTrack<TTrack>>
): string {
  return [
    title,
    ...tracks.map((track) => getTrackTitle(track)),
    ...tracks.flatMap((track) => normalizeTagIds(track.tags)),
  ]
    .join(" ")
    .toLowerCase();
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

export function buildGroupedLibraryGroundworkTracks<
  TTrack extends Record<string, unknown>
>(tracks: TTrack[]): Array<GroupedLibraryTrack<TTrack>> {
  const decoratedTracks = buildLibraryGroundworkTracks(tracks);
  const groups = new Map<string, Array<DecoratedLibraryTrack<TTrack>>>();

  for (const track of decoratedTracks) {
    const title = getLibraryGroupTitle(track);
    const groupId = getLibraryGroupId(title);

    const current = groups.get(groupId) ?? [];
    current.push(track);
    groups.set(groupId, current);
  }

  return Array.from(groups.entries())
    .map(([id, groupedTracks]) => {
      const title = getLibraryGroupTitle(groupedTracks[0]);

      return {
        id,
        title,
        copyCount: groupedTracks.length,
        tracks: groupedTracks,
        searchText: buildGroupSearchText(title, groupedTracks),
      };
    })
    .sort((first, second) => first.title.localeCompare(second.title));
}