import type {
  MetadataEntry,
  MetadataKind,
  MetadataTargetType,
} from "./metadataTypes";

export function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

export function cleanLower(value: unknown): string {
  return cleanText(value).toLowerCase();
}

export function uniqueStrings(values: unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values ?? []) {
    const clean = cleanText(value);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }

  return out;
}

export function uniqueEntriesById<T extends { id?: string }>(entries: T[]): T[] {
  const out: T[] = [];
  const seen = new Set<string>();

  for (const entry of entries ?? []) {
    const id = cleanText(entry?.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(entry);
  }

  return out;
}

export function excludeEntriesById<T extends { id?: string }>(
  entries: T[],
  excludeIds: string[]
): T[] {
  const blocked = new Set(
    (excludeIds ?? []).map((id) => cleanText(id)).filter(Boolean)
  );

  return (entries ?? []).filter((entry) => !blocked.has(cleanText(entry?.id)));
}

export function safeNowIso(): string {
  return new Date().toISOString();
}

export function safeKind(value: unknown): MetadataKind {
  const clean = cleanText(value) as MetadataKind;

  switch (clean) {
    case "tag":
    case "description":
    case "analysis":
    case "instruction":
    case "structure":
    case "emotion":
    case "technical":
    case "timing":
    case "reference":
      return clean;
    default:
      return "description";
  }
}

export function safeTargetType(value: unknown): MetadataTargetType {
  const clean = cleanText(value) as MetadataTargetType;

  switch (clean) {
    case "track":
    case "section":
    case "moment":
    case "lyric":
    case "instrument":
    case "note":
    case "chord":
    case "modulation":
    case "tag":
      return clean;
    default:
      return "track";
  }
}

export function createId(): string {
  return `meta_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function normalizeMetadataEntry(
  entry: Partial<MetadataEntry>
): MetadataEntry {
  return {
    id: cleanText(entry.id) || createId(),
    targetType: safeTargetType(entry.targetType),
    targetId: cleanText(entry.targetId),
    kind: safeKind(entry.kind),
    label: cleanText(entry.label) || "Untitled Metadata",
    value: cleanText(entry.value) || undefined,
    description: cleanText(entry.description) || undefined,
    parentId: cleanText(entry.parentId) || undefined,
    createdAt: cleanText(entry.createdAt) || safeNowIso(),
    updatedAt: cleanText(entry.updatedAt) || undefined,
    createdBy: cleanText(entry.createdBy) || undefined,
    tags: uniqueStrings(entry.tags ?? []),
  };
}

export function sortMetadataEntries<T extends MetadataEntry>(entries: T[]): T[] {
  return [...(entries ?? [])].sort((a, b) => {
    const at = Date.parse(a.updatedAt || a.createdAt || "") || 0;
    const bt = Date.parse(b.updatedAt || b.createdAt || "") || 0;
    if (at !== bt) return bt - at;
    return cleanLower(a.label).localeCompare(cleanLower(b.label));
  });
}