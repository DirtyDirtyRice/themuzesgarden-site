import {
  fetchAllMetadataRelationships,
  fetchMetadataRelationshipsBySourceSlug,
  fetchMetadataRelationshipsBySourceSlugs,
  fetchMetadataRelationshipsByTargetSlug,
  fetchRecentMetadataRelationships,
} from "./metadataRelationshipQueries";

import type { MetadataRelationshipQueryClient } from "./metadataRelationshipQueries";

import { getRelationshipServiceCacheKey } from "./metadataRelationshipServiceCache";

import {
  createFailedFetchResult,
  createSuccessfulFetchResult,
} from "./metadataRelationshipServiceFetchResults";

import {
  getRelationshipServiceCachedOrRefresh,
  warmRelationshipServiceCache,
} from "./metadataRelationshipServiceFetchCache";

import { createRecordNetworkFetchResult } from "./metadataRelationshipServiceFetchRecord";

import { prefetchRelatedRecordNetworks } from "./metadataRelationshipServiceFetchPrefetch";

import { createTableSourceResult } from "./metadataRelationshipServiceResults";

import type {
  MetadataRelationshipServiceResult,
  MetadataRelationshipTableSourceResult,
} from "./metadataRelationshipServiceResults";

function getUniqueCacheSlugs(slugs: (string | null | undefined)[]) {
  const cleanSlugs = slugs
    .map((slug) => String(slug ?? "").trim())
    .filter((slug) => slug.length > 0);

  return Array.from(new Set(cleanSlugs));
}

export async function getAllMetadataRelationshipsForService({
  client,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  tableName?: string;
}): Promise<MetadataRelationshipServiceResult> {
  const cacheKey = getRelationshipServiceCacheKey("all", [tableName]);

  return getRelationshipServiceCachedOrRefresh({
    cacheKey,
    includeGlobalListScope: true,
    fetchResult: async () => {
      const result = await fetchAllMetadataRelationships({ client, tableName });

      if (!result.ok) {
        return createFailedFetchResult(result.error);
      }

      return createSuccessfulFetchResult(result.rows);
    },
  });
}

export async function getMetadataRelationshipsForSource({
  client,
  sourceSlug,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  sourceSlug: string;
  tableName?: string;
}): Promise<MetadataRelationshipServiceResult> {
  const cacheKey = getRelationshipServiceCacheKey("source", [
    sourceSlug,
    tableName,
  ]);

  return getRelationshipServiceCachedOrRefresh({
    cacheKey,
    slugs: [sourceSlug],
    fetchResult: async () => {
      const result = await fetchMetadataRelationshipsBySourceSlug({
        client,
        sourceSlug,
        tableName,
      });

      if (!result.ok) {
        return createFailedFetchResult(result.error);
      }

      return createSuccessfulFetchResult(result.rows);
    },
  });
}

export async function getMetadataRelationshipsForSources({
  client,
  sourceSlugs,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  sourceSlugs: string[];
  tableName?: string;
}): Promise<MetadataRelationshipServiceResult> {
  const cleanSourceSlugs = getUniqueCacheSlugs(sourceSlugs);
  const cacheKey = getRelationshipServiceCacheKey("sources", [
    cleanSourceSlugs.join(","),
    tableName,
  ]);

  return getRelationshipServiceCachedOrRefresh({
    cacheKey,
    slugs: cleanSourceSlugs,
    fetchResult: async () => {
      const result = await fetchMetadataRelationshipsBySourceSlugs({
        client,
        sourceSlugs: cleanSourceSlugs,
        tableName,
      });

      if (!result.ok) {
        return createFailedFetchResult(result.error);
      }

      return createSuccessfulFetchResult(result.rows);
    },
  });
}

export async function getMetadataRelationshipsForTarget({
  client,
  targetSlug,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  targetSlug: string;
  tableName?: string;
}): Promise<MetadataRelationshipServiceResult> {
  const cacheKey = getRelationshipServiceCacheKey("target", [
    targetSlug,
    tableName,
  ]);

  return getRelationshipServiceCachedOrRefresh({
    cacheKey,
    slugs: [targetSlug],
    fetchResult: async () => {
      const result = await fetchMetadataRelationshipsByTargetSlug({
        client,
        targetSlug,
        tableName,
      });

      if (!result.ok) {
        return createFailedFetchResult(result.error);
      }

      return createSuccessfulFetchResult(result.rows);
    },
  });
}

export async function getMetadataRelationshipNetworkForRecord({
  client,
  recordSlug,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  recordSlug: string;
  tableName?: string;
}): Promise<MetadataRelationshipServiceResult> {
  const cacheKey = getRelationshipServiceCacheKey("record", [
    recordSlug,
    tableName,
  ]);

  const result = await getRelationshipServiceCachedOrRefresh({
    cacheKey,
    slugs: [recordSlug],
    fetchResult: () =>
      createRecordNetworkFetchResult({
        client,
        recordSlug,
        tableName,
      }),
  });

  prefetchRelatedRecordNetworks({
    client,
    recordSlug,
    result,
    tableName,
  });

  return result;
}

export async function getMetadataRelationshipsTableOnlyForRecord({
  client,
  recordSlug,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  recordSlug: string;
  tableName?: string;
}): Promise<MetadataRelationshipTableSourceResult> {
  const result = await getMetadataRelationshipNetworkForRecord({
    client,
    recordSlug,
    tableName,
  });

  return createTableSourceResult(result);
}

export async function getRecentMetadataRelationshipsForService({
  client,
  limit,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  limit?: number;
  tableName?: string;
}): Promise<MetadataRelationshipServiceResult> {
  const cacheKey = getRelationshipServiceCacheKey("recent", [
    limit,
    tableName,
  ]);

  return getRelationshipServiceCachedOrRefresh({
    cacheKey,
    includeGlobalListScope: true,
    fetchResult: async () => {
      const result = await fetchRecentMetadataRelationships({
        client,
        limit,
        tableName,
      });

      if (!result.ok) {
        return createFailedFetchResult(result.error);
      }

      return createSuccessfulFetchResult(result.rows);
    },
  });
}

export function prefetchMetadataRelationshipNetworkForRecord({
  client,
  recordSlug,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  recordSlug: string;
  tableName?: string;
}) {
  const cacheKey = getRelationshipServiceCacheKey("record", [
    recordSlug,
    tableName,
  ]);

  return warmRelationshipServiceCache({
    cacheKey,
    slugs: [recordSlug],
    fetchResult: () =>
      createRecordNetworkFetchResult({
        client,
        recordSlug,
        tableName,
      }),
  });
}

export function prefetchMetadataRelationshipsForSources({
  client,
  sourceSlugs,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  sourceSlugs: string[];
  tableName?: string;
}) {
  const cleanSourceSlugs = getUniqueCacheSlugs(sourceSlugs);
  const cacheKey = getRelationshipServiceCacheKey("sources", [
    cleanSourceSlugs.join(","),
    tableName,
  ]);

  return warmRelationshipServiceCache({
    cacheKey,
    slugs: cleanSourceSlugs,
    fetchResult: async () => {
      const result = await fetchMetadataRelationshipsBySourceSlugs({
        client,
        sourceSlugs: cleanSourceSlugs,
        tableName,
      });

      if (!result.ok) {
        return createFailedFetchResult(result.error);
      }

      return createSuccessfulFetchResult(result.rows);
    },
  });
}