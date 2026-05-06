export type RelationshipConfidence = "low" | "medium" | "high";

export type SignalWeightKey =
  | "shelf"
  | "section"
  | "title"
  | "preview"
  | "slug"
  | "visibility"
  | "sharedWords";

type RelationshipSignalWeight = {
  key: SignalWeightKey;
  label: string;
  value: number;
  description: string;
};

export const SIGNAL_WEIGHTS: RelationshipSignalWeight[] = [
  { key: "shelf", label: "Shelf", value: 35, description: "Same shelf" },
  { key: "section", label: "Section", value: 35, description: "Same section" },
  { key: "title", label: "Title language", value: 18, description: "Title overlap" },
  { key: "preview", label: "Preview language", value: 12, description: "Preview overlap" },
  { key: "slug", label: "Slug language", value: 10, description: "Slug overlap" },
  { key: "visibility", label: "Visibility", value: 5, description: "Same visibility" },
  { key: "sharedWords", label: "Shared words", value: 2, description: "Extra overlap" },
];

export function getSignalWeight(key: SignalWeightKey) {
  return SIGNAL_WEIGHTS.find((w) => w.key === key)?.value ?? 0;
}

export function getSignalLabel(key: SignalWeightKey) {
  return SIGNAL_WEIGHTS.find((w) => w.key === key)?.label ?? key;
}

export function getSignalDescription(key: SignalWeightKey) {
  return SIGNAL_WEIGHTS.find((w) => w.key === key)?.description ?? "";
}

export function getRelationshipConfidence(score: number): RelationshipConfidence {
  if (score >= 85) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function getConfidenceRank(confidence: RelationshipConfidence) {
  return confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
}

export function getScoreLabel(score: number) {
  if (score >= 90) return "Very strong";
  if (score >= 70) return "Strong";
  if (score >= 45) return "Useful";
  if (score > 0) return "Light";
  return "Loose";
}

export function getDominantSignal(scoreParts: Record<SignalWeightKey, number>) {
  const sorted = Object.entries(scoreParts)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0);

  const key = sorted[0]?.[0] as SignalWeightKey | undefined;
  return key ? getSignalLabel(key) : "Loose";
}

export function getDominantSignalRank(label: string) {
  if (label === "Shelf") return 5;
  if (label === "Section") return 5;
  if (label === "Title language") return 4;
  if (label === "Preview language") return 3;
  if (label === "Slug language") return 2;
  if (label === "Visibility") return 1;
  return 0;
}