import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  ExplorerStep,
  RelatedRecordSignal,
} from "./relationshipExplorerTypes";

import { getRelatedRecordSignalsCore } from "./relationshipExplorerScoringEngine";
import { compareSignals } from "./relationshipExplorerRankingEngine";
import { buildSummary } from "./relationshipExplorerSummaryEngine";
import { findSharedWords } from "./relationshipExplorerTextEngine";

export function getRelatedRecordSignals(
  allRecords: MetadataLibraryRecordSummary[],
  activeRecord: MetadataLibraryRecordSummary | null
): RelatedRecordSignal[] {
  if (!activeRecord) return [];

  const scored = getRelatedRecordSignalsCore(allRecords, activeRecord);

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => compareSignals(activeRecord, a, b));
}

export function getRelationshipMapSummaryController(
  signals: RelatedRecordSignal[],
  savedCount: number
) {
  return buildSummary(signals, savedCount);
}

export function getExplorerStepFromRecord(
  record: MetadataLibraryRecordSummary
): ExplorerStep {
  return {
    id: String(record.id ?? ""),
    title: String(record.title ?? ""),
    slug: String(record.slug ?? ""),
  };
}

export function getUniqueHistorySteps(history: ExplorerStep[]) {
  const seen = new Set<string>();

  return history.filter((step) => {
    const key = step.id || step.slug || step.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getSharedWordsForDebug(
  active: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
) {
  return findSharedWords(active, candidate);
}