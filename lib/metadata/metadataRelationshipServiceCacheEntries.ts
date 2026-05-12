import type { MetadataRelationshipServiceResult } from "./metadataRelationshipServiceResults";
import {
  RELATIONSHIP_SERVICE_ERROR_FRESH_TTL_MS,
  RELATIONSHIP_SERVICE_ERROR_HARD_TTL_MS,
  RELATIONSHIP_SERVICE_ERROR_STALE_TTL_MS,
  RELATIONSHIP_SERVICE_FRESH_TTL_MS,
  RELATIONSHIP_SERVICE_HARD_TTL_MS,
  RELATIONSHIP_SERVICE_MAX_CACHE_ENTRIES,
  RELATIONSHIP_SERVICE_STALE_TTL_MS,
  logRelationshipServiceCacheEvent,
} from "./metadataRelationshipServiceCacheConfig";
import type {
  RelationshipServiceCacheEntry,
  RelationshipServiceCacheState,
  RelationshipServiceCacheTtlProfile,
  RelationshipServiceRelationship,
} from "./metadataRelationshipServiceCacheTypes";

export const relationshipServiceCache = new Map<
  string,
  RelationshipServiceCacheEntry
>();

export function getRelationshipServiceCacheAge(
  entry: RelationshipServiceCacheEntry,
) {
  return Date.now() - entry.savedAt;
}

export function getRelationshipServiceCacheTtlProfile(
  entry: RelationshipServiceCacheEntry,
): RelationshipServiceCacheTtlProfile {
  if (!entry.result.ok) {
    return {
      freshMs: RELATIONSHIP_SERVICE_ERROR_FRESH_TTL_MS,
      staleMs: RELATIONSHIP_SERVICE_ERROR_STALE_TTL_MS,
      hardMs: RELATIONSHIP_SERVICE_ERROR_HARD_TTL_MS,
    };
  }

  return {
    freshMs: RELATIONSHIP_SERVICE_FRESH_TTL_MS,
    staleMs: RELATIONSHIP_SERVICE_STALE_TTL_MS,
    hardMs: RELATIONSHIP_SERVICE_HARD_TTL_MS,
  };
}

export function getRelationshipServiceCacheState(
  entry: RelationshipServiceCacheEntry | undefined,
): RelationshipServiceCacheState {
  if (!entry) {
    return "missing";
  }

  const age = getRelationshipServiceCacheAge(entry);
  const ttl = getRelationshipServiceCacheTtlProfile(entry);

  if (age <= ttl.freshMs) {
    return "fresh";
  }

  if (age <= ttl.staleMs) {
    return "stale";
  }

  if (age <= ttl.hardMs) {
    return "stale";
  }

  return "expired";
}

function getRelationshipCacheIdentity(
  relationship: RelationshipServiceRelationship,
) {
  const relationshipWithOptionalId = relationship as RelationshipServiceRelationship & {
    id?: string | number | null;
    relationshipType?: string | null;
    type?: string | null;
    label?: string | null;
  };

  const id = String(relationshipWithOptionalId.id ?? "").trim();

  if (id) {
    return `id:${id}`;
  }

  return [
    "fallback",
    relationship.sourceSlug,
    relationship.targetSlug,
    relationshipWithOptionalId.relationshipType ??
      relationshipWithOptionalId.type,
    relationshipWithOptionalId.label,
  ]
    .map((value) => String(value ?? "").trim())
    .join("::");
}

export function compactRelationshipServiceResult(
  result: MetadataRelationshipServiceResult,
): MetadataRelationshipServiceResult {
  const seenKeys = new Set<string>();
  const relationships: RelationshipServiceRelationship[] = [];

  result.relationships.forEach((relationship) => {
    const key = getRelationshipCacheIdentity(relationship);

    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    relationships.push(relationship);
  });

  if (relationships.length === result.relationships.length) {
    return result;
  }

  return {
    ...result,
    relationships,
  };
}

export function getRelationshipServiceCacheEntry(cacheKey: string) {
  return relationshipServiceCache.get(cacheKey);
}

export function setRelationshipServiceCacheEntry(
  cacheKey: string,
  entry: RelationshipServiceCacheEntry,
) {
  relationshipServiceCache.set(cacheKey, entry);
}

export function deleteRelationshipServiceCacheEntry(cacheKey: string) {
  relationshipServiceCache.delete(cacheKey);
}

export function evictOldestRelationshipServiceCacheEntries(
  deleteCacheKey: (cacheKey: string) => void,
) {
  if (relationshipServiceCache.size <= RELATIONSHIP_SERVICE_MAX_CACHE_ENTRIES) {
    return;
  }

  const entriesToEvict =
    relationshipServiceCache.size - RELATIONSHIP_SERVICE_MAX_CACHE_ENTRIES;
  const oldestCacheKeys = Array.from(relationshipServiceCache.entries())
    .sort(
      (firstEntry, secondEntry) =>
        firstEntry[1].lastAccessedAt - secondEntry[1].lastAccessedAt,
    )
    .slice(0, entriesToEvict)
    .map(([cacheKey]) => cacheKey);

  oldestCacheKeys.forEach((cacheKey) => {
    deleteCacheKey(cacheKey);
  });

  logRelationshipServiceCacheEvent("evict-oldest", "cache", {
    evictedKeys: oldestCacheKeys.length,
    maxEntries: RELATIONSHIP_SERVICE_MAX_CACHE_ENTRIES,
  });
}

export function getRelationshipServiceCacheEntryCount() {
  return relationshipServiceCache.size;
}

export function clearRelationshipServiceCacheEntries() {
  relationshipServiceCache.clear();
}