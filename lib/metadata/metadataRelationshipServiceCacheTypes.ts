import type { MetadataRelationshipServiceResult } from "./metadataRelationshipServiceResults";

export type RelationshipServiceRelationship =
  MetadataRelationshipServiceResult["relationships"][number];

export type RelationshipServiceCacheEntry = {
  savedAt: number;
  refreshedAt: number;
  lastAccessedAt: number;
  result: MetadataRelationshipServiceResult;
};

export type RelationshipServiceCacheState =
  | "fresh"
  | "stale"
  | "expired"
  | "missing";

export type RelationshipServiceCacheRead = {
  state: RelationshipServiceCacheState;
  result: MetadataRelationshipServiceResult | null;
};

export type RelationshipServiceCacheTtlProfile = {
  freshMs: number;
  staleMs: number;
  hardMs: number;
};

export type RelationshipServiceCacheWrite = {
  cacheKey: string;
  result: MetadataRelationshipServiceResult;
  slugs?: (string | null | undefined)[];
};

export type RelationshipServiceCacheStats = {
  cacheEntries: number;
  indexedSlugs: number;
  indexedCacheKeys: number;
  inflightRequests: number;
  refreshCooldowns: number;
  maxEntries: number;
  globalScopeKey: string;
};