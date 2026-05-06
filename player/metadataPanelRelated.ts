import { getRelatedMetadataForEntry } from "../lib/metadata/metadataApi";
import type { MetadataEntry } from "../lib/metadata/metadataTypes";
import { cleanText, normalizeTags } from "./metadataPanelUtils";

type RankedOverviewItem = {
  id?: string;
  label?: string;
  value?: string;
  description?: string;
  kind?: string;
  tags?: string[] | null;
} | null;

const GENERIC_WORDS = new Set([
  "a","an","and","are","as","at","be","by","for","from","in","into","is","it",
  "of","on","or","that","the","to","with","type","kind","item","entry","metadata",
  "data","info","thing","stuff","general","misc","miscellaneous","other","unknown",
  "untitled","tag","tags","value","label","description","note","notes",
]);

function splitWords(value: string): string[] {
  return cleanText(value)
    .toLowerCase()
    .split(/[\s/_\-.,:;()[\]{}|]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function normalizeWordSet(words: string[]): Set<string> {
  return new Set(
    words.filter((word) => word && word.length >= 2 && !GENERIC_WORDS.has(word))
  );
}

function normalizePhrase(value: string): string {
  return cleanText(value).toLowerCase().trim();
}

function countOverlap(source: Set<string>, target: string[]): number {
  let count = 0;
  for (const item of target) {
    if (source.has(item)) count += 1;
  }
  return count;
}

function isWeakText(value: string): boolean {
  const normalized = normalizePhrase(value);
  if (!normalized) return true;
  if (GENERIC_WORDS.has(normalized)) return true;
  return normalized.length <= 2;
}

function phraseSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  if (a.includes(b) || b.includes(a)) return 0.6;

  return 0;
}

function buildBaseSignals(item: RankedOverviewItem) {
  const label = cleanText(item?.label);
  const value = cleanText(item?.value);
  const description = cleanText(item?.description);
  const kind = cleanText(item?.kind).toLowerCase();

  const labelPhrase = normalizePhrase(label);
  const valuePhrase = normalizePhrase(value);
  const descriptionPhrase = normalizePhrase(description);

  const labelWords = normalizeWordSet(splitWords(label));
  const valueWords = normalizeWordSet(splitWords(value));
  const descriptionWords = normalizeWordSet(
    splitWords(description).filter((word) => word.length >= 4)
  );

  const combinedPrimaryWords = new Set<string>([
    ...labelWords,
    ...valueWords,
  ]);

  const tags = new Set(
    normalizeTags(item?.tags)
      .map((tag) => cleanText(tag).toLowerCase())
      .filter(Boolean)
  );

  return {
    label,
    value,
    description,
    kind,
    labelPhrase,
    valuePhrase,
    descriptionPhrase,
    labelWords,
    valueWords,
    descriptionWords,
    combinedPrimaryWords,
    tags,
  };
}

export function getRankedRelatedMetadata(
  overviewItem: RankedOverviewItem
): MetadataEntry[] {
  const overviewId = cleanText(overviewItem?.id);
  if (!overviewId) return [];

  const base = buildBaseSignals(overviewItem);
  const seen = new Set<string>();

  return getRelatedMetadataForEntry(overviewId)
    .map((entry) => {
      const id = cleanText(entry.id);
      if (!id || id === overviewId || seen.has(id)) return null;
      seen.add(id);

      const current = buildBaseSignals({
        id: entry.id,
        label: cleanText(entry.label),
        value: cleanText(entry.value),
        description: cleanText(entry.description),
        kind: cleanText(entry.kind),
        tags: normalizeTags(entry.tags),
      });

      let score = 0;

      const tagOverlap = countOverlap(base.tags, Array.from(current.tags));
      const primaryWordOverlap = countOverlap(
        base.combinedPrimaryWords,
        Array.from(current.combinedPrimaryWords)
      );
      const descriptionOverlap = countOverlap(
        base.descriptionWords,
        Array.from(current.descriptionWords)
      );

      // base weights
      score += tagOverlap * 5;
      score += primaryWordOverlap * 3;
      score += descriptionOverlap * 1;

      // NEW: exact tag match bonus
      if (tagOverlap >= 2) score += 4;

      // NEW: phrase similarity
      const phraseSim = phraseSimilarity(
        base.labelPhrase,
        current.labelPhrase
      );
      score += phraseSim * 5;

      // NEW: description phrase boost
      if (
        base.descriptionPhrase &&
        current.descriptionPhrase &&
        base.descriptionPhrase === current.descriptionPhrase
      ) {
        score += 3;
      }

      // kind weighting
      if (base.kind && current.kind && base.kind === current.kind) {
        score += 2;
      }

      // signal gating
      const signalCount =
        (tagOverlap > 0 ? 1 : 0) +
        (primaryWordOverlap > 0 ? 1 : 0) +
        (descriptionOverlap > 0 ? 1 : 0);

      if (signalCount < 2 && tagOverlap < 2 && phraseSim < 0.6) {
        return null;
      }

      if (signalCount >= 2) score += 4;

      // penalties
      if (isWeakText(current.label) && isWeakText(current.value)) {
        score -= 3;
      }

      if (
        !current.tags.size &&
        !current.combinedPrimaryWords.size
      ) {
        score -= 3;
      }

      if (score < 3) return null;

      const signalStrength =
        current.tags.size +
        current.combinedPrimaryWords.size +
        current.descriptionWords.size;

      return {
        entry,
        score,
        tieLabel:
          cleanText(entry.label) || cleanText(entry.value) || "Untitled",
        signalStrength,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.signalStrength !== a.signalStrength) {
        return b.signalStrength - a.signalStrength;
      }
      return a.tieLabel.localeCompare(b.tieLabel);
    })
    .slice(0, 10)
    .map((item: any) => item.entry);
}