import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";
import {
  findSharedWords,
  getUsefulWords,
  cleanText,
} from "./relationshipExplorerTextEngine";

const WEIGHTS = {
  shelf: 35,
  section: 35,
  title: 18,
  preview: 12,
  slug: 10,
  visibility: 5,
  shared: 2,
};

function calculateScoreParts(
  active: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
) {
  const shelf = active.shelf === candidate.shelf ? WEIGHTS.shelf : 0;
  const section = active.section === candidate.section ? WEIGHTS.section : 0;

  const words = getUsefulWords(active.title);

  const titleMatches = words.filter((w) =>
    cleanText(candidate.title).includes(w)
  );

  const previewMatches = words.filter((w) =>
    cleanText(candidate.excerpt).includes(w)
  );

  const shared = findSharedWords(active, candidate);

  const slugMatch =
    cleanText(candidate.slug).includes(words[0] ?? "") ? WEIGHTS.slug : 0;

  const visibilityMatch =
    active.visibility === candidate.visibility ? WEIGHTS.visibility : 0;

  return {
    shelf,
    section,
    title: Math.min(titleMatches.length * 8, WEIGHTS.title),
    preview: Math.min(previewMatches.length * 4, WEIGHTS.preview),
    slug: slugMatch,
    visibility: visibilityMatch,
    shared: Math.min(shared.length * WEIGHTS.shared, 12),
  };
}

function sumScore(parts: Record<string, number>) {
  return Object.values(parts).reduce((total, value) => total + value, 0);
}

function getConfidence(score: number) {
  if (score >= 85) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function buildReason(parts: Record<string, number>) {
  const active = Object.entries(parts)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!active.length) return "loose relationship";

  return active
    .map(([key, value]) => `${key}+${value}`)
    .join(" · ");
}

export function scoreRecord(
  active: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
): RelatedRecordSignal {
  const parts = calculateScoreParts(active, candidate);
  const score = sumScore(parts);

  return {
    record: candidate,
    shelfMatch: parts.shelf > 0,
    sectionMatch: parts.section > 0,
    titleMatch: parts.title > 0 || parts.preview > 0,
    score,
    reason: buildReason(parts),
  };
}

export function getRelatedRecordSignalsCore(
  allRecords: MetadataLibraryRecordSummary[],
  activeRecord: MetadataLibraryRecordSummary
) {
  return allRecords
    .filter((record) => record.id !== activeRecord.id)
    .map((record) => scoreRecord(activeRecord, record));
}

export function scoreBatch(
  active: MetadataLibraryRecordSummary,
  records: MetadataLibraryRecordSummary[]
) {
  return records.map((r) => scoreRecord(active, r));
}

export function getScoreLabel(score: number) {
  if (score >= 90) return "Very strong";
  if (score >= 70) return "Strong";
  if (score >= 45) return "Useful";
  if (score > 0) return "Light";
  return "Loose";
}