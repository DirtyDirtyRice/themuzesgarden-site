import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";

export type SummaryTextTone = "empty" | "early" | "ready" | "dense";

export type SummaryCopyBlock = {
  label: string;
  detail: string;
  tone: SummaryTextTone;
};

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function cleanSummaryText(value: unknown, fallback = "not available") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length ? text : fallback;
}

export function formatSummaryCount(value: unknown, noun: string) {
  const count = asNumber(value);
  const label = count === 1 ? noun : `${noun}s`;
  return `${count.toLocaleString()} ${label}`;
}

export function formatPercent(part: unknown, total: unknown) {
  const safePart = asNumber(part);
  const safeTotal = asNumber(total);

  if (safeTotal <= 0) return "0%";

  return `${Math.round((safePart / safeTotal) * 100)}%`;
}

export function getSummaryTone(stats: RelationshipExplorerStats): SummaryTextTone {
  if (stats.relatedRecordsCount >= 10 && stats.relationshipCount > 0) {
    return "dense";
  }

  if (stats.relatedRecordsCount >= 4 || stats.relationshipCount > 0) {
    return "ready";
  }

  if (stats.relatedRecordsCount > 0) {
    return "early";
  }

  return "empty";
}

export function getToneLabel(tone: SummaryTextTone) {
  if (tone === "dense") return "dense map";
  if (tone === "ready") return "review ready";
  if (tone === "early") return "early signal";
  return "needs data";
}

export function getTrailStepLabel(stats: RelationshipExplorerStats) {
  return formatSummaryCount(stats.historyCount, "trail step");
}

export function getSavedRelationshipLabel(stats: RelationshipExplorerStats) {
  return formatSummaryCount(stats.relationshipCount, "saved");
}

export function getSuggestedRelationshipLabel(stats: RelationshipExplorerStats) {
  return formatSummaryCount(stats.relatedRecordsCount, "suggested");
}

export function makeCopyBlock(
  label: string,
  detail: string,
  tone: SummaryTextTone
): SummaryCopyBlock {
  return {
    label: cleanSummaryText(label, "summary"),
    detail: cleanSummaryText(detail, "No detail is available yet."),
    tone,
  };
}

export function compactLabels(labels: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const next: string[] = [];

  labels.forEach((label) => {
    const clean = cleanSummaryText(label, "");
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    next.push(clean);
  });

  return next;
}

export function joinSummaryParts(parts: Array<string | null | undefined>) {
  return compactLabels(parts).join(" • ");
}

export function getMapDensityLabel(stats: RelationshipExplorerStats) {
  const tone = getSummaryTone(stats);
  const saved = stats.relationshipCount;
  const suggested = stats.relatedRecordsCount;
  const total = saved + suggested;

  if (tone === "dense") {
    return makeCopyBlock(
      "high-density relationship map",
      `${formatSummaryCount(total, "relationship signal")} are available for comparison.`,
      tone
    );
  }

  if (tone === "ready") {
    return makeCopyBlock(
      "relationship map ready",
      `${formatSummaryCount(suggested, "suggestion")} can now be reviewed against saved links.`,
      tone
    );
  }

  if (tone === "early") {
    return makeCopyBlock(
      "early relationship map",
      "The explorer has enough material to show direction, but not enough to trust clusters yet.",
      tone
    );
  }

  return makeCopyBlock(
    "relationship map needs data",
    "Add shelf, section, preview, or saved relationship material to activate stronger readouts.",
    tone
  );
}