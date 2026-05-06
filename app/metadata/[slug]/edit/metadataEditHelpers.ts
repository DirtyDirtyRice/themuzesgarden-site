import {
  RECORD_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/app/metadata/create/metadataCreateConfig";
import type { MetadataRecord } from "@/lib/metadata/metadataLibraryTypes";

export type RecordTypeOption = (typeof RECORD_TYPE_OPTIONS)[number]["value"];
export type RelationshipType = (typeof RELATIONSHIP_OPTIONS)[number]["value"];

export function findRecordTypeFromRecord(
  record: MetadataRecord
): RecordTypeOption {
  const recordTypeField = record.fields.find(
    (field) => field.label === "Record Type" && typeof field.value === "string"
  );

  const rawValue = String(recordTypeField?.value ?? "concept");
  const validValues = new Set(RECORD_TYPE_OPTIONS.map((option) => option.value));

  return validValues.has(rawValue as RecordTypeOption)
    ? (rawValue as RecordTypeOption)
    : "concept";
}

export function findBelongsReasonFromRecord(record: MetadataRecord): string {
  const explicitField = record.fields.find(
    (field) =>
      field.label === "Belongs Reason" && typeof field.value === "string"
  );

  if (explicitField && typeof explicitField.value === "string") {
    return explicitField.value;
  }

  const marker = "Why this belongs here:";
  const description = String(record.description ?? "");
  const markerIndex = description.indexOf(marker);

  if (markerIndex === -1) {
    return "";
  }

  return description.slice(markerIndex + marker.length).trim();
}

export function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

export function getRelationshipMeaning(
  relationshipType: RelationshipType,
  relatedRecordTitle: string
): string {
  switch (relationshipType) {
    case "related_to":
      return `This means this record is conceptually related to ${relatedRecordTitle}.`;
    case "references":
      return `This means this record points toward ${relatedRecordTitle} as a useful reference.`;
    case "influences":
      return `This means this record can influence or shape how ${relatedRecordTitle} is understood.`;
    case "uses":
      return `This means this record uses ${relatedRecordTitle} as part of its structure or meaning.`;
    case "part_of":
      return `This means this record belongs inside ${relatedRecordTitle} as part of a larger structure.`;
    case "contains":
      return `This means this record includes or contains ${relatedRecordTitle} inside it.`;
    default:
      return `This will connect this record to ${relatedRecordTitle}.`;
  }
}