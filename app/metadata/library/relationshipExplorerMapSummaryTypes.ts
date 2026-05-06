import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";

export type FlexibleRelationshipStats = RelationshipExplorerStats &
  Record<string, unknown>;

export type SignalBalance = {
  label: string;
  detail: string;
  tone: string;
};

export type SignalStrengthTier = "none" | "weak" | "moderate" | "strong";

export type ExplorationMode = "Empty" | "Explore" | "Refine" | "Balanced";

export type ClusterDensity = "none" | "tight" | "mixed" | "fragmented";

export type MapIntelligence = {
  dominantSignal: string;
  mapType: string;
  clusterStrength: string;
  recommendationHint: string;
  signalBalance: SignalBalance;
  confidenceScore: number;
  explorationMode: ExplorationMode;
  signalStrengthTier: SignalStrengthTier;
  clusterDensity: ClusterDensity;
  hasSignalConflict: boolean;
  summaryLine: string;
};

export type SignalDistribution = {
  shelfCount: number;
  sectionCount: number;
  languageCount: number;
  shelfPercent: number;
  sectionPercent: number;
  languagePercent: number;
};

export type MapSummaryAction = {
  label: string;
  detail: string;
};

export type MapPulseSummary = {
  savedCount: number;
  suggestedCount: number;
  totalCount: number;
  label: string;
};

export function getMapPulseSummary(
  savedCount: number,
  suggestedCount: number
): MapPulseSummary {
  const totalCount = savedCount + suggestedCount;

  return {
    savedCount,
    suggestedCount,
    totalCount,
    label: totalCount > 0 ? `${totalCount} total signals` : "no signals yet",
  };
}