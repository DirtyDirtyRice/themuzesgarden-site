import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";
import {
  getActiveRecordInsight,
  getDensityAction,
  getExplorerMapState,
  getHeaderMetrics,
} from "./relationshipExplorerHeaderUtils";
import { getMapPulseSummary } from "./relationshipExplorerMapSummaryTypes";
import {
  compactLabels,
  formatPercent,
  formatSummaryCount,
  getSavedRelationshipLabel,
  getSuggestedRelationshipLabel,
  getTrailStepLabel,
} from "./relationshipExplorerMapSummaryFormatting";

export type MapSummaryMetricsModel = {
  mapState: ReturnType<typeof getExplorerMapState>;
  metrics: ReturnType<typeof getHeaderMetrics>;
  pulse: ReturnType<typeof getMapPulseSummary>;
  activeRecordInsight: string;
  primaryAction: {
    label: string;
    detail: string;
  };
  countPills: string[];
  densityRatio: string;
};

function getTotalSignals(stats: RelationshipExplorerStats) {
  return Math.max(0, stats.relationshipCount + stats.relatedRecordsCount);
}

function getSavedRatio(stats: RelationshipExplorerStats) {
  return formatPercent(stats.relationshipCount, getTotalSignals(stats));
}

function getSuggestionRatio(stats: RelationshipExplorerStats) {
  return formatPercent(stats.relatedRecordsCount, getTotalSignals(stats));
}

function getPrimaryActionDetail(stats: RelationshipExplorerStats) {
  const base = getDensityAction(stats.relatedRecordsCount);

  if (stats.relatedRecordsCount >= 10 && stats.relationshipCount > 0) {
    return `${base} Saved coverage is ${getSavedRatio(stats)} of visible signals.`;
  }

  if (stats.relatedRecordsCount >= 4) {
    return `${base} Suggestions represent ${getSuggestionRatio(stats)} of visible signals.`;
  }

  return base;
}

function getPrimaryActionLabel(stats: RelationshipExplorerStats) {
  const mapState = getExplorerMapState(stats);

  if (stats.relatedRecordsCount >= 10) {
    return "Review strongest repeated relationship patterns.";
  }

  if (stats.relatedRecordsCount >= 4) {
    return mapState.action;
  }

  if (stats.relatedRecordsCount > 0) {
    return "Use early suggestions as a drafting surface.";
  }

  return mapState.action;
}

function getCountPills(stats: RelationshipExplorerStats) {
  return compactLabels([
    getSavedRelationshipLabel(stats),
    getSuggestedRelationshipLabel(stats),
    getTrailStepLabel(stats),
    formatSummaryCount(getTotalSignals(stats), "visible signal"),
  ]);
}

function getDensityRatioLabel(stats: RelationshipExplorerStats) {
  const total = getTotalSignals(stats);

  if (total <= 0) return "0% saved coverage";

  return `${getSavedRatio(stats)} saved coverage`;
}

function normalizeMetricDetails(metrics: ReturnType<typeof getHeaderMetrics>) {
  return metrics.map((metric) => ({
    ...metric,
    label: String(metric.label ?? "metric").trim() || "metric",
    value: metric.value ?? "—",
    detail: String(metric.detail ?? "No detail available yet.").trim(),
  }));
}

export function buildMapSummaryMetricsModel(
  stats: RelationshipExplorerStats
): MapSummaryMetricsModel {
  const mapState = getExplorerMapState(stats);
  const metrics = normalizeMetricDetails(getHeaderMetrics(stats));
  const pulse = getMapPulseSummary(
    stats.relationshipCount,
    stats.relatedRecordsCount
  );

  return {
    mapState,
    metrics,
    pulse,
    activeRecordInsight: getActiveRecordInsight(stats),
    primaryAction: {
      label: getPrimaryActionLabel(stats),
      detail: getPrimaryActionDetail(stats),
    },
    countPills: getCountPills(stats),
    densityRatio: getDensityRatioLabel(stats),
  };
}