import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

import {
  getSignalWeight,
  getRelationshipConfidence,
  getSignalLabel,
  getSignalDescription,
} from "./relationshipExplorerScoring";

import {
  cleanComparableText,
  getRecordLabel,
  getRecordSlug,
  getPreviewText,
  getTitleWords,
  getSharedWords,
} from "./relationshipExplorerTextUtils";

export type RelationshipReasonBreakdown = {
  shelfMatch: boolean;
  sectionMatch: boolean;
  titleMatch: boolean;
  previewMatch: boolean;
  slugMatch: boolean;
  sameVisibility: boolean;
  sharedWordCount: number;
  matchedWords: string[];
  dominantSignal: string;
  confidence: "low" | "medium" | "high";
  scoreParts: Record<string, number>;
};

type MatchExplanation = {
  headline: string;
  detail: string;
  dominantSignal: string;
  rankedReasons: string[];
};

function getWordMatches(sourceWords: string[], targetText: string) {
  return sourceWords.filter((word) => targetText.includes(word));
}

function getDominantSignal(scoreParts: Record<string, number>) {
  const sorted = Object.entries(scoreParts)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0);

  const key = sorted[0]?.[0];
  return key ? getSignalLabel(key as any) : "Loose";
}

export function getRelationshipReasonBreakdown(
  activeRecord: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
): RelationshipReasonBreakdown {
  const shelfMatch = candidate.shelf === activeRecord.shelf;
  const sectionMatch = candidate.section === activeRecord.section;
  const sameVisibility = candidate.visibility === activeRecord.visibility;

  const activeTitleWords = getTitleWords(activeRecord);

  const candidateTitle = cleanComparableText(getRecordLabel(candidate));
  const candidatePreview = cleanComparableText(getPreviewText(candidate));
  const candidateSlug = cleanComparableText(getRecordSlug(candidate));

  const titleMatchedWords = getWordMatches(activeTitleWords, candidateTitle);
  const previewMatchedWords = getWordMatches(activeTitleWords, candidatePreview);
  const slugMatchedWords = getWordMatches(activeTitleWords, candidateSlug);

  const sharedWords = getSharedWords(activeRecord, candidate);

  const scoreParts = {
    shelf: shelfMatch ? getSignalWeight("shelf") : 0,
    section: sectionMatch ? getSignalWeight("section") : 0,
    title: titleMatchedWords.length > 0
      ? Math.min(titleMatchedWords.length * 8, getSignalWeight("title"))
      : 0,
    preview: previewMatchedWords.length > 0
      ? Math.min(previewMatchedWords.length * 4, getSignalWeight("preview"))
      : 0,
    slug: slugMatchedWords.length > 0
      ? Math.min(slugMatchedWords.length * 5, getSignalWeight("slug"))
      : 0,
    visibility: sameVisibility ? getSignalWeight("visibility") : 0,
    sharedWords: Math.min(sharedWords.length * getSignalWeight("sharedWords"), 10),
  };

  const score = Object.values(scoreParts).reduce((t, v) => t + v, 0);

  return {
    shelfMatch,
    sectionMatch,
    titleMatch: titleMatchedWords.length > 0,
    previewMatch: previewMatchedWords.length > 0,
    slugMatch: slugMatchedWords.length > 0,
    sameVisibility,
    sharedWordCount: sharedWords.length,
    matchedWords: sharedWords,
    dominantSignal: getDominantSignal(scoreParts),
    confidence: getRelationshipConfidence(score),
    scoreParts,
  };
}

export function getRelationshipScoreFromBreakdown(
  breakdown: RelationshipReasonBreakdown
) {
  return Object.values(breakdown.scoreParts).reduce((t, v) => t + v, 0);
}

export function getRankedRelationshipReasons(
  breakdown: RelationshipReasonBreakdown
) {
  return Object.entries(breakdown.scoreParts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => {
      return `${getSignalLabel(key as any)} +${value}: ${getSignalDescription(
        key as any
      )}`;
    });
}

export function getRelationshipReasonText(
  breakdown: RelationshipReasonBreakdown
) {
  const parts = [
    breakdown.shelfMatch ? "same shelf" : "",
    breakdown.sectionMatch ? "same section" : "",
    breakdown.titleMatch ? "title overlap" : "",
    breakdown.previewMatch ? "preview overlap" : "",
    breakdown.slugMatch ? "slug overlap" : "",
    breakdown.sameVisibility ? "same visibility" : "",
    breakdown.sharedWordCount > 0
      ? `${breakdown.sharedWordCount} shared words`
      : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "loose suggestion";
}

export function getMatchExplanation(
  breakdown: RelationshipReasonBreakdown
): MatchExplanation {
  const rankedReasons = getRankedRelationshipReasons(breakdown);

  if (breakdown.confidence === "high") {
    return {
      headline: "Strong nearby relationship",
      detail:
        "Multiple strong signals align — this record is structurally close.",
      dominantSignal: breakdown.dominantSignal,
      rankedReasons,
    };
  }

  if (breakdown.confidence === "medium") {
    return {
      headline: "Useful relationship",
      detail:
        "There is enough structural or language overlap to explore.",
      dominantSignal: breakdown.dominantSignal,
      rankedReasons,
    };
  }

  return {
    headline: "Light relationship",
    detail: "Weaker signals — still useful for expanding the map.",
    dominantSignal: breakdown.dominantSignal,
    rankedReasons,
  };
}

export function getWhyThisMatchText(
  breakdown: RelationshipReasonBreakdown
) {
  return getMatchExplanation(breakdown).detail;
}