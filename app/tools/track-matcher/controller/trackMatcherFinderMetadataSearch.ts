import type {
  TrackMatcherMetadataCategory,
  TrackMatcherMetadataProfile,
  TrackMatcherMetadataToken,
} from "./trackMatcherFinderMetadataTypes";

export type TrackMatcherMetadataSearchResult = {
  profile: TrackMatcherMetadataProfile;
  score: number;
  matchedTokens: string[];
  matchedCategories: string[];
};

type MetadataProfileFieldMatch = {
  category: TrackMatcherMetadataCategory;
  tokens: readonly string[];
  score: number;
};

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function tokenize(value: unknown) {
  return normalize(value)
    .split(/\s+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(normalize).filter(Boolean)));
}

function fieldIncludesTerm(values: readonly string[], term: string) {
  return values.some((value) => normalize(value).includes(term));
}

function phraseIncludesTerm(value: unknown, term: string) {
  return normalize(value).includes(term);
}

function addMatchedToken(
  matchedTokens: Set<string>,
  matchedCategories: Set<string>,
  token: string,
  category: TrackMatcherMetadataCategory,
) {
  const cleanToken = normalize(token);
  if (!cleanToken) return;
  matchedTokens.add(cleanToken);
  matchedCategories.add(category);
}

function tokenScore(token: TrackMatcherMetadataToken) {
  if (token.confidence === "verified") return token.score + 30;
  if (token.confidence === "inferred") return token.score + 15;
  return token.score;
}

function getFieldMatches(
  profile: TrackMatcherMetadataProfile,
): MetadataProfileFieldMatch[] {
  return [
    {
      category: "genre",
      tokens: profile.genres,
      score: 34,
    },
    {
      category: "mood",
      tokens: profile.moods,
      score: 30,
    },
    {
      category: "instrument",
      tokens: profile.instruments,
      score: 32,
    },
    {
      category: "stem",
      tokens: profile.stemTypes,
      score: 36,
    },
    {
      category: "vocal",
      tokens: profile.vocalTypes,
      score: 34,
    },
    {
      category: "workflow",
      tokens: profile.workflowFlags,
      score: 28,
    },
  ];
}

function scoreTitleAndText(
  profile: TrackMatcherMetadataProfile,
  term: string,
  matchedTokens: Set<string>,
  matchedCategories: Set<string>,
) {
  let score = 0;
  const title = normalize(profile.title);

  if (title === term) {
    score += 120;
    addMatchedToken(matchedTokens, matchedCategories, profile.title, "workflow");
  } else if (title.includes(term)) {
    score += 60;
    addMatchedToken(matchedTokens, matchedCategories, profile.title, "workflow");
  }

  if (profile.searchableText.includes(term)) {
    score += 25;
  }

  return score;
}

function scoreMetadataTokenMatches(
  profile: TrackMatcherMetadataProfile,
  term: string,
  matchedTokens: Set<string>,
  matchedCategories: Set<string>,
) {
  let score = 0;

  for (const token of profile.metadataTokens) {
    const normalizedToken = normalize(token.token);

    if (normalizedToken === term) {
      score += tokenScore(token) + 30;
      addMatchedToken(matchedTokens, matchedCategories, token.token, token.category);
      continue;
    }

    if (normalizedToken.includes(term) || term.includes(normalizedToken)) {
      score += tokenScore(token);
      addMatchedToken(matchedTokens, matchedCategories, token.token, token.category);
    }
  }

  return score;
}

function scoreProfileFieldMatches(
  profile: TrackMatcherMetadataProfile,
  term: string,
  matchedTokens: Set<string>,
  matchedCategories: Set<string>,
) {
  let score = 0;

  for (const field of getFieldMatches(profile)) {
    if (!fieldIncludesTerm(field.tokens, term)) continue;

    score += field.score;

    field.tokens
      .filter((token) => phraseIncludesTerm(token, term))
      .forEach((token) =>
        addMatchedToken(matchedTokens, matchedCategories, token, field.category),
      );
  }

  return score;
}

function scoreKeywordMatches(
  profile: TrackMatcherMetadataProfile,
  term: string,
  matchedTokens: Set<string>,
  matchedCategories: Set<string>,
) {
  let score = 0;

  for (const keyword of profile.generatedKeywords) {
    const normalizedKeyword = normalize(keyword);

    if (normalizedKeyword === term) {
      score += 20;
      addMatchedToken(matchedTokens, matchedCategories, keyword, "workflow");
      continue;
    }

    if (normalizedKeyword.includes(term) || term.includes(normalizedKeyword)) {
      score += 12;
      addMatchedToken(matchedTokens, matchedCategories, keyword, "workflow");
    }
  }

  return score;
}

function getCategoryDiversityBoost(matchedCategories: Set<string>) {
  const categoryCount = matchedCategories.size;

  if (categoryCount >= 5) return 40;
  if (categoryCount >= 4) return 28;
  if (categoryCount >= 3) return 18;
  if (categoryCount >= 2) return 8;

  return 0;
}

function getConfidenceBoost(profile: TrackMatcherMetadataProfile) {
  if (profile.confidenceScore >= 120) return 24;
  if (profile.confidenceScore >= 80) return 16;
  if (profile.confidenceScore >= 40) return 8;
  return 0;
}

function scoreMetadataProfile(
  profile: TrackMatcherMetadataProfile,
  terms: readonly string[],
): TrackMatcherMetadataSearchResult {
  const matchedTokens = new Set<string>();
  const matchedCategories = new Set<string>();
  let score = 0;

  for (const term of terms) {
    score += scoreTitleAndText(profile, term, matchedTokens, matchedCategories);
    score += scoreMetadataTokenMatches(
      profile,
      term,
      matchedTokens,
      matchedCategories,
    );
    score += scoreProfileFieldMatches(
      profile,
      term,
      matchedTokens,
      matchedCategories,
    );
    score += scoreKeywordMatches(profile, term, matchedTokens, matchedCategories);
  }

  score += getCategoryDiversityBoost(matchedCategories);
  score += getConfidenceBoost(profile);

  return {
    profile,
    score,
    matchedTokens: [...matchedTokens],
    matchedCategories: [...matchedCategories],
  };
}

function buildDefaultMetadataSearchResult(
  profile: TrackMatcherMetadataProfile,
): TrackMatcherMetadataSearchResult {
  const matchedTokens = unique([
    ...profile.generatedKeywords,
    ...profile.metadataTokens.map((token) => token.token),
  ]);

  const matchedCategories = unique(
    profile.metadataTokens.map((token) => token.category),
  );

  return {
    profile,
    score: profile.confidenceScore + getConfidenceBoost(profile),
    matchedTokens,
    matchedCategories,
  };
}

export function searchTrackMatcherMetadataProfiles(
  profiles: readonly TrackMatcherMetadataProfile[],
  query: string,
): TrackMatcherMetadataSearchResult[] {
  const terms = tokenize(query);

  if (!terms.length) {
    return profiles
      .map((profile) => buildDefaultMetadataSearchResult(profile))
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return a.profile.title.localeCompare(b.profile.title);
      });
  }

  return profiles
    .map((profile) => scoreMetadataProfile(profile, terms))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.matchedCategories.length !== b.matchedCategories.length) {
        return b.matchedCategories.length - a.matchedCategories.length;
      }
      if (a.matchedTokens.length !== b.matchedTokens.length) {
        return b.matchedTokens.length - a.matchedTokens.length;
      }
      return a.profile.title.localeCompare(b.profile.title);
    });
}

export function getMetadataSearchTokenSuggestions(
  profiles: readonly TrackMatcherMetadataProfile[],
) {
  const tokens = new Set<string>();

  for (const profile of profiles) {
    profile.generatedKeywords.forEach((token) => tokens.add(normalize(token)));
    profile.metadataTokens.forEach((token) => tokens.add(normalize(token.token)));
    profile.genres.forEach((token) => tokens.add(normalize(token)));
    profile.moods.forEach((token) => tokens.add(normalize(token)));
    profile.instruments.forEach((token) => tokens.add(normalize(token)));
    profile.stemTypes.forEach((token) => tokens.add(normalize(token)));
    profile.vocalTypes.forEach((token) => tokens.add(normalize(token)));
    profile.workflowFlags.forEach((token) => tokens.add(normalize(token)));
  }

  return [...tokens].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export function getMetadataSearchCategorySuggestions(
  profiles: readonly TrackMatcherMetadataProfile[],
) {
  const categories = new Set<string>();

  for (const profile of profiles) {
    profile.metadataTokens.forEach((token) => categories.add(token.category));
  }

  return [...categories].sort((a, b) => a.localeCompare(b));
}

export function getTopMetadataSearchResults(
  profiles: readonly TrackMatcherMetadataProfile[],
  query: string,
  limit = 12,
) {
  return searchTrackMatcherMetadataProfiles(profiles, query).slice(0, limit);
}
