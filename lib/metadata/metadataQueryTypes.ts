import type {
  LayeredMetadataEntry,
  MetadataKind,
  MetadataTargetType,
  UnifiedMetadataTargetResult,
} from "./metadataTypes";

export type MetadataQueryMode = "text" | "target" | "tokens" | "all";

export type MetadataQueryInput = {
  query: string;
  mode?: MetadataQueryMode;
  targetType?: MetadataTargetType | "all";
  kind?: MetadataKind | "all";
  targetId?: string;
  tags?: string[];
  limit?: number;
  includeDirect?: boolean;
  includeInherited?: boolean;
  includeRelated?: boolean;
  includeExpanded?: boolean;
  includeFallback?: boolean;
};

export type MetadataQueryResultItem = LayeredMetadataEntry & {
  matchedBy: Array<
    "label" | "value" | "description" | "tags" | "targetId" | "targetType" | "kind" | "tokens"
  >;
};

export type MetadataQueryResultGroup = {
  source: LayeredMetadataEntry["source"];
  label: string;
  entries: MetadataQueryResultItem[];
};

export type MetadataQueryResult = {
  input: MetadataQueryInput;
  normalizedQuery: string;
  total: number;
  entries: MetadataQueryResultItem[];
  groups: MetadataQueryResultGroup[];
  targetContexts: UnifiedMetadataTargetResult[];
  tokens: string[];
};