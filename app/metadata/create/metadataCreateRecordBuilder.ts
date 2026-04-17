import {
  type MetadataRecord,
  type MetadataRecordField,
  type MetadataRelationship,
  type MetadataRelationshipType,
  type MetadataSectionKey,
  type MetadataShelfKey,
  type MetadataVisibility,
} from "@/lib/metadata/metadataLibraryTypes";
import { normalizeText, getRelationshipLabel } from "./metadataCreateUtils";

export type MetadataCreateRecordBuilderInput = {
  generatedSlug: string;
  trimmedTitle: string;
  trimmedSummary: string;
  trimmedBelongsReason: string;
  visibility: MetadataVisibility;
  recordType: string;
  relationshipType: MetadataRelationshipType;
  selectedShelfId: string;
  selectedSectionId: string;
  activeShelfKey?: MetadataShelfKey;
  activeSectionKey?: MetadataSectionKey;
  selectedRelatedRecord: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

export type MetadataCreateRecordBuilderResult = {
  finalRecord: MetadataRecord;
  finalRecordJson: string;
};

export function buildMetadataCreateRecord({
  generatedSlug,
  trimmedTitle,
  trimmedSummary,
  trimmedBelongsReason,
  visibility,
  recordType,
  relationshipType,
  selectedShelfId,
  selectedSectionId,
  activeShelfKey,
  activeSectionKey,
  selectedRelatedRecord,
}: MetadataCreateRecordBuilderInput): MetadataCreateRecordBuilderResult {
  const safeSlug = generatedSlug || "untitled-record";
  const shelfKey = (activeShelfKey ?? selectedShelfId) as MetadataShelfKey;
  const sectionKey = (activeSectionKey ?? selectedSectionId) as MetadataSectionKey;

  const descriptionParts = [trimmedSummary];

  if (trimmedBelongsReason) {
    descriptionParts.push(`Why this belongs here: ${trimmedBelongsReason}`);
  }

  const draftFields = [
    {
      id: `field-${safeSlug}-record-type`,
      label: "Record Type",
      type: "text" as const,
      value: recordType,
    },
    {
      id: `field-${safeSlug}-belongs-reason`,
      label: "Belongs Reason",
      type: "textarea" as const,
      value: trimmedBelongsReason,
    },
  ];

  const fields: MetadataRecordField[] = draftFields.filter(
    (field) => normalizeText(String(field.value ?? "")).length > 0
  );

  const relationships: MetadataRelationship[] = selectedRelatedRecord
    ? [
        {
          id: `rel-${safeSlug}-${selectedRelatedRecord.slug}`,
          type: relationshipType,
          targetRecordId: selectedRelatedRecord.id,
          targetSlug: selectedRelatedRecord.slug,
          targetLabel: selectedRelatedRecord.title,
          note: `Starter relationship created from Metadata Create (${getRelationshipLabel(
            relationshipType
          )}).`,
        },
      ]
    : [];

  const finalRecord: MetadataRecord = {
    id: `record-${safeSlug}`,
    slug: safeSlug,
    title: trimmedTitle || "Untitled Record",
    shelf: shelfKey,
    section: sectionKey,
    visibility,
    excerpt: trimmedSummary,
    description: descriptionParts.filter(Boolean).join("\n\n"),
    fields,
    relationships,
  };

  const finalRecordJson = JSON.stringify(finalRecord, null, 2);

  return {
    finalRecord,
    finalRecordJson,
  };
}