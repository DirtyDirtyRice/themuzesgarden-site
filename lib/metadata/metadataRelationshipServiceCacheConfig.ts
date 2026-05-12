export const RELATIONSHIP_SERVICE_FRESH_TTL_MS = 5000;
export const RELATIONSHIP_SERVICE_STALE_TTL_MS = 20000;
export const RELATIONSHIP_SERVICE_HARD_TTL_MS = 60000;

export const RELATIONSHIP_SERVICE_ERROR_FRESH_TTL_MS = 1500;
export const RELATIONSHIP_SERVICE_ERROR_STALE_TTL_MS = 5000;
export const RELATIONSHIP_SERVICE_ERROR_HARD_TTL_MS = 12000;

export const RELATIONSHIP_SERVICE_REFRESH_COOLDOWN_MS = 2500;
export const RELATIONSHIP_SERVICE_MAX_CACHE_ENTRIES = 250;
export const RELATIONSHIP_SERVICE_GLOBAL_CACHE_SLUG =
  "__relationship-service-global__";

export const RELATIONSHIP_SERVICE_CACHE_DEBUG =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_METADATA_RELATIONSHIP_CACHE_DEBUG === "true";

export function logRelationshipServiceCacheEvent(
  event: string,
  cacheKey: string,
  extra?: Record<string, string | number | boolean | null | undefined>,
) {
  if (!RELATIONSHIP_SERVICE_CACHE_DEBUG) {
    return;
  }

  console.info("[metadata relationship cache]", event, {
    cacheKey,
    ...extra,
  });
}