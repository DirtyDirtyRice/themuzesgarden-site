import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";
import type {
  FlexibleRelationshipStats,
  MapIntelligence,
  SignalBalance,
  SignalDistribution,
} from "./relationshipExplorerMapSummaryTypes";

/* =========================================================
   BASIC HELPERS (STABLE BASE)
========================================================= */

export function getStatNumber(stats: RelationshipExplorerStats, key: string) {
  const value = (stats as FlexibleRelationshipStats)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function getPercent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/* =========================================================
   SIGNAL COUNTS
========================================================= */

export function getShelfSignalCount(stats: RelationshipExplorerStats) {
  return (
    getStatNumber(stats, "shelfMatchCount") ||
    getStatNumber(stats, "relatedByShelfCount")
  );
}

export function getSectionSignalCount(stats: RelationshipExplorerStats) {
  return (
    getStatNumber(stats, "sectionMatchCount") ||
    getStatNumber(stats, "relatedBySectionCount")
  );
}

export function getLanguageSignalCount(stats: RelationshipExplorerStats) {
  return (
    getStatNumber(stats, "titleMatchCount") ||
    getStatNumber(stats, "languageMatchCount")
  );
}

export function getStructureSignalCount(stats: RelationshipExplorerStats) {
  return getShelfSignalCount(stats) + getSectionSignalCount(stats);
}

/* =========================================================
   DOMINANT SIGNAL
========================================================= */

export function getDominantSignal(stats: RelationshipExplorerStats) {
  const options = [
    { label: "Shelf", value: getShelfSignalCount(stats) },
    { label: "Section", value: getSectionSignalCount(stats) },
    { label: "Language", value: getLanguageSignalCount(stats) },
    { label: "Saved", value: stats.relationshipCount },
    { label: "Suggested", value: stats.relatedRecordsCount },
  ];

  const winner = options.sort((a, b) => b.value - a.value)[0];

  if (!winner || winner.value <= 0) return "No dominant signal yet";
  return winner.label;
}

/* =========================================================
   SIGNAL BALANCE
========================================================= */

export function getSignalBalance(
  stats: RelationshipExplorerStats
): SignalBalance {
  const structure = getStructureSignalCount(stats);
  const language = getLanguageSignalCount(stats);

  if (structure === 0 && language === 0) {
    return {
      label: "Signal balance pending",
      detail:
        "The current relationship stats need more structure or language signal before balance can be read.",
      tone: "pending",
    };
  }

  if (structure >= language * 2) {
    return {
      label: "Structure-led map",
      detail:
        "Shelf and section matches are carrying most of the relationship meaning right now.",
      tone: "structured",
    };
  }

  if (language >= structure * 2) {
    return {
      label: "Language-led map",
      detail:
        "Shared words and title language are carrying most of the relationship meaning right now.",
      tone: "language",
    };
  }

  return {
    label: "Balanced map",
    detail:
      "Structure and language are both contributing useful relationship signals.",
    tone: "balanced",
  };
}

/* =========================================================
   CLUSTER + MAP TYPES
========================================================= */

export function getClusterStrength(stats: RelationshipExplorerStats) {
  const total = stats.relatedRecordsCount;
  if (total <= 0) return "No clusters yet";

  const structure = getStructureSignalCount(stats);
  const percent = getPercent(structure, total);

  if (percent >= 80) return "Very clustered";
  if (percent >= 55) return "Clustered";
  if (percent >= 30) return "Loosely clustered";
  return "Wide discovery";
}

export function getMapType(stats: RelationshipExplorerStats) {
  if (stats.relationshipCount > 0 && stats.relatedRecordsCount >= 8) {
    return "Saved + suggested map";
  }

  if (stats.relationshipCount > 0) return "Saved relationship map";
  if (stats.relatedRecordsCount >= 8) return "Suggested discovery map";
  if (stats.relatedRecordsCount > 0) return "Early suggestion map";

  return "Empty relationship map";
}

/* =========================================================
   NEW: SIGNAL STRENGTH TIERS
========================================================= */

export function getSignalStrengthTier(stats: RelationshipExplorerStats) {
  const total =
    getStructureSignalCount(stats) +
    getLanguageSignalCount(stats) +
    stats.relationshipCount;

  if (total === 0) return "none";
  if (total < 5) return "weak";
  if (total < 15) return "moderate";
  return "strong";
}

/* =========================================================
   NEW: CONFIDENCE SCORE (0–100)
========================================================= */

export function getConfidenceScore(stats: RelationshipExplorerStats) {
  const base =
    stats.relationshipCount * 3 +
    getStructureSignalCount(stats) * 2 +
    getLanguageSignalCount(stats);

  const cap = 100;
  return Math.min(base, cap);
}

/* =========================================================
   NEW: EXPLORATION MODE
========================================================= */

export function getExplorationMode(stats: RelationshipExplorerStats) {
  if (stats.relationshipCount === 0 && stats.relatedRecordsCount === 0) {
    return "Empty";
  }

  if (stats.relationshipCount === 0) return "Explore";
  if (stats.relatedRecordsCount >= 10) return "Refine";

  return "Balanced";
}

/* =========================================================
   NEW: CLUSTER DENSITY
========================================================= */

export function getClusterDensity(stats: RelationshipExplorerStats) {
  const total = stats.relatedRecordsCount;
  if (total <= 0) return "none";

  const structure = getStructureSignalCount(stats);
  const percent = getPercent(structure, total);

  if (percent >= 75) return "tight";
  if (percent >= 40) return "mixed";
  return "fragmented";
}

/* =========================================================
   NEW: SIGNAL CONFLICT DETECTION
========================================================= */

export function getSignalConflict(stats: RelationshipExplorerStats) {
  const structure = getStructureSignalCount(stats);
  const language = getLanguageSignalCount(stats);

  if (structure > 0 && language > 0 && Math.abs(structure - language) < 2) {
    return true;
  }

  return false;
}

/* =========================================================
   RECOMMENDATION
========================================================= */

export function getRecommendationHint(stats: RelationshipExplorerStats) {
  if (stats.relatedRecordsCount === 0 && stats.relationshipCount === 0) {
    return "Open more records or add saved relationships so the map has material to compare.";
  }

  if (stats.relationshipCount === 0 && stats.relatedRecordsCount > 0) {
    return "Review the strongest suggestions first, then save the ones that should become permanent links.";
  }

  if (stats.relatedRecordsCount >= 10) {
    return "Use the strongest and most repeated signals to decide which relationship clusters deserve cleanup.";
  }

  return "Keep browsing nearby records and use the detail panels to confirm relationship meaning.";
}

/* =========================================================
   SIGNAL DISTRIBUTION
========================================================= */

export function getSignalDistribution(
  stats: RelationshipExplorerStats
): SignalDistribution {
  const total = Math.max(stats.relatedRecordsCount, 1);
  const shelfCount = getShelfSignalCount(stats);
  const sectionCount = getSectionSignalCount(stats);
  const languageCount = getLanguageSignalCount(stats);

  return {
    shelfCount,
    sectionCount,
    languageCount,
    shelfPercent: getPercent(shelfCount, total),
    sectionPercent: getPercent(sectionCount, total),
    languagePercent: getPercent(languageCount, total),
  };
}

/* =========================================================
   NEW: HUMAN SUMMARY (UI READY)
========================================================= */

export function getMapSummaryLine(stats: RelationshipExplorerStats) {
  const mode = getExplorationMode(stats);
  const strength = getSignalStrengthTier(stats);
  const dominant = getDominantSignal(stats);

  return `${mode} mode • ${strength} signals • Dominant: ${dominant}`;
}

/* =========================================================
   MASTER INTELLIGENCE
========================================================= */

export function getMapIntelligence(
  stats: RelationshipExplorerStats
): MapIntelligence {
  const signalBalance = getSignalBalance(stats);

  return {
    dominantSignal: getDominantSignal(stats),
    mapType: getMapType(stats),
    clusterStrength: getClusterStrength(stats),
    recommendationHint: getRecommendationHint(stats),
    signalBalance,

    // NEW LAYER
    confidenceScore: getConfidenceScore(stats),
    explorationMode: getExplorationMode(stats),
    signalStrengthTier: getSignalStrengthTier(stats),
    clusterDensity: getClusterDensity(stats),
    hasSignalConflict: getSignalConflict(stats),
    summaryLine: getMapSummaryLine(stats),
  } as MapIntelligence;
}