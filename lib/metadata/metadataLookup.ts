import type { MetadataEntry, MetadataTargetType } from "./metadataTypes";
import { METADATA_REGISTRY } from "./metadataRegistry";

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