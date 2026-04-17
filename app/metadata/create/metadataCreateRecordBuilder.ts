import { normalizeText, getRelationshipLabel } from "./metadataCreateUtils";

export type MetadataCreateRecordBuilderInput = {
  generatedSlug: string;
  trimmedTitle: string;
  trimmedSummary: string;
  trimmedBelongsReason: string;
  visibility: string;
  recordType: string;
  relationshipType: string;
  selectedShelfId: string;
  selectedSectionId: string;
  activeShelfKey?: string;
  activeSectionKey?: string;
  selectedRelatedRecord: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

export type MetadataCreateRelationshipRecord = {
  id: string;
  type: string;
  targetRecordId: string;
  targetSlug: string;
  targetLabel: string;
  note: string;
};

export type MetadataCreateFieldRecord = {
  id: string;
  label: string;
  type: string;
  value: string;
};

export type MetadataCreateFinalRecord = {
  id: string;
  slug: string;
  title: string;
  shelf: string;
  section: string;
  visibility: string;
  excerpt: string;
  description: string;
  fields: MetadataCreateFieldRecord[];
  relationships: MetadataCreateRelationshipRecord[];
};

export type MetadataCreateRecordBuilderResult = {
  finalRecord: MetadataCreateFinalRecord;
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
  const shelfKey = activeShelfKey ?? selectedShelfId;
  const sectionKey = activeSectionKey ?? selectedSectionId;

  const descriptionParts = [trimmedSummary];

  if (trimmedBelongsReason) {
    descriptionParts.push(`Why this belongs here: ${trimmedBelongsReason}`);
  }

  const fields: MetadataCreateFieldRecord[] = [
    {
      id: `field-${safeSlug}-record-type`,
      label: "Record Type",
      type: "text",
      value: recordType,
    },
    {
      id: `field-${safeSlug}-belongs-reason`,
      label: "Belongs Reason",
      type: "textarea",
      value: trimmedBelongsReason,
    },
  ].filter((field) => normalizeText(field.value).length > 0);

  const relationships: MetadataCreateRelationshipRecord[] = selectedRelatedRecord
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

  const finalRecord: MetadataCreateFinalRecord = {
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