import type {
  ExpandedMetadataTargetContext,
  LayeredMetadataEntry,
  MetadataEntry,
  MetadataLayerSource,
  MetadataLink,
  MetadataTargetType,
  UnifiedMetadataTargetResult,
} from "./metadataTypes";

import {
  cleanLower,
  cleanText,
  excludeEntriesById,
  sortMetadataEntries,
  uniqueEntriesById,
  uniqueStrings,
} from "./metadataEngineCore";

import {
  filterMetadataByTarget,
  getRelatedMetadataEntries,
} from "./metadataEngineContext";

function getEntriesByTargetInternal(
  entries: MetadataEntry[],
  targetType: MetadataTargetType,
  targetId: string
): MetadataEntry[] {
  return sortMetadataEntries(filterMetadataByTarget(entries, targetType, targetId));
}

function getLinkedEntriesForEntrySet(
  entries: MetadataEntry[],
  links: MetadataLink[],
  seedEntries: MetadataEntry[]
): MetadataEntry[] {
  const out: MetadataEntry[] = [];

  for (const entry of seedEntries ?? []) {
    out.push(...getRelatedMetadataEntries(entries, links, cleanText(entry.id)));
  }

  return sortMetadataEntries(uniqueEntriesById(out));
}

function collectTagPoolFromEntries(seedEntries: MetadataEntry[]): string[] {
  const tags = uniqueStrings(seedEntries.flatMap((entry) => entry.tags ?? []));
  const labels = uniqueStrings(seedEntries.map((entry) => entry.label));
  const values = uniqueStrings(seedEntries.map((entry) => entry.value));

  return uniqueStrings([...tags, ...labels, ...values]);
}

function collectCandidateInheritanceEntries(
  entries: MetadataEntry[],
  links: MetadataLink[],
  directEntries: MetadataEntry[]
): MetadataEntry[] {
  const linkedEntries = getLinkedEntriesForEntrySet(entries, links, directEntries);
  const pool = collectTagPoolFromEntries([...directEntries, ...linkedEntries]);

  if (!pool.length) return [];

  const pooled = (entries ?? []).filter((entry) => {
    const targetValues = [
      ...(entry.tags ?? []),
      entry.label,
      entry.value,
      entry.targetId,
    ].map((value) => cleanLower(value));

    return pool.some((token) => targetValues.includes(cleanLower(token)));
  });

  return sortMetadataEntries(uniqueEntriesById([...linkedEntries, ...pooled]));
}

function expandRelatedEntriesMultiHop(
  entries: MetadataEntry[],
  links: MetadataLink[],
  startingIds: string[],
  maxDepth = 2
): MetadataEntry[] {
  const startQueue = uniqueStrings(startingIds);
  const seenIds = new Set<string>(startQueue.map((id) => cleanText(id)));
  const collected: MetadataEntry[] = [];
  let frontier = startQueue.slice();
  let depth = 0;

  while (frontier.length > 0 && depth < maxDepth) {
    const nextFrontier: string[] = [];

    for (const id of frontier) {
      const related = getRelatedMetadataEntries(entries, links, id);

      for (const entry of related) {
        const entryId = cleanText(entry.id);
        if (!entryId) continue;

        if (!seenIds.has(entryId)) {
          seenIds.add(entryId);
          collected.push(entry);
          nextFrontier.push(entryId);
        }
      }
    }

    frontier = uniqueStrings(nextFrontier);
    depth += 1;
  }

  return sortMetadataEntries(uniqueEntriesById(collected));
}

function tokenizeTargetId(targetId: string): string[] {
  return uniqueStrings(
    cleanText(targetId)
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((part) => part.trim())
      .filter((part) => part.length >= 3)
  );
}

function scoreFallbackEntry(
  entry: MetadataEntry,
  tokens: string[],
  targetType: MetadataTargetType
): number {
  const hay = [
    entry.label,
    entry.value,
    entry.description,
    entry.targetId,
    ...(entry.tags ?? []),
  ]
    .map((value) => cleanLower(value))
    .join(" ");

  let score = 0;

  for (const token of tokens) {
    if (!token) continue;
    if (hay.includes(token)) {
      score += 5;
    }
  }

  if (targetType === "track") {
    if (entry.targetType === "tag") score += 3;
    if (entry.targetType === "instrument") score += 2;
    if (entry.targetType === "chord") score += 2;
  }

  if (targetType === "section" || targetType === "moment") {
    if (entry.kind === "timing") score += 3;
    if (entry.kind === "structure") score += 3;
    if (entry.kind === "reference") score += 2;
    if (entry.targetType === "tag") score += 2;
    if (entry.targetType === "instrument") score += 2;
  }

  if (entry.kind === "reference") score += 2;

  if (entry.targetType === "track") score -= 3;

  return score;
}

function getGlobalFallbackEntries(
  entries: MetadataEntry[],
  targetType: MetadataTargetType,
  targetId: string
): MetadataEntry[] {
  const tokens = tokenizeTargetId(targetId);

  const scored = (entries ?? [])
    .map((entry) => ({
      entry,
      score: scoreFallbackEntry(entry, tokens, targetType),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return cleanLower(a.entry.label).localeCompare(cleanLower(b.entry.label));
    })
    .map((item) => item.entry);

  return sortMetadataEntries(uniqueEntriesById(scored).slice(0, 6));
}

function computeMetadataScore(
  entry: MetadataEntry,
  source: MetadataLayerSource
): number {
  let score = 0;

  if (source === "direct") score += 100;
  if (source === "inherited") score += 60;
  if (source === "related") score += 40;
  if (source === "expanded") score += 20;
  if (source === "fallback") score += 10;

  if (entry.kind === "reference") score += 20;
  if (entry.kind === "analysis") score += 15;
  if (entry.kind === "structure") score += 15;
  if (entry.kind === "timing") score += 12;
  if (entry.kind === "technical") score += 8;

  if (entry.targetType === "tag") score += 10;
  if (entry.targetType === "instrument") score += 10;
  if (entry.targetType === "chord") score += 6;

  const tagCount = (entry.tags ?? []).length;
  score += Math.min(tagCount, 5);

  return score;
}

function layerEntries(
  entries: MetadataEntry[],
  source: MetadataLayerSource
): LayeredMetadataEntry[] {
  return (entries ?? []).map((entry) => ({
    ...entry,
    source,
    score: computeMetadataScore(entry, source),
  }));
}

export function extractMetadataTokens(
  entries: Array<MetadataEntry | LayeredMetadataEntry>
): string[] {
  const rawValues = (entries ?? []).flatMap((entry) => [
    entry.label,
    entry.value,
    entry.description,
    entry.targetId,
    ...(entry.tags ?? []),
  ]);

  const splitValues = rawValues.flatMap((value) => {
    const clean = cleanText(value);
    if (!clean) return [];
    return clean.split(/[^a-zA-Z0-9#]+/g);
  });

  return uniqueStrings([...rawValues, ...splitValues].filter(Boolean));
}

function chooseBestLayeredEntries(
  entries: LayeredMetadataEntry[]
): LayeredMetadataEntry[] {
  const bestMap = new Map<string, LayeredMetadataEntry>();

  for (const entry of entries ?? []) {
    const id = cleanText(entry.id);
    if (!id) continue;

    const existing = bestMap.get(id);
    if (!existing || entry.score > existing.score) {
      bestMap.set(id, entry);
    }
  }

  return [...bestMap.values()].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return cleanLower(a.label).localeCompare(cleanLower(b.label));
  });
}

export function getUnifiedMetadataForTarget(
  entries: MetadataEntry[],
  links: MetadataLink[],
  targetType: MetadataTargetType,
  targetId: string
): UnifiedMetadataTargetResult {
  const directEntries = getEntriesByTargetInternal(entries, targetType, targetId);

  const inheritedRaw = collectCandidateInheritanceEntries(
    entries,
    links,
    directEntries
  );

  const directIds = directEntries.map((entry) => cleanText(entry.id));

  const inheritedEntries = sortMetadataEntries(
    excludeEntriesById(uniqueEntriesById(inheritedRaw), directIds)
  );

  const relatedRaw = getLinkedEntriesForEntrySet(
    entries,
    links,
    [...directEntries, ...inheritedEntries]
  );

  const relatedEntries = sortMetadataEntries(
    excludeEntriesById(
      uniqueEntriesById(relatedRaw),
      [...directIds, ...inheritedEntries.map((entry) => cleanText(entry.id))]
    )
  );

  const expandedRaw = expandRelatedEntriesMultiHop(
    entries,
    links,
    [...directEntries, ...inheritedEntries, ...relatedEntries].map((entry) =>
      cleanText(entry.id)
    ),
    2
  );

  const expandedEntries = sortMetadataEntries(
    excludeEntriesById(
      uniqueEntriesById(expandedRaw),
      [
        ...directIds,
        ...inheritedEntries.map((entry) => cleanText(entry.id)),
        ...relatedEntries.map((entry) => cleanText(entry.id)),
      ]
    )
  );

  const naturalDisplayEntries = sortMetadataEntries(
    uniqueEntriesById(
      directEntries.length
        ? directEntries
        : [...inheritedEntries, ...relatedEntries, ...expandedEntries]
    )
  );

  const fallbackEntries =
    naturalDisplayEntries.length > 0
      ? []
      : getGlobalFallbackEntries(entries, targetType, targetId);

  const layered = chooseBestLayeredEntries([
    ...layerEntries(directEntries, "direct"),
    ...layerEntries(inheritedEntries, "inherited"),
    ...layerEntries(relatedEntries, "related"),
    ...layerEntries(expandedEntries, "expanded"),
    ...layerEntries(fallbackEntries, "fallback"),
  ]);

  return {
    targetType,
    targetId: cleanText(targetId),
    directEntries,
    inheritedEntries,
    relatedEntries,
    expandedEntries,
    fallbackEntries,
    displayEntries: layered,
    tokens: extractMetadataTokens(layered),
    isFallback: directEntries.length === 0 && layered.length > 0,
  };
}

export function buildExpandedMetadataTargetContext(
  entries: MetadataEntry[],
  links: MetadataLink[],
  targetType: MetadataTargetType,
  targetId: string
): ExpandedMetadataTargetContext {
  const unified = getUnifiedMetadataForTarget(entries, links, targetType, targetId);
  const childBuckets = new Map<string, LayeredMetadataEntry[]>();

  for (const entry of unified.displayEntries) {
    const parentId = cleanText(entry.parentId);
    if (!parentId) continue;

    const existing = childBuckets.get(parentId) ?? [];
    existing.push(entry);
    childBuckets.set(parentId, existing);
  }

  const childrenMap: Record<string, LayeredMetadataEntry[]> = {};
  for (const [parentId, children] of childBuckets.entries()) {
    childrenMap[parentId] = [...children].sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return cleanLower(a.label).localeCompare(cleanLower(b.label));
    });
  }

  const roots = [...unified.displayEntries]
    .filter((entry) => {
      const parentId = cleanText(entry.parentId);
      if (!parentId) return true;
      return !unified.displayEntries.some(
        (candidate) => cleanText(candidate.id) === parentId
      );
    })
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return cleanLower(a.label).localeCompare(cleanLower(b.label));
    });

  return {
    ...unified,
    roots,
    childrenMap,
  };
}