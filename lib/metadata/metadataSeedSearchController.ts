import type { MetadataRecord } from "./metadataLibraryTypes";

type MetadataSearchMeaning = {
  title: string;
  excerpt: string;
  slug: string;
};

type MetadataSearchCandidate = {
  record: MetadataRecord;
  score: number;
};

const METADATA_SEARCH_ALIASES: Record<string, string[]> = {
  "c-major": [
    "c",
    "c maj",
    "c major",
    "key of c",
    "c key",
    "no sharps",
    "no flats",
  ],
  "major-scale": [
    "maj",
    "major",
    "scale",
    "major scale",
    "the major scale",
    "whole half",
    "whole whole half",
    "w w h",
  ],
  "find-it": [
    "find",
    "find it",
    "findit",
    "where is",
    "where do i go",
    "how do i get",
    "navigation helper",
    "path guidance",
  ],
};

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stringifyMetadataValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(" ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function slugToSearchText(slug: string): string {
  return normalizeSearchText(slug.replace(/-/g, " "));
}

function getRecordSearchTerms(record: MetadataRecord): string[] {
  const aliases = METADATA_SEARCH_ALIASES[record.slug] ?? [];
  const relationshipTerms = record.relationships.flatMap((relationship) => [
    relationship.targetLabel,
    relationship.targetSlug,
    relationship.note,
  ]);
  const fieldTerms = record.fields.flatMap((field) => [
    field.label,
    stringifyMetadataValue(field.value),
  ]);

  return [
    record.title,
    record.slug,
    slugToSearchText(record.slug),
    record.excerpt,
    record.description,
    record.shelf,
    record.section,
    ...aliases,
    ...relationshipTerms,
    ...fieldTerms,
  ]
    .filter((term): term is string => typeof term === "string")
    .map(normalizeSearchText)
    .filter(Boolean);
}

function getTermScore(query: string, term: string): number {
  if (!query || !term) {
    return 0;
  }

  if (term === query) {
    return 100;
  }

  if (term.startsWith(query)) {
    return 80;
  }

  if (term.includes(query)) {
    return 60;
  }

  if (query.includes(term) && term.length >= 3) {
    return 45;
  }

  const queryWords = query.split(" ");
  const termWords = term.split(" ");
  const allQueryWordsFound = queryWords.every((word) =>
    termWords.some((termWord) => termWord.startsWith(word) || termWord === word),
  );

  if (allQueryWordsFound) {
    return 35;
  }

  const sharedWords = queryWords.filter((word) =>
    termWords.some((termWord) => termWord === word || termWord.startsWith(word)),
  );

  return sharedWords.length > 0 ? sharedWords.length * 10 : 0;
}

function scoreMetadataRecord(query: string, record: MetadataRecord): number {
  const terms = getRecordSearchTerms(record);
  const bestTermScore = Math.max(
    ...terms.map((term) => getTermScore(query, term)),
  );
  const directAliasBonus = (METADATA_SEARCH_ALIASES[record.slug] ?? [])
    .map(normalizeSearchText)
    .includes(query)
    ? 30
    : 0;

  return bestTermScore + directAliasBonus;
}

function getBestMetadataSearchCandidate(
  query: string,
  records: MetadataRecord[],
): MetadataSearchCandidate | null {
  const candidates = records
    .map((record) => ({
      record,
      score: scoreMetadataRecord(query, record),
    }))
    .filter((candidate) => candidate.score >= 35)
    .sort((left, right) => right.score - left.score);

  return candidates[0] ?? null;
}

export function findMetadataMeaningForSearch(
  query: string,
  records: MetadataRecord[],
): MetadataSearchMeaning | null {
  const cleanQuery = normalizeSearchText(query);

  if (!cleanQuery) {
    return null;
  }

  const match = getBestMetadataSearchCandidate(cleanQuery, records);

  if (!match) {
    return null;
  }

  return {
    title: match.record.title,
    excerpt: match.record.excerpt,
    slug: match.record.slug,
  };
}