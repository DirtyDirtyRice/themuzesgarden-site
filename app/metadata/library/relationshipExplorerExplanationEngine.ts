import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

export type ExplanationItem = {
  id: string;
  score: number;
  label: string;
  explanation: string;
};

export function buildExplanation(signal: RelatedRecordSignal): string {
  const score = signal.score;

  if (score >= 90) return "Extremely strong match across multiple dimensions.";
  if (score >= 70) return "Strong relationship with clear alignment.";
  if (score >= 45) return "Moderate relationship with useful overlap.";
  if (score > 0) return "Light relationship with minor connections.";
  return "No meaningful relationship detected.";
}

export function buildExplanationItem(signal: RelatedRecordSignal): ExplanationItem {
  return {
    id: String(signal.record.id),
    score: signal.score,
    label: getScoreLabel(signal.score),
    explanation: buildExplanation(signal),
  };
}

export function buildExplanationList(signals: RelatedRecordSignal[]) {
  return signals.map((signal) => buildExplanationItem(signal));
}

export function getScoreLabel(score: number) {
  if (score >= 90) return "Very Strong";
  if (score >= 70) return "Strong";
  if (score >= 45) return "Useful";
  if (score > 0) return "Light";
  return "Loose";
}

export function groupByStrength(signals: RelatedRecordSignal[]) {
  return {
    veryStrong: signals.filter((s) => s.score >= 90),
    strong: signals.filter((s) => s.score >= 70 && s.score < 90),
    useful: signals.filter((s) => s.score >= 45 && s.score < 70),
    light: signals.filter((s) => s.score > 0 && s.score < 45),
  };
}

export function getTopExplanation(signals: RelatedRecordSignal[]) {
  if (!signals.length) return null;
  return buildExplanationItem(signals[0]);
}

export function summarizeExplanations(signals: RelatedRecordSignal[]) {
  const counts = {
    strong: signals.filter((s) => s.score >= 70).length,
    useful: signals.filter((s) => s.score >= 45).length,
    light: signals.filter((s) => s.score > 0 && s.score < 45).length,
  };

  if (counts.strong > 5) return "Strong relationship cluster forming.";
  if (counts.useful > 5) return "Useful connections available.";
  if (counts.light > 0) return "Weak signals present.";
  return "No meaningful relationships.";
}

export function debugExplanation(signal: RelatedRecordSignal) {
  return {
    id: signal.record.id,
    score: signal.score,
    reason: signal.reason,
  };
}

export function debugExplanationList(signals: RelatedRecordSignal[]) {
  return signals.map((s) => debugExplanation(s));
}

export function hasStrongExplanation(signals: RelatedRecordSignal[]) {
  return signals.some((s) => s.score >= 70);
}

export function hasAnyExplanation(signals: RelatedRecordSignal[]) {
  return signals.some((s) => s.score > 0);
}

export function getExplanationCount(signals: RelatedRecordSignal[]) {
  return signals.length;
}

export function getStrongExplanationCount(signals: RelatedRecordSignal[]) {
  return signals.filter((s) => s.score >= 70).length;
}

export function getUsefulExplanationCount(signals: RelatedRecordSignal[]) {
  return signals.filter((s) => s.score >= 45).length;
}

export function getLightExplanationCount(signals: RelatedRecordSignal[]) {
  return signals.filter((s) => s.score > 0 && s.score < 45).length;
}