import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

export type RelationshipSummary = {
  savedCount: number;
  total: number;
  strong: number;
  useful: number;
  weak: number;
  density: string;
};

export function buildSummary(
  signals: RelatedRecordSignal[],
  savedCount: number
): RelationshipSummary {
  const total = signals.length;
  const strong = signals.filter((s) => s.score >= 70).length;
  const useful = signals.filter((s) => s.score >= 45).length;
  const weak = signals.filter((s) => s.score > 0 && s.score < 45).length;

  return {
    savedCount,
    total,
    strong,
    useful,
    weak,
    density: getDensity(total),
  };
}

function getDensity(count: number) {
  if (count >= 20) return "very dense";
  if (count >= 12) return "dense";
  if (count >= 7) return "healthy";
  if (count >= 3) return "light";
  if (count > 0) return "thin";
  return "empty";
}

export function getExplorerHealthLabel(signalCount: number, savedCount: number) {
  if (savedCount > 0 && signalCount > 10) return "Dense relationship map";
  if (savedCount > 0 && signalCount > 6) return "Strong relationship map";
  if (savedCount > 0) return "Saved relationships ready";
  if (signalCount > 10) return "Wide suggested map";
  if (signalCount > 6) return "Good suggested map";
  if (signalCount > 0) return "Early relationship map";
  return "Needs more relationship data";
}