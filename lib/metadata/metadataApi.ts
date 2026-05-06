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
  cleanText,
  uniqueEntriesById,
} from "./metadataEngineCore";
import {
  getWorkingMetadataLinks,
  getWorkingMetadataRegistry,
  removeWorkingMetadataLink,
  replaceWorkingMetadataEntry,
  replaceWorkingMetadataLink,
  setWorkingMetadataLinks,
  setWorkingMetadataRegistry,
} from "./metadataStore";

export type ResolvedMetadataLink = {
  link: MetadataLink;
  entry: MetadataEntry | null;
};

function ensureRegistryLoaded() {
  const current = getWorkingMetadataRegistry();
  if (current.length > 0) return current;

  const seeded = Array.isArray(METADATA_REGISTRY) ? METADATA_REGISTRY : [];
  const normalized = seeded.map(normalizeMetadataEntry);
  setWorkingMetadataRegistry(normalized);
  return normalized;
}

function normalizeMetadataLink(link: MetadataLink): MetadataLink {
  return {
    ...link,
    id: cleanText(link.id) || undefined,
    sourceId: cleanText(link.sourceId),
    targetId: cleanText(link.targetId),
    relationship: link.relationship,
    createdAt: cleanText(link.createdAt) || undefined,
  };
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
    .map((link) => normalizeMetadataLink(link));

  setWorkingMetadataLinks(safe);
  return safe;
}

/* =========================
   NEW INTELLIGENCE HELPERS
========================= */

function calculateConfidence(entry: MetadataEntry): number {
  let score = 0;

  if (entry.tags?.length) score += entry.tags.length * 2;
  if (entry.label) score += 2;
  if (entry.value) score += 1;
  if (entry.description) score += 2;

  return score;
}

function classifyStrength(score: number): "strong" | "medium" | "weak" {
  if (score >= 6) return "strong";
  if (score >= 3) return "medium";
  return "weak";
}

/* ========================= */

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

  const unified = getUnifiedMetadataForTarget(
    registry,
    links,
    targetType,
    targetId
  );
  return sortMetadataEntries(uniqueEntriesById(unified.displayEntries));
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

/* =========================
   🔥 INTELLIGENCE UPGRADE
========================= */

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

  const enrichedEntries = unified.displayEntries.map((entry) => {
    const confidence = calculateConfidence(entry);
    const strength = classifyStrength(confidence);

    return {
      ...entry,
      _confidence: confidence,
      _strength: strength,
    };
  });

  const topTags = [...tagWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return {
    targetType,
    targetId: cleanText(targetId),
    entries: enrichedEntries,
    tokens: extractMetadataTokens(unified.displayEntries),
    topTags,
    isFallback: unified.isFallback,
    meta: {
      totalEntries: enrichedEntries.length,
      strongCount: enrichedEntries.filter((e) => e._strength === "strong").length,
      weakCount: enrichedEntries.filter((e) => e._strength === "weak").length,
    },
  };
}

/* ========================= */

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
    uniqueEntriesById(
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

export function replaceMetadataLink(link: MetadataLink): MetadataLink {
  const normalized = normalizeMetadataLink(link);
  replaceWorkingMetadataLink(normalized);
  return normalized;
}

export function removeMetadataLink(id: string): MetadataLink[] {
  return removeWorkingMetadataLink(id);
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
        .map((link) => normalizeMetadataLink(link))
    : [];

  setWorkingMetadataLinks(safe);
  return safe;
}