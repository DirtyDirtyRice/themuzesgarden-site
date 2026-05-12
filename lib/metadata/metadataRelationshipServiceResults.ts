import {
  normalizeMetadataRelationshipDbRows,
  normalizeUnknownMetadataRelationshipDbRows,
} from "./metadataRelationshipAdapter";
import type { MetadataRelationshipDbRow } from "./metadataRelationshipAdapter";
import {
  getMetadataRelationshipGroups,
  getMetadataRelationshipGraphEdges,
  getMetadataRelationshipGraphNodes,
  getMetadataRelationshipSelectorSummary,
  getStrongestMetadataRelationships,
} from "./metadataRelationshipSelectors";
import type { NormalizedMetadataRelationship } from "./metadataRelationshipEngine";

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

export function createServiceResult({
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

export function createTableSourceResult({
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