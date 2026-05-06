export const METADATA_RELATIONSHIP_TYPES = [
  "related_to",
  "belongs_to",
  "contains",
  "references",
  "referenced_by",
  "influences",
  "influenced_by",
  "part_of",
  "has_part",
  "uses",
  "used_by",
] as const;

export type MetadataRelationshipType =
  (typeof METADATA_RELATIONSHIP_TYPES)[number];

export type MetadataRelationshipRecord = {
  id: string;
  source_record_id: string;
  target_record_id: string;
  relationship_type: MetadataRelationshipType | string;
  notes: string | null;
  created_at: string;
};

export type MetadataRelationshipDisplayRecord = {
  id: string;
  sourceRecordId: string;
  targetRecordId: string;
  relationshipType: MetadataRelationshipType | string;
  notes: string | null;
  createdAt: string;
  targetTitle: string;
  targetSlug: string;
  targetShelf: string | null;
  targetSection: string | null;
};