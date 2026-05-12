import {
  RELATIONSHIP_SERVICE_GLOBAL_CACHE_SLUG,
  RELATIONSHIP_SERVICE_MAX_CACHE_ENTRIES,
} from "./metadataRelationshipServiceCacheConfig";
import { getRelationshipServiceCacheEntryCount } from "./metadataRelationshipServiceCacheEntries";
import { getRelationshipServiceCacheIndexSizes } from "./metadataRelationshipServiceCacheIndexes";
import { getRelationshipServiceInflightStats } from "./metadataRelationshipServiceCacheInflight";
import type { RelationshipServiceCacheStats } from "./metadataRelationshipServiceCacheTypes";

export function getRelationshipServiceCacheStatsSnapshot(): RelationshipServiceCacheStats {
  const indexSizes = getRelationshipServiceCacheIndexSizes();
  const inflightStats = getRelationshipServiceInflightStats();

  return {
    cacheEntries: getRelationshipServiceCacheEntryCount(),
    indexedSlugs: indexSizes.indexedSlugs,
    indexedCacheKeys: indexSizes.indexedCacheKeys,
    inflightRequests: inflightStats.inflightRequests,
    refreshCooldowns: inflightStats.refreshCooldowns,
    maxEntries: RELATIONSHIP_SERVICE_MAX_CACHE_ENTRIES,
    globalScopeKey: RELATIONSHIP_SERVICE_GLOBAL_CACHE_SLUG,
  };
}