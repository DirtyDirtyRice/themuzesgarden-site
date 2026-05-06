import type { LayeredMetadataEntry } from "./metadataTypes";
import type {
  MetadataQueryInput,
  MetadataQueryResultGroup,
  MetadataQueryResultItem,
} from "./metadataQueryTypes";

export function cleanQueryText(value: unknown): string {
  return String(value ?? "").trim();
}

export function cleanQueryLower(value: unknown): string {
  return cleanQueryText(value).toLowerCase();
}

export function normalizeQueryTags(tags: unknown[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const tag of tags ?? []) {
    const clean = cleanQueryLower(tag);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }

  return out;
}

export function normalizeMetadataQueryInput(
  input: Partial<MetadataQueryInput> | undefined
): MetadataQueryInput {
  return {
    query: cleanQueryText(input?.query),
    mode: input?.mode ?? "all",
    targetType: input?.targetType ?? "all",
    kind: input?.kind ?? "all",
    targetId: cleanQueryText(input?.targetId),
    tags: normalizeQueryTags(input?.tags),
    limit: Number.isFinite(input?.limit) && Number(input?.limit) > 0 ? Number(input?.limit) : 50,
    includeDirect: input?.includeDirect !== false,
    includeInherited: input?.includeInherited !== false,
    includeRelated: input?.includeRelated !== false,
    includeExpanded: input?.includeExpanded !== false,
    includeFallback: input?.includeFallback !== false,
  };
}

export function getLayerSourceLabel(source: LayeredMetadataEntry["source"]): string {
  if (source === "direct") return "Direct";
  if (source === "inherited") return "Inherited";
  if (source === "related") return "Related";
  if (source === "expanded") return "Expanded";
  return "Fallback";
}

export function shouldIncludeSource(
  source: LayeredMetadataEntry["source"],
  input: MetadataQueryInput
): boolean {
  if (source === "direct") return input.includeDirect !== false;
  if (source === "inherited") return input.includeInherited !== false;
  if (source === "related") return input.includeRelated !== false;
  if (source === "expanded") return input.includeExpanded !== false;
  return input.includeFallback !== false;
}

export function matchesTagFilters(entry: LayeredMetadataEntry, tags: string[]): boolean {
  if (!tags.length) return true;

  const entryTags = (entry.tags ?? []).map((tag) => cleanQueryLower(tag));
  return tags.every((tag) => entryTags.includes(tag));
}

export function collectMatchedBy(params: {
  entry: LayeredMetadataEntry;
  normalizedQuery: string;
  contextTokens: string[];
}): MetadataQueryResultItem["matchedBy"] {
  const { entry, normalizedQuery, contextTokens } = params;
  const matchedBy: MetadataQueryResultItem["matchedBy"] = [];

  if (!normalizedQuery) {
    return matchedBy;
  }

  const query = normalizedQuery;

  const label = cleanQueryLower(entry.label);
  const value = cleanQueryLower(entry.value);
  const description = cleanQueryLower(entry.description);
  const targetId = cleanQueryLower(entry.targetId);
  const targetType = cleanQueryLower(entry.targetType);
  const kind = cleanQueryLower(entry.kind);
  const tags = (entry.tags ?? []).map((tag) => cleanQueryLower(tag));
  const tokens = (contextTokens ?? []).map((token) => cleanQueryLower(token));

  if (label.includes(query)) matchedBy.push("label");
  if (value.includes(query)) matchedBy.push("value");
  if (description.includes(query)) matchedBy.push("description");
  if (targetId.includes(query)) matchedBy.push("targetId");
  if (targetType.includes(query)) matchedBy.push("targetType");
  if (kind.includes(query)) matchedBy.push("kind");
  if (tags.some((tag) => tag.includes(query))) matchedBy.push("tags");
  if (tokens.some((token) => token.includes(query))) matchedBy.push("tokens");

  return matchedBy;
}

export function buildMetadataQueryGroups(
  entries: MetadataQueryResultItem[]
): MetadataQueryResultGroup[] {
  const buckets = new Map<LayeredMetadataEntry["source"], MetadataQueryResultItem[]>();

  for (const entry of entries) {
    const existing = buckets.get(entry.source) ?? [];
    existing.push(entry);
    buckets.set(entry.source, existing);
  }

  const orderedSources: LayeredMetadataEntry["source"][] = [
    "direct",
    "inherited",
    "related",
    "expanded",
    "fallback",
  ];

  return orderedSources
    .filter((source) => (buckets.get(source) ?? []).length > 0)
    .map((source) => ({
      source,
      label: getLayerSourceLabel(source),
      entries: [...(buckets.get(source) ?? [])].sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return cleanQueryLower(a.label).localeCompare(cleanQueryLower(b.label));
      }),
    }));
}