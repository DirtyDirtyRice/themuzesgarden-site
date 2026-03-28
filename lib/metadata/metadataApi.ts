import type {
  MetadataEntry,
  MetadataTargetType,
  MetadataLink,
} from "./metadataTypes";

import { METADATA_REGISTRY } from "./metadataRegistry";
import { METADATA_LINKS } from "./metadataLinks";

export function getMetadataById(id: string): MetadataEntry | null {
  const clean = String(id ?? "").trim();
  if (!clean) return null;

  const found = METADATA_REGISTRY.find((m) => m.id === clean);
  return found ?? null;
}

export function getMetadataByTarget(
  targetType: MetadataTargetType,
  targetId: string
): MetadataEntry[] {
  const cleanId = String(targetId ?? "").trim().toLowerCase();
  if (!cleanId) return [];

  return METADATA_REGISTRY.filter((m) => {
    if (m.targetType !== targetType) return false;

    const id = String(m.targetId ?? "").trim().toLowerCase();
    return id === cleanId;
  });
}

export function searchMetadata(query: string): MetadataEntry[] {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];

  return METADATA_REGISTRY.filter((m) => {
    const label = String(m.label ?? "").toLowerCase();
    const description = String(m.description ?? "").toLowerCase();

    return label.includes(q) || description.includes(q);
  });
}

export function getMetadataChildren(parentId: string): MetadataEntry[] {
  const clean = String(parentId ?? "").trim();
  if (!clean) return [];

  return METADATA_REGISTRY.filter((m) => m.parentId === clean);
}

export function getMetadataParent(id: string): MetadataEntry | null {
  const entry = getMetadataById(id);
  if (!entry?.parentId) return null;

  return getMetadataById(entry.parentId);
}

export function getLinksFrom(sourceId: string): MetadataLink[] {
  const clean = String(sourceId ?? "").trim();
  if (!clean) return [];

  return METADATA_LINKS.filter((l) => l.sourceId === clean);
}

export function getLinksTo(targetId: string): MetadataLink[] {
  const clean = String(targetId ?? "").trim();
  if (!clean) return [];

  return METADATA_LINKS.filter((l) => l.targetId === clean);
}

export function getMetadataContext(id: string) {
  const entry = getMetadataById(id);

  if (!entry) return null;

  return {
    entry,
    parent: getMetadataParent(id),
    children: getMetadataChildren(id),
    linksFrom: getLinksFrom(id),
    linksTo: getLinksTo(id),
  };
}