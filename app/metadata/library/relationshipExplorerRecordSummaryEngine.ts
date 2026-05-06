import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

export type RelationshipMapSummary = {
  savedCount: number;
  totalSuggestions: number;
  strongCount: number;
  usefulCount: number;
  shelfCount: number;
  sectionCount: number;
  languageCount: number;
  density: string;
};

export function getRelationshipDensityLabel(signalCount: number) {
  if (signalCount >= 12) return "dense";
  if (signalCount >= 7) return "healthy";
  if (signalCount >= 3) return "light";
  if (signalCount > 0) return "thin";
  return "empty";
}

export function getExplorerHealthLabel(
  signalCount: number,
  savedCount: number
) {
  if (savedCount > 0 && signalCount > 10) {
    return "Dense relationship map";
  }

  if (savedCount > 0 && signalCount > 6) {
    return "Strong relationship map";
  }

  if (savedCount > 0) {
    return "Saved relationships ready";
  }

  if (signalCount > 10) {
    return "Wide suggested map";
  }

  if (signalCount > 6) {
    return "Good suggested map";
  }

  if (signalCount > 0) {
    return "Early relationship map";
  }

  return "Needs more relationship data";
}

export function getRelationshipMapSummary(
  signals: RelatedRecordSignal[],
  savedCount: number
): RelationshipMapSummary {
  const strongCount = signals.filter((signal) => signal.score >= 70).length;
  const usefulCount = signals.filter((signal) => signal.score >= 45).length;
  const shelfCount = signals.filter((signal) => signal.shelfMatch).length;
  const sectionCount = signals.filter((signal) => signal.sectionMatch).length;
  const languageCount = signals.filter((signal) => signal.titleMatch).length;

  return {
    savedCount,
    totalSuggestions: signals.length,
    strongCount,
    usefulCount,
    shelfCount,
    sectionCount,
    languageCount,
    density: getRelationshipDensityLabel(signals.length),
  };
}

export function getFutureSemanticSignalPlaceholder() {
  return {
    ready: false,
    label: "Semantic signal placeholder",
    detail:
      "Future vector similarity or embedding scores can plug into the scoring layer without rewriting the relationship UI.",
  };
}

export function getStrongSignalCount(signals: RelatedRecordSignal[]) {
  return signals.filter((signal) => signal.score >= 70).length;
}

export function getUsefulSignalCount(signals: RelatedRecordSignal[]) {
  return signals.filter((signal) => signal.score >= 45).length;
}

export function getLightSignalCount(signals: RelatedRecordSignal[]) {
  return signals.filter((signal) => signal.score > 0 && signal.score < 45)
    .length;
}

export function getSavedSuggestionBalance(
  signals: RelatedRecordSignal[],
  savedCount: number
) {
  if (savedCount > 0 && signals.length > 0) {
    return "saved and suggested signals are both active";
  }

  if (savedCount > 0) {
    return "saved relationships are active";
  }

  if (signals.length > 0) {
    return "suggested relationships are active";
  }

  return "relationship map needs more metadata";
}