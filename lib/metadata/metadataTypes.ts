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

export type MetadataKind =
  | "tag"
  | "description"
  | "analysis"
  | "instruction"
  | "structure"
  | "emotion"
  | "technical"
  | "timing"
  | "reference";

export type MetadataEntry = {
  id: string;
  targetType: MetadataTargetType;
  targetId: string;
  kind: MetadataKind;
  label: string;
  value?: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
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
  id?: string;
  sourceId: string;
  targetId: string;
  relationship: MetadataRelationship;
  createdAt?: string;
};

export type MetadataEntryInput = {
  targetType: MetadataTargetType;
  targetId: string;
  kind: MetadataKind;
  label: string;
  value?: string;
  description?: string;
  parentId?: string;
  createdBy?: string;
  tags?: string[];
};

export type MetadataEntryPatch = Partial<
  Omit<MetadataEntry, "id" | "createdAt" | "targetType" | "targetId">
>;

export type MetadataContext = {
  entry: MetadataEntry;
  parent: MetadataEntry | null;
  children: MetadataEntry[];
  linksFrom: MetadataLink[];
  linksTo: MetadataLink[];
};

export type MetadataSearchOptions = {
  targetType?: MetadataTargetType;
  targetId?: string;
  kind?: MetadataKind;
  tags?: string[];
  includeValue?: boolean;
  includeDescription?: boolean;
  limit?: number;
};

export type MetadataLayerSource =
  | "direct"
  | "inherited"
  | "related"
  | "expanded"
  | "fallback";

export type LayeredMetadataEntry = MetadataEntry & {
  source: MetadataLayerSource;
  score: number;
};

export type UnifiedMetadataTargetResult = {
  targetType: MetadataTargetType;
  targetId: string;
  directEntries: MetadataEntry[];
  inheritedEntries: MetadataEntry[];
  relatedEntries: MetadataEntry[];
  expandedEntries: MetadataEntry[];
  fallbackEntries: MetadataEntry[];
  displayEntries: LayeredMetadataEntry[];
  tokens: string[];
  isFallback: boolean;
};

export type ExpandedMetadataTargetContext = UnifiedMetadataTargetResult & {
  roots: LayeredMetadataEntry[];
  childrenMap: Record<string, LayeredMetadataEntry[]>;
};

export type MetadataIntelligencePayload = {
  targetType: MetadataTargetType;
  targetId: string;
  entries: LayeredMetadataEntry[];
  tokens: string[];
  topTags: string[];
  isFallback: boolean;
};