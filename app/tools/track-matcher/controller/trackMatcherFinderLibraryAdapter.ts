import type { DecoratedLibraryTrack } from "../../../library/libraryTrackDecorators";
import type { TrackLike } from "../../../library/libraryTypes";
import { adaptTrackToFinderResult } from "./trackMatcherFinderAdapters";
import type { TrackMatcherFinderTrackResult } from "./trackMatcherFinderTypes";

export type TrackMatcherFinderLibraryTrackLike = Partial<TrackLike> &
  Partial<DecoratedLibraryTrack<Record<string, unknown>>> & {
    id?: unknown;
    title?: unknown;
    name?: unknown;
    artist?: unknown;
    tags?: unknown;
    description?: unknown;
    body?: unknown;
    source?: unknown;
    librarySource?: unknown;
    librarySourceLabel?: unknown;
    origin?: unknown;
    sourceProjectTitle?: unknown;
    sourceProjectId?: unknown;
    visibility?: unknown;
    libraryVisibilityLabel?: unknown;
    url?: unknown;
    mp3?: unknown;
    wav?: unknown;
    flac?: unknown;
    aiff?: unknown;
    original?: unknown;
    originalUpload?: unknown;
    masterAudio?: unknown;
    previewAudio?: unknown;
    path?: unknown;
    storage_path?: unknown;
    file_path?: unknown;
  };

type SearchTextPart = string | undefined;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function splitLooseWords(value: unknown) {
  return lower(value)
    .split(/[\s_\-./]+/g)
    .map((word) => word.trim())
    .filter(Boolean);
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return unique(value.map((item) => clean(item)));
}

function getFirstCleanString(...values: unknown[]) {
  for (const value of values) {
    const cleaned = clean(value);
    if (cleaned) return cleaned;
  }
  return undefined;
}

function buildSearchText(...parts: SearchTextPart[]) {
  return parts.map(clean).filter(Boolean).join(" ");
}

function inferSourceText(track: TrackMatcherFinderLibraryTrackLike) {
  return getFirstCleanString(
    track.librarySourceLabel,
    track.librarySource,
    track.source,
    track.origin,
  );
}

function inferVisibilityText(track: TrackMatcherFinderLibraryTrackLike) {
  return getFirstCleanString(
    track.libraryVisibilityLabel,
    track.visibility,
    typeof track.libraryAccess === "object" && track.libraryAccess
      ? (track.libraryAccess as { visibility?: unknown }).visibility
      : undefined,
  );
}

function inferAudioPathText(track: TrackMatcherFinderLibraryTrackLike) {
  return buildSearchText(
    clean(track.url),
    clean(track.mp3),
    clean(track.wav),
    clean(track.flac),
    clean(track.aiff),
    clean(track.original),
    clean(track.originalUpload),
    clean(track.masterAudio),
    clean(track.previewAudio),
    clean(track.path),
    clean(track.storage_path),
    clean(track.file_path),
  );
}

function inferFilenameWords(track: TrackMatcherFinderLibraryTrackLike) {
  return unique([
    ...splitLooseWords(track.title),
    ...splitLooseWords(track.name),
    ...splitLooseWords(track.path),
    ...splitLooseWords(track.storage_path),
    ...splitLooseWords(track.file_path),
    ...splitLooseWords(track.url),
    ...splitLooseWords(track.mp3),
    ...splitLooseWords(track.wav),
  ]);
}

function inferGeneratedTags(track: TrackMatcherFinderLibraryTrackLike) {
  const words = inferFilenameWords(track);
  const searchableWords = new Set(words);
  const generated: string[] = [];

  const addIfPresent = (tag: string, matches: string[]) => {
    if (matches.some((match) => searchableWords.has(match))) generated.push(tag);
  };

  addIfPresent("rock", ["rock"]);
  addIfPresent("funk", ["funk", "funky", "funk1", "funk2"]);
  addIfPresent("keeper", ["keeper", "keeper1", "keeper2", "keepers"]);
  addIfPresent("suno", ["suno"]);
  addIfPresent("stem", ["stem", "stems", "stem1", "stem2"]);
  addIfPresent("instrumental", ["instrumental", "instrumentals"]);
  addIfPresent("bass", ["bass"]);
  addIfPresent("drums", ["drum", "drums"]);
  addIfPresent("vocal", ["vocal", "vocals", "voice"]);
  addIfPresent("melody", ["melody", "hook", "lead"]);
  addIfPresent("harmony", ["harmony", "chords", "chord"]);
  addIfPresent("hybrid", ["hybrid", "blend", "candidate"]);
  addIfPresent("reference", ["reference", "refs"]);

  return unique(generated);
}

function buildGeneratedDescription(track: TrackMatcherFinderLibraryTrackLike) {
  const sourceText = inferSourceText(track);
  const visibilityText = inferVisibilityText(track);
  const audioPathText = inferAudioPathText(track);

  return buildSearchText(
    clean(track.description),
    clean(track.body),
    clean(track.sourceProjectTitle),
    clean(track.sourceProjectId),
    sourceText ? `Source ${sourceText}` : undefined,
    visibilityText ? `Visibility ${visibilityText}` : undefined,
    audioPathText,
  );
}

function buildFinderAdapterTrack(track: TrackMatcherFinderLibraryTrackLike) {
  const tags = unique([...normalizeTags(track.tags), ...inferGeneratedTags(track)]);

  return {
    ...track,
    source: track.librarySource ?? track.source ?? track.origin,
    librarySource: track.librarySource,
    tags,
    description: buildGeneratedDescription(track),
  };
}

export function adaptLibraryTrackToFinderResult(
  track: TrackMatcherFinderLibraryTrackLike,
): TrackMatcherFinderTrackResult | null {
  return adaptTrackToFinderResult(buildFinderAdapterTrack(track));
}

export function adaptLibraryTracksToFinderResults(
  tracks: readonly TrackMatcherFinderLibraryTrackLike[],
): TrackMatcherFinderTrackResult[] {
  return tracks
    .map((track) => adaptLibraryTrackToFinderResult(track))
    .filter((track): track is TrackMatcherFinderTrackResult => Boolean(track));
}

export function getLibraryTrackFinderSearchPreview(
  track: TrackMatcherFinderLibraryTrackLike,
) {
  const adapted = buildFinderAdapterTrack(track);

  return {
    id: clean(adapted.id),
    title: clean(adapted.title ?? adapted.name) || "Untitled",
    tags: normalizeTags(adapted.tags),
    description: clean(adapted.description),
    source: inferSourceText(track) ?? "unknown",
    visibility: inferVisibilityText(track) ?? "unknown",
  };
}

export function getLibraryTrackFinderGeneratedTags(
  track: TrackMatcherFinderLibraryTrackLike,
) {
  return inferGeneratedTags(track);
}