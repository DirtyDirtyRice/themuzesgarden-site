import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";
import {
  getRelationshipScore,
} from "./relationshipExplorerRecordScoringEngine";
import {
  getRecordLabel,
} from "./relationshipExplorerRecordTextEngine";
import {
  getDominantSignal,
} from "./relationshipExplorerRecordExplanationEngine";

export type RelationshipSortSnapshot = {
  score: number;
  confidenceRank: number;
  sharedWordCount: number;
  shelfRank: number;
  sectionRank: number;
  dominantRank: number;
  title: string;
};

function getConfidenceRank(score: number) {
  if (score >= 85) return 3;
  if (score >= 50) return 2;
  return 1;
}

function getDominantSignalRank(label: string) {
  if (label === "Shelf") return 5;
  if (label === "Section") return 5;
  if (label === "Title language") return 4;
  if (label === "Preview language") return 3;
  if (label === "Slug language") return 2;
  if (label === "Visibility") return 1;
  return 0;
}

export function getRelationshipSortSnapshot(
  activeRecord: MetadataLibraryRecordSummary,
  signal: RelatedRecordSignal
): RelationshipSortSnapshot {
  const result = getRelationshipScore(activeRecord, signal.record);
  const scoreParts = result.scoreParts;
  const dominantSignal = getDominantSignal(scoreParts);

  return {
    score: signal.score,
    confidenceRank: getConfidenceRank(signal.score),
    sharedWordCount: scoreParts.sharedWords ?? 0,
    shelfRank: signal.shelfMatch ? 1 : 0,
    sectionRank: signal.sectionMatch ? 1 : 0,
    dominantRank: getDominantSignalRank(dominantSignal),
    title: getRecordLabel(signal.record),
  };
}

export function compareRelationshipSignals(
  activeRecord: MetadataLibraryRecordSummary,
  a: RelatedRecordSignal,
  b: RelatedRecordSignal
) {
  const left = getRelationshipSortSnapshot(activeRecord, a);
  const right = getRelationshipSortSnapshot(activeRecord, b);

  if (right.score !== left.score) return right.score - left.score;

  if (right.confidenceRank !== left.confidenceRank) {
    return right.confidenceRank - left.confidenceRank;
  }

  if (right.dominantRank !== left.dominantRank) {
    return right.dominantRank - left.dominantRank;
  }

  if (right.sharedWordCount !== left.sharedWordCount) {
    return right.sharedWordCount - left.sharedWordCount;
  }

  if (right.sectionRank !== left.sectionRank) {
    return right.sectionRank - left.sectionRank;
  }

  if (right.shelfRank !== left.shelfRank) {
    return right.shelfRank - left.shelfRank;
  }

  return left.title.localeCompare(right.title);
}

export function sortRelationshipSignals(
  activeRecord: MetadataLibraryRecordSummary,
  signals: RelatedRecordSignal[]
) {
  return signals
    .slice()
    .sort((a, b) => compareRelationshipSignals(activeRecord, a, b));
}

export function getTopRelationshipSignals(
  activeRecord: MetadataLibraryRecordSummary,
  signals: RelatedRecordSignal[],
  limit = 10
) {
  return sortRelationshipSignals(activeRecord, signals).slice(0, limit);
}

export function groupSignalsByShelf(signals: RelatedRecordSignal[]) {
  const groups: Record<string, RelatedRecordSignal[]> = {};

  signals.forEach((signal) => {
    const key = String(signal.record.shelf ?? "unknown");
    if (!groups[key]) groups[key] = [];
    groups[key].push(signal);
  });

  return groups;
}

export function groupSignalsBySection(signals: RelatedRecordSignal[]) {
  const groups: Record<string, RelatedRecordSignal[]> = {};

  signals.forEach((signal) => {
    const key = String(signal.record.section ?? "unknown");
    if (!groups[key]) groups[key] = [];
    groups[key].push(signal);
  });

  return groups;
}