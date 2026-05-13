import { getMetadataRecords } from "@/lib/metadata/metadataLibrarySeed";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

const MAX_FIND_IT_METADATA_RESULTS = 8;

type MetadataSeedRecord = ReturnType<typeof getMetadataRecords>[number];

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function getMetadataSearchTokens(searchValue: string) {
  return normalizeSearchText(searchValue)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 8);
}

function getMetadataFieldText(record: MetadataSeedRecord) {
  return record.fields
    .map((field) => {
      if (Array.isArray(field.value)) {
        return field.value.join(" ");
      }

      return String(field.value);
    })
    .join(" ");
}

function getMetadataRelationshipText(record: MetadataSeedRecord) {
  return record.relationships
    .map((relationship) =>
      [
        relationship.type,
        relationship.targetLabel,
        relationship.targetSlug,
        relationship.note,
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ");
}

function getMetadataRecordSearchText(record: MetadataSeedRecord) {
  return normalizeSearchText(
    [
      record.title,
      record.slug,
      record.shelf,
      record.section,
      record.excerpt,
      record.description,
      getMetadataFieldText(record),
      getMetadataRelationshipText(record),
    ].join(" "),
  );
}

function scoreMetadataRecord(record: MetadataSeedRecord, tokens: string[]) {
  const title = normalizeSearchText(record.title);
  const slug = normalizeSearchText(record.slug);
  const shelf = normalizeSearchText(record.shelf);
  const section = normalizeSearchText(record.section);
  const excerpt = normalizeSearchText(record.excerpt);
  const fullText = getMetadataRecordSearchText(record);

  return tokens.reduce((score, token) => {
    if (title === token || slug === token) return score + 12;
    if (title.startsWith(token) || slug.startsWith(token)) return score + 8;
    if (title.includes(token) || slug.includes(token)) return score + 6;
    if (shelf.includes(token) || section.includes(token)) return score + 4;
    if (excerpt.includes(token)) return score + 3;
    if (fullText.includes(token)) return score + 1;

    return score;
  }, 0);
}

function getMetadataMatchedBy(record: MetadataSeedRecord, tokens: string[]) {
  const title = normalizeSearchText(record.title);
  const slug = normalizeSearchText(record.slug);
  const shelf = normalizeSearchText(record.shelf);
  const section = normalizeSearchText(record.section);
  const excerpt = normalizeSearchText(record.excerpt);
  const fullText = getMetadataRecordSearchText(record);

  if (tokens.some((token) => title.includes(token))) {
    return "title";
  }

  if (tokens.some((token) => slug.includes(token))) {
    return "slug";
  }

  if (tokens.some((token) => shelf.includes(token))) {
    return "shelf";
  }

  if (tokens.some((token) => section.includes(token))) {
    return "section";
  }

  if (tokens.some((token) => excerpt.includes(token))) {
    return "excerpt";
  }

  if (tokens.some((token) => fullText.includes(token))) {
    return "metadata";
  }

  return "metadata";
}

export function getFindItMetadataResults(
  searchValue: string,
): NavigationSearchResult[] {
  const tokens = getMetadataSearchTokens(searchValue);

  if (tokens.length === 0) {
    return [];
  }

  return getMetadataRecords()
    .map((record) => ({
      record,
      score: scoreMetadataRecord(record, tokens),
    }))
    .filter((match) => match.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return first.record.title.localeCompare(second.record.title);
    })
    .slice(0, MAX_FIND_IT_METADATA_RESULTS)
    .map(({ record, score }) => ({
      node: {
        id: `metadata-record-${record.slug}`,
        label: record.title,
        description: record.excerpt,
        href: `/metadata/${record.slug}`,
        kind: "page",
        keywords: [
          "metadata",
          "record",
          record.shelf,
          record.section,
          record.slug,
          record.excerpt,
        ],
      },
      score,
      matchedBy: getMetadataMatchedBy(record, tokens),
      matchedText: record.excerpt,
      contextBoost: 0,
    }));
}