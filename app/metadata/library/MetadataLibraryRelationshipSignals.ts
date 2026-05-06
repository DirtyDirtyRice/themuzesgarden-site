import { formatLabel } from "./metadataLibraryHelpers";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  MetadataRelationshipContext,
  MetadataRelationshipLayerKey,
  MetadataRelationshipSnapshot,
  MetadataRelationshipSource,
  MetadataRelationshipStrength,
} from "./MetadataLibraryRelationshipIntelligenceTypes";

export function getRelationshipLayerLabel(
  layer: MetadataRelationshipLayerKey,
) {
  if (layer === "structure") return "Structure";
  if (layer === "meaning") return "Meaning";
  return "Usage";
}

export function getRelationshipLayerPurpose(
  layer: MetadataRelationshipLayerKey,
) {
  if (layer === "structure") {
    return "Find records connected by shelf, section, visibility, and structural placement.";
  }

  if (layer === "meaning") {
    return "Prepare records for intent, concept, semantic, and creative-purpose comparisons.";
  }

  return "Prepare records for workflow placement, track usage, prompt usage, and app-wide reuse.";
}

export function getRelationshipLayerMemoryLabel(
  layer: MetadataRelationshipLayerKey,
) {
  if (layer === "structure") return "Memory: structure path is active";
  if (layer === "meaning") return "Memory: meaning lens is active";
  return "Memory: usage lens is active";
}

export function labelRelationshipStrength(
  strength: MetadataRelationshipStrength,
) {
  if (strength === "strong") return "Strong Match";
  if (strength === "medium") return "Related Match";
  return "Loose Match";
}

export function labelRelationshipSource(source: MetadataRelationshipSource) {
  if (source === "shelf") return "Same Shelf";
  return "Same Section";
}

export function explainRelationshipStrength(
  strength: MetadataRelationshipStrength,
) {
  if (strength === "strong") {
    return "This record was opened from a high-confidence structural relationship.";
  }

  if (strength === "medium") {
    return "This record was opened from a related structural group.";
  }

  return "This record was opened from a lighter structural relationship.";
}

export function explainRelationshipSource(source: MetadataRelationshipSource) {
  if (source === "shelf") {
    return "The source relationship came from records sharing the same shelf.";
  }

  return "The source relationship came from records sharing the same section.";
}

export function getRelationshipStructureSignal(params: {
  openRecord: MetadataLibraryRecordSummary;
  relatedByShelfLength: number;
  relatedBySectionLength: number;
}) {
  const { openRecord, relatedByShelfLength, relatedBySectionLength } = params;

  return `${formatLabel(openRecord.title)} currently has ${relatedByShelfLength} same-shelf structural links and ${relatedBySectionLength} same-section structural links.`;
}

export function getRelationshipMeaningSignal(
  openRecord: MetadataLibraryRecordSummary,
) {
  return `${formatLabel(openRecord.title)} can later be compared by intent, concept, creative role, and semantic purpose.`;
}

export function getRelationshipUsageSignal(
  openRecord: MetadataLibraryRecordSummary,
) {
  return `${formatLabel(openRecord.title)} can later be tracked across tracks, prompts, instruments, workflows, and app tools.`;
}

export function getRelationshipQuerySignal(activeQuery: string) {
  const query = activeQuery.trim();

  if (!query) {
    return "No active search query is shaping this relationship view.";
  }

  return `Active search memory is carrying “${query}” into the relationship workspace.`;
}

export function buildRelationshipSnapshot(params: {
  activeLayer: MetadataRelationshipLayerKey;
  activeQuery: string;
  openRecord: MetadataLibraryRecordSummary;
  relatedByShelfLength: number;
  relatedBySectionLength: number;
}): MetadataRelationshipSnapshot {
  const {
    activeLayer,
    activeQuery,
    openRecord,
    relatedByShelfLength,
    relatedBySectionLength,
  } = params;

  const layerLabel = getRelationshipLayerLabel(activeLayer);
  const structureSignal = getRelationshipStructureSignal({
    openRecord,
    relatedByShelfLength,
    relatedBySectionLength,
  });
  const meaningSignal = getRelationshipMeaningSignal(openRecord);
  const usageSignal = getRelationshipUsageSignal(openRecord);

  return {
    layerLabel,
    layerPurpose: getRelationshipLayerPurpose(activeLayer),
    layerMemoryLabel: getRelationshipLayerMemoryLabel(activeLayer),
    structureSignal,
    meaningSignal,
    usageSignal,
    querySignal: getRelationshipQuerySignal(activeQuery),
    crossLayerBridge: `${layerLabel} is active, but the workspace keeps structure, meaning, and usage connected so the relationship trail does not reset when layers change.`,
    relationshipReadiness: `${formatLabel(openRecord.title)} is ready for cross-layer relationship intelligence without changing stored metadata yet.`,
  };
}

export function buildRelationshipTrailSummary(
  relationshipContext: MetadataRelationshipContext | undefined,
) {
  if (!relationshipContext) {
    return "Opened directly. No carried relationship trail yet.";
  }

  const scoreText =
    typeof relationshipContext.score === "number"
      ? ` Confidence score: ${relationshipContext.score}.`
      : "";

  return `Opened from ${formatLabel(
    relationshipContext.fromTitle,
  )} through ${labelRelationshipStrength(
    relationshipContext.strength,
  )} / ${labelRelationshipSource(relationshipContext.source)}.${scoreText}`;
}