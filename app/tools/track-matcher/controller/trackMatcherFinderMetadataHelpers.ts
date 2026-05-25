import type {
  TrackMatcherMetadataProfile,
  TrackMatcherMetadataStatistics,
  TrackMatcherMetadataToken,
} from "./trackMatcherFinderMetadataTypes";

type MetadataDictionaryEntry = {
  token: string;
  aliases?: string[];
  score?: number;
};

type MetadataDictionary = {
  genre: MetadataDictionaryEntry[];
  mood: MetadataDictionaryEntry[];
  stem: MetadataDictionaryEntry[];
  instrument: MetadataDictionaryEntry[];
  vocal: MetadataDictionaryEntry[];
  structure: MetadataDictionaryEntry[];
  source: MetadataDictionaryEntry[];
  quality: MetadataDictionaryEntry[];
  workflow: MetadataDictionaryEntry[];
};

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(normalize).filter(Boolean)));
}

function compact(values: string[]) {
  return values.map(normalize).filter(Boolean);
}

function phraseMatches(text: string, phrase: string) {
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  return text.includes(normalizedPhrase);
}

function entryMatches(text: string, entry: MetadataDictionaryEntry) {
  if (phraseMatches(text, entry.token)) return true;
  return compact(entry.aliases ?? []).some((alias) => phraseMatches(text, alias));
}

function extractDictionaryTokens(
  text: string,
  entries: readonly MetadataDictionaryEntry[],
) {
  return entries
    .filter((entry) => entryMatches(text, entry))
    .map((entry) => normalize(entry.token));
}

function getEntryScore(entry: MetadataDictionaryEntry) {
  return entry.score ?? 10;
}

const METADATA_DICTIONARY: MetadataDictionary = {
  genre: [
    { token: "rock", aliases: ["classic rock", "hard rock"], score: 18 },
    { token: "funk", aliases: ["funky", "funk groove"], score: 18 },
    { token: "jazz", aliases: ["jazzy"], score: 14 },
    { token: "blues", aliases: ["bluesy"], score: 14 },
    { token: "country", aliases: ["country rock"], score: 12 },
    { token: "metal", aliases: ["heavy metal"], score: 14 },
    { token: "edm", aliases: ["dance", "electronic dance"], score: 12 },
    { token: "house", aliases: ["deep house"], score: 12 },
    { token: "techno", aliases: ["techno groove"], score: 12 },
    { token: "ambient", aliases: ["atmospheric"], score: 12 },
    { token: "orchestral", aliases: ["cinematic", "score"], score: 12 },
    { token: "hiphop", aliases: ["hip hop", "rap"], score: 14 },
    { token: "trap", aliases: ["trap beat"], score: 12 },
    { token: "pop", aliases: ["pop rock"], score: 12 },
    { token: "soul", aliases: ["soulful"], score: 12 },
    { token: "r&b", aliases: ["rnb", "rhythm and blues"], score: 12 },
    { token: "punk", aliases: ["punk rock"], score: 12 },
    { token: "folk", aliases: ["folk rock"], score: 10 },
    { token: "reggae", aliases: ["dub"], score: 10 },
    { token: "latin", aliases: ["latin groove"], score: 10 },
    { token: "gospel", aliases: ["church", "choir"], score: 10 },
  ],

  mood: [
    { token: "dark", aliases: ["moody", "shadow"], score: 12 },
    { token: "bright", aliases: ["uplift", "upbeat"], score: 12 },
    { token: "sad", aliases: ["melancholy", "blue"], score: 12 },
    { token: "happy", aliases: ["joyful", "fun"], score: 10 },
    { token: "angry", aliases: ["aggressive", "rage"], score: 12 },
    { token: "romantic", aliases: ["love", "tender"], score: 10 },
    { token: "dreamy", aliases: ["floaty", "ethereal"], score: 10 },
    { token: "gritty", aliases: ["dirty", "raw"], score: 12 },
    { token: "smooth", aliases: ["silky", "polished"], score: 10 },
    { token: "tense", aliases: ["suspense", "anxious"], score: 10 },
    { token: "epic", aliases: ["big", "massive"], score: 10 },
    { token: "intimate", aliases: ["close", "small"], score: 10 },
    { token: "haunting", aliases: ["ghostly", "eerie"], score: 10 },
    { token: "playful", aliases: ["quirky", "funny"], score: 8 },
  ],

  stem: [
    { token: "stem", aliases: ["stems", "isolated"], score: 18 },
    { token: "bass", aliases: ["bassline", "low end", "low-end"], score: 18 },
    { token: "drums", aliases: ["drum", "beat", "percussion"], score: 18 },
    { token: "vocal", aliases: ["vocals", "voice", "sung"], score: 18 },
    { token: "instrumental", aliases: ["no vocal", "backing track"], score: 16 },
    { token: "melody", aliases: ["lead line", "topline", "top line"], score: 16 },
    { token: "harmony", aliases: ["harmonies", "chords"], score: 16 },
    { token: "hook", aliases: ["chorus hook", "main hook"], score: 14 },
    { token: "loop", aliases: ["looped", "cycle"], score: 12 },
    { token: "sample", aliases: ["sampled", "chop"], score: 12 },
    { token: "acapella", aliases: ["a cappella", "acap"], score: 16 },
  ],

  instrument: [
    { token: "guitar", aliases: ["electric guitar", "acoustic guitar"], score: 16 },
    { token: "bass guitar", aliases: ["bass"], score: 14 },
    { token: "piano", aliases: ["keys", "keyboard"], score: 14 },
    { token: "synth", aliases: ["synthesizer", "lead synth"], score: 14 },
    { token: "drum kit", aliases: ["kit", "drums"], score: 14 },
    { token: "percussion", aliases: ["shaker", "tambourine"], score: 12 },
    { token: "strings", aliases: ["violin", "cello", "string section"], score: 12 },
    { token: "brass", aliases: ["horns", "trumpet", "trombone"], score: 12 },
    { token: "saxophone", aliases: ["sax"], score: 12 },
    { token: "organ", aliases: ["hammond", "b3"], score: 10 },
    { token: "pad", aliases: ["pads", "ambient pad"], score: 10 },
    { token: "riff", aliases: ["riffs"], score: 10 },
    { token: "lead", aliases: ["lead part", "lead line"], score: 10 },
  ],

  vocal: [
    { token: "lead vocal", aliases: ["main vocal", "lead voice"], score: 16 },
    { token: "backing vocal", aliases: ["background vocal", "bgv"], score: 14 },
    { token: "harmony vocal", aliases: ["vocal harmony", "stacked vocal"], score: 14 },
    { token: "chant", aliases: ["gang vocal", "crowd vocal"], score: 12 },
    { token: "spoken", aliases: ["spoken word", "talk"], score: 10 },
    { token: "falsetto", aliases: ["high voice"], score: 10 },
    { token: "rough vocal", aliases: ["scratch vocal", "demo vocal"], score: 10 },
    { token: "pronunciation", aliases: ["phonetic", "phonetics"], score: 12 },
  ],

  structure: [
    { token: "intro", aliases: ["opening"], score: 10 },
    { token: "verse", aliases: ["v1", "v2"], score: 10 },
    { token: "pre chorus", aliases: ["prechorus", "pre-chorus"], score: 10 },
    { token: "chorus", aliases: ["hook section"], score: 12 },
    { token: "bridge", aliases: ["middle eight"], score: 10 },
    { token: "breakdown", aliases: ["dropout"], score: 10 },
    { token: "drop", aliases: ["beat drop"], score: 10 },
    { token: "outro", aliases: ["ending"], score: 10 },
    { token: "solo", aliases: ["lead break"], score: 10 },
    { token: "arrangement", aliases: ["song form", "structure"], score: 10 },
  ],

  source: [
    { token: "library", aliases: ["library track"], score: 10 },
    { token: "project", aliases: ["workspace", "project track"], score: 10 },
    { token: "upload", aliases: ["uploaded", "user upload"], score: 10 },
    { token: "supabase", aliases: ["storage", "bucket"], score: 10 },
    { token: "seed", aliases: ["demo", "example"], score: 8 },
    { token: "suno", aliases: ["generated", "ai generated"], score: 12 },
    { token: "original", aliases: ["original idea", "sketch"], score: 12 },
  ],

  quality: [
    { token: "keeper", aliases: ["keep", "favorite", "best"], score: 20 },
    { token: "master", aliases: ["mastered"], score: 16 },
    { token: "final", aliases: ["finished", "complete"], score: 16 },
    { token: "approved", aliases: ["accepted"], score: 16 },
    { token: "candidate", aliases: ["option", "possible"], score: 14 },
    { token: "reference", aliases: ["ref", "sounds like", "sounds-like"], score: 18 },
    { token: "rough", aliases: ["draft", "wip", "work in progress"], score: 12 },
    { token: "clean", aliases: ["clear", "usable"], score: 12 },
    { token: "problem", aliases: ["issue", "mismatch", "repair"], score: 12 },
  ],

  workflow: [
    { token: "compare", aliases: ["comparison", "match"], score: 12 },
    { token: "tempo", aliases: ["bpm", "speed"], score: 14 },
    { token: "key", aliases: ["pitch", "transpose"], score: 14 },
    { token: "route", aliases: ["routing", "load to"], score: 12 },
    { token: "analyze", aliases: ["analysis", "diagnostic"], score: 12 },
    { token: "mix", aliases: ["mixing", "blend"], score: 12 },
    { token: "arrange", aliases: ["arrangement", "structure"], score: 12 },
    { token: "tag", aliases: ["metadata", "label"], score: 10 },
    { token: "search", aliases: ["find", "finder"], score: 10 },
    { token: "sync", aliases: ["align", "timing"], score: 12 },
  ],
};

function buildToken(
  token: string,
  category: TrackMatcherMetadataToken["category"],
  score = 10,
): TrackMatcherMetadataToken {
  return {
    token: normalize(token),
    category,
    confidence: "generated",
    score,
  };
}

function buildTokensForCategory(
  searchableText: string,
  category: keyof MetadataDictionary,
): TrackMatcherMetadataToken[] {
  return METADATA_DICTIONARY[category]
    .filter((entry) => entryMatches(searchableText, entry))
    .map((entry) => buildToken(entry.token, category, getEntryScore(entry)));
}

export function buildSearchableText(...parts: unknown[]) {
  return parts
    .map(normalize)
    .filter(Boolean)
    .join(" ");
}

export function extractGenres(text: string) {
  return extractDictionaryTokens(text, METADATA_DICTIONARY.genre);
}

export function extractMoods(text: string) {
  return extractDictionaryTokens(text, METADATA_DICTIONARY.mood);
}

export function extractStemTypes(text: string) {
  return extractDictionaryTokens(text, METADATA_DICTIONARY.stem);
}

export function extractInstruments(text: string) {
  return extractDictionaryTokens(text, METADATA_DICTIONARY.instrument);
}

export function extractVocalTypes(text: string) {
  return extractDictionaryTokens(text, METADATA_DICTIONARY.vocal);
}

export function extractStructures(text: string) {
  return extractDictionaryTokens(text, METADATA_DICTIONARY.structure);
}

export function extractSources(text: string) {
  return extractDictionaryTokens(text, METADATA_DICTIONARY.source);
}

export function extractQualityFlags(text: string) {
  return extractDictionaryTokens(text, METADATA_DICTIONARY.quality);
}

export function extractWorkflowFlags(text: string) {
  return unique([
    ...extractDictionaryTokens(text, METADATA_DICTIONARY.workflow),
    ...extractQualityFlags(text),
  ]);
}

export function buildMetadataTokens(
  searchableText: string,
): TrackMatcherMetadataToken[] {
  return uniqueTokenList([
    ...buildTokensForCategory(searchableText, "genre"),
    ...buildTokensForCategory(searchableText, "mood"),
    ...buildTokensForCategory(searchableText, "stem"),
    ...buildTokensForCategory(searchableText, "instrument"),
    ...buildTokensForCategory(searchableText, "vocal"),
    ...buildTokensForCategory(searchableText, "structure"),
    ...buildTokensForCategory(searchableText, "source"),
    ...buildTokensForCategory(searchableText, "quality"),
    ...buildTokensForCategory(searchableText, "workflow"),
  ]);
}

function uniqueTokenList(tokens: TrackMatcherMetadataToken[]) {
  const seen = new Set<string>();

  return tokens.filter((token) => {
    const key = `${token.category}:${token.token}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildGeneratedKeywords(args: {
  genres: string[];
  moods: string[];
  instruments: string[];
  stemTypes: string[];
  vocalTypes: string[];
  structures: string[];
  sources: string[];
  qualityFlags: string[];
  workflowFlags: string[];
}) {
  return unique([
    ...args.genres,
    ...args.moods,
    ...args.instruments,
    ...args.stemTypes,
    ...args.vocalTypes,
    ...args.structures,
    ...args.sources,
    ...args.qualityFlags,
    ...args.workflowFlags,
  ]);
}

function calculateConfidenceScore(tokens: readonly TrackMatcherMetadataToken[]) {
  return tokens.reduce((sum, token) => sum + token.score, 0);
}

export function buildMetadataProfile(args: {
  trackId: string;
  title: string;
  description?: string;
  tags?: string[];
}): TrackMatcherMetadataProfile {
  const searchableText = buildSearchableText(
    args.title,
    args.description,
    ...(args.tags ?? []),
  );

  const genres = extractGenres(searchableText);
  const moods = extractMoods(searchableText);
  const instruments = extractInstruments(searchableText);
  const stemTypes = extractStemTypes(searchableText);
  const vocalTypes = extractVocalTypes(searchableText);
  const structures = extractStructures(searchableText);
  const sources = extractSources(searchableText);
  const qualityFlags = extractQualityFlags(searchableText);
  const workflowFlags = extractWorkflowFlags(searchableText);

  const metadataTokens = buildMetadataTokens(searchableText);

  return {
    trackId: args.trackId,
    title: args.title,
    searchableText,

    genres,
    moods,

    instruments,

    stemTypes,

    vocalTypes,

    workflowFlags: unique([...workflowFlags, ...structures, ...sources]),

    metadataTokens,

    generatedKeywords: buildGeneratedKeywords({
      genres,
      moods,
      instruments,
      stemTypes,
      vocalTypes,
      structures,
      sources,
      qualityFlags,
      workflowFlags,
    }),

    confidenceScore: calculateConfidenceScore(metadataTokens),
  };
}

export function buildMetadataStatistics(
  profiles: readonly TrackMatcherMetadataProfile[],
): TrackMatcherMetadataStatistics {
  return {
    totalProfiles: profiles.length,
    totalTokens: profiles.reduce(
      (sum, profile) => sum + profile.metadataTokens.length,
      0,
    ),
    totalGenres: profiles.reduce(
      (sum, profile) => sum + profile.genres.length,
      0,
    ),
    totalStemTypes: profiles.reduce(
      (sum, profile) => sum + profile.stemTypes.length,
      0,
    ),
    totalInstruments: profiles.reduce(
      (sum, profile) => sum + profile.instruments.length,
      0,
    ),
  };
}
