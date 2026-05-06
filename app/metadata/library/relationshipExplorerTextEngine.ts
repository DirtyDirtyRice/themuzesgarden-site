import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

const COMMON_WORDS = new Set([
  "about","after","again","audio","before","being","could","every","from",
  "have","into","layer","library","metadata","more","record","relationship",
  "section","shelf","should","signal","system","that","this","usage","with",
]);

export function cleanText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitWords(value: unknown) {
  return cleanText(value)
    .split(" ")
    .map((w) => w.trim())
    .filter(Boolean);
}

export function getUsefulWords(value: unknown) {
  return splitWords(value)
    .filter((w) => w.length >= 4)
    .filter((w) => !COMMON_WORDS.has(w));
}

export function getRecordText(record: MetadataLibraryRecordSummary) {
  return [
    record.title,
    record.slug,
    record.shelf,
    record.section,
    record.visibility,
    record.excerpt,
  ]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");
}

export function findSharedWords(
  active: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
) {
  const base = getUsefulWords(active.title);
  const target = getRecordText(candidate);
  return base.filter((w) => target.includes(w)).slice(0, 10);
}