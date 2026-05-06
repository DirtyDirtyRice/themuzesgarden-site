import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

import {
  getConfidenceRank,
  getDominantSignalRank,
} from "./relationshipExplorerScoring";

import {
  getRelationshipReasonBreakdown,
} from "./relationshipExplorerBreakdown";

import {
  getRecordLabel,
} from "./relationshipExplorerTextUtils";

type RelationshipSortSnapshot = {
  score: number;
  confidenceRank: number;
  sharedWordCount: number;
  shelfRank: number;
  sectionRank: number;
  dominantRank: number;
  title: string;
};

export function getRelationshipSortSnapshot(
  activeRecord: MetadataLibraryRecordSummary,
  signal: RelatedRecordSignal
): RelationshipSortSnapshot {
  const breakdown = getRelationshipReasonBreakdown(
    activeRecord,
    signal.record
  );

  return {
    score: signal.score,
    confidenceRank: getConfidenceRank(breakdown.confidence),
    sharedWordCount: breakdown.sharedWordCount,
    shelfRank: signal.shelfMatch ? 1 : 0,
    sectionRank: signal.sectionMatch ? 1 : 0,
    dominantRank: getDominantSignalRank(breakdown.dominantSignal),
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
  if (right.confidenceRank !== left.confidenceRank)
    return right.confidenceRank - left.confidenceRank;
  if (right.dominantRank !== left.dominantRank)
    return right.dominantRank - left.dominantRank;
  if (right.sharedWordCount !== left.sharedWordCount)
    return right.sharedWordCount - left.sharedWordCount;
  if (right.sectionRank !== left.sectionRank)
    return right.sectionRank - left.sectionRank;
  if (right.shelfRank !== left.shelfRank)
    return right.shelfRank - left.shelfRank;

  return left.title.localeCompare(right.title);
}