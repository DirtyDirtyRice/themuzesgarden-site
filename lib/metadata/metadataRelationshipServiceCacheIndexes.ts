export const relationshipServiceCacheSlugIndex = new Map<string, Set<string>>();
export const relationshipServiceCacheKeySlugIndex = new Map<
  string,
  Set<string>
>();

export function normalizeRelationshipServiceCacheSlug(
  slug: string | null | undefined,
) {
  const normalizedSlug = String(slug ?? "").trim();

  if (!normalizedSlug) {
    return null;
  }

  return normalizedSlug;
}

export function trackCacheKeyForSlug(
  slug: string | null | undefined,
  cacheKey: string,
) {
  const normalizedSlug = normalizeRelationshipServiceCacheSlug(slug);

  if (!normalizedSlug || !cacheKey) {
    return;
  }

  const cacheKeysForSlug =
    relationshipServiceCacheSlugIndex.get(normalizedSlug) ?? new Set<string>();
  const slugsForCacheKey =
    relationshipServiceCacheKeySlugIndex.get(cacheKey) ?? new Set<string>();

  cacheKeysForSlug.add(cacheKey);
  slugsForCacheKey.add(normalizedSlug);

  relationshipServiceCacheSlugIndex.set(normalizedSlug, cacheKeysForSlug);
  relationshipServiceCacheKeySlugIndex.set(cacheKey, slugsForCacheKey);
}

export function trackCacheKeyForSlugs(
  slugs: (string | null | undefined)[],
  cacheKey: string,
) {
  Array.from(
    new Set(
      slugs
        .map((slug) => normalizeRelationshipServiceCacheSlug(slug))
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ).forEach((slug) => {
    trackCacheKeyForSlug(slug, cacheKey);
  });
}

export function removeCacheKeyFromSlugIndex(cacheKey: string) {
  const trackedSlugs = relationshipServiceCacheKeySlugIndex.get(cacheKey);

  if (!trackedSlugs) {
    return;
  }

  trackedSlugs.forEach((slug) => {
    const cacheKeys = relationshipServiceCacheSlugIndex.get(slug);

    if (!cacheKeys) {
      return;
    }

    cacheKeys.delete(cacheKey);

    if (cacheKeys.size === 0) {
      relationshipServiceCacheSlugIndex.delete(slug);
    }
  });

  relationshipServiceCacheKeySlugIndex.delete(cacheKey);
}

export function getRelationshipServiceLinkedCacheKeysForSlugFromIndex(
  slug: string | null | undefined,
) {
  const normalizedSlug = normalizeRelationshipServiceCacheSlug(slug);

  if (!normalizedSlug) {
    return [];
  }

  return Array.from(relationshipServiceCacheSlugIndex.get(normalizedSlug) ?? []);
}

export function getRelationshipServiceLinkedSlugsForCacheKeyFromIndex(
  cacheKey: string,
) {
  return Array.from(relationshipServiceCacheKeySlugIndex.get(cacheKey) ?? []);
}

export function getRelationshipServiceCacheIndexSizes() {
  return {
    indexedSlugs: relationshipServiceCacheSlugIndex.size,
    indexedCacheKeys: relationshipServiceCacheKeySlugIndex.size,
  };
}

export function clearRelationshipServiceCacheIndexes() {
  relationshipServiceCacheSlugIndex.clear();
  relationshipServiceCacheKeySlugIndex.clear();
}