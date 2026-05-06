import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

export function getCompactCardStatus(signal: RelatedRecordSignal) {
  const parts = [
    signal.shelfMatch ? "shelf" : "",
    signal.sectionMatch ? "section" : "",
    signal.titleMatch ? "language" : "",
  ].filter(Boolean);

  if (parts.length === 0) return "loose suggestion";
  return parts.join(" + ");
}

export function getCardActionHint(expanded: boolean) {
  return expanded
    ? "Details are open. You can hide them or open this record in the explorer."
    : "Open details to inspect why this record is suggested.";
}

export function getSmartSummaryLine(breakdown: any) {
  if (breakdown.sharedWordCount > 0) {
    return `${breakdown.sharedWordCount} shared words · ${breakdown.dominantSignal}`;
  }

  if (breakdown.dominantSignal) {
    return `${breakdown.dominantSignal} driven match`;
  }

  return "Structure-based relationship";
}