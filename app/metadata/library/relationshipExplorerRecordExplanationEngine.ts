import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import { getRelationshipScore } from "./relationshipExplorerRecordScoringEngine";
import {
  getRecordLabel,
  getSharedWords,
} from "./relationshipExplorerRecordTextEngine";

export type RelationshipConfidence = "low" | "medium" | "high";

export type MatchExplanation = {
  headline: string;
  detail: string;
  dominantSignal: string;
  rankedReasons: string[];
};

type ScoreParts = Record<string, number>;

type Breakdown = {
  scoreParts: ScoreParts;
  confidence?: RelationshipConfidence | string;
  dominantSignal?: string;
};

type BreakdownInput = Breakdown | ScoreParts;

function hasScoreParts(input: BreakdownInput): input is Breakdown {
  return (
    typeof input === "object" &&
    input !== null &&
    "scoreParts" in input &&
    typeof input.scoreParts === "object"
  );
}

function normalizeScoreParts(input: BreakdownInput): ScoreParts {
  if (hasScoreParts(input)) {
    return input.scoreParts;
  }

  return input;
}

function getConfidence(score: number): RelationshipConfidence {
  if (score >= 85) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function getScoreFromParts(parts: ScoreParts) {
  return Object.values(parts).reduce((total, value) => {
    return total + value;
  }, 0);
}

function getConfidenceFromInput(input: BreakdownInput): RelationshipConfidence {
  if (hasScoreParts(input) && input.confidence) {
    const confidence = String(input.confidence);

    if (confidence === "high") return "high";
    if (confidence === "medium") return "medium";
  }

  return getConfidence(getScoreFromParts(normalizeScoreParts(input)));
}

export function getScoreLabel(score: number) {
  if (score >= 90) return "Very strong";
  if (score >= 70) return "Strong";
  if (score >= 45) return "Useful";
  if (score > 0) return "Light";
  return "Loose";
}

function getSignalLabel(key: string) {
  if (key === "shelf") return "Shelf";
  if (key === "section") return "Section";
  if (key === "title") return "Title language";
  if (key === "preview") return "Preview language";
  if (key === "slug") return "Slug language";
  if (key === "visibility") return "Visibility";
  if (key === "sharedWords") return "Shared words";
  return key;
}

function getSignalDescription(key: string) {
  if (key === "shelf") return "Records share the same metadata shelf.";
  if (key === "section") return "Records share the same metadata section.";
  if (key === "title") return "Records share important title words.";
  if (key === "preview") return "Records share important preview words.";
  if (key === "slug") return "Records share important slug words.";
  if (key === "visibility") return "Records share the same visibility state.";
  if (key === "sharedWords") return "Records share extra useful search words.";
  return "Relationship signal contributed to the match.";
}

export function getRankedRelationshipReasons(input: BreakdownInput) {
  const scoreParts = normalizeScoreParts(input);

  return Object.entries(scoreParts)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => {
      return `${getSignalLabel(key)} +${value}: ${getSignalDescription(key)}`;
    });
}

export function getDominantSignal(input: BreakdownInput): string {
  if (hasScoreParts(input) && input.dominantSignal) {
    return String(input.dominantSignal);
  }

  const scoreParts = normalizeScoreParts(input);
  const sorted = Object.entries(scoreParts)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .sort((a, b) => b[1] - a[1]);

  const key = sorted[0]?.[0];
  return key ? String(getSignalLabel(key)) : "Loose";
}

export function getRelationshipReasonText(input: BreakdownInput) {
  const scoreParts = normalizeScoreParts(input);
  const reasons = Object.entries(scoreParts)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .map(([key]) => getSignalLabel(key).toLowerCase());

  if (reasons.length > 0) return reasons.join(" · ");
  return "loose suggestion";
}

export function getMatchExplanation(input: BreakdownInput): MatchExplanation {
  const confidence = getConfidenceFromInput(input);
  const rankedReasons = getRankedRelationshipReasons(input);
  const dominantSignal = getDominantSignal(input);

  if (confidence === "high") {
    return {
      headline: "Strong nearby relationship",
      detail:
        "Multiple high-value signals agree, so this record is likely close to the active record.",
      dominantSignal,
      rankedReasons,
    };
  }

  if (confidence === "medium") {
    return {
      headline: "Useful relationship candidate",
      detail:
        "The record shares enough structure or language to be useful for exploration.",
      dominantSignal,
      rankedReasons,
    };
  }

  return {
    headline: "Light relationship candidate",
    detail:
      "The record has a weaker signal, but it may still help widen the map.",
    dominantSignal,
    rankedReasons,
  };
}

export function getMatchExplanationFromBreakdown(
  breakdown: BreakdownInput
): MatchExplanation {
  return getMatchExplanation(breakdown);
}

export function getWhyThisMatchText(input: BreakdownInput) {
  return getMatchExplanation(input).detail;
}

export function getMatchDebugSummary(
  active: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
) {
  const { score, scoreParts } = getRelationshipScore(active, candidate);

  return {
    active: getRecordLabel(active),
    candidate: getRecordLabel(candidate),
    score,
    label: getScoreLabel(score),
    dominantSignal: getDominantSignal(scoreParts),
    sharedWords: getSharedWords(active, candidate),
  };
}