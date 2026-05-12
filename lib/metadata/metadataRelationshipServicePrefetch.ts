import type { MetadataRelationshipQueryClient } from "./metadataRelationshipQueries";
import {
  prefetchMetadataRelationshipNetworkForRecord,
  prefetchMetadataRelationshipsForSources,
} from "./metadataRelationshipServiceFetch";

type RelationshipServicePrefetchRecordOptions = {
  client: MetadataRelationshipQueryClient;
  recordSlug: string;
  tableName?: string;
};

type RelationshipServicePrefetchRecordsOptions = {
  client: MetadataRelationshipQueryClient;
  recordSlugs: string[];
  tableName?: string;
  limit?: number;
};

type RelationshipServicePrefetchSourcesOptions = {
  client: MetadataRelationshipQueryClient;
  sourceSlugs: string[];
  tableName?: string;
  limit?: number;
};

type RelationshipServicePrefetchResult = {
  attemptedCount: number;
  warmedCount: number;
  skippedCount: number;
};

const DEFAULT_PREFETCH_LIMIT = 12;

function cleanPrefetchSlug(slug: string | null | undefined) {
  return String(slug ?? "").trim();
}

function cleanUniquePrefetchSlugs(slugs: (string | null | undefined)[]) {
  return Array.from(
    new Set(
      slugs
        .map((slug) => cleanPrefetchSlug(slug))
        .filter((slug) => slug.length > 0),
    ),
  );
}

function getSafePrefetchLimit(limit: number | undefined) {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return DEFAULT_PREFETCH_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), 50));
}

function createPrefetchResult({
  attemptedCount,
  warmedCount,
}: {
  attemptedCount: number;
  warmedCount: number;
}): RelationshipServicePrefetchResult {
  return {
    attemptedCount,
    warmedCount,
    skippedCount: Math.max(0, attemptedCount - warmedCount),
  };
}

export function prefetchRelationshipRecordThroughService({
  client,
  recordSlug,
  tableName,
}: RelationshipServicePrefetchRecordOptions) {
  const cleanRecordSlug = cleanPrefetchSlug(recordSlug);

  if (!cleanRecordSlug) {
    return createPrefetchResult({
      attemptedCount: 1,
      warmedCount: 0,
    });
  }

  const warmedResult = prefetchMetadataRelationshipNetworkForRecord({
    client,
    recordSlug: cleanRecordSlug,
    tableName,
  });

  return createPrefetchResult({
    attemptedCount: 1,
    warmedCount: warmedResult ? 1 : 0,
  });
}

export function prefetchRelationshipRecordsThroughService({
  client,
  recordSlugs,
  tableName,
  limit,
}: RelationshipServicePrefetchRecordsOptions) {
  const cleanRecordSlugs = cleanUniquePrefetchSlugs(recordSlugs).slice(
    0,
    getSafePrefetchLimit(limit),
  );
  let warmedCount = 0;

  cleanRecordSlugs.forEach((recordSlug) => {
    const warmedResult = prefetchMetadataRelationshipNetworkForRecord({
      client,
      recordSlug,
      tableName,
    });

    if (warmedResult) {
      warmedCount += 1;
    }
  });

  return createPrefetchResult({
    attemptedCount: recordSlugs.length,
    warmedCount,
  });
}

export function prefetchRelationshipSourcesThroughService({
  client,
  sourceSlugs,
  tableName,
  limit,
}: RelationshipServicePrefetchSourcesOptions) {
  const cleanSourceSlugs = cleanUniquePrefetchSlugs(sourceSlugs).slice(
    0,
    getSafePrefetchLimit(limit),
  );

  if (cleanSourceSlugs.length === 0) {
    return createPrefetchResult({
      attemptedCount: sourceSlugs.length,
      warmedCount: 0,
    });
  }

  const warmedResult = prefetchMetadataRelationshipsForSources({
    client,
    sourceSlugs: cleanSourceSlugs,
    tableName,
  });

  return createPrefetchResult({
    attemptedCount: sourceSlugs.length,
    warmedCount: warmedResult ? cleanSourceSlugs.length : 0,
  });
}

export function prefetchRelationshipNeighborhoodThroughService({
  client,
  recordSlug,
  relatedSlugs,
  tableName,
  limit,
}: RelationshipServicePrefetchRecordOptions & {
  relatedSlugs: string[];
  limit?: number;
}) {
  const cleanRecordSlug = cleanPrefetchSlug(recordSlug);
  const cleanRelatedSlugs = cleanUniquePrefetchSlugs(relatedSlugs).filter(
    (relatedSlug) => relatedSlug !== cleanRecordSlug,
  );
  const slugsToWarm = [cleanRecordSlug, ...cleanRelatedSlugs]
    .filter((slug) => slug.length > 0)
    .slice(0, getSafePrefetchLimit(limit));

  return prefetchRelationshipRecordsThroughService({
    client,
    recordSlugs: slugsToWarm,
    tableName,
    limit,
  });
}