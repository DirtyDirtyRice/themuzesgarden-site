import { getMetadataRecords } from "@/lib/metadata/metadataLibrarySeed";

type MetadataSeedRecord = ReturnType<typeof getMetadataRecords>[number];

export type FindItRelationshipSummary = {
  id: string;
  sourceLabel: string;
  sourceSlug: string;
  targetLabel: string;
  targetSlug?: string;
  type: string;
  note?: string;
};

function normalizeRelationshipSearchText(value: string) {
  return value.trim().toLowerCase();
}

function getRelationshipText(summary: FindItRelationshipSummary) {
  return normalizeRelationshipSearchText(
    [
      summary.sourceLabel,
      summary.sourceSlug,
      summary.targetLabel,
      summary.targetSlug,
      summary.type,
      summary.note,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function getFindItRelationshipSummaries(): FindItRelationshipSummary[] {
  return getMetadataRecords().flatMap((record: MetadataSeedRecord) =>
    record.relationships.map((relationship) => ({
      id: relationship.id,
      sourceLabel: record.title,
      sourceSlug: record.slug,
      targetLabel: relationship.targetLabel,
      targetSlug: relationship.targetSlug,
      type: relationship.type,
      note: relationship.note,
    })),
  );
}

export function getFindItRelationshipSummariesForRecordSlug(
  recordSlug: string,
): FindItRelationshipSummary[] {
  const cleanSlug = normalizeRelationshipSearchText(recordSlug);

  if (!cleanSlug) {
    return [];
  }

  return getFindItRelationshipSummaries().filter(
    (summary) =>
      normalizeRelationshipSearchText(summary.sourceSlug) === cleanSlug ||
      normalizeRelationshipSearchText(summary.targetSlug ?? "") === cleanSlug,
  );
}

export function getFindItRelationshipSummariesForSearch(
  searchValue: string,
): FindItRelationshipSummary[] {
  const cleanSearchValue = normalizeRelationshipSearchText(searchValue);

  if (!cleanSearchValue) {
    return [];
  }

  const tokens = cleanSearchValue
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  if (tokens.length === 0) {
    return [];
  }

  return getFindItRelationshipSummaries()
    .map((summary) => ({
      summary,
      score: tokens.reduce((score, token) => {
        const relationshipText = getRelationshipText(summary);

        if (normalizeRelationshipSearchText(summary.sourceLabel).includes(token)) {
          return score + 5;
        }

        if (normalizeRelationshipSearchText(summary.targetLabel).includes(token)) {
          return score + 5;
        }

        if (normalizeRelationshipSearchText(summary.type).includes(token)) {
          return score + 3;
        }

        if (relationshipText.includes(token)) {
          return score + 1;
        }

        return score;
      }, 0),
    }))
    .filter((match) => match.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return first.summary.sourceLabel.localeCompare(second.summary.sourceLabel);
    })
    .map((match) => match.summary);
}