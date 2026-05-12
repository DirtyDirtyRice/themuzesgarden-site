import { getMetadataRelationshipNetworkForRecord } from "@/lib/metadata/metadataRelationshipServiceFetch";
import type { MetadataRelationshipQueryClient } from "@/lib/metadata/metadataRelationshipQueries";
import type { MetadataRelationshipServiceResult } from "@/lib/metadata/metadataRelationshipServiceResults";

import type { NavigationSearchInjectedRecord } from "./navigationSearch";

type RelationshipRecord = MetadataRelationshipServiceResult["relationships"][number];

function getRelationshipTextField(
  relationship: RelationshipRecord,
  fieldName: string,
) {
  const value = (relationship as Record<string, unknown>)[fieldName];

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function getRelationshipStrength(relationship: RelationshipRecord) {
  const value = (relationship as Record<string, unknown>).strength;

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return null;
}

function getRelationshipTypeLabel(relationship: RelationshipRecord) {
  return (
    getRelationshipTextField(relationship, "typeLabel") ||
    getRelationshipTextField(relationship, "relationshipType") ||
    getRelationshipTextField(relationship, "type") ||
    getRelationshipTextField(relationship, "label") ||
    "Related metadata"
  );
}

function getRelationshipDisplayLabel({
  relationship,
  slug,
}: {
  relationship: RelationshipRecord;
  slug: string;
}) {
  return (
    getRelationshipTextField(relationship, "targetLabel") ||
    getRelationshipTextField(relationship, "targetTitle") ||
    getRelationshipTextField(relationship, "targetName") ||
    getRelationshipTextField(relationship, "sourceLabel") ||
    getRelationshipTextField(relationship, "sourceTitle") ||
    getRelationshipTextField(relationship, "sourceName") ||
    slug ||
    "Unknown"
  );
}

function createNavigationRecordFromRelationship({
  relationship,
  currentSlug,
}: {
  relationship: RelationshipRecord;
  currentSlug: string;
}): NavigationSearchInjectedRecord | null {
  const sourceSlug = relationship.sourceSlug ?? "";
  const targetSlug = relationship.targetSlug ?? "";
  const isSource = sourceSlug === currentSlug;
  const relatedSlug = isSource ? targetSlug : sourceSlug;

  if (!relatedSlug) {
    return null;
  }

  const relationshipType = getRelationshipTypeLabel(relationship);
  const label = getRelationshipDisplayLabel({
    relationship,
    slug: relatedSlug,
  });

  return {
    id: relatedSlug,
    label,
    href: `/metadata/${relatedSlug}`,
    description: relationshipType,
    keywords: [
      relationshipType,
      getRelationshipTextField(relationship, "sourceLabel"),
      getRelationshipTextField(relationship, "sourceTitle"),
      getRelationshipTextField(relationship, "sourceName"),
      getRelationshipTextField(relationship, "targetLabel"),
      getRelationshipTextField(relationship, "targetTitle"),
      getRelationshipTextField(relationship, "targetName"),
      sourceSlug,
      targetSlug,
    ].filter((value) => value.trim().length > 0),
    relationshipType,
    sourceLabel:
      getRelationshipTextField(relationship, "sourceLabel") ||
      getRelationshipTextField(relationship, "sourceTitle") ||
      getRelationshipTextField(relationship, "sourceName") ||
      sourceSlug,
    targetLabel:
      getRelationshipTextField(relationship, "targetLabel") ||
      getRelationshipTextField(relationship, "targetTitle") ||
      getRelationshipTextField(relationship, "targetName") ||
      targetSlug,
    strength: getRelationshipStrength(relationship),
  };
}

function isNavigationInjectedRecord(
  record: NavigationSearchInjectedRecord | null,
): record is NavigationSearchInjectedRecord {
  return record !== null;
}

function extractRelatedRecords(
  result: MetadataRelationshipServiceResult,
  currentSlug: string,
): NavigationSearchInjectedRecord[] {
  if (!result.ok) {
    return [];
  }

  const records = result.relationships.map((relationship) =>
    createNavigationRecordFromRelationship({
      relationship,
      currentSlug,
    }),
  );

  return records.filter(isNavigationInjectedRecord);
}

export async function getNavigationRelatedRecords({
  client,
  recordSlug,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  recordSlug: string;
  tableName?: string;
}): Promise<NavigationSearchInjectedRecord[]> {
  try {
    const result = await getMetadataRelationshipNetworkForRecord({
      client,
      recordSlug,
      tableName,
    });

    return extractRelatedRecords(result, recordSlug);
  } catch (error) {
    console.error("FindIt relationship adapter error:", error);
    return [];
  }
}