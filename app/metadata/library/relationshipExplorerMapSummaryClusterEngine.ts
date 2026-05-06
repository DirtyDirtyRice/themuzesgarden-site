import type {
  RelationshipClusterSummary,
  RelationshipExplorerStats,
} from "./relationshipExplorerTypes";
import {
  cleanSummaryText,
  compactLabels,
  formatSummaryCount,
  getSummaryTone,
} from "./relationshipExplorerMapSummaryFormatting";

export type MapSummaryClusterModel = {
  summary: RelationshipClusterSummary;
  insight: string;
  readiness: string;
  notes: string[];
};

export function getPendingClusterSummary(): RelationshipClusterSummary {
  return {
    shelf: "pending",
    section: "pending",
    language: "pending",
    strongestKind: "none",
    strongestLabel: "cluster wiring pending",
    strongestCount: 0,
  };
}

export function getPendingClusterInsight(stats: RelationshipExplorerStats) {
  if (stats.relatedRecordsCount <= 0) {
    return "Clusters will activate after related records are available.";
  }

  if (stats.relatedRecordsCount >= 10 && stats.relationshipCount > 0) {
    return "Cluster review is ready. Compare repeated suggestion patterns against saved relationship decisions.";
  }

  if (stats.relatedRecordsCount >= 4) {
    return "Cluster logic is ready for review. More saved links will make the map easier to trust.";
  }

  return "Cluster logic is ready. The next wiring step will pass real related-record signals into this summary.";
}

function getClusterReadiness(stats: RelationshipExplorerStats) {
  const tone = getSummaryTone(stats);

  if (tone === "dense") return "cluster review ready";
  if (tone === "ready") return "cluster draft ready";
  if (tone === "early") return "cluster warmup";
  return "cluster pending";
}

function getClusterNotes(stats: RelationshipExplorerStats) {
  const notes = compactLabels([
    stats.relatedRecordsCount >= 10
      ? "enough suggested matches for repeated pattern review"
      : null,
    stats.relationshipCount > 0
      ? "saved links can now be compared against suggestions"
      : null,
    stats.historyCount > 0
      ? `${formatSummaryCount(stats.historyCount, "trail step")} available`
      : null,
    stats.relatedRecordsCount <= 0
      ? "no suggestion material available for cluster shaping yet"
      : null,
  ]);

  if (notes.length) return notes;

  return ["cluster notes will expand as relationship detail grows"];
}

function getStrongestLabel(stats: RelationshipExplorerStats) {
  if (stats.relatedRecordsCount >= 10) {
    return "suggestion density";
  }

  if (stats.relationshipCount > 0) {
    return "saved relationship presence";
  }

  if (stats.relatedRecordsCount > 0) {
    return "early suggestion presence";
  }

  return "cluster wiring pending";
}

function getStrongestCount(stats: RelationshipExplorerStats) {
  if (stats.relatedRecordsCount >= stats.relationshipCount) {
    return stats.relatedRecordsCount;
  }

  return stats.relationshipCount;
}

function buildProjectedClusterSummary(
  stats: RelationshipExplorerStats
): RelationshipClusterSummary {
  const pending = getPendingClusterSummary();

  return {
    ...pending,
    strongestKind: pending.strongestKind,
    strongestLabel: cleanSummaryText(getStrongestLabel(stats), pending.strongestLabel),
    strongestCount: getStrongestCount(stats),
  };
}

export function buildMapSummaryClusterModel(
  stats: RelationshipExplorerStats
): MapSummaryClusterModel {
  return {
    summary: buildProjectedClusterSummary(stats),
    insight: getPendingClusterInsight(stats),
    readiness: getClusterReadiness(stats),
    notes: getClusterNotes(stats),
  };
}