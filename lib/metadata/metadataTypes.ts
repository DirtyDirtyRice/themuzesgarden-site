export type MetadataTargetType =
  | "track"
  | "section"
  | "moment"
  | "lyric"
  | "instrument"
  | "note"
  | "chord"
  | "modulation"
  | "tag";

export type MetadataEntry = {
  id: string;

  targetType: MetadataTargetType;

  targetId: string;

  parentId?: string;

  label: string;

  description?: string;

  createdAt: string;

  createdBy?: string;

  tags?: string[];
};

export type MetadataRelationship =
  | "explains"
  | "references"
  | "variation"
  | "related"
  | "example"
  | "contains"
  | "resolves-to"
  | "uses"
  | "derived-from";

export type MetadataLink = {
  sourceId: string;

  targetId: string;

  relationship: MetadataRelationship;
};