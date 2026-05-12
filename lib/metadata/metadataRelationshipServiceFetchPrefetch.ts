import type { MetadataRelationshipQueryClient } from "./metadataRelationshipQueries";
import type { MetadataRelationshipServiceResult } from "./metadataRelationshipServiceResults";

import {
  getRelatedRecordSlugsFromResult,
} from "./metadataRelationshipServiceFetchRecord";

import {
  prefetchMetadataRelationshipNetworkForRecord,
} from "./metadataRelationshipServiceFetch";

export function prefetchRelatedRecordNetworks({
  client,
  recordSlug,
  result,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  recordSlug: string;
  result: MetadataRelationshipServiceResult;
  tableName?: string;
}) {
  if (!result.ok) return;

  getRelatedRecordSlugsFromResult({ result, recordSlug })
    .slice(0, 12)
    .forEach((relatedSlug) => {
      prefetchMetadataRelationshipNetworkForRecord({
        client,
        recordSlug: relatedSlug,
        tableName,
      });
    });
}