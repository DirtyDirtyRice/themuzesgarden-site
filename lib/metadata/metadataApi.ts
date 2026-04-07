import type {
  ExpandedMetadataTargetContext,
  MetadataContext,
  MetadataEntry,
  MetadataEntryInput,
  MetadataEntryPatch,
  MetadataIntelligencePayload,
  MetadataLink,
  MetadataSearchOptions,
  MetadataTargetType,
  UnifiedMetadataTargetResult,
} from "./metadataTypes";

import { METADATA_REGISTRY } from "./metadataRegistry";
import { METADATA_LINKS } from "./metadataLinks";
import {
  buildExpandedMetadataTargetContext,
  buildFullMetadataContext,
  buildMetadataContext,
  createMetadataEntry,
  extractMetadataTokens,
  filterMetadataByTarget,
  findMetadataById,
  getRelatedMetadataEntries,
  getUnifiedMetadataForTarget,
  normalizeMetadataEntry,
  resolveMetadataLinksFrom,
  resolveMetadataLinksTo,
  searchMetadataEntries,
  sortMetadataEntries,
  updateMetadataEntry,
  type FullMetadataContext,
} from "./metadataEngine";
import {
  getWorkingMetadataLinks,
  getWorkingMetadataRegistry,
  replaceWorkingMetadataEntry,
  setWorkingMetadataLinks,
  setWorkingMetadataRegistry,
} from "./metadataStore";

export type ResolvedMetadataLink = {
  link: MetadataLink;
  entry: MetadataEntry | null;
};

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function uniqueById<T extends { id?: string }>(entries: T[]): T[] {
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

function ensureRegistryLoaded() {
  const current = getWorkingMetadataRegistry();
  if (current.length > 0) return current;

  const seeded = Array.isArray(METADATA_REGISTRY) ? METADATA_REGISTRY : [];
  const normalized = seeded.map(normalizeMetadataEntry);
  setWorkingMetadataRegistry(normalized);
  return normalized;
}

function ensureLinksLoaded() {
  const current = getWorkingMetadataLinks();
  if (current.length > 0) return current;

  const seeded = Array.isArray(METADATA_LINKS) ? METADATA_LINKS : [];
  const safe = seeded
    .filter((link) => {
      const sourceId = cleanText(link?.sourceId);
      const targetId = cleanText(link?.targetId);
      const relationship = cleanText(link?.relationship);
      return !!sourceId && !!targetId && !!relationship;
    })
    .map((link) => ({
      ...link,
      id: cleanText(link.id) || undefined,
      sourceId: cleanText(link.sourceId),
      targetId: cleanText(link.targetId),
      relationship: link.relationship,
      createdAt: cleanText(link.createdAt) || undefined,
    }));

  setWorkingMetadataLinks(safe);
  return safe;
}

export function getAllMetadata(): MetadataEntry[] {
  return sortMetadataEntries(ensureRegistryLoaded());
}

export function getAllMetadataLinks(): MetadataLink[] {
  return ensureLinksLoaded().slice();
}

export function getMetadataById(id: string): MetadataEntry | null {
  return findMetadataById(ensureRegistryLoaded(), id);
}

export function getMetadataByTarget(
  targetType: MetadataTargetType,
  targetId: string
): MetadataEntry[] {
  const registry = ensureRegistryLoaded();
  const links = ensureLinksLoaded();

  const direct = sortMetadataEntries(
    filterMetadataByTarget(registry, targetType, targetId)
  );

  if (direct.length > 0) {
    return direct;
  }

  const unified = getUnifiedMetadataForTarget(registry, links, targetType, targetId);
  return sortMetadataEntries(uniqueById(unified.displayEntries));
}

export function getUnifiedMetadataByTarget(
  targetType: MetadataTargetType,
  targetId: string
): UnifiedMetadataTargetResult {
  return getUnifiedMetadataForTarget(
    ensureRegistryLoaded(),
    ensureLinksLoaded(),
    targetType,
    targetId
  );
}

export function getExpandedMetadataByTarget(
  targetType: MetadataTargetType,
  targetId: string
): ExpandedMetadataTargetContext {
  return buildExpandedMetadataTargetContext(
    ensureRegistryLoaded(),
    ensureLinksLoaded(),
    targetType,
    targetId
  );
}

export function getMetadataIntelligence(
  targetType: MetadataTargetType,
  targetId: string
): MetadataIntelligencePayload {
  const unified = getUnifiedMetadataForTarget(
    ensureRegistryLoaded(),
    ensureLinksLoaded(),
    targetType,
    targetId
  );

  const tagWeights = new Map<string, number>();

  for (const entry of unified.displayEntries) {
    for (const tag of entry.tags ?? []) {
      const clean = cleanText(tag).toLowerCase();
      if (!clean) continue;
      tagWeights.set(clean, (tagWeights.get(clean) ?? 0) + entry.score);
    }
  }

  const topTags = [...tagWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return {
    targetType,
    targetId: cleanText(targetId),
    entries: unified.displayEntries,
    tokens: extractMetadataTokens(unified.displayEntries),
    topTags,
    isFallback: unified.isFallback,
  };
}

export function searchMetadata(
  query: string,
  options?: MetadataSearchOptions
): MetadataEntry[] {
  return searchMetadataEntries(ensureRegistryLoaded(), query, options);
}

export function getMetadataChildren(parentId: string): MetadataEntry[] {
  const clean = cleanText(parentId);
  if (!clean) return [];

  return sortMetadataEntries(
    ensureRegistryLoaded().filter((m) => cleanText(m.parentId) === clean)
  );
}

export function getMetadataParent(id: string): MetadataEntry | null {
  const entry = getMetadataById(id);
  if (!entry?.parentId) return null;
  return getMetadataById(entry.parentId);
}

export function getLinksFrom(sourceId: string): MetadataLink[] {
  const clean = cleanText(sourceId);
  if (!clean) return [];

  return ensureLinksLoaded().filter((l) => cleanText(l.sourceId) === clean);
}

export function getLinksTo(targetId: string): MetadataLink[] {
  const clean = cleanText(targetId);
  if (!clean) return [];

  return ensureLinksLoaded().filter((l) => cleanText(l.targetId) === clean);
}

export function getResolvedLinksFrom(sourceId: string): ResolvedMetadataLink[] {
  return resolveMetadataLinksFrom(
    ensureRegistryLoaded(),
    ensureLinksLoaded(),
    sourceId
  );
}

export function getResolvedLinksTo(targetId: string): ResolvedMetadataLink[] {
  return resolveMetadataLinksTo(
    ensureRegistryLoaded(),
    ensureLinksLoaded(),
    targetId
  );
}

export function getRelatedMetadataForEntry(id: string): MetadataEntry[] {
  return sortMetadataEntries(
    uniqueById(
      getRelatedMetadataEntries(ensureRegistryLoaded(), ensureLinksLoaded(), id)
    )
  );
}

export function getMetadataContext(id: string): MetadataContext | null {
  return buildMetadataContext(ensureRegistryLoaded(), ensureLinksLoaded(), id);
}

export function getFullMetadataContext(id: string): FullMetadataContext | null {
  return buildFullMetadataContext(
    ensureRegistryLoaded(),
    ensureLinksLoaded(),
    id
  );
}

export function addMetadataEntry(input: MetadataEntryInput): MetadataEntry {
  const next = createMetadataEntry(input);
  const registry = ensureRegistryLoaded();
  setWorkingMetadataRegistry([...registry, next]);
  return next;
}

export function patchMetadataEntry(
  id: string,
  patch: MetadataEntryPatch
): MetadataEntry | null {
  const registry = ensureRegistryLoaded();
  const existing = findMetadataById(registry, id);
  if (!existing) return null;

  const updated = updateMetadataEntry(existing, patch);
  replaceWorkingMetadataEntry(updated);
  return updated;
}

export function replaceAllMetadata(entries: MetadataEntry[]) {
  const normalized = (entries ?? []).map(normalizeMetadataEntry);
  setWorkingMetadataRegistry(normalized);
  return normalized;
}

export function replaceAllMetadataLinks(links: MetadataLink[]) {
  const safe = Array.isArray(links)
    ? links
        .filter((link) => {
          const sourceId = cleanText(link?.sourceId);
          const targetId = cleanText(link?.targetId);
          const relationship = cleanText(link?.relationship);
          return !!sourceId && !!targetId && !!relationship;
        })
        .map((link) => ({
          ...link,
          id: cleanText(link.id) || undefined,
          sourceId: cleanText(link.sourceId),
          targetId: cleanText(link.targetId),
          relationship: link.relationship,
          createdAt: cleanText(link.createdAt) || undefined,
        }))
    : [];

  setWorkingMetadataLinks(safe);
  return safe;
}