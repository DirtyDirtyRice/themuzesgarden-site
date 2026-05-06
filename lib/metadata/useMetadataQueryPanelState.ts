"use client";

import { useMemo, useState } from "react";
import type { MetadataKind, MetadataTargetType } from "./metadataTypes";
import type { MetadataQueryInput } from "./metadataQueryTypes";

type UseMetadataQueryPanelStateArgs = {
  initialQuery?: Partial<MetadataQueryInput>;
};

export function useMetadataQueryPanelState({
  initialQuery,
}: UseMetadataQueryPanelStateArgs) {
  const [query, setQuery] = useState(initialQuery?.query ?? "");
  const [mode, setMode] = useState<MetadataQueryInput["mode"]>(
    initialQuery?.mode ?? "all"
  );
  const [targetType, setTargetType] = useState<MetadataTargetType | "all">(
    initialQuery?.targetType ?? "all"
  );
  const [kind, setKind] = useState<MetadataKind | "all">(
    initialQuery?.kind ?? "all"
  );
  const [targetId, setTargetId] = useState(initialQuery?.targetId ?? "");
  const [tagsInput, setTagsInput] = useState(
    (initialQuery?.tags ?? []).join(", ")
  );
  const [limit, setLimit] = useState<number>(initialQuery?.limit ?? 50);

  const [includeDirect, setIncludeDirect] = useState(
    initialQuery?.includeDirect !== false
  );
  const [includeInherited, setIncludeInherited] = useState(
    initialQuery?.includeInherited !== false
  );
  const [includeRelated, setIncludeRelated] = useState(
    initialQuery?.includeRelated !== false
  );
  const [includeExpanded, setIncludeExpanded] = useState(
    initialQuery?.includeExpanded !== false
  );
  const [includeFallback, setIncludeFallback] = useState(
    initialQuery?.includeFallback !== false
  );

  const [runCount, setRunCount] = useState(0);
  const [statusText, setStatusText] = useState(
    'Enter a query like "groove" and click "Run Query".'
  );
  const [isPinned, setIsPinned] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isRunningQuery, setIsRunningQuery] = useState(false);

  const tags = useMemo(() => {
    return tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [tagsInput]);

  const nextInput = useMemo<MetadataQueryInput>(
    () => ({
      query,
      mode,
      targetType,
      kind,
      targetId,
      tags,
      limit,
      includeDirect,
      includeInherited,
      includeRelated,
      includeExpanded,
      includeFallback,
    }),
    [
      query,
      mode,
      targetType,
      kind,
      targetId,
      tags,
      limit,
      includeDirect,
      includeInherited,
      includeRelated,
      includeExpanded,
      includeFallback,
    ]
  );

  return {
    query,
    setQuery,
    mode,
    setMode,
    targetType,
    setTargetType,
    kind,
    setKind,
    targetId,
    setTargetId,
    tagsInput,
    setTagsInput,
    limit,
    setLimit,
    includeDirect,
    setIncludeDirect,
    includeInherited,
    setIncludeInherited,
    includeRelated,
    setIncludeRelated,
    includeExpanded,
    setIncludeExpanded,
    includeFallback,
    setIncludeFallback,
    runCount,
    setRunCount,
    statusText,
    setStatusText,
    isPinned,
    setIsPinned,
    isDockCollapsed,
    setIsDockCollapsed,
    isRunningQuery,
    setIsRunningQuery,
    tags,
    nextInput,
  };
}