import type {
  CurrentLocationSummary,
  FindItMatch,
  FindItTarget,
} from "./findItTypes";
import { FIND_IT_TARGETS } from "./findItTargets";

const MAX_RESULTS = 5;
const MAX_SUGGESTIONS = 5;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "for",
  "get",
  "go",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "page",
  "show",
  "take",
  "the",
  "to",
  "want",
  "where",
]);

const KNOWN_PHRASE_BOOSTS = [
  "relationship",
  "relationships",
  "record",
  "create record",
  "open record",
  "edit record",
  "delete record",
  "required fields",
  "placement",
  "metadata library",
  "metadata system",
  "more information",
  "find it",
  "library",
  "listen",
  "live",
  "members",
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getCurrentLocationLabel(pathname: string) {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/metadata/create")) return "Metadata → Create";
  if (pathname.startsWith("/metadata/library")) return "Metadata → Library";
  if (pathname.startsWith("/metadata/system")) return "Metadata → System";
  if (pathname.startsWith("/metadata/")) return "Metadata → Record page";
  if (pathname.startsWith("/metadata")) return "Metadata Home";
  if (pathname.startsWith("/library")) return "Library";
  if (pathname.startsWith("/listen")) return "Listen";
  if (pathname.startsWith("/live")) return "Live";
  if (pathname.startsWith("/members")) return "Members";
  return "Current page";
}

export function getCurrentTreeSteps(pathname: string) {
  if (pathname.startsWith("/metadata/create")) {
    return ["Home", "Metadata", "Create"];
  }

  if (pathname.startsWith("/metadata/library")) {
    return ["Home", "Metadata", "Library"];
  }

  if (pathname.startsWith("/metadata/system")) {
    return ["Home", "Metadata", "System"];
  }

  if (pathname.startsWith("/metadata/")) {
    return ["Home", "Metadata", "Library", "Record page"];
  }

  if (pathname.startsWith("/metadata")) {
    return ["Home", "Metadata"];
  }

  if (pathname === "/") return ["Home"];

  return ["Home", getCurrentLocationLabel(pathname)];
}

export function getCurrentLocationSummary(
  pathname: string,
): CurrentLocationSummary {
  return {
    label: getCurrentLocationLabel(pathname),
    steps: getCurrentTreeSteps(pathname),
  };
}

export function normalizeFindItSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/find\s+it/g, "findit")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSearchWords(value: string) {
  const cleanValue = normalizeFindItSearch(value);

  if (!cleanValue) return [];

  return cleanValue
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function getTargetSearchText(target: FindItTarget) {
  return [
    target.label,
    target.shortLabel,
    target.category,
    target.detail,
    target.route,
    ...target.steps,
    ...target.keywords,
  ]
    .join(" ")
    .toLowerCase();
}

function getTargetSuggestionWords(target: FindItTarget) {
  return [
    target.shortLabel,
    target.label,
    target.category,
    ...target.steps,
    ...target.keywords,
  ]
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => normalizeFindItSearch(word))
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function getKnownVocabulary() {
  const vocabulary = new Set<string>();

  KNOWN_PHRASE_BOOSTS.forEach((phrase) => vocabulary.add(phrase));

  FIND_IT_TARGETS.forEach((target) => {
    vocabulary.add(target.shortLabel.toLowerCase());
    vocabulary.add(target.label.toLowerCase());
    target.keywords.forEach((keyword) => vocabulary.add(keyword.toLowerCase()));
    getTargetSuggestionWords(target).forEach((word) => vocabulary.add(word));
  });

  return Array.from(vocabulary)
    .map((word) => normalizeFindItSearch(word))
    .filter((word) => word.length > 2);
}

function getEditDistance(first: string, second: string) {
  if (first === second) return 0;
  if (!first.length) return second.length;
  if (!second.length) return first.length;

  const previousRow = Array.from(
    { length: second.length + 1 },
    (_, index) => index,
  );
  const currentRow = Array.from({ length: second.length + 1 }, () => 0);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    currentRow[0] = firstIndex;

    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const substitutionCost =
        first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;

      currentRow[secondIndex] = Math.min(
        currentRow[secondIndex - 1] + 1,
        previousRow[secondIndex] + 1,
        previousRow[secondIndex - 1] + substitutionCost,
      );
    }

    for (let index = 0; index <= second.length; index += 1) {
      previousRow[index] = currentRow[index];
    }
  }

  return previousRow[second.length];
}

function getFuzzyWordScore(word: string, target: FindItTarget) {
  if (word.length < 4) return 0;

  const candidates = getTargetSuggestionWords(target);
  const bestDistance = Math.min(
    ...candidates.map((candidate) => getEditDistance(word, candidate)),
  );
  const allowedDistance = word.length > 8 ? 3 : 2;

  if (bestDistance <= 1) return 9;
  if (bestDistance <= allowedDistance) return 5;

  return 0;
}

function getWordScore(word: string, target: FindItTarget) {
  const exactKeywordMatch = target.keywords.some(
    (keyword) => keyword.toLowerCase() === word,
  );
  const looseKeywordMatch = target.keywords.some((keyword) =>
    keyword.toLowerCase().includes(word),
  );
  const labelMatch = target.label.toLowerCase().includes(word);
  const shortLabelMatch = target.shortLabel.toLowerCase().includes(word);
  const routeMatch = target.route.toLowerCase().includes(word);
  const stepMatch = target.steps.some((step) =>
    step.toLowerCase().includes(word),
  );
  const detailMatch = target.detail.toLowerCase().includes(word);
  const fuzzyScore = getFuzzyWordScore(word, target);

  if (exactKeywordMatch) return 20;
  if (shortLabelMatch) return 16;
  if (labelMatch) return 14;
  if (routeMatch) return 10;
  if (looseKeywordMatch) return 8;
  if (stepMatch) return 6;
  if (fuzzyScore > 0) return fuzzyScore;
  if (detailMatch) return 3;

  return 0;
}

function scoreTarget(target: FindItTarget, words: string[], cleanSearch: string) {
  const searchableText = getTargetSearchText(target);
  const phraseBonus =
    cleanSearch.length > 2 && searchableText.includes(cleanSearch) ? 30 : 0;
  const matchedWords = words.filter((word) => {
    const directMatch = searchableText.includes(word);
    const fuzzyMatch = getFuzzyWordScore(word, target) > 0;

    return directMatch || fuzzyMatch;
  });
  const wordScore = words.reduce(
    (total, word) => total + getWordScore(word, target),
    0,
  );
  const coverageBonus =
    words.length > 0 ? Math.round((matchedWords.length / words.length) * 10) : 0;

  return {
    matchedWords,
    score: phraseBonus + wordScore + coverageBonus,
  };
}

function isFindItMatch(match: FindItMatch | null): match is FindItMatch {
  return match !== null;
}

export function findItMatches(searchValue: string): FindItMatch[] {
  const cleanSearch = normalizeFindItSearch(searchValue);
  const words = getSearchWords(searchValue);

  if (!cleanSearch || words.length === 0) return [];

  return FIND_IT_TARGETS.map((target) => {
    const result = scoreTarget(target, words, cleanSearch);

    return {
      target,
      score: result.score,
      matchedWords: result.matchedWords,
    };
  })
    .filter((match) => match.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score;
      return first.target.label.localeCompare(second.target.label);
    })
    .slice(0, MAX_RESULTS);
}

export function getDefaultFindItMatches(pathname: string): FindItMatch[] {
  const currentSummary = getCurrentLocationSummary(pathname);
  const currentText = currentSummary.label.toLowerCase();

  const preferredIds = currentText.includes("metadata")
    ? [
        "metadata-library",
        "metadata-create-record",
        "metadata-relationships",
        "metadata-system",
      ]
    : ["metadata-find-it-help", "main-library", "metadata-library", "listen"];

  return preferredIds
    .map((id, index): FindItMatch | null => {
      const target = FIND_IT_TARGETS.find((item) => item.id === id);

      if (!target) return null;

      return {
        target,
        score: 1 - index / 10,
        matchedWords: [],
      };
    })
    .filter(isFindItMatch);
}

export function getFindItSuggestionPhrases(searchValue: string) {
  const cleanSearch = normalizeFindItSearch(searchValue);
  const words = getSearchWords(searchValue);

  if (!cleanSearch || words.length === 0) return [];

  const vocabulary = getKnownVocabulary();
  const suggestions = new Map<string, number>();

  vocabulary.forEach((candidate) => {
    const distance = getEditDistance(cleanSearch, candidate);
    const candidateIncludesSearch = candidate.includes(cleanSearch);
    const searchIncludesCandidate = cleanSearch.includes(candidate);
    const wordDistance = Math.min(
      ...words.map((word) => getEditDistance(word, candidate)),
    );
    const allowedDistance = cleanSearch.length > 8 ? 4 : 3;

    let score = 0;

    if (candidateIncludesSearch || searchIncludesCandidate) score += 18;
    if (distance > 0 && distance <= allowedDistance) score += 16 - distance;
    if (wordDistance > 0 && wordDistance <= 2) score += 10 - wordDistance;
    if (KNOWN_PHRASE_BOOSTS.includes(candidate)) score += 5;

    if (score > 0 && candidate !== cleanSearch) {
      suggestions.set(
        candidate,
        Math.max(suggestions.get(candidate) ?? 0, score),
      );
    }
  });

  return Array.from(suggestions.entries())
    .sort((first, second) => {
      if (second[1] !== first[1]) return second[1] - first[1];
      return first[0].localeCompare(second[0]);
    })
    .slice(0, MAX_SUGGESTIONS)
    .map(([suggestion]) => suggestion);
}

export function getFindItEmptyMessage(searchValue: string) {
  if (!searchValue.trim()) {
    return "Type what you are trying to find, or click one of the suggested starting points.";
  }

  return "No exact match yet. Try words like relationship, create record, library, required fields, placement, listen, or members.";
}