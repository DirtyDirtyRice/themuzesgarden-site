import type { RelationshipClusterSummary } from "./relationshipExplorerTypes";
import type { MapIntelligence, MapPulseSummary } from "./relationshipExplorerMapSummaryTypes";

export type ReadoutRow = {
  label: string;
  value: string;
  detail: string;
};

export type MeterTone = "empty" | "low" | "medium" | "high";

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return Math.round(value);
}

export function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function formatCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getMeterTone(percent: number): MeterTone {
  if (percent <= 0) return "empty";
  if (percent < 34) return "low";
  if (percent < 67) return "medium";
  return "high";
}

export function getMeterToneLabel(percent: number) {
  const tone = getMeterTone(percent);

  if (tone === "high") return "strong signal";
  if (tone === "medium") return "usable signal";
  if (tone === "low") return "early signal";
  return "no signal";
}

export function getConfidenceLabel(score: number) {
  if (score >= 80) return "high confidence";
  if (score >= 50) return "building confidence";
  if (score > 0) return "early confidence";
  return "no confidence yet";
}

export function getConfidenceDetail(score: number) {
  if (score >= 80) {
    return "The map has enough saved, structural, and language signal to support stronger review decisions.";
  }

  if (score >= 50) {
    return "The map is becoming useful, but relationship choices should still be checked against the detail cards.";
  }

  if (score > 0) {
    return "The map has started forming, but it needs more saved or repeated metadata signals.";
  }

  return "Confidence will appear after the record has saved relationships, suggested matches, or repeated signals.";
}

export function getPulseTone(pulse: MapPulseSummary) {
  if (pulse.totalCount >= 12) return "wide map";
  if (pulse.totalCount >= 7) return "healthy map";
  if (pulse.totalCount > 0) return "early map";
  return "empty map";
}

export function getPulseDetail(pulse: MapPulseSummary) {
  if (pulse.totalCount >= 12) {
    return "There are enough signals to compare patterns and look for clusters.";
  }

  if (pulse.totalCount >= 7) {
    return "The map has enough material for useful relationship review.";
  }

  if (pulse.totalCount > 0) {
    return "The map has started, but it still needs stronger metadata.";
  }

  return "No saved or suggested signals are available yet.";
}

export function getPulseRows(pulse: MapPulseSummary): ReadoutRow[] {
  return [
    {
      label: "Saved links",
      value: String(pulse.savedCount),
      detail: "Relationships that have already been chosen as durable record links.",
    },
    {
      label: "Suggested links",
      value: String(pulse.suggestedCount),
      detail: "Nearby records that the explorer can compare before you save anything.",
    },
    {
      label: "Total signals",
      value: String(pulse.totalCount),
      detail: "Combined saved and suggested material available to the relationship map.",
    },
  ];
}

export function getIntelligenceRows(intelligence: MapIntelligence): ReadoutRow[] {
  return [
    {
      label: "Map type",
      value: intelligence.mapType,
      detail: "Shows whether this is driven by saved links, suggestions, or both.",
    },
    {
      label: "Cluster strength",
      value: intelligence.clusterStrength,
      detail: "Estimates how tightly records are gathering around repeatable signals.",
    },
    {
      label: "Dominant signal",
      value: intelligence.dominantSignal,
      detail: "The signal family currently carrying the most relationship meaning.",
    },
  ];
}

export function getClusterRows(summary: RelationshipClusterSummary): ReadoutRow[] {
  return [
    {
      label: "Shelf cluster",
      value: summary.shelf,
      detail: "Top shelf grouping detected for this relationship map.",
    },
    {
      label: "Section cluster",
      value: summary.section,
      detail: "Top section grouping detected for this relationship map.",
    },
    {
      label: "Language cluster",
      value: summary.language,
      detail: "Top shared-word grouping detected for this relationship map.",
    },
  ];
}

export function getClusterHealthLabel(summary: RelationshipClusterSummary) {
  if (summary.strongestCount >= 8) return "cluster is strong";
  if (summary.strongestCount >= 4) return "cluster is forming";
  if (summary.strongestCount > 0) return "cluster is early";
  return "cluster pending";
}

export function getClusterHealthDetail(summary: RelationshipClusterSummary) {
  if (summary.strongestCount >= 8) {
    return "The strongest grouping has enough repeated records to support cleanup or saved relationship decisions.";
  }

  if (summary.strongestCount >= 4) {
    return "The strongest grouping is visible, but it should still be compared against other signals.";
  }

  if (summary.strongestCount > 0) {
    return "A cluster is beginning to form, but the relationship map needs more repeated evidence.";
  }

  return "Cluster health will become useful after real related-record signals are passed into this card.";
}