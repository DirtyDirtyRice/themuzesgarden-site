import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

export function compareSignals(
  active: MetadataLibraryRecordSummary,
  a: RelatedRecordSignal,
  b: RelatedRecordSignal
) {
  if (b.score !== a.score) return b.score - a.score;

  if (b.sectionMatch !== a.sectionMatch) {
    return Number(b.sectionMatch) - Number(a.sectionMatch);
  }

  if (b.shelfMatch !== a.shelfMatch) {
    return Number(b.shelfMatch) - Number(a.shelfMatch);
  }

  return String(a.record.title).localeCompare(
    String(b.record.title)
  );
}

export function sortSignals(
  active: MetadataLibraryRecordSummary,
  signals: RelatedRecordSignal[]
) {
  return signals.sort((a, b) => compareSignals(active, a, b));
}