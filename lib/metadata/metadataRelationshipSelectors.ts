import {
  buildMetadataRelationshipGraph,
  groupMetadataRelationshipsByType,
  summarizeMetadataRelationships,
} from "./metadataRelationshipEngine";
import type {
  MetadataRelationshipGraphEdge,
  MetadataRelationshipGraphNode,
  MetadataRelationshipGroup,
  MetadataRelationshipStrength,
  NormalizedMetadataRelationship,
} from "./metadataRelationshipEngine";

export type MetadataRelationshipSelectorSummary = {
  totalRelationships: number;
  totalGroups: number;
  totalNodes: number;
  totalEdges: number;
  strongestRelationship: NormalizedMetadataRelationship | null;
  averageStrengthScore: number;
};

export type MetadataRelationshipSearchFilters = {
  type?: string;
  strength?: MetadataRelationshipStrength;
  sourceSlug?: string;
  targetSlug?: string;
  searchText?: string;
};

function cleanSelectorText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function relationshipMatchesSearchText(
  relationship: NormalizedMetadataRelationship,
  searchText: string,
) {
  const cleanSearchText = cleanSelectorText(searchText);

  if (!cleanSearchText) return true;

  const searchableText = [
    relationship.sourceTitle,
    relationship.sourceSlug,
    relationship.targetTitle,
    relationship.targetSlug,
    relationship.type,
    relationship.label,
    relationship.detail,
    relationship.note,
    relationship.reason,
    relationship.strength,
    relationship.source,
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(cleanSearchText);
}

export function sortRelationshipsByStrength(
  relationships: NormalizedMetadataRelationship[],
) {
  return relationships
    .slice()
    .sort((first, second) => second.strengthScore - first.strengthScore);
}

export function sortRelationshipsByTargetTitle(
  relationships: NormalizedMetadataRelationship[],
) {
  return relationships
    .slice()
    .sort((first, second) =>
      first.targetTitle.localeCompare(second.targetTitle),
    );
}

export function getStrongestMetadataRelationships(
  relationships: NormalizedMetadataRelationship[],
  limit = 5,
) {
  return sortRelationshipsByStrength(relationships).slice(0, limit);
}

export function getWeakestMetadataRelationships(
  relationships: NormalizedMetadataRelationship[],
  limit = 5,
) {
  return relationships
    .slice()
    .sort((first, second) => first.strengthScore - second.strengthScore)
    .slice(0, limit);
}

export function filterMetadataRelationships(
  relationships: NormalizedMetadataRelationship[],
  filters: MetadataRelationshipSearchFilters,
) {
  const cleanType = cleanSelectorText(filters.type);
  const cleanSourceSlug = cleanSelectorText(filters.sourceSlug);
  const cleanTargetSlug = cleanSelectorText(filters.targetSlug);

  return relationships.filter((relationship) => {
    if (cleanType && cleanSelectorText(relationship.type) !== cleanType) {
      return false;
    }

    if (filters.strength && relationship.strength !== filters.strength) {
      return false;
    }

    if (
      cleanSourceSlug &&
      cleanSelectorText(relationship.sourceSlug) !== cleanSourceSlug
    ) {
      return false;
    }

    if (
      cleanTargetSlug &&
      cleanSelectorText(relationship.targetSlug) !== cleanTargetSlug
    ) {
      return false;
    }

    if (
      filters.searchText &&
      !relationshipMatchesSearchText(relationship, filters.searchText)
    ) {
      return false;
    }

    return true;
  });
}

export function getMetadataRelationshipGroups(
  relationships: NormalizedMetadataRelationship[],
): MetadataRelationshipGroup[] {
  return groupMetadataRelationshipsByType(relationships);
}

export function getMetadataRelationshipGraphNodes(
  relationships: NormalizedMetadataRelationship[],
): MetadataRelationshipGraphNode[] {
  return buildMetadataRelationshipGraph(relationships).nodes;
}

export function getMetadataRelationshipGraphEdges(
  relationships: NormalizedMetadataRelationship[],
): MetadataRelationshipGraphEdge[] {
  return buildMetadataRelationshipGraph(relationships).edges;
}

export function getTopMetadataRelationshipGraphNodes(
  relationships: NormalizedMetadataRelationship[],
  limit = 8,
) {
  return getMetadataRelationshipGraphNodes(relationships).slice(0, limit);
}

export function getTopMetadataRelationshipGraphEdges(
  relationships: NormalizedMetadataRelationship[],
  limit = 12,
) {
  return getMetadataRelationshipGraphEdges(relationships).slice(0, limit);
}

export function getMetadataRelationshipTypes(
  relationships: NormalizedMetadataRelationship[],
) {
  return Array.from(
    new Set(relationships.map((relationship) => relationship.type)),
  ).sort((first, second) => first.localeCompare(second));
}

export function getMetadataRelationshipSelectorSummary(
  relationships: NormalizedMetadataRelationship[],
): MetadataRelationshipSelectorSummary {
  const summary = summarizeMetadataRelationships(relationships);
  const totalStrengthScore = relationships.reduce(
    (total, relationship) => total + relationship.strengthScore,
    0,
  );

  return {
    totalRelationships: summary.totalRelationships,
    totalGroups: summary.totalGroups,
    totalNodes: summary.totalNodes,
    totalEdges: summary.totalEdges,
    strongestRelationship: summary.strongestRelationship,
    averageStrengthScore:
      relationships.length > 0
        ? Math.round(totalStrengthScore / relationships.length)
        : 0,
  };
}

export function getMetadataRelationshipTargetTitles(
  relationships: NormalizedMetadataRelationship[],
) {
  return Array.from(
    new Set(
      relationships
        .map((relationship) => relationship.targetTitle)
        .filter((title) => title.trim().length > 0),
    ),
  ).sort((first, second) => first.localeCompare(second));
}

export function getMetadataRelationshipSourceTitles(
  relationships: NormalizedMetadataRelationship[],
) {
  return Array.from(
    new Set(
      relationships
        .map((relationship) => relationship.sourceTitle)
        .filter((title) => title.trim().length > 0),
    ),
  ).sort((first, second) => first.localeCompare(second));
}