export type LibrarySearchableTrack = Record<string, unknown>;

export type LibraryTrackSearchIndexEntry<TTrack extends LibrarySearchableTrack> = {
  track: TTrack;
  searchableText: string;
  searchableTokens: string[];
};

export type LibraryTrackSearchOptions<TTrack extends LibrarySearchableTrack> = {
  getExtraSearchText?: (track: TTrack) => string[];
};

const TOKEN_SPLIT_PATTERN = /[^a-zA-Z0-9]+/g;

const CAMEL_CASE_PATTERN = /([a-z])([A-Z])/g;

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

const COMMON_STEM_WORDS = [
  "stem",
  "stems",
  "instrument",
  "instruments",
  "instrumental",
  "vocal",
  "vocals",
  "drum",
  "drums",
  "bass",
  "guitar",
  "piano",
  "melody",
  "harmony",
];

const COMMON_STATUS_WORDS = [
  "keeper",
  "keep",
  "favorite",
  "final",
  "draft",
  "demo",
  "master",
  "mix",
];

const COMMON_SOURCE_WORDS = [
  "suno",
  "supabase",
  "upload",
  "uploaded",
  "project",
  "library",
  "public",
  "private",
];

function stringifySearchValue(value: unknown): string[] {
  if (value == null) return [];

  if (typeof value === "string") return [value];

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => stringifySearchValue(item));
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      stringifySearchValue(item),
    );
  }

  return [];
}

function normalizeSearchText(value: string): string {
  return value
    .replace(UUID_PATTERN, " ")
    .replace(CAMEL_CASE_PATTERN, "$1 $2")
    .replace(TOKEN_SPLIT_PATTERN, " ")
    .toLowerCase()
    .trim();
}

function splitTokenNumberSuffix(token: string): string[] {
  const match = token.match(/^([a-z]+)(\d+)$/i);
  if (!match) return [token];

  return [token, match[1] ?? token];
}

function expandCompoundToken(token: string): string[] {
  const expanded = new Set<string>([token]);

  for (const word of COMMON_STEM_WORDS) {
    if (token.includes(word)) expanded.add(word);
  }

  for (const word of COMMON_STATUS_WORDS) {
    if (token.includes(word)) expanded.add(word);
  }

  for (const word of COMMON_SOURCE_WORDS) {
    if (token.includes(word)) expanded.add(word);
  }

  if (token.includes("instrumental")) {
    expanded.add("instrument");
    expanded.add("instruments");
  }

  if (token.includes("stems")) {
    expanded.add("stem");
  }

  if (token.includes("master")) {
    expanded.add("master");
  }

  return Array.from(expanded);
}

function buildSearchTokens(values: string[]): string[] {
  const tokens = new Set<string>();

  for (const value of values) {
    const normalized = normalizeSearchText(value);
    if (!normalized) continue;

    for (const rawToken of normalized.split(" ")) {
      const token = rawToken.trim();
      if (!token) continue;

      for (const suffixToken of splitTokenNumberSuffix(token)) {
        for (const expandedToken of expandCompoundToken(suffixToken)) {
          if (expandedToken) tokens.add(expandedToken);
        }
      }
    }
  }

  return Array.from(tokens).sort();
}

function collectTrackSearchValues<TTrack extends LibrarySearchableTrack>(
  track: TTrack,
  options?: LibraryTrackSearchOptions<TTrack>,
): string[] {
  const preferredFields = [
    "id",
    "title",
    "name",
    "trackName",
    "fileName",
    "filename",
    "description",
    "body",
    "tags",
    "metadata",
    "librarySource",
    "librarySourceLabel",
    "libraryVisibilityLabel",
    "source",
    "visibility",
  ];

  const values: string[] = [];

  for (const field of preferredFields) {
    values.push(...stringifySearchValue(track[field]));
  }

  values.push(...stringifySearchValue(track));

  if (options?.getExtraSearchText) {
    values.push(...options.getExtraSearchText(track));
  }

  return values;
}

export function buildLibraryTrackSearchIndexEntry<
  TTrack extends LibrarySearchableTrack,
>(
  track: TTrack,
  options?: LibraryTrackSearchOptions<TTrack>,
): LibraryTrackSearchIndexEntry<TTrack> {
  const values = collectTrackSearchValues(track, options);
  const searchableTokens = buildSearchTokens(values);

  return {
    track,
    searchableText: searchableTokens.join(" "),
    searchableTokens,
  };
}

export function buildLibraryTrackSearchIndex<TTrack extends LibrarySearchableTrack>(
  tracks: TTrack[],
  options?: LibraryTrackSearchOptions<TTrack>,
): Array<LibraryTrackSearchIndexEntry<TTrack>> {
  return tracks.map((track) => buildLibraryTrackSearchIndexEntry(track, options));
}

export function searchLibraryTracks<TTrack extends LibrarySearchableTrack>(
  tracks: TTrack[],
  query: string,
  options?: LibraryTrackSearchOptions<TTrack>,
): TTrack[] {
  const queryTokens = buildSearchTokens([query]);

  if (queryTokens.length === 0) return tracks;

  return buildLibraryTrackSearchIndex(tracks, options)
    .filter((entry) =>
      queryTokens.every((queryToken) =>
        entry.searchableTokens.some((trackToken) =>
          trackToken.includes(queryToken),
        ),
      ),
    )
    .map((entry) => entry.track);
}

export function getLibraryTrackSearchTokens<TTrack extends LibrarySearchableTrack>(
  track: TTrack,
  options?: LibraryTrackSearchOptions<TTrack>,
): string[] {
  return buildLibraryTrackSearchIndexEntry(track, options).searchableTokens;
}