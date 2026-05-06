import type { MetadataQueryInput } from "./metadataQueryTypes";

export function buildResultsUrl(input: MetadataQueryInput): string {
  const params = new URLSearchParams();

  const safeQuery = input.query ?? "";
  const safeMode = input.mode ?? "all";
  const safeTargetType = input.targetType ?? "all";
  const safeKind = input.kind ?? "all";
  const safeTargetId = input.targetId ?? "";
  const safeTags = input.tags ?? [];
  const safeLimit = input.limit ?? 50;
  const safeIncludeDirect = input.includeDirect ?? true;
  const safeIncludeInherited = input.includeInherited ?? true;
  const safeIncludeRelated = input.includeRelated ?? true;
  const safeIncludeExpanded = input.includeExpanded ?? true;
  const safeIncludeFallback = input.includeFallback ?? true;

  if (safeQuery.trim()) {
    params.set("query", safeQuery.trim());
  }

  params.set("mode", safeMode);
  params.set("targetType", safeTargetType);
  params.set("kind", safeKind);

  if (safeTargetId.trim()) {
    params.set("targetId", safeTargetId.trim());
  }

  if (safeTags.length > 0) {
    params.set("tags", safeTags.join(","));
  }

  params.set("limit", String(safeLimit));
  params.set("includeDirect", String(safeIncludeDirect));
  params.set("includeInherited", String(safeIncludeInherited));
  params.set("includeRelated", String(safeIncludeRelated));
  params.set("includeExpanded", String(safeIncludeExpanded));
  params.set("includeFallback", String(safeIncludeFallback));

  const queryString = params.toString();

  return queryString
    ? `/metadata/results?${queryString}`
    : "/metadata/results";
}