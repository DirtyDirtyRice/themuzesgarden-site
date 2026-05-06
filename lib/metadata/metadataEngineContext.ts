import type {
  MetadataContext,
  MetadataEntry,
  MetadataLink,
  MetadataSearchOptions,
  MetadataTargetType,
} from "./metadataTypes";
import {
  cleanLower,
  cleanText,
  excludeEntriesById,
  sortMetadataEntries,
  uniqueEntriesById,
  uniqueStrings,
} from "./metadataEngineCore";

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