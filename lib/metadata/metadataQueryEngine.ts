import type {
  LayeredMetadataEntry,
  MetadataEntry,
  MetadataLink,
  MetadataTargetType,
  UnifiedMetadataTargetResult,
} from "./metadataTypes";
import {
  buildExpandedMetadataTargetContext,
  extractMetadataTokens,
  getUnifiedMetadataForTarget,
} from "./metadataEngine";
import type {
  MetadataQueryInput,
  MetadataQueryResult,
  MetadataQueryResultItem,
} from "./metadataQueryTypes";
import {
  buildMetadataQueryGroups,
  cleanQueryLower,
  normalizeMetadataQueryInput,
  matchesTagFilters,
  shouldIncludeSource,
  collectMatchedBy,
} from "./metadataQueryUtils";

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
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

function uniqueResultItemsById(entries: MetadataQueryResultItem[]): MetadataQueryResultItem[] {
  const out: MetadataQueryResultItem[] = [];
  const seen = new Set<string>();

  for (const entry of entries ?? []) {
    const id = cleanText(entry.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(entry);
  }

  return out;
}

function collectTargetPairs(entries: MetadataEntry[]): Array<{
  targetType: MetadataTargetType;
  targetId: string;
}> {
  const out: Array<{ targetType: MetadataTargetType; targetId: string }> = [];
  const seen = new Set<string>();

  for (const entry of entries ?? []) {
    const targetId = cleanText(entry.targetId);
    if (!targetId) continue;

    const key = `${entry.targetType}::${targetId.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      targetType: entry.targetType,
      targetId,
    });
  }

  return out;
}

function buildCandidateTargetContexts(
  entries: MetadataEntry[],
  links: MetadataLink[],
  input: MetadataQueryInput
): UnifiedMetadataTargetResult[] {
  const pairs = collectTargetPairs(entries);

  let filteredPairs = pairs;

  if (input.targetType && input.targetType !== "all") {
    filteredPairs = filteredPairs.filter((pair) => pair.targetType === input.targetType);
  }

  if (input.targetId) {
    const wanted = input.targetId.toLowerCase();
    filteredPairs = filteredPairs.filter((pair) => pair.targetId.toLowerCase() === wanted);
  }

  return filteredPairs.map((pair) =>
    getUnifiedMetadataForTarget(entries, links, pair.targetType, pair.targetId)
  );
}

function matchesMode(entry: LayeredMetadataEntry, query: string, mode: MetadataQueryInput["mode"], tokens: string[]) {
  if (!query) return true;

  const label = cleanQueryLower(entry.label);
  const value = cleanQueryLower(entry.value);
  const description = cleanQueryLower(entry.description);
  const targetId = cleanQueryLower(entry.targetId);
  const entryTokens = tokens.map((token) => cleanQueryLower(token));
  const tags = (entry.tags ?? []).map((tag) => cleanQueryLower(tag));

  if (mode === "text") {
    return (
      label.includes(query) ||
      value.includes(query) ||
      description.includes(query)
    );
  }

  if (mode === "target") {
    return targetId.includes(query) || cleanQueryLower(entry.targetType).includes(query);
  }

  if (mode === "tokens") {
    return entryTokens.some((token) => token.includes(query)) || tags.some((tag) => tag.includes(query));
  }

  return (
    label.includes(query) ||
    value.includes(query) ||
    description.includes(query) ||
    targetId.includes(query) ||
    cleanQueryLower(entry.targetType).includes(query) ||
    cleanQueryLower(entry.kind).includes(query) ||
    tags.some((tag) => tag.includes(query)) ||
    entryTokens.some((token) => token.includes(query))
  );
}

export function runMetadataQuery(params: {
  entries: MetadataEntry[];
  links: MetadataLink[];
  input?: Partial<MetadataQueryInput>;
}): MetadataQueryResult {
  const { entries, links, input } = params;
  const normalized = normalizeMetadataQueryInput(input);
  const normalizedQuery = cleanQueryLower(normalized.query);

  const targetContexts = buildCandidateTargetContexts(entries, links, normalized);

  let items: MetadataQueryResultItem[] = [];

  for (const context of targetContexts) {
    const expanded = buildExpandedMetadataTargetContext(
      entries,
      links,
      context.targetType,
      context.targetId
    );

    const contextTokens = expanded ? expanded.tokens : extractMetadataTokens(context.displayEntries);

    for (const entry of context.displayEntries) {
      if (!shouldIncludeSource(entry.source, normalized)) continue;
      if (normalized.kind && normalized.kind !== "all" && entry.kind !== normalized.kind) continue;
      if (!matchesTagFilters(entry, normalized.tags ?? [])) continue;

      const matchedBy = collectMatchedBy({
        entry,
        normalizedQuery,
        contextTokens,
      });

      const modeMatch = matchesMode(entry, normalizedQuery, normalized.mode, contextTokens);

      if (normalizedQuery && !modeMatch) continue;

      items.push({
        ...entry,
        matchedBy,
      });
    }
  }

  items = uniqueResultItemsById(items).sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return cleanQueryLower(a.label).localeCompare(cleanQueryLower(b.label));
  });

  if (normalized.limit && normalized.limit > 0) {
    items = items.slice(0, normalized.limit);
  }

  const tokens = uniqueStrings(
    items.flatMap((entry) => [
      entry.label,
      entry.value,
      entry.description,
      entry.targetId,
      ...(entry.tags ?? []),
      ...entry.matchedBy,
    ])
  );

  return {
    input: normalized,
    normalizedQuery,
    total: items.length,
    entries: items,
    groups: buildMetadataQueryGroups(items),
    targetContexts,
    tokens,
  };
}