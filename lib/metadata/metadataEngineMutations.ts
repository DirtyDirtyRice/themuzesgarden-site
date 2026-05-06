import type {
  MetadataEntry,
  MetadataEntryInput,
  MetadataEntryPatch,
} from "./metadataTypes";

import {
  createId,
  normalizeMetadataEntry,
  safeNowIso,
} from "./metadataEngineCore";

export function createMetadataEntry(input: MetadataEntryInput): MetadataEntry {
  return normalizeMetadataEntry({
    id: createId(),
    targetType: input.targetType,
    targetId: input.targetId,
    kind: input.kind,
    label: input.label,
    value: input.value,
    description: input.description,
    parentId: input.parentId,
    createdAt: safeNowIso(),
    updatedAt: safeNowIso(),
    createdBy: input.createdBy,
    tags: input.tags ?? [],
  });
}

export function updateMetadataEntry(
  entry: MetadataEntry,
  patch: MetadataEntryPatch
): MetadataEntry {
  return normalizeMetadataEntry({
    ...entry,
    ...patch,
    id: entry.id,
    targetType: entry.targetType,
    targetId: entry.targetId,
    createdAt: entry.createdAt,
    updatedAt: safeNowIso(),
  });
}