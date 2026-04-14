import type { MetadataEntry } from "../../../../../lib/metadata/metadataTypes";
import type { WorkspaceTrackLike } from "./libraryNormalize";
import { cleanText } from "./textUtils";

export type MetadataFilter = {
  id: string;
  label: string;
  query: string;
};

export function buildMetadataQuery(entry: MetadataEntry): string {
  const parts: string[] = [];

  if (entry.label) parts.push(cleanText(entry.label));
  if (entry.value != null) parts.push(cleanText(entry.value));

  if (Array.isArray(entry.tags) && entry.tags.length > 0) {
    parts.push(...entry.tags.map((tag) => cleanText(tag)).filter(Boolean));
  }

  return parts.join(" ").toLowerCase().trim();
}

export function buildMetadataFilter(entry: MetadataEntry): MetadataFilter {
  return {
    id: cleanText(entry.id),
    label: cleanText(entry.label) || cleanText(entry.id) || "Metadata",
    query: buildMetadataQuery(entry),
  };
}

export function buildTrackSearchText(track: WorkspaceTrackLike): string {
  return [
    cleanText(track.title),
    cleanText(track.artist),
    ...(Array.isArray(track.tags)
      ? track.tags.map((tag) => cleanText(tag))
      : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function trackMatchesSingleFilter(
  track: WorkspaceTrackLike,
  filter: MetadataFilter
): boolean {
  if (!filter.query) return true;

  const haystack = buildTrackSearchText(track);

  const tokens = filter.query
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  if (!tokens.length) return true;

  return tokens.some((token) => haystack.includes(token));
}

export function trackMatchesAllFilters(
  track: WorkspaceTrackLike,
  filters: MetadataFilter[]
): boolean {
  if (!filters.length) return true;
  return filters.every((filter) => trackMatchesSingleFilter(track, filter));
}