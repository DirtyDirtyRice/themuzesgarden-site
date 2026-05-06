import { formatLabel } from "./metadataLibraryHelpers";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import {
  getRelationshipLayerLabel,
  getRelationshipLayerPurpose,
  getRelationshipQuerySignal,
} from "./MetadataLibraryRelationshipSignals";
import type {
  MetadataRelationshipLayerKey,
  MetadataRelationshipMemoryItem,
} from "./MetadataLibraryRelationshipIntelligenceTypes";

export function getRelationshipLayerMomentum(
  layer: MetadataRelationshipLayerKey,
) {
  if (layer === "structure") {
    return "Structure is mapping where the record lives before the system decides what it means or where it is reused.";
  }

  if (layer === "meaning") {
    return "Meaning is preparing the record for intent and concept matching after structure gives it a clean starting point.";
  }

  return "Usage is preparing the record for real app activity after structure and meaning explain why the record matters.";
}

export function getRelationshipNextStep(
  layer: MetadataRelationshipLayerKey,
) {
  if (layer === "structure") {
    return "Next: use the strongest structural links as the first candidates for meaning comparison.";
  }

  if (layer === "meaning") {
    return "Next: turn meaning candidates into usage candidates once real workflow events exist.";
  }

  return "Next: connect usage candidates to player, prompt, timeline, and workflow systems.";
}

export function buildRelationshipMemoryItems(params: {
  activeLayer: MetadataRelationshipLayerKey;
  activeQuery: string;
  openRecord: MetadataLibraryRecordSummary;
  relatedByShelfLength: number;
  relatedBySectionLength: number;
}): MetadataRelationshipMemoryItem[] {
  const {
    activeLayer,
    activeQuery,
    openRecord,
    relatedByShelfLength,
    relatedBySectionLength,
  } = params;

  return [
    {
      label: "Layer",
      value: getRelationshipLayerLabel(activeLayer),
      detail: getRelationshipLayerPurpose(activeLayer),
    },
    {
      label: "Record",
      value: formatLabel(openRecord.title),
      detail: `${formatLabel(openRecord.shelf)} / ${formatLabel(
        openRecord.section,
      )} / ${formatLabel(openRecord.visibility)}`,
    },
    {
      label: "Structure",
      value: `${relatedByShelfLength + relatedBySectionLength} candidates`,
      detail: `${relatedByShelfLength} same-shelf links and ${relatedBySectionLength} same-section links are available as the starting relationship pool.`,
    },
    {
      label: "Search",
      value: activeQuery.trim() ? `“${activeQuery.trim()}”` : "No query",
      detail: getRelationshipQuerySignal(activeQuery),
    },
  ];
}