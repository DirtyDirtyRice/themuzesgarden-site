import {
  fetchMetadataRelationshipsForRecordSlug,
} from "./metadataRelationshipQueries";

import type { MetadataRelationshipQueryClient } from "./metadataRelationshipQueries";

import { normalizeMetadataRelationshipDbRows } from "./metadataRelationshipAdapter";
import { createServiceResult } from "./metadataRelationshipServiceResults";
import type { MetadataRelationshipServiceResult } from "./metadataRelationshipServiceResults";

export async function createRecordNetworkFetchResult({
  client,
  recordSlug,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  recordSlug: string;
  tableName?: string;
}) {
  const result = await fetchMetadataRelationshipsForRecordSlug({
    client,
    recordSlug,
    tableName,
  });

  if (!result.ok) {
    return createServiceResult({
      ok: false,
      relationships: [],
      error: result.error,
    });
  }

  return createServiceResult({
    ok: true,
    relationships: normalizeMetadataRelationshipDbRows(result.rows),
    error: result.error,
  });
}

export function getRelatedRecordSlugsFromResult({
  result,
  recordSlug,
}: {
  result: MetadataRelationshipServiceResult;
  recordSlug: string;
}) {
  const relatedSlugs = new Set<string>();

  result.relationships.forEach((relationship) => {
    if (relationship.sourceSlug && relationship.sourceSlug !== recordSlug) {
      relatedSlugs.add(relationship.sourceSlug);
    }

    if (relationship.targetSlug && relationship.targetSlug !== recordSlug) {
      relatedSlugs.add(relationship.targetSlug);
    }
  });

  return Array.from(relatedSlugs);
}