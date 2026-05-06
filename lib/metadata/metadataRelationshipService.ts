import {
  normalizeMetadataRelationshipDbRows,
  normalizeUnknownMetadataRelationshipDbRows,
} from "./metadataRelationshipAdapter";
import type {
  MetadataRelationshipDbInsertPayload,
  MetadataRelationshipDbRow,
} from "./metadataRelationshipAdapter";
import {
  fetchAllMetadataRelationships,
  fetchMetadataRelationshipsBySourceSlug,
  fetchMetadataRelationshipsBySourceSlugs,
  fetchMetadataRelationshipsByTargetSlug,
  fetchMetadataRelationshipsForRecordSlug,
  fetchRecentMetadataRelationships,
} from "./metadataRelationshipQueries";
import type { MetadataRelationshipQueryClient } from "./metadataRelationshipQueries";
import {
  getMetadataRelationshipGroups,
  getMetadataRelationshipGraphEdges,
  getMetadataRelationshipGraphNodes,
  getMetadataRelationshipSelectorSummary,
  getStrongestMetadataRelationships,
} from "./metadataRelationshipSelectors";
import type {
  MetadataRelationshipInput,
  NormalizedMetadataRelationship,
} from "./metadataRelationshipEngine";
import {
  createMetadataRelationship,
  createManyMetadataRelationships,
  createValidMetadataRelationships,
  deleteManyMetadataRelationships,
  deleteMetadataRelationship,
  updateMetadataRelationship,
} from "./metadataRelationshipMutations";
import type {
  MetadataRelationshipBatchMutationResult,
  MetadataRelationshipMutationClient,
  MetadataRelationshipMutationResult,
} from "./metadataRelationshipMutations";

export type MetadataRelationshipServiceResult = {
  ok: boolean;
  relationships: NormalizedMetadataRelationship[];
  error: string | null;
};

export type MetadataRelationshipServiceSummary = {
  relationships: NormalizedMetadataRelationship[];
  summary: ReturnType<typeof getMetadataRelationshipSelectorSummary>;
  groups: ReturnType<typeof getMetadataRelationshipGroups>;
  graphNodes: ReturnType<typeof getMetadataRelationshipGraphNodes>;
  graphEdges: ReturnType<typeof getMetadataRelationshipGraphEdges>;
  strongestRelationships: NormalizedMetadataRelationship[];
};

export type MetadataRelationshipTableSourceResult =
  MetadataRelationshipServiceResult & {
    source: "table" | "empty";
    tableCount: number;
  };

function createServiceResult({
  ok,
  relationships,
  error,
}: MetadataRelationshipServiceResult): MetadataRelationshipServiceResult {
  return {
    ok,
    relationships,
    error,
  };
}

function createTableSourceResult({
  ok,
  relationships,
  error,
}: MetadataRelationshipServiceResult): MetadataRelationshipTableSourceResult {
  return {
    ok,
    relationships,
    error,
    source: relationships.length > 0 ? "table" : "empty",
    tableCount: relationships.length,
  };
}

export function buildMetadataRelationshipServiceSummary(
  relationships: NormalizedMetadataRelationship[],
): MetadataRelationshipServiceSummary {
  return {
    relationships,
    summary: getMetadataRelationshipSelectorSummary(relationships),
    groups: getMetadataRelationshipGroups(relationships),
    graphNodes: getMetadataRelationshipGraphNodes(relationships),
    graphEdges: getMetadataRelationshipGraphEdges(relationships),
    strongestRelationships: getStrongestMetadataRelationships(relationships),
  };
}

export function normalizeRelationshipRowsForService(
  rows: MetadataRelationshipDbRow[],
): MetadataRelationshipServiceSummary {
  return buildMetadataRelationshipServiceSummary(
    normalizeMetadataRelationshipDbRows(rows),
  );
}

export function normalizeUnknownRelationshipRowsForService(
  rows: unknown[],
): MetadataRelationshipServiceSummary {
  return buildMetadataRelationshipServiceSummary(
    normalizeUnknownMetadataRelationshipDbRows(rows),
  );
}

export async function getAllMetadataRelationshipsForService({
  client,
  tableName,
}: {
  client: MetadataRelationshipQueryClient;
  tableName?: string;
}): Promise<MetadataRelationshipServiceResult> {
  const result = await fetchAllMetadataRelationships({ client, tableName });

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
    error: null,
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
  const result = await fetchMetadataRelationshipsBySourceSlug({
    client,
    sourceSlug,
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
    error: null,
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
  const result = await fetchMetadataRelationshipsBySourceSlugs({
    client,
    sourceSlugs,
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
    error: null,
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
  const result = await fetchMetadataRelationshipsByTargetSlug({
    client,
    targetSlug,
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
    error: null,
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
  const result = await fetchRecentMetadataRelationships({
    client,
    limit,
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
    error: null,
  });
}

export async function createRelationshipThroughService({
  client,
  input,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  input: MetadataRelationshipInput;
  tableName?: string;
}): Promise<MetadataRelationshipMutationResult> {
  return createMetadataRelationship({ client, input, tableName });
}

export async function createRelationshipsThroughService({
  client,
  inputs,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  inputs: MetadataRelationshipInput[];
  tableName?: string;
}): Promise<MetadataRelationshipBatchMutationResult> {
  return createManyMetadataRelationships({ client, inputs, tableName });
}

export async function createValidRelationshipsThroughService({
  client,
  inputs,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  inputs: MetadataRelationshipInput[];
  tableName?: string;
}): Promise<MetadataRelationshipBatchMutationResult> {
  return createValidMetadataRelationships({ client, inputs, tableName });
}

export async function updateRelationshipThroughService({
  client,
  relationshipId,
  input,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  relationshipId: string;
  input: MetadataRelationshipInput;
  tableName?: string;
}): Promise<MetadataRelationshipMutationResult> {
  return updateMetadataRelationship({
    client,
    relationshipId,
    input,
    tableName,
  });
}

export async function deleteRelationshipThroughService({
  client,
  relationshipId,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  relationshipId: string;
  tableName?: string;
}): Promise<MetadataRelationshipMutationResult> {
  return deleteMetadataRelationship({ client, relationshipId, tableName });
}

export async function deleteRelationshipsThroughService({
  client,
  relationshipIds,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  relationshipIds: string[];
  tableName?: string;
}): Promise<MetadataRelationshipBatchMutationResult> {
  return deleteManyMetadataRelationships({ client, relationshipIds, tableName });
}

export type { MetadataRelationshipDbInsertPayload };