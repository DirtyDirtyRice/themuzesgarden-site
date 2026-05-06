import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";
import {
  cleanSummaryText,
  getMapDensityLabel,
  getSummaryTone,
  getToneLabel,
  getTrailStepLabel,
  type SummaryCopyBlock,
} from "./relationshipExplorerMapSummaryFormatting";

export type MapSummaryGuidanceModel = {
  headline: string;
  supportText: string;
  readinessLabel: string;
  footerGuidance: string;
  density: SummaryCopyBlock;
  inspectionLabel: string;
  inspectionDetail: string;
  routeHint: string;
};

export function getSummaryHeadline(stats: RelationshipExplorerStats) {
  if (stats.relationshipCount > 0 && stats.relatedRecordsCount > 0) {
    return "Saved relationships and suggested matches are both active.";
  }

  if (stats.relationshipCount > 0) {
    return "Saved relationships are active for this record.";
  }

  if (stats.relatedRecordsCount > 0) {
    return "Suggested relationship matches are active for this record.";
  }

  return "This record needs more relationship material.";
}

export function getSummarySupportText(stats: RelationshipExplorerStats) {
  if (stats.relatedRecordsCount >= 10) {
    return "There are enough suggestions to start looking for repeated patterns, clusters, and cleanup opportunities.";
  }

  if (stats.relatedRecordsCount >= 4) {
    return "There are enough suggestions to compare structure, language, and relationship strength.";
  }

  if (stats.relatedRecordsCount > 0) {
    return "There are early signals, but the map will become smarter as more metadata is added.";
  }

  return "Add shelf, section, preview, or saved relationships to create stronger relationship signals.";
}

export function getMapReadinessLabel(stats: RelationshipExplorerStats) {
  if (stats.relatedRecordsCount >= 10 && stats.relationshipCount > 0) {
    return "ready for cluster review";
  }

  if (stats.relatedRecordsCount >= 4) {
    return "ready for match review";
  }

  if (stats.relatedRecordsCount > 0) {
    return "early review";
  }

  return "needs data";
}

export function getFooterGuidance(stats: RelationshipExplorerStats) {
  if (stats.relatedRecordsCount >= 10) {
    return "Next best move: inspect the strongest repeated signals, then decide which relationship groups should become saved links.";
  }

  if (stats.relatedRecordsCount >= 4) {
    return "Next best move: open the strongest match cards and compare why each match was suggested.";
  }

  if (stats.relatedRecordsCount > 0) {
    return "Next best move: add clearer preview text or section placement so the suggestions become easier to trust.";
  }

  return "Next best move: add metadata to the active record so the relationship explorer has something useful to compare.";
}

function getInspectionLabel(stats: RelationshipExplorerStats) {
  if (stats.relatedRecordsCount >= 10) {
    return "Inspect repeated relationship clusters.";
  }

  if (stats.relatedRecordsCount >= 4) {
    return "Inspect explainable match cards.";
  }

  if (stats.relatedRecordsCount > 0) {
    return "Inspect early relationship hints.";
  }

  return "Add source material before inspection.";
}

function getInspectionDetail(stats: RelationshipExplorerStats) {
  if (stats.relatedRecordsCount > 0) {
    return "The quick-record cards show confidence, matched words, and score breakdowns.";
  }

  return "The cards below will become useful after this record has comparable metadata.";
}

function getRouteHint(stats: RelationshipExplorerStats) {
  const tone = getSummaryTone(stats);

  if (tone === "dense") {
    return "Use the map summary first, then move down into the strongest signals.";
  }

  if (tone === "ready") {
    return "Use the suggested cards first, then decide which links deserve saving.";
  }

  if (tone === "early") {
    return "Use the preview and language fields to make future suggestions easier to trust.";
  }

  return "Start with metadata enrichment before expecting meaningful relationship routes.";
}

export function buildMapSummaryGuidanceModel(
  stats: RelationshipExplorerStats
): MapSummaryGuidanceModel {
  const density = getMapDensityLabel(stats);

  return {
    headline: cleanSummaryText(getSummaryHeadline(stats)),
    supportText: cleanSummaryText(getSummarySupportText(stats)),
    readinessLabel: cleanSummaryText(getMapReadinessLabel(stats)),
    footerGuidance: cleanSummaryText(getFooterGuidance(stats)),
    density,
    inspectionLabel: getInspectionLabel(stats),
    inspectionDetail: getInspectionDetail(stats),
    routeHint: `${getToneLabel(density.tone)} • ${getTrailStepLabel(stats)} • ${getRouteHint(stats)}`,
  };
}