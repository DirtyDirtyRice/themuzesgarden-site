import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

const COMMON_WORDS = new Set([
  "about","active","after","again","audio","before","being","could","every",
  "from","have","into","layer","library","metadata","more","record",
  "relationship","section","shelf","should","signal","system","that",
  "this","usage","with",
]);

export function cleanComparableText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");
}

export function formatContextValue(value: unknown) {
  return String(value ?? "unknown").replaceAll("_", " ");
}

export function getRecordLabel(record: MetadataLibraryRecordSummary | null) {
  return String(record?.title ?? record?.slug ?? "Untitled record").trim();
}

export function getRecordSlug(record: MetadataLibraryRecordSummary | null) {
  return String(record?.slug ?? "").trim();
}

export function getPreviewText(record: MetadataLibraryRecordSummary) {
  return String(record.excerpt ?? "").trim();
}

export function getUsefulWords(value: unknown) {
  return cleanComparableText(value)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 4)
    .filter((word) => !COMMON_WORDS.has(word));
}

export function getTitleWords(record: MetadataLibraryRecordSummary) {
  return getUsefulWords(getRecordLabel(record));
}

export function getRecordSearchText(record: MetadataLibraryRecordSummary) {
  return [
    getRecordLabel(record),
    getRecordSlug(record),
    record.shelf,
    record.section,
    record.visibility,
    getPreviewText(record),
  ]
    .map((value) => cleanComparableText(value))
    .filter(Boolean)
    .join(" ");
}

export function getSharedWords(
  activeRecord: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
) {
  const activeWords = getUsefulWords(
    [
      getRecordLabel(activeRecord),
      getRecordSlug(activeRecord),
      getPreviewText(activeRecord),
    ].join(" ")
  );

  const candidateText = getRecordSearchText(candidate);
  const shared = activeWords.filter((word) =>
    candidateText.includes(word)
  );

  return Array.from(new Set(shared)).slice(0, 8);
}

export function getWordMatches(sourceWords: string[], targetText: string) {
  return sourceWords.filter((word) => targetText.includes(word));
}

export function normalizeWords(words: string[]) {
  return Array.from(new Set(words.map((w) => w.trim()).filter(Boolean)));
}

export function mergeWordSets(a: string[], b: string[]) {
  return Array.from(new Set([...a, ...b]));
}

export function getWordOverlapScore(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  return a.filter((word) => b.includes(word)).length;
}

export function hasWordMatch(a: string[], b: string[]) {
  return a.some((word) => b.includes(word));
}
