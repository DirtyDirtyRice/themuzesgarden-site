import { formatLabel } from "./metadataLibraryHelpers";
import {
  buildRelationshipScore,
  compareRelationshipScores,
} from "./MetadataLibraryRelationshipIntelligence";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  MetadataLibraryRelationshipSource,
  MetadataLibraryRelationshipStrength,
  MetadataLibraryScoredRelationshipRecord,
} from "./MetadataLibraryRelationshipTypes";

export function getStrength(
  record: MetadataLibraryRecordSummary,
  openRecord: MetadataLibraryRecordSummary,
): MetadataLibraryRelationshipStrength {
  if (
    record.shelf === openRecord.shelf &&
    record.section === openRecord.section
  ) {
    return "strong";
  }

  if (record.shelf === openRecord.shelf) return "medium";

  return "light";
}

export function groupByStrength(
  records: MetadataLibraryRecordSummary[],
  openRecord: MetadataLibraryRecordSummary,
  source: MetadataLibraryRelationshipSource,
  activeQuery: string,
) {
  const groups: Record<
    MetadataLibraryRelationshipStrength,
    MetadataLibraryScoredRelationshipRecord[]
  > = {
    strong: [],
    medium: [],
    light: [],
  };

  records.forEach((record) => {
    const strength = getStrength(record, openRecord);
    const score = buildRelationshipScore({
      record,
      openRecord,
      strength,
      source,
      activeQuery,
    });

    groups[strength].push({ record, score });
  });

  groups.strong.sort((first, second) =>
    compareRelationshipScores(first.score, second.score),
  );

  groups.medium.sort((first, second) =>
    compareRelationshipScores(first.score, second.score),
  );

  groups.light.sort((first, second) =>
    compareRelationshipScores(first.score, second.score),
  );

  return groups;
}

export function getStrengthDescription(
  strength: MetadataLibraryRelationshipStrength,
) {
  if (strength === "strong") return "Shares shelf and section";
  if (strength === "medium") return "Shares shelf";
  return "Indirect relation";
}

export function getSourceDescription(
  source: MetadataLibraryRelationshipSource,
) {
  if (source === "shelf") return "Opened from the same-shelf relationship lane";
  return "Opened from the same-section relationship lane";
}

export function getRelationshipReason({
  strength,
  source,
  record,
  openRecord,
}: {
  strength: MetadataLibraryRelationshipStrength;
  source: MetadataLibraryRelationshipSource;
  record: MetadataLibraryRecordSummary;
  openRecord: MetadataLibraryRecordSummary;
}) {
  if (strength === "strong") {
    return `Strong structural match: ${formatLabel(
      record.title,
    )} shares both ${formatLabel(openRecord.shelf)} and ${formatLabel(
      openRecord.section,
    )}.`;
  }

  if (source === "shelf") {
    return `Shelf relationship: ${formatLabel(record.title)} lives in the same ${formatLabel(
      openRecord.shelf,
    )} shelf.`;
  }

  return `Section relationship: ${formatLabel(record.title)} lives in the same ${formatLabel(
    openRecord.section,
  )} section.`;
}

export function getTrailLabel(
  strength: MetadataLibraryRelationshipStrength,
  source: MetadataLibraryRelationshipSource,
) {
  const strengthLabel =
    strength === "strong"
      ? "Strong"
      : strength === "medium"
        ? "Related"
        : "Loose";

  const sourceLabel = source === "shelf" ? "Same Shelf" : "Same Section";

  return `${strengthLabel} · ${sourceLabel}`;
}