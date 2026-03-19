import type { IndexedMoment } from "./playerMomentIndex";

export type MomentSearchFilters = {
  query?: string;
  minStart?: number | null;
  maxStart?: number | null;
  minDuration?: number | null;
  maxDuration?: number | null;
  instruments?: string[];
  moods?: string[];
  textures?: string[];
  tags?: string[];
  requireLoop?: boolean;
  requireTransition?: boolean;
  requireImpact?: boolean;
};

export type MomentSearchResult = {
  moment: IndexedMoment;
  score: number;
  reasons: string[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeList(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];

  return uniqStrings(values.map((value) => normalizeText(value))).filter(Boolean);
}

function splitQueryTokens(query: string): string[] {
  return uniqStrings(
    normalizeText(query)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
  );
}

function getMomentSearchBlob(moment: IndexedMoment): string {
  return [
    moment.trackTitle,
    moment.trackArtist,
    moment.label,
    moment.description,
    moment.searchableText,
    ...moment.trackTags,
    ...moment.sectionTags,
    ...moment.combinedTags,
    ...moment.instruments,
    ...moment.moods,
    ...moment.textures,
    moment.source ?? "",
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ")
    .trim();
}

function includesAny(haystack: string[], needles: string[]): boolean {
  if (!needles.length) return true;
  if (!haystack.length) return false;

  const set = new Set(haystack.map((value) => normalizeText(value)));
  return needles.some((needle) => set.has(normalizeText(needle)));
}

function scoreTextMatch(blob: string, query: string): { score: number; reasons: string[] } {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return { score: 0, reasons: [] };

  const reasons: string[] = [];
  let score = 0;

  if (blob === cleanQuery) {
    score += 120;
    reasons.push("exact-text");
    return { score, reasons };
  }

  if (blob.includes(cleanQuery)) {
    score += 60;
    reasons.push("phrase-match");
  }

  const tokens = splitQueryTokens(cleanQuery);
  const matchedTokens = tokens.filter((token) => blob.includes(token));

  if (matchedTokens.length) {
    score += matchedTokens.length * 12;
    reasons.push(`token-match:${matchedTokens.length}`);
  }

  if (tokens.length && matchedTokens.length === tokens.length) {
    score += 20;
    reasons.push("all-tokens");
  }

  return { score, reasons };
}

function scoreListMatch(
  label: string,
  haystack: string[],
  needles: string[]
): { score: number; reasons: string[] } {
  if (!needles.length) return { score: 0, reasons: [] };

  const normalizedHaystack = normalizeList(haystack);
  const normalizedNeedles = normalizeList(needles);

  const matched = normalizedNeedles.filter((needle) =>
    normalizedHaystack.includes(needle)
  );

  if (!matched.length) return { score: 0, reasons: [] };

  return {
    score: matched.length * 15,
    reasons: matched.map((value) => `${label}:${value}`),
  };
}

function passesTimingFilters(
  moment: IndexedMoment,
  filters: MomentSearchFilters
): boolean {
  if (
    typeof filters.minStart === "number" &&
    Number.isFinite(filters.minStart) &&
    moment.start < filters.minStart
  ) {
    return false;
  }

  if (
    typeof filters.maxStart === "number" &&
    Number.isFinite(filters.maxStart) &&
    moment.start > filters.maxStart
  ) {
    return false;
  }

  if (
    typeof filters.minDuration === "number" &&
    Number.isFinite(filters.minDuration) &&
    moment.duration < filters.minDuration
  ) {
    return false;
  }

  if (
    typeof filters.maxDuration === "number" &&
    Number.isFinite(filters.maxDuration) &&
    moment.duration > filters.maxDuration
  ) {
    return false;
  }

  return true;
}

function passesBooleanFilters(
  moment: IndexedMoment,
  filters: MomentSearchFilters
): boolean {
  if (filters.requireLoop && !moment.isLoop) return false;
  if (filters.requireTransition && !moment.isTransition) return false;
  if (filters.requireImpact && !moment.isImpact) return false;

  return true;
}

function passesListFilters(
  moment: IndexedMoment,
  filters: MomentSearchFilters
): boolean {
  const instruments = normalizeList(filters.instruments);
  const moods = normalizeList(filters.moods);
  const textures = normalizeList(filters.textures);
  const tags = normalizeList(filters.tags);

  if (instruments.length && !includesAny(moment.instruments, instruments)) {
    return false;
  }

  if (moods.length && !includesAny(moment.moods, moods)) {
    return false;
  }

  if (textures.length && !includesAny(moment.textures, textures)) {
    return false;
  }

  if (tags.length && !includesAny(moment.combinedTags, tags)) {
    return false;
  }

  return true;
}

export function scoreIndexedMoment(
  moment: IndexedMoment,
  filters: MomentSearchFilters = {}
): MomentSearchResult | null {
  if (!passesTimingFilters(moment, filters)) return null;
  if (!passesBooleanFilters(moment, filters)) return null;
  if (!passesListFilters(moment, filters)) return null;

  const reasons: string[] = [];
  let score = 0;

  const blob = getMomentSearchBlob(moment);
  const query = normalizeText(filters.query);

  if (query) {
    const textMatch = scoreTextMatch(blob, query);
    if (!textMatch.score) return null;

    score += textMatch.score;
    reasons.push(...textMatch.reasons);
  }

  const tagMatch = scoreListMatch("tag", moment.combinedTags, filters.tags ?? []);
  score += tagMatch.score;
  reasons.push(...tagMatch.reasons);

  const instrumentMatch = scoreListMatch(
    "instrument",
    moment.instruments,
    filters.instruments ?? []
  );
  score += instrumentMatch.score;
  reasons.push(...instrumentMatch.reasons);

  const moodMatch = scoreListMatch("mood", moment.moods, filters.moods ?? []);
  score += moodMatch.score;
  reasons.push(...moodMatch.reasons);

  const textureMatch = scoreListMatch(
    "texture",
    moment.textures,
    filters.textures ?? []
  );
  score += textureMatch.score;
  reasons.push(...textureMatch.reasons);

  if (filters.requireLoop && moment.isLoop) {
    score += 8;
    reasons.push("loop");
  }

  if (filters.requireTransition && moment.isTransition) {
    score += 8;
    reasons.push("transition");
  }

  if (filters.requireImpact && moment.isImpact) {
    score += 8;
    reasons.push("impact");
  }

  if (typeof moment.confidence === "number" && Number.isFinite(moment.confidence)) {
    score += Math.max(0, Math.round(moment.confidence * 10));
  }

  return {
    moment,
    score,
    reasons: uniqStrings(reasons),
  };
}

export function searchIndexedMoments(
  moments: IndexedMoment[],
  filters: MomentSearchFilters = {}
): MomentSearchResult[] {
  if (!Array.isArray(moments) || !moments.length) return [];

  return moments
    .map((moment) => scoreIndexedMoment(moment, filters))
    .filter((result): result is MomentSearchResult => Boolean(result))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.moment.start !== b.moment.start) return a.moment.start - b.moment.start;
      return a.moment.label.localeCompare(b.moment.label);
    });
}