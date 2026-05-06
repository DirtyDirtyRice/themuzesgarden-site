import { slugify } from "@/app/metadata/create/metadataCreateUtils";
import type { MetadataRecord } from "@/lib/metadata/metadataLibraryTypes";
import { cleanText, type RelationshipType } from "./metadataEditHelpers";

export type RecordSummaryOption = {
  id: string;
  title: string;
  slug: string;
};

type BuildRelationshipOptionsArgs = {
  title: string;
  record: MetadataRecord;
  relationshipType: RelationshipType;
  currentRelationshipId: string;
  starterRelationshipOptions: RecordSummaryOption[];
};

export function buildRelationshipOptions({
  title,
  record,
  relationshipType,
  currentRelationshipId,
  starterRelationshipOptions,
}: BuildRelationshipOptionsArgs): RecordSummaryOption[] {
  const currentSlug = slugify(title);

  return starterRelationshipOptions.filter((summaryRecord) => {
    if (summaryRecord.id === record.id) return false;
    if (summaryRecord.slug === currentSlug) return false;

    const alreadyExists = (record.relationships ?? []).some((relationship) => {
      const relationshipId = cleanText(relationship?.id);
      const targetRecordId = cleanText(relationship?.targetRecordId);
      const type = cleanText(relationship?.type);

      if (relationshipId && relationshipId === currentRelationshipId) {
        return false;
      }

      return (
        targetRecordId === cleanText(summaryRecord.id) &&
        type === cleanText(relationshipType)
      );
    });

    return !alreadyExists;
  });
}

export function findSelectedRelatedRecord(
  relationshipOptions: RecordSummaryOption[],
  relatedRecordId: string
): RecordSummaryOption | null {
  return (
    relationshipOptions.find(
      (summaryRecord) => summaryRecord.id === relatedRecordId
    ) ?? null
  );
}

export function hasDuplicateRelationshipSelection({
  record,
  selectedRelatedRecord,
  relationshipType,
  currentRelationshipId,
}: {
  record: MetadataRecord;
  selectedRelatedRecord: RecordSummaryOption | null;
  relationshipType: RelationshipType;
  currentRelationshipId: string;
}): boolean {
  const selectedTargetId = cleanText(selectedRelatedRecord?.id);
  const selectedType = cleanText(relationshipType);

  if (!selectedTargetId || !selectedType) return false;

  return (record.relationships ?? []).some((relationship) => {
    const relationshipId = cleanText(relationship?.id);
    const targetRecordId = cleanText(relationship?.targetRecordId);
    const type = cleanText(relationship?.type);

    if (relationshipId && relationshipId === currentRelationshipId) {
      return false;
    }

    return targetRecordId === selectedTargetId && type === selectedType;
  });
}