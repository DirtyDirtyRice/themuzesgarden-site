import type {
  MetadataClarificationAmbiguityFlag,
  MetadataClarificationPriority,
  MetadataClarificationSource,
  MetadataClarificationStatus,
  MetadataClarificationTargetKind,
} from "./metadataClarification.types";

export function normalizeMetadataText(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizeMetadataTextOrNull(value: unknown): string | null {
  const text = normalizeMetadataText(value);
  return text ? text : null;
}

export function normalizeMetadataKey(value: unknown): string {
  return normalizeMetadataText(value).toLowerCase();
}

export function normalizeMetadataStringList(values: unknown[]): string[] {
  const out: string[] = [];

  for (const value of values) {
    const text = normalizeMetadataText(value);
    if (!text) continue;
    if (!out.includes(text)) out.push(text);
  }

  return out;
}

export function normalizeMetadataId(prefix: string, value: unknown): string {
  const clean = normalizeMetadataKey(value).replace(/[^a-z0-9-_]+/g, "-");
  return clean ? `${prefix}-${clean}` : `${prefix}-unknown`;
}

export function normalizeTargetKind(value: unknown): MetadataClarificationTargetKind {
  const clean = normalizeMetadataKey(value);

  if (clean === "lyric") return "lyric";
  if (clean === "word") return "word";
  if (clean === "phrase") return "phrase";
  if (clean === "note") return "note";
  if (clean === "chord") return "chord";
  if (clean === "instrument") return "instrument";
  if (clean === "texture") return "texture";
  if (clean === "effect") return "effect";
  if (clean === "section") return "section";
  if (clean === "moment") return "moment";
  if (clean === "track") return "track";
  return "other";
}

export function normalizeStatus(value: unknown): MetadataClarificationStatus {
  const clean = normalizeMetadataKey(value);

  if (clean === "reviewed") return "reviewed";
  if (clean === "approved") return "approved";
  if (clean === "uncertain") return "uncertain";
  if (clean === "deprecated") return "deprecated";
  return "draft";
}

export function normalizePriority(value: unknown): MetadataClarificationPriority {
  const clean = normalizeMetadataKey(value);

  if (clean === "medium") return "medium";
  if (clean === "high") return "high";
  if (clean === "critical") return "critical";
  return "low";
}

export function normalizeSource(value: unknown): MetadataClarificationSource {
  const clean = normalizeMetadataKey(value);

  if (clean === "developer") return "developer";
  if (clean === "system") return "system";
  if (clean === "imported") return "imported";
  return "user";
}

export function normalizeAmbiguityFlags(
  values: unknown[]
): MetadataClarificationAmbiguityFlag[] {
  const out: MetadataClarificationAmbiguityFlag[] = [];

  for (const value of values) {
    const clean = normalizeMetadataKey(value);

    let next: MetadataClarificationAmbiguityFlag | null = null;

    if (clean === "meaning-unclear") next = "meaning-unclear";
    else if (clean === "sound-unclear") next = "sound-unclear";
    else if (clean === "timing-unclear") next = "timing-unclear";
    else if (clean === "performance-unclear") next = "performance-unclear";
    else if (clean === "scope-unclear") next = "scope-unclear";
    else if (clean === "conflicting-notes") next = "conflicting-notes";
    else if (clean === "missing-context") next = "missing-context";
    else if (clean === "needs-review") next = "needs-review";

    if (next && !out.includes(next)) out.push(next);
  }

  return out;
}