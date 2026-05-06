import { getMetadataRecords } from "@/lib/metadata/metadataLibrarySeed";

import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  ExplorerStep,
  RecordWithOptionalRelationships,
  RelatedRecordSignal,
} from "./relationshipExplorerTypes";
import {
  cleanComparableText,
  formatContextValue,
  getPreviewText,
  getRecordLabel,
  getRecordSearchText,
  getRecordSlug,
  getSharedWords,
  getTitleWords,
  getUsefulWords,
} from "./relationshipExplorerRecordTextEngine";
import {
  getRelationshipScore,
  scoreRelatedRecord,
} from "./relationshipExplorerRecordScoringEngine";
import {
  getDominantSignal,
  getMatchExplanation,
  getRankedRelationshipReasons,
  getRelationshipReasonText,
  getScoreLabel,
  getWhyThisMatchText,
  type MatchExplanation,
  type RelationshipConfidence,
} from "./relationshipExplorerRecordExplanationEngine";
import {
  compareRelationshipSignals,
  getRelationshipSortSnapshot,
  type RelationshipSortSnapshot,
} from "./relationshipExplorerRecordRankingEngine";
import {
  getExplorerHealthLabel,
  getFutureSemanticSignalPlaceholder,
  getRelationshipDensityLabel,
  getRelationshipMapSummary,
} from "./relationshipExplorerRecordSummaryEngine";

export type {
  MatchExplanation,
  RelationshipConfidence,
  RelationshipSortSnapshot,
};

export {
  cleanComparableText,
  compareRelationshipSignals,
  formatContextValue,
  getDominantSignal,
  getExplorerHealthLabel,
  getFutureSemanticSignalPlaceholder,
  getMatchExplanation,
  getPreviewText,
  getRankedRelationshipReasons,
  getRecordLabel,
  getRecordSearchText,
  getRecordSlug,
  getRelationshipDensityLabel,
  getRelationshipMapSummary,
  getRelationshipReasonText,
  getRelationshipScore,
  getRelationshipSortSnapshot,
  getScoreLabel,
  getSharedWords,
  getTitleWords,
  getUsefulWords,
  getWhyThisMatchText,
  scoreRelatedRecord,
};

export function normalizeRelationshipRecords(): MetadataLibraryRecordSummary[] {
  return getMetadataRecords().map((record: any) => ({
    id: String(record.id ?? ""),
    slug: String(record.slug ?? ""),
    title: String(record.title ?? ""),
    shelf: record.shelf,
    section: record.section,
    visibility: record.visibility,
    excerpt: String(record.excerpt ?? record.description ?? ""),
    description: String(record.description ?? ""),
  }));
}

export function getRelationshipCount(record: MetadataLibraryRecordSummary) {
  const maybeRecord = record as RecordWithOptionalRelationships;

  return Array.isArray(maybeRecord.relationships)
    ? maybeRecord.relationships.length
    : 0;
}

export function getExplorerStep(
  record: MetadataLibraryRecordSummary
): ExplorerStep {
  return {
    id: String(record.id ?? ""),
    title: getRecordLabel(record),
    slug: getRecordSlug(record),
  };
}

export function getUniqueHistory(history: ExplorerStep[]) {
  const seen = new Set<string>();

  return history.filter((step) => {
    const key = step.id || step.slug || step.title;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function getRelatedRecordSignals(
  allRecords: MetadataLibraryRecordSummary[],
  activeRecord: MetadataLibraryRecordSummary | null
) {
  if (!activeRecord) return [];

  return allRecords
    .filter((candidate) => candidate.id !== activeRecord.id)
    .map((candidate) => scoreRelatedRecord(activeRecord, candidate))
    .filter((signal) => signal.score > 0)
    .sort((a, b) => compareRelationshipSignals(activeRecord, a, b));
}

export function findRecordForExplorerStep(
  allRecords: MetadataLibraryRecordSummary[],
  step: ExplorerStep
) {
  return (
    allRecords.find((candidate) => {
      return candidate.id === step.id || candidate.slug === step.slug;
    }) ?? null
  );
}

export function getRelationshipReasonBreakdown(
  activeRecord: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
) {
  const { score, scoreParts } = getRelationshipScore(activeRecord, candidate);
  const confidence: RelationshipConfidence =
    score >= 85 ? "high" : score >= 50 ? "medium" : "low";

  const explanation = getMatchExplanation({
    scoreParts,
    confidence,
  });

  return {
    shelfMatch: candidate.shelf === activeRecord.shelf,
    sectionMatch: candidate.section === activeRecord.section,
    titleMatch: scoreParts.title > 0,
    previewMatch: scoreParts.preview > 0,
    slugMatch: scoreParts.slug > 0,
    sameVisibility: scoreParts.visibility > 0,
    sharedWordCount: scoreParts.sharedWords ?? 0,
    matchedWords: getSharedWords(activeRecord, candidate),
    dominantSignal: explanation.dominantSignal,
    confidence,
    scoreParts,
  };
}

export function getRelationshipScoreFromBreakdown(breakdown: {
  scoreParts: Record<string, number>;
}) {
  return Object.values(breakdown.scoreParts).reduce((total, value) => {
    return total + value;
  }, 0);
}