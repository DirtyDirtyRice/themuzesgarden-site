import { normalizeMetadataRelationshipDbRows } from "./metadataRelationshipAdapter";
import { createServiceResult } from "./metadataRelationshipServiceResults";

export function createFailedFetchResult(error: string | null) {
  return createServiceResult({
    ok: false,
    relationships: [],
    error,
  });
}

export function createSuccessfulFetchResult(
  rows: Parameters<typeof normalizeMetadataRelationshipDbRows>[0],
) {
  return createServiceResult({
    ok: true,
    relationships: normalizeMetadataRelationshipDbRows(rows),
    error: null,
  });
}