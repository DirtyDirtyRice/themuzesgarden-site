import { getMetadataRecords } from "@/lib/metadata/metadataLibrarySeed";

import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  ExplorerStep,
  RelatedRecordSignal,
} from "./relationshipExplorerTypes";

import {
  getRelationshipReasonBreakdown,
  getRelationshipScoreFromBreakdown,
  getRelationshipReasonText,
} from "./relationshipExplorerBreakdown";

import {
  compareRelationshipSignals,
} from "./relationshipExplorerSorting";

export function normalizeRelationshipRecords(): MetadataLibraryRecordSummary[] {
  return getMetadataRecords().map((r: any) => ({
    id: String(r.id ?? ""),
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    shelf: r.shelf,
    section: r.section,
    visibility: r.visibility,
    excerpt: String(r.excerpt ?? r.description ?? ""),
    description: String(r.description ?? ""),
  }));
}

export function getRelationshipCount(record: MetadataLibraryRecordSummary) {
  const maybe = record as any;
  return Array.isArray(maybe.relationships)
    ? maybe.relationships.length
    : 0;
}

export function getExplorerStep(
  record: MetadataLibraryRecordSummary
): ExplorerStep {
  return {
    id: String(record.id ?? ""),
    title: record.title,
    slug: record.slug,
  };
}

export function getUniqueHistory(history: ExplorerStep[]) {
  const seen = new Set<string>();

  return history.filter((step) => {
    const key = step.id || step.slug || step.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function scoreRelatedRecord(
  activeRecord: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
): RelatedRecordSignal {
  const breakdown = getRelationshipReasonBreakdown(
    activeRecord,
    candidate
  );

  const score = getRelationshipScoreFromBreakdown(breakdown);

  return {
    record: candidate,
    shelfMatch: breakdown.shelfMatch,
    sectionMatch: breakdown.sectionMatch,
    titleMatch:
      breakdown.titleMatch ||
      breakdown.previewMatch ||
      breakdown.slugMatch,
    score,
    reason: getRelationshipReasonText(breakdown),
  };
}

export function getRelatedRecordSignals(
  allRecords: MetadataLibraryRecordSummary[],
  activeRecord: MetadataLibraryRecordSummary | null
) {
  if (!activeRecord) return [];

  return allRecords
    .filter((r) => r.id !== activeRecord.id)
    .map((r) => scoreRelatedRecord(activeRecord, r))
    .filter((s) => s.score > 0)
    .sort((a, b) =>
      compareRelationshipSignals(activeRecord, a, b)
    );
}

export function findRecordForExplorerStep(
  allRecords: MetadataLibraryRecordSummary[],
  step: ExplorerStep
) {
  return (
    allRecords.find(
      (r) => r.id === step.id || r.slug === step.slug
    ) ?? null
  );
}

export function getRelationshipDensityLabel(count: number) {
  if (count >= 12) return "dense";
  if (count >= 7) return "healthy";
  if (count >= 3) return "light";
  if (count > 0) return "thin";
  return "empty";
}

export function getRelationshipMapSummary(
  signals: RelatedRecordSignal[],
  savedCount: number
) {
  const strong = signals.filter((s) => s.score >= 70).length;
  const useful = signals.filter((s) => s.score >= 45).length;
  const shelf = signals.filter((s) => s.shelfMatch).length;
  const section = signals.filter((s) => s.sectionMatch).length;
  const language = signals.filter((s) => s.titleMatch).length;

  return {
    savedCount,
    totalSuggestions: signals.length,
    strongCount: strong,
    usefulCount: useful,
    shelfCount: shelf,
    sectionCount: section,
    languageCount: language,
    density: getRelationshipDensityLabel(signals.length),
  };
}

export function getFutureSemanticSignalPlaceholder() {
  return {
    ready: false,
    label: "Semantic signal placeholder",
    detail:
      "Future embedding scoring layer can plug in without UI rewrite.",
  };
}