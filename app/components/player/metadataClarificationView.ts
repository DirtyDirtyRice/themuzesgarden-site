import type { MetadataClarificationResult } from "./metadataClarification";

export type InspectorMetadataClarificationSummary = {
  totalLinks: number;
  lyricWordLinks: number;
  musicalLinks: number;
  sectionLinks: number;
  momentLinks: number;
  trackLinks: number;
  unresolvedCount: number;
  highPriorityCount: number;
};

export function buildInspectorMetadataClarificationSummary(
  result: MetadataClarificationResult | null | undefined
): InspectorMetadataClarificationSummary | null {
  if (!result) return null;

  const records = Array.isArray(result.records) ? result.records : [];
  const totalLinks = Number(result.recordCount ?? records.length ?? 0);

  if (totalLinks <= 0) return null;

  let lyricWordLinks = 0;
  let musicalLinks = 0;
  let sectionLinks = 0;
  let momentLinks = 0;
  let trackLinks = 0;

  for (const record of records) {
    const kind = String(record?.targetKind ?? "").trim();

    if (kind === "lyric" || kind === "word" || kind === "phrase") {
      lyricWordLinks += 1;
      continue;
    }

    if (
      kind === "note" ||
      kind === "chord" ||
      kind === "instrument" ||
      kind === "texture" ||
      kind === "effect"
    ) {
      musicalLinks += 1;
      continue;
    }

    if (kind === "section") {
      sectionLinks += 1;
      continue;
    }

    if (kind === "moment") {
      momentLinks += 1;
      continue;
    }

    if (kind === "track") {
      trackLinks += 1;
    }
  }

  return {
    totalLinks,
    lyricWordLinks,
    musicalLinks,
    sectionLinks,
    momentLinks,
    trackLinks,
    unresolvedCount: Number(result.unresolvedCount ?? 0),
    highPriorityCount: Number(result.highPriorityCount ?? 0),
  };
}