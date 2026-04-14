export type MetadataVisibility = "public" | "private" | "shared";

export type MetadataShelfKey =
  | "music_theory"
  | "songwriting"
  | "production"
  | "artists"
  | "genres"
  | "instruments"
  | "projects"
  | "lyrics"
  | "technical";

export type MetadataSectionKey =
  | "concepts"
  | "techniques"
  | "terms"
  | "people"
  | "works"
  | "tools"
  | "structures"
  | "references"
  | "notes";

export type MetadataRelationshipType =
  | "related_to"
  | "belongs_to"
  | "influences"
  | "influenced_by"
  | "uses"
  | "used_by"
  | "part_of"
  | "contains"
  | "references"
  | "referenced_by";

export type MetadataRecordFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "boolean"
  | "list"
  | "link";

export type MetadataRecordField = {
  id: string;
  label: string;
  type: MetadataRecordFieldType;
  value: string | number | boolean | string[];
};

export type MetadataRelationship = {
  id: string;
  type: MetadataRelationshipType;
  targetRecordId: string;
  targetLabel: string;
  note?: string;
};

export type MetadataRecordSummary = {
  id: string;
  slug: string;
  title: string;
  shelf: MetadataShelfKey;
  section: MetadataSectionKey;
  visibility: MetadataVisibility;
  excerpt: string;
};

export type MetadataRecord = MetadataRecordSummary & {
  description: string;
  fields: MetadataRecordField[];
  relationships: MetadataRelationship[];
};

export type MetadataSection = {
  id: string;
  key: MetadataSectionKey;
  label: string;
  description: string;
};

export type MetadataShelf = {
  id: string;
  key: MetadataShelfKey;
  label: string;
  description: string;
  sections: MetadataSection[];
};

export type MetadataLibrary = {
  id: string;
  label: string;
  description: string;
  shelves: MetadataShelf[];
};