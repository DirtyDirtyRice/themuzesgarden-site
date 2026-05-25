import type {
  TrackMatcherFinderDestination,
  TrackMatcherFinderSource,
  TrackMatcherFinderTrackResult,
} from "./trackMatcherFinderTypes";

type FinderTrackLike = {
  id?: unknown;
  title?: unknown;
  name?: unknown;
  artist?: unknown;
  source?: unknown;
  librarySource?: unknown;
  origin?: unknown;
  tags?: unknown;
  description?: unknown;
  body?: unknown;
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

type FinderInferenceProfile = {
  searchable: string;
  source: TrackMatcherFinderSource;
  isStem: boolean;
  isInstrumental: boolean;
  isReferenceSong: boolean;
  isHybridCandidate: boolean;
  destinationHints: TrackMatcherFinderDestination[];
};

const AUDIO_FIELDS: Array<keyof FinderTrackLike> = [
  "masterAudio",
  "previewAudio",
  "wav",
  "mp3",
  "flac",
  "aiff",
  "original",
  "originalUpload",
  "url",
  "path",
  "storage_path",
  "file_path",
];

const SOURCE_WORDS: Record<TrackMatcherFinderSource, string[]> = {
  library: ["library", "library track", "catalog"],
  project: ["project", "workspace", "session"],
  upload: ["upload", "uploaded", "user upload", "local upload"],
  supabase: ["supabase", "storage", "bucket", "public bucket"],
  seed: ["seed", "demo", "example", "starter"],
  unknown: [],
};

const DESTINATION_WORDS: Record<TrackMatcherFinderDestination, string[]> = {
  "track-a": ["track a", "deck a", "primary", "compare"],
  "track-b": ["track b", "deck b", "secondary", "comparison"],
  "original-idea": ["original idea", "sketch", "rough idea", "song seed"],
  "suno-result": ["suno", "generated", "ai generated"],
  "reference-song": ["reference", "sounds like", "sounds-like", "inspiration"],
  melody: ["melody", "hook", "lead", "topline", "top line", "motif"],
  harmony: ["harmony", "harmonies", "chord", "chords", "pad"],
  drums: ["drum", "drums", "beat", "rhythm", "groove", "percussion"],
  bass: ["bass", "bassline", "lowend", "low end", "low-end", "pocket"],
  vocal: ["vocal", "vocals", "voice", "sing", "sung", "chant", "phrase"],
  instrument: ["instrument", "guitar", "keys", "piano", "synth", "riff"],
  stem: ["stem", "stems", "separated", "isolated", "part"],
  hybrid: ["hybrid", "blend", "combo", "candidate", "mashup"],
  analysis: ["analysis", "analyze", "diagnostic", "score", "review"],
};

const STEM_WORDS = [
  "stem",
  "stems",
  "separated",
  "isolated",
  "acapella",
  "a cappella",
  "drum stem",
  "bass stem",
  "vocal stem",
  "instrument stem",
];

const INSTRUMENTAL_WORDS = [
  "instrumental",
  "no vocal",
  "no vocals",
  "backing track",
  "bed",
  "music only",
  "karaoke",
];

const REFERENCE_WORDS = [
  "reference",
  "ref",
  "sounds like",
  "sounds-like",
  "inspiration",
  "style match",
  "production ref",
];

const HYBRID_WORDS = [
  "hybrid",
  "blend",
  "combo",
  "candidate",
  "mashup",
  "mixed source",
  "experiment",
];

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function lower(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.map((item) => clean(item)).filter(Boolean)),
  );
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getFirstCleanString(...values: unknown[]) {
  for (const value of values) {
    const cleaned = clean(value);
    if (cleaned) return cleaned;
  }

  return undefined;
}

function joinLower(...values: unknown[]) {
  return values.map(lower).filter(Boolean).join(" ");
}

function inferAudioUrl(track: FinderTrackLike) {
  return getFirstCleanString(...AUDIO_FIELDS.map((field) => track[field]));
}

function buildAudioSearchText(track: FinderTrackLike) {
  return joinLower(...AUDIO_FIELDS.map((field) => track[field]));
}

function textHasAny(text: string, words: readonly string[]) {
  return words.some((word) => {
    const normalizedWord = lower(word);
    return normalizedWord ? text.includes(normalizedWord) : false;
  });
}

function inferExplicitSource(track: FinderTrackLike): TrackMatcherFinderSource | null {
  const explicit = lower(track.source ?? track.librarySource ?? track.origin);

  if (
    explicit === "library" ||
    explicit === "project" ||
    explicit === "upload" ||
    explicit === "supabase" ||
    explicit === "seed"
  ) {
    return explicit;
  }

  for (const source of Object.keys(SOURCE_WORDS) as TrackMatcherFinderSource[]) {
    if (source === "unknown") continue;
    if (textHasAny(explicit, SOURCE_WORDS[source])) return source;
  }

  return null;
}

function inferSource(track: FinderTrackLike): TrackMatcherFinderSource {
  const explicitSource = inferExplicitSource(track);
  if (explicitSource) return explicitSource;

  const joined = buildAudioSearchText(track);

  if (textHasAny(joined, SOURCE_WORDS.supabase)) return "supabase";
  if (textHasAny(joined, SOURCE_WORDS.upload)) return "upload";
  if (textHasAny(joined, SOURCE_WORDS.project)) return "project";
  if (textHasAny(joined, SOURCE_WORDS.seed)) return "seed";
  if (textHasAny(joined, SOURCE_WORDS.library)) return "library";

  return "unknown";
}

function buildSearchableText(args: {
  title: string;
  artist: string;
  description: string;
  audioUrl?: string;
  tags: string[];
  track: FinderTrackLike;
}) {
 return joinLower(
  args.title,
  args.artist,
  args.description,
  args.audioUrl,
  ...args.tags,
  args.track.source,
  args.track.librarySource,
  args.track.origin,
  buildAudioSearchText(args.track),
);
}

function inferDestinationHints(searchable: string): TrackMatcherFinderDestination[] {
  const hints: TrackMatcherFinderDestination[] = ["track-a", "track-b"];

  for (const destination of Object.keys(
    DESTINATION_WORDS,
  ) as TrackMatcherFinderDestination[]) {
    if (destination === "track-a" || destination === "track-b") continue;

    if (textHasAny(searchable, DESTINATION_WORDS[destination])) {
      hints.push(destination);
    }
  }

  if (textHasAny(searchable, STEM_WORDS)) hints.push("stem");
  if (textHasAny(searchable, INSTRUMENTAL_WORDS)) hints.push("instrument");
  if (textHasAny(searchable, REFERENCE_WORDS)) hints.push("reference-song");
  if (textHasAny(searchable, HYBRID_WORDS)) hints.push("hybrid");

  return unique(hints);
}

function buildInferenceProfile(args: {
  searchable: string;
  track: FinderTrackLike;
}): FinderInferenceProfile {
  return {
    searchable: args.searchable,
    source: inferSource(args.track),
    isStem: textHasAny(args.searchable, STEM_WORDS),
    isInstrumental: textHasAny(args.searchable, INSTRUMENTAL_WORDS),
    isReferenceSong: textHasAny(args.searchable, REFERENCE_WORDS),
    isHybridCandidate: textHasAny(args.searchable, HYBRID_WORDS),
    destinationHints: inferDestinationHints(args.searchable),
  };
}

function enrichTagsWithInferences(args: {
  tags: string[];
  profile: FinderInferenceProfile;
}) {
  const generatedTags: string[] = [];

  if (args.profile.source !== "unknown") generatedTags.push(args.profile.source);
  if (args.profile.isStem) generatedTags.push("stem");
  if (args.profile.isInstrumental) generatedTags.push("instrumental");
  if (args.profile.isReferenceSong) generatedTags.push("reference");
  if (args.profile.isHybridCandidate) generatedTags.push("hybrid");

  for (const destination of args.profile.destinationHints) {
    if (destination === "track-a" || destination === "track-b") continue;
    generatedTags.push(destination);
  }

  return unique([...args.tags, ...generatedTags]);
}

export function adaptTrackToFinderResult(
  track: FinderTrackLike,
): TrackMatcherFinderTrackResult | null {
  const id = clean(track.id);
  if (!id) return null;

  const title = clean(track.title ?? track.name) || "Untitled";
  const artist = clean(track.artist) || "Unknown";
  const rawTags = normalizeTags(track.tags);
  const description = clean(track.description ?? track.body);
  const audioUrl = inferAudioUrl(track);

  const initialSearchable = buildSearchableText({
    title,
    artist,
    description,
    audioUrl,
    tags: rawTags,
    track,
  });

  const initialProfile = buildInferenceProfile({
    searchable: initialSearchable,
    track,
  });

  const tags = enrichTagsWithInferences({
    tags: rawTags,
    profile: initialProfile,
  });

  const searchable = buildSearchableText({
    title,
    artist,
    description,
    audioUrl,
    tags,
    track,
  });

  const profile = buildInferenceProfile({ searchable, track });

  return {
    id,
    title,
    artist,
    source: profile.source,
    tags,
    description: description || undefined,
    audioUrl,
    score: 0,
    isStem: profile.isStem,
    isInstrumental: profile.isInstrumental,
    isReferenceSong: profile.isReferenceSong,
    isHybridCandidate: profile.isHybridCandidate,
    destinationHints: profile.destinationHints,
  };
}

export function adaptTracksToFinderResults(
  tracks: readonly FinderTrackLike[],
): TrackMatcherFinderTrackResult[] {
  return tracks
    .map((track) => adaptTrackToFinderResult(track))
    .filter((track): track is TrackMatcherFinderTrackResult => Boolean(track));
}
