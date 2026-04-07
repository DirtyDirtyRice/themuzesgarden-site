import type {
  ExpandedMetadataTargetContext,
  LayeredMetadataEntry,
  MetadataContext,
  MetadataEntry,
  MetadataEntryInput,
  MetadataEntryPatch,
  MetadataKind,
  MetadataLayerSource,
  MetadataLink,
  MetadataSearchOptions,
  MetadataTargetType,
  UnifiedMetadataTargetResult,
} from "./metadataTypes";

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function cleanLower(value: unknown): string {
  return cleanText(value).toLowerCase();
}

function uniqueStrings(values: unknown[]): string[] {
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

function uniqueEntriesById<T extends { id?: string }>(entries: T[]): T[] {
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

function excludeEntriesById<T extends { id?: string }>(
  entries: T[],
  excludeIds: string[]
): T[] {
  const blocked = new Set(
    (excludeIds ?? []).map((id) => cleanText(id)).filter(Boolean)
  );

  return (entries ?? []).filter((entry) => !blocked.has(cleanText(entry?.id)));
}

function safeNowIso(): string {
  return new Date().toISOString();
}

function safeKind(value: unknown): MetadataKind {
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

function safeTargetType(value: unknown): MetadataTargetType {
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

function createId() {
  return `meta_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function normalizeMetadataEntry(entry: Partial<MetadataEntry>): MetadataEntry {
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

export function findMetadataById(
  entries: MetadataEntry[],
  id: string
): MetadataEntry | null {
  const clean = cleanText(id);
  if (!clean) return null;

  return entries.find((m) => cleanText(m.id) === clean) ?? null;
}

export function filterMetadataByTarget(
  entries: MetadataEntry[],
  targetType: MetadataTargetType,
  targetId: string
): MetadataEntry[] {
  const cleanId = cleanLower(targetId);
  if (!cleanId) return [];

  return (entries ?? []).filter((m) => {
    return m.targetType === targetType && cleanLower(m.targetId) === cleanId;
  });
}

export function searchMetadataEntries(
  entries: MetadataEntry[],
  query: string,
  options?: MetadataSearchOptions
): MetadataEntry[] {
  const q = cleanLower(query);
  if (!q) return [];

  const includeValue = options?.includeValue !== false;
  const includeDescription = options?.includeDescription !== false;
  const requiredTags = uniqueStrings(options?.tags ?? []).map((x) => x.toLowerCase());

  let result = (entries ?? []).filter((m) => {
    if (options?.targetType && m.targetType !== options.targetType) return false;
    if (options?.targetId && cleanLower(m.targetId) !== cleanLower(options.targetId)) {
      return false;
    }
    if (options?.kind && m.kind !== options.kind) return false;

    if (requiredTags.length > 0) {
      const tags = (m.tags ?? []).map((x) => cleanLower(x));
      const hasAll = requiredTags.every((tag) => tags.includes(tag));
      if (!hasAll) return false;
    }

    const hay = [
      m.label,
      includeValue ? m.value : "",
      includeDescription ? m.description : "",
      ...(m.tags ?? []),
    ]
      .map((x) => cleanLower(x))
      .join(" ");

    return hay.includes(q);
  });

  result = sortMetadataEntries(result);

  if (options?.limit && options.limit > 0) {
    result = result.slice(0, options.limit);
  }

  return result;
}

export function buildMetadataContext(
  entries: MetadataEntry[],
  links: MetadataLink[],
  id: string
): MetadataContext | null {
  const entry = findMetadataById(entries, id);
  if (!entry) return null;

  const parent = entry.parentId ? findMetadataById(entries, entry.parentId) : null;
  const children = sortMetadataEntries(
    (entries ?? []).filter((m) => cleanText(m.parentId) === cleanText(entry.id))
  );
  const linksFrom = (links ?? []).filter(
    (l) => cleanText(l.sourceId) === cleanText(entry.id)
  );
  const linksTo = (links ?? []).filter(
    (l) => cleanText(l.targetId) === cleanText(entry.id)
  );

  return {
    entry,
    parent,
    children,
    linksFrom,
    linksTo,
  };
}

export function resolveMetadataLinksFrom(
  entries: MetadataEntry[],
  links: MetadataLink[],
  id: string
): Array<{ link: MetadataLink; entry: MetadataEntry | null }> {
  const cleanId = cleanText(id);
  if (!cleanId) return [];

  return (links ?? [])
    .filter((l) => cleanText(l.sourceId) === cleanId)
    .map((link) => ({
      link,
      entry: findMetadataById(entries, link.targetId),
    }));
}

export function resolveMetadataLinksTo(
  entries: MetadataEntry[],
  links: MetadataLink[],
  id: string
): Array<{ link: MetadataLink; entry: MetadataEntry | null }> {
  const cleanId = cleanText(id);
  if (!cleanId) return [];

  return (links ?? [])
    .filter((l) => cleanText(l.targetId) === cleanId)
    .map((link) => ({
      link,
      entry: findMetadataById(entries, link.sourceId),
    }));
}

export function getRelatedMetadataEntries(
  entries: MetadataEntry[],
  links: MetadataLink[],
  id: string
): MetadataEntry[] {
  const from = resolveMetadataLinksFrom(entries, links, id)
    .map((item) => item.entry)
    .filter((entry): entry is MetadataEntry => !!entry);

  const to = resolveMetadataLinksTo(entries, links, id)
    .map((item) => item.entry)
    .filter((entry): entry is MetadataEntry => !!entry);

  return sortMetadataEntries(uniqueEntriesById([...from, ...to]));
}

export type FullMetadataContext = MetadataContext & {
  related: MetadataEntry[];
  resolvedLinksFrom: Array<{ link: MetadataLink; entry: MetadataEntry | null }>;
  resolvedLinksTo: Array<{ link: MetadataLink; entry: MetadataEntry | null }>;
};

export function buildFullMetadataContext(
  entries: MetadataEntry[],
  links: MetadataLink[],
  id: string
): FullMetadataContext | null {
  const base = buildMetadataContext(entries, links, id);
  if (!base) return null;

  const resolvedLinksFrom = resolveMetadataLinksFrom(entries, links, id);
  const resolvedLinksTo = resolveMetadataLinksTo(entries, links, id);

  const explicitLinkedEntries = uniqueEntriesById(
    [...resolvedLinksFrom, ...resolvedLinksTo]
      .map((item) => item.entry)
      .filter((entry): entry is MetadataEntry => !!entry)
  );

  const excludedIds = [
    cleanText(base.parent?.id),
    ...base.children.map((child) => cleanText(child.id)),
    ...explicitLinkedEntries.map((entry) => cleanText(entry.id)),
  ].filter(Boolean);

  const related = sortMetadataEntries(
    uniqueEntriesById(
      excludeEntriesById(
        getRelatedMetadataEntries(entries, links, id),
        excludedIds
      )
    )
  );

  return {
    ...base,
    related,
    resolvedLinksFrom,
    resolvedLinksTo,
  };
}

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