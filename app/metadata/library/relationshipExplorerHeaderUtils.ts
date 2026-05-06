import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";

export type HeaderMetric = {
  label: string;
  value: string;
  detail: string;
  help: string;
};

export type ExplorerMapState = {
  label: string;
  detail: string;
  tone: string;
  action: string;
};

export type HeaderStatCard = {
  label: string;
  value: string;
  detail: string;
};

export type TrailInsight = {
  depthLabel: string;
  depthDetail: string;
  returnLabel: string;
  returnDetail: string;
  hopCount: number;
};

export type ExplorerMode = "structure" | "language" | "hybrid" | "unknown";

function getMaxSignal(stats: RelationshipExplorerStats) {
  const signals = [
    { key: "shelf", value: stats.relatedByShelfCount },
    { key: "section", value: stats.relatedBySectionCount },
    { key: "language", value: stats.titleMatchCount },
  ];

  return signals.sort((a, b) => b.value - a.value)[0];
}

export function getExplorerMode(stats: RelationshipExplorerStats): ExplorerMode {
  const structure = stats.relatedByShelfCount + stats.relatedBySectionCount;
  const language = stats.titleMatchCount;

  if (structure === 0 && language === 0) return "unknown";

  if (structure >= language * 2) return "structure";
  if (language >= structure * 2) return "language";

  return "hybrid";
}

export function getExplorerModeLabel(mode: ExplorerMode) {
  if (mode === "structure") return "Structure-led";
  if (mode === "language") return "Language-led";
  if (mode === "hybrid") return "Hybrid map";
  return "Unknown map";
}

export function getExplorerModeDetail(mode: ExplorerMode) {
  if (mode === "structure") {
    return "Shelf and section are driving most of the relationships.";
  }
  if (mode === "language") {
    return "Shared words and naming patterns are driving relationships.";
  }
  if (mode === "hybrid") {
    return "Structure and language are both contributing meaning.";
  }
  return "Not enough signals to determine map behavior yet.";
}

export function getMapMaturity(stats: RelationshipExplorerStats) {
  if (stats.relationshipCount > 0 && stats.relatedRecordsCount >= 10) {
    return "Mature map";
  }

  if (stats.relatedRecordsCount >= 7) {
    return "Developing map";
  }

  if (stats.relatedRecordsCount > 0) {
    return "Early map";
  }

  return "Empty map";
}

export function getDensityLabel(count: number) {
  if (count >= 12) return "Dense";
  if (count >= 7) return "Healthy";
  if (count >= 3) return "Light";
  if (count > 0) return "Thin";
  return "Empty";
}

export function getDensityDetail(count: number) {
  if (count >= 12) return "Wide relationship spread available.";
  if (count >= 7) return "Good coverage of related records.";
  if (count >= 3) return "Some nearby records available.";
  if (count > 0) return "Very limited relationship spread.";
  return "No relationship suggestions yet.";
}

export function getDensityAction(count: number) {
  if (count >= 12) return "Use filters to narrow the map.";
  if (count >= 7) return "Explore strongest matches first.";
  if (count >= 3) return "Open related records to grow the trail.";
  if (count > 0) return "Add richer metadata to improve matches.";
  return "Add shelf, section, preview, or relationship data.";
}

export function getSuggestionQuality(stats: RelationshipExplorerStats) {
  const mode = getExplorerMode(stats);

  if (mode === "structure") return "Structure-led";
  if (mode === "language") return "Language-led";
  if (mode === "hybrid") return "Structure + language";

  if (stats.relatedRecordsCount > 0) return "Loose suggestions";
  return "No suggestions";
}

export function getSuggestionQualityDetail(stats: RelationshipExplorerStats) {
  const mode = getExplorerMode(stats);

  if (mode === "structure") {
    return "Shelf and section are carrying most of the map.";
  }

  if (mode === "language") {
    return "Shared title or wording is carrying the map.";
  }

  if (mode === "hybrid") {
    return "Structure and language signals are both contributing.";
  }

  if (stats.relatedRecordsCount > 0) {
    return "Suggestions exist, but signal mix is still light.";
  }

  return "No relationship signals are visible yet.";
}

export function getBalanceLabel(stats: RelationshipExplorerStats) {
  const mode = getExplorerMode(stats);
  return getExplorerModeLabel(mode);
}

export function getBalanceDetail(stats: RelationshipExplorerStats) {
  return `${stats.relatedByShelfCount} shelf · ${stats.relatedBySectionCount} section · ${stats.titleMatchCount} language`;
}

export function getBalanceHelp(stats: RelationshipExplorerStats) {
  return getExplorerModeDetail(getExplorerMode(stats));
}

export function getTrailDepthLabel(count: number) {
  if (count >= 6) return "Deep trail";
  if (count >= 3) return "Active trail";
  if (count === 2) return "One hop";
  return "Source only";
}

export function getTrailDepthDetail(count: number) {
  if (count >= 6) return "You have moved through several relationship steps.";
  if (count >= 3) return "You are exploring beyond the first related record.";
  if (count === 2) return "You have opened one related record.";
  return "You are still on the original record.";
}

export function getTrailReturnLabel(count: number) {
  if (count >= 6) return "Long return path";
  if (count >= 3) return "Return available";
  if (count === 2) return "Single return";
  return "No return needed";
}

export function getTrailReturnDetail(count: number) {
  if (count >= 6) return "Use trail controls to jump back efficiently.";
  if (count >= 3) return "You can return to earlier relationship steps.";
  if (count === 2) return "You can jump back to the source.";
  return "The trail has not branched yet.";
}

export function getTrailInsight(count: number): TrailInsight {
  const hopCount = Math.max(count - 1, 0);

  return {
    depthLabel: getTrailDepthLabel(count),
    depthDetail: getTrailDepthDetail(count),
    returnLabel: getTrailReturnLabel(count),
    returnDetail: getTrailReturnDetail(count),
    hopCount,
  };
}

export function getExplorerMapState(
  stats: RelationshipExplorerStats
): ExplorerMapState {
  const maturity = getMapMaturity(stats);

  if (maturity === "Mature map") {
    return {
      label: "Stable relationship map",
      detail: "Saved and suggested relationships are working together.",
      tone: "stable",
      action: "Refine clusters and validate relationships.",
    };
  }

  if (maturity === "Developing map") {
    return {
      label: "Expanding relationship map",
      detail: "The explorer has a useful spread of suggestions.",
      tone: "growing",
      action: "Open strong matches and build relationships.",
    };
  }

  if (maturity === "Early map") {
    return {
      label: "Early relationship map",
      detail: "The explorer has started finding nearby records.",
      tone: "early",
      action: "Add more metadata to strengthen matches.",
    };
  }

  return {
    label: "Sparse relationship map",
    detail: "This record needs more metadata or relationships.",
    tone: "empty",
    action: "Add metadata or relationships to activate the map.",
  };
}

export function getActiveRecordInsight(stats: RelationshipExplorerStats) {
  const mode = getExplorerMode(stats);

  if (stats.relationshipCount > 0) {
    return "This record has saved relationships, improving map reliability.";
  }

  if (mode === "structure") {
    return "This record relies heavily on structural placement for relationships.";
  }

  if (mode === "language") {
    return "This record relies on shared language patterns for relationships.";
  }

  if (mode === "hybrid") {
    return "This record benefits from both structure and language signals.";
  }

  if (stats.relatedRecordsCount > 0) {
    return "This record has early signals but needs stronger metadata.";
  }

  return "No relationship signals detected yet.";
}

export function getHeaderMetrics(stats: RelationshipExplorerStats): HeaderMetric[] {
  return [
    {
      label: "Density",
      value: getDensityLabel(stats.relatedRecordsCount),
      detail: `${stats.relatedRecordsCount} suggested`,
      help: getDensityDetail(stats.relatedRecordsCount),
    },
    {
      label: "Quality",
      value: getSuggestionQuality(stats),
      detail: getSuggestionQualityDetail(stats),
      help: "Which signals are driving relationships.",
    },
    {
      label: "Balance",
      value: getBalanceLabel(stats),
      detail: getBalanceDetail(stats),
      help: getBalanceHelp(stats),
    },
    {
      label: "Trail",
      value: getTrailDepthLabel(stats.historyCount),
      detail: getTrailDepthDetail(stats.historyCount),
      help: getTrailReturnDetail(stats.historyCount),
    },
  ];
}

export function getHeaderStatCards(
  stats: RelationshipExplorerStats
): HeaderStatCard[] {
  return [
    {
      label: "Structure matches",
      value: `${stats.relatedByShelfCount} shelf-linked`,
      detail: "Records sharing the same shelf.",
    },
    {
      label: "Meaning matches",
      value: `${stats.relatedBySectionCount} section-linked`,
      detail: "Records sharing the same section.",
    },
    {
      label: "Language matches",
      value: `${stats.titleMatchCount} language-linked`,
      detail: "Records sharing wording patterns.",
    },
    {
      label: "Explorer trail",
      value: `${stats.historyCount} visited`,
      detail: "Records opened in this session.",
    },
  ];
}