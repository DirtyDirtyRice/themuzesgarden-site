import type { MetadataRelationshipServiceResult } from "./metadataRelationshipServiceResults";
import {
  RELATIONSHIP_SERVICE_GLOBAL_CACHE_SLUG,
  logRelationshipServiceCacheEvent,
} from "./metadataRelationshipServiceCacheConfig";
import {
  clearRelationshipServiceCacheEntries,
  compactRelationshipServiceResult,
  deleteRelationshipServiceCacheEntry,
  evictOldestRelationshipServiceCacheEntries,
  getRelationshipServiceCacheAge,
  getRelationshipServiceCacheEntry,
  getRelationshipServiceCacheState,
  setRelationshipServiceCacheEntry,
} from "./metadataRelationshipServiceCacheEntries";
import {
  clearRelationshipServiceCacheIndexes,
  getRelationshipServiceLinkedCacheKeysForSlugFromIndex,
  getRelationshipServiceLinkedSlugsForCacheKeyFromIndex,
  normalizeRelationshipServiceCacheSlug,
  removeCacheKeyFromSlugIndex,
  trackCacheKeyForSlug,
  trackCacheKeyForSlugs,
} from "./metadataRelationshipServiceCacheIndexes";
import {
  canRefreshRelationshipServiceCacheKey,
  clearRelationshipServiceInflightState,
  deleteRelationshipServiceInflightState,
  getInflightRelationshipServiceRequest,
  getOrSetInflightRelationshipServiceRequest,
  markRelationshipServiceCacheRefreshCooldown,
  pruneRelationshipServiceRefreshCooldowns,
  setInflightRelationshipServiceRequest,
} from "./metadataRelationshipServiceCacheInflight";
import { getRelationshipServiceCacheStatsSnapshot } from "./metadataRelationshipServiceCacheStats";
import type {
  RelationshipServiceCacheRead,
  RelationshipServiceCacheStats,
  RelationshipServiceCacheWrite,
} from "./metadataRelationshipServiceCacheTypes";

function deleteRelationshipServiceCacheKey(cacheKey: string) {
  deleteRelationshipServiceCacheEntry(cacheKey);
  deleteRelationshipServiceInflightState(cacheKey);
  removeCacheKeyFromSlugIndex(cacheKey);
}

export function getRelationshipServiceCacheKey(
  scope: string,
  values: (string | number | undefined)[],
) {
  return [scope, ...values].map((value) => String(value ?? "")).join("::");
}

export function getRelationshipServiceGlobalCacheSlug() {
  return RELATIONSHIP_SERVICE_GLOBAL_CACHE_SLUG;
}

export { trackCacheKeyForSlug, trackCacheKeyForSlugs };

export function getRelationshipServiceCacheRead(
  cacheKey: string,
): RelationshipServiceCacheRead {
  pruneRelationshipServiceRefreshCooldowns();

  const entry = getRelationshipServiceCacheEntry(cacheKey);
  const state = getRelationshipServiceCacheState(entry);

  if (!entry || state === "missing") {
    logRelationshipServiceCacheEvent("miss", cacheKey);
    return {
      state: "missing",
      result: null,
    };
  }

  if (state === "expired") {
    logRelationshipServiceCacheEvent("expired", cacheKey, {
      ageMs: getRelationshipServiceCacheAge(entry),
      ok: entry.result.ok,
    });
    deleteRelationshipServiceCacheKey(cacheKey);

    return {
      state: "expired",
      result: null,
    };
  }

  entry.lastAccessedAt = Date.now();

  logRelationshipServiceCacheEvent(
    state === "fresh" ? "hit" : "stale",
    cacheKey,
    {
      ageMs: getRelationshipServiceCacheAge(entry),
      ok: entry.result.ok,
    },
  );

  return {
    state,
    result: entry.result,
  };
}

export function getCachedRelationshipServiceResult(cacheKey: string) {
  const cached = getRelationshipServiceCacheRead(cacheKey);

  if (cached.state !== "fresh") {
    return null;
  }

  return cached.result;
}

export function setCachedRelationshipServiceResult(
  cacheKey: string,
  result: MetadataRelationshipServiceResult,
) {
  removeCacheKeyFromSlugIndex(cacheKey);

  const savedAt = Date.now();
  const compactedResult = compactRelationshipServiceResult(result);

  setRelationshipServiceCacheEntry(cacheKey, {
    savedAt,
    refreshedAt: savedAt,
    lastAccessedAt: savedAt,
    result: compactedResult,
  });

  evictOldestRelationshipServiceCacheEntries(deleteRelationshipServiceCacheKey);

  logRelationshipServiceCacheEvent("set", cacheKey, {
    ok: compactedResult.ok,
    count: compactedResult.relationships.length,
    cacheEntries: getRelationshipServiceCacheStatsSnapshot().cacheEntries,
  });

  return compactedResult;
}

export function setCachedRelationshipServiceResults(
  writes: RelationshipServiceCacheWrite[],
) {
  return writes.map((write) => {
    const result = setCachedRelationshipServiceResult(
      write.cacheKey,
      write.result,
    );

    if (write.slugs) {
      trackCacheKeyForSlugs(write.slugs, write.cacheKey);
    }

    return result;
  });
}

export function getRelationshipServiceLinkedCacheKeysForSlug(
  slug: string | null | undefined,
) {
  return getRelationshipServiceLinkedCacheKeysForSlugFromIndex(slug);
}

export function getRelationshipServiceLinkedSlugsForCacheKey(cacheKey: string) {
  return getRelationshipServiceLinkedSlugsForCacheKeyFromIndex(cacheKey);
}

export {
  getInflightRelationshipServiceRequest,
  getOrSetInflightRelationshipServiceRequest,
  setInflightRelationshipServiceRequest,
};

export function refreshStaleRelationshipServiceCache(
  cacheKey: string,
  refresh: () => Promise<MetadataRelationshipServiceResult>,
) {
  if (getInflightRelationshipServiceRequest(cacheKey)) {
    logRelationshipServiceCacheEvent("refresh-skip-inflight", cacheKey);
    return;
  }

  if (!canRefreshRelationshipServiceCacheKey(cacheKey)) {
    logRelationshipServiceCacheEvent("refresh-skip-cooldown", cacheKey);
    return;
  }

  markRelationshipServiceCacheRefreshCooldown(cacheKey);

  void getOrSetInflightRelationshipServiceRequest(cacheKey, refresh).catch(
    (error: unknown) => {
      logRelationshipServiceCacheEvent("refresh-error", cacheKey, {
        message: error instanceof Error ? error.message : "Unknown refresh error",
      });
    },
  );
}

export function prefetchRelationshipServiceCache(
  cacheKey: string,
  refresh: () => Promise<MetadataRelationshipServiceResult>,
) {
  const cached = getRelationshipServiceCacheRead(cacheKey);

  if (cached.state === "fresh" || cached.state === "stale") {
    return cached.result;
  }

  if (getInflightRelationshipServiceRequest(cacheKey)) {
    return null;
  }

  void getOrSetInflightRelationshipServiceRequest(cacheKey, refresh).catch(
    (error: unknown) => {
      logRelationshipServiceCacheEvent("prefetch-error", cacheKey, {
        message: error instanceof Error ? error.message : "Unknown prefetch error",
      });
    },
  );

  return null;
}

export function clearCacheForSlug(slug: string | null | undefined) {
  const normalizedSlug = normalizeRelationshipServiceCacheSlug(slug);

  if (!normalizedSlug) {
    return;
  }

  const cacheKeys = getRelationshipServiceLinkedCacheKeysForSlugFromIndex(
    normalizedSlug,
  );

  if (cacheKeys.length === 0) {
    return;
  }

  cacheKeys.forEach((cacheKey) => {
    deleteRelationshipServiceCacheKey(cacheKey);
  });

  logRelationshipServiceCacheEvent("clear-slug", normalizedSlug, {
    clearedKeys: cacheKeys.length,
  });
}

export function clearCacheForSlugs(slugs: (string | null | undefined)[]) {
  Array.from(new Set(slugs)).forEach((slug) => {
    clearCacheForSlug(slug);
  });
}

export function getRelationshipServiceCacheStats(): RelationshipServiceCacheStats {
  return getRelationshipServiceCacheStatsSnapshot();
}

export function clearMetadataRelationshipServiceCache() {
  clearRelationshipServiceCacheEntries();
  clearRelationshipServiceCacheIndexes();
  clearRelationshipServiceInflightState();
  logRelationshipServiceCacheEvent("clear-all", "all");
}

export type {
  RelationshipServiceCacheStats,
  RelationshipServiceCacheWrite,
} from "./metadataRelationshipServiceCacheTypes";