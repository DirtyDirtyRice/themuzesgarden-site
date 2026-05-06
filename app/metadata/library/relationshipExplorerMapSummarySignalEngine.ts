import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";
import { getMapIntelligence } from "./relationshipExplorerMapSummaryIntelligence";
import {
  cleanSummaryText,
  compactLabels,
  joinSummaryParts,
} from "./relationshipExplorerMapSummaryFormatting";

export type MapSummarySignalModel = {
  raw: ReturnType<typeof getMapIntelligence>;
  summaryLine: string;
  recommendationHint: string;
  statusPills: string[];
  intelligencePills: string[];
  signalBalanceLabel: string;
  conflict: {
    show: boolean;
    label: string;
    detail: string;
  };
};

function getConfidenceLabel(intelligence: ReturnType<typeof getMapIntelligence>) {
  const confidence = String(intelligence.confidenceScore ?? "").trim();
  return confidence.length ? confidence : "confidence pending";
}

function getExplorationModeLabel(
  intelligence: ReturnType<typeof getMapIntelligence>
) {
  return cleanSummaryText(intelligence.explorationMode, "exploration pending");
}

function getSignalStrengthLabel(
  intelligence: ReturnType<typeof getMapIntelligence>
) {
  return cleanSummaryText(intelligence.signalStrengthTier, "signal strength pending");
}

function getClusterDensityLabel(
  intelligence: ReturnType<typeof getMapIntelligence>
) {
  return cleanSummaryText(intelligence.clusterDensity, "cluster density pending");
}

function getSignalBalanceLabel(
  intelligence: ReturnType<typeof getMapIntelligence>
) {
  return cleanSummaryText(intelligence.signalBalance?.label, "signal balance pending");
}

function getConflictDetail(
  intelligence: ReturnType<typeof getMapIntelligence>
) {
  const balanceDetail = cleanSummaryText(intelligence.signalBalance?.detail, "");

  if (balanceDetail) return balanceDetail;

  return "Structure and language signals are competing. Review both before saving.";
}

function getStatusPills(
  stats: RelationshipExplorerStats,
  intelligence: ReturnType<typeof getMapIntelligence>
) {
  return compactLabels([
    getSignalBalanceLabel(intelligence),
    stats.relationshipCount > 0 ? "saved links active" : "saved links pending",
    stats.relatedRecordsCount > 0 ? "suggestions active" : "suggestions pending",
  ]);
}

function getIntelligencePills(intelligence: ReturnType<typeof getMapIntelligence>) {
  return compactLabels([
    getConfidenceLabel(intelligence),
    getExplorationModeLabel(intelligence),
    getSignalStrengthLabel(intelligence),
    getClusterDensityLabel(intelligence),
  ]);
}

function getSummaryLine(intelligence: ReturnType<typeof getMapIntelligence>) {
  const summaryLine = cleanSummaryText(intelligence.summaryLine, "");

  if (summaryLine) return summaryLine;

  return joinSummaryParts([
    getExplorationModeLabel(intelligence),
    getSignalStrengthLabel(intelligence),
    getClusterDensityLabel(intelligence),
  ]);
}

function getRecommendationHint(
  intelligence: ReturnType<typeof getMapIntelligence>
) {
  return cleanSummaryText(
    intelligence.recommendationHint,
    "No recommendation is available yet. Add more metadata to strengthen the map."
  );
}

export function buildMapSummarySignalModel(
  stats: RelationshipExplorerStats
): MapSummarySignalModel {
  const raw = getMapIntelligence(stats);

  return {
    raw,
    summaryLine: getSummaryLine(raw),
    recommendationHint: getRecommendationHint(raw),
    statusPills: getStatusPills(stats, raw),
    intelligencePills: getIntelligencePills(raw),
    signalBalanceLabel: getSignalBalanceLabel(raw),
    conflict: {
      show: Boolean(raw.hasSignalConflict),
      label: "Signal conflict detected",
      detail: getConflictDetail(raw),
    },
  };
}