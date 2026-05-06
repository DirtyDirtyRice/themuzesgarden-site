import { getFullMetadataContext } from "../lib/metadata/metadataApi";
import type { MetadataEntry } from "../lib/metadata/metadataTypes";
import type { MetadataItemLike } from "./metadataPanelTypes";

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function sortMetadataItems(items: MetadataItemLike[]): MetadataItemLike[] {
  return [...items].sort((a, b) => {
    const aLabel = cleanText(a.label) || cleanText(a.value) || cleanText(a.id);
    const bLabel = cleanText(b.label) || cleanText(b.value) || cleanText(b.id);
    return compareText(aLabel, bLabel);
  });
}

export function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function formatKind(kind: unknown): string {
  const text = cleanText(kind);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

export function formatRelationship(value: unknown): string {
  const text = cleanText(value);
  if (!text) return "";

  return text
    .split(/[-_]/)
    .map((part) => {
      const clean = cleanText(part);
      return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "";
    })
    .filter(Boolean)
    .join(" ");
}

export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  return Array.from(
    new Set(tags.map((tag) => cleanText(tag)).filter(Boolean))
  );
}

export function groupMetadata(items: MetadataItemLike[]) {
  const childrenMap = new Map<string, MetadataItemLike[]>();

  for (const item of items) {
    const parent = cleanText(item.parentId);
    if (!parent) continue;

    const existing = childrenMap.get(parent) ?? [];
    existing.push(item);
    childrenMap.set(parent, existing);
  }

  for (const [key, value] of childrenMap.entries()) {
    childrenMap.set(key, sortMetadataItems(value));
  }

  return {
    roots: sortMetadataItems(items.filter((item) => !cleanText(item.parentId))),
    childrenMap,
  };
}

export function buildSyntheticMetadataEntry(
  source: MetadataItemLike,
  override: {
    idSuffix: string;
    label: string;
    value?: string;
    tags?: string[];
    kind?: string;
  }
): MetadataEntry {
  const sourceId = cleanText(source.id) || "metadata";
  const nextLabel = cleanText(override.label) || "Metadata";
  const nextValue = cleanText(override.value);
  const nextKind = cleanText(override.kind) || "tag";
  const nextTags = normalizeTags(override.tags);

  return {
    id: `${sourceId}::${cleanText(override.idSuffix) || "synthetic"}`,
    targetType: source.targetType ?? "track",
    targetId: cleanText(source.targetId) || "",
    kind: nextKind as MetadataEntry["kind"],
    label: nextLabel,
    value: nextValue || undefined,
    description: cleanText(source.description) || undefined,
    parentId: cleanText(source.parentId) || undefined,
    createdAt: new Date(0).toISOString(),
    tags: nextTags,
  };
}

export function selectRealEntry(
  entryId: string,
  onMetadataSelect?: (entry: MetadataEntry) => void
) {
  if (!onMetadataSelect) return;

  const cleanId = cleanText(entryId);
  if (!cleanId) return;

  const context = getFullMetadataContext(cleanId);
  if (context) {
    onMetadataSelect(context.entry);
  }
}