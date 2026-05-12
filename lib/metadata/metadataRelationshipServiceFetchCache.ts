import {
  getOrSetInflightRelationshipServiceRequest,
  getRelationshipServiceCacheRead,
  prefetchRelationshipServiceCache,
  refreshStaleRelationshipServiceCache,
  setCachedRelationshipServiceResult,
  trackCacheKeyForSlug,
  trackCacheKeyForSlugs,
  getRelationshipServiceGlobalCacheSlug,
} from "./metadataRelationshipServiceCache";

import type { MetadataRelationshipServiceResult } from "./metadataRelationshipServiceResults";
import type {
  RelationshipServiceFetchOptions,
  RelationshipServicePrefetchOptions,
} from "./metadataRelationshipServiceFetchTypes";

function getRelationshipSlugsFromResult(
  result: MetadataRelationshipServiceResult,
) {
  const slugs = new Set<string>();

  result.relationships.forEach((relationship) => {
    if (relationship.sourceSlug) slugs.add(relationship.sourceSlug);
    if (relationship.targetSlug) slugs.add(relationship.targetSlug);
  });

  return Array.from(slugs);
}

function getUniqueCacheSlugs(slugs: (string | null | undefined)[]) {
  const cleanSlugs = slugs
    .map((slug) => String(slug ?? "").trim())
    .filter((slug) => slug.length > 0);

  return Array.from(new Set(cleanSlugs));
}

export function cacheRelationshipServiceResult({
  cacheKey,
  result,
  slugs,
  includeGlobalListScope = false,
}: {
  cacheKey: string;
  result: MetadataRelationshipServiceResult;
  slugs?: (string | null | undefined)[];
  includeGlobalListScope?: boolean;
}) {
  const cachedResult = setCachedRelationshipServiceResult(cacheKey, result);

  const resultSlugs = result.ok ? getRelationshipSlugsFromResult(result) : [];
  const cacheSlugs = getUniqueCacheSlugs([...(slugs ?? []), ...resultSlugs]);

  trackCacheKeyForSlugs(cacheSlugs, cacheKey);

  if (includeGlobalListScope) {
    trackCacheKeyForSlug(getRelationshipServiceGlobalCacheSlug(), cacheKey);
  }

  return cachedResult;
}

export function getRelationshipServiceCachedOrRefresh({
  cacheKey,
  slugs,
  includeGlobalListScope,
  fetchResult,
}: RelationshipServiceFetchOptions) {
  const cached = getRelationshipServiceCacheRead(cacheKey);

  if (cached.state === "fresh" && cached.result) {
    return cached.result;
  }

  const refresh = () =>
    fetchResult().then((result) =>
      cacheRelationshipServiceResult({
        cacheKey,
        result,
        slugs,
        includeGlobalListScope,
      }),
    );

  if (cached.state === "stale" && cached.result) {
    refreshStaleRelationshipServiceCache(cacheKey, refresh);
    return cached.result;
  }

  return getOrSetInflightRelationshipServiceRequest(cacheKey, refresh);
}

export function warmRelationshipServiceCache({
  cacheKey,
  slugs,
  includeGlobalListScope,
  fetchResult,
}: RelationshipServicePrefetchOptions) {
  return prefetchRelationshipServiceCache(cacheKey, () =>
    fetchResult().then((result) =>
      cacheRelationshipServiceResult({
        cacheKey,
        result,
        slugs,
        includeGlobalListScope,
      }),
    ),
  );
}