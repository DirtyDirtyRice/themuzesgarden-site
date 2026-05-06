import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";
import { buildMapSummaryClusterModel } from "./relationshipExplorerMapSummaryClusterEngine";
import { buildMapSummaryGuidanceModel } from "./relationshipExplorerMapSummaryGuidanceEngine";
import { buildMapSummaryMetricsModel } from "./relationshipExplorerMapSummaryMetricsEngine";
import { buildMapSummarySignalModel } from "./relationshipExplorerMapSummarySignalEngine";
import { compactLabels } from "./relationshipExplorerMapSummaryFormatting";

export type RelationshipExplorerMapSummaryModel = ReturnType<
  typeof buildRelationshipExplorerMapSummaryModel
>;

function buildHeaderModel(
  metrics: ReturnType<typeof buildMapSummaryMetricsModel>,
  signal: ReturnType<typeof buildMapSummarySignalModel>
) {
  return {
    eyebrow: "Relationship map summary",
    title: metrics.mapState.label,
    detail: metrics.mapState.detail,
    activeRecordInsight: metrics.activeRecordInsight,
    summaryLine: signal.summaryLine,
    statusPills: compactLabels([
      metrics.mapState.tone,
      ...metrics.countPills,
      signal.signalBalanceLabel,
    ]),
  };
}

function buildOverviewModel(
  stats: RelationshipExplorerStats,
  signal: ReturnType<typeof buildMapSummarySignalModel>,
  guidance: ReturnType<typeof buildMapSummaryGuidanceModel>,
  cluster: ReturnType<typeof buildMapSummaryClusterModel>
) {
  return {
    label: "Map readout",
    headline: guidance.headline,
    supportText: guidance.supportText,
    summaryLine: signal.summaryLine,
    recommendationHint: signal.recommendationHint,
    readinessPills: compactLabels([
      guidance.readinessLabel,
      `${stats.historyCount} trail steps`,
      cluster.readiness,
    ]),
    intelligencePills: signal.intelligencePills,
  };
}

function buildActionModel(
  metrics: ReturnType<typeof buildMapSummaryMetricsModel>,
  guidance: ReturnType<typeof buildMapSummaryGuidanceModel>
) {
  return {
    primary: {
      label: metrics.primaryAction.label,
      detail: metrics.primaryAction.detail,
    },
    inspect: {
      label: guidance.inspectionLabel,
      detail: guidance.inspectionDetail,
    },
    routeHint: guidance.routeHint,
  };
}

function buildFooterModel(
  guidance: ReturnType<typeof buildMapSummaryGuidanceModel>
) {
  return {
    label: "Relationship explorer guidance",
    guidance: guidance.footerGuidance,
  };
}

function buildDiagnosticsModel(
  metrics: ReturnType<typeof buildMapSummaryMetricsModel>,
  signal: ReturnType<typeof buildMapSummarySignalModel>,
  cluster: ReturnType<typeof buildMapSummaryClusterModel>,
  guidance: ReturnType<typeof buildMapSummaryGuidanceModel>
) {
  return {
    densityRatio: metrics.densityRatio,
    signalPills: signal.statusPills,
    clusterNotes: cluster.notes,
    routeHint: guidance.routeHint,
  };
}

export function buildRelationshipExplorerMapSummaryModel(
  stats: RelationshipExplorerStats
) {
  const metrics = buildMapSummaryMetricsModel(stats);
  const signal = buildMapSummarySignalModel(stats);
  const cluster = buildMapSummaryClusterModel(stats);
  const guidance = buildMapSummaryGuidanceModel(stats);

  return {
    header: buildHeaderModel(metrics, signal),
    overview: buildOverviewModel(stats, signal, guidance, cluster),
    metrics: metrics.metrics,
    pulse: metrics.pulse,
    intelligence: signal,
    cluster,
    actions: buildActionModel(metrics, guidance),
    footer: buildFooterModel(guidance),
    conflict: signal.conflict,
    diagnostics: buildDiagnosticsModel(metrics, signal, cluster, guidance),
  };
}