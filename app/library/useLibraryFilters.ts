"use client";

import { useMemo, useState } from "react";

function getTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

type Args<TTrack> = {
  visibleTracks: TTrack[];
};

export function useLibraryFilters<TTrack>({ visibleTracks }: Args<TTrack>) {
  const [activeTags, setActiveTags] = useState<string[]>([]);

  function addFilterTag(tagId: string) {
    setActiveTags((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
  }

  function removeFilterTag(tagId: string) {
    setActiveTags((prev) => prev.filter((t) => t !== tagId));
  }

  function clearFilters() {
    setActiveTags([]);
  }

  const filteredTracks = useMemo(() => {
    if (!activeTags.length) return visibleTracks;

    return visibleTracks.filter((track) => {
      const tags = (track as { tags?: unknown }).tags;
      const ids = getTagIds(tags);
      return activeTags.every((tag) => ids.includes(tag));
    });
  }, [visibleTracks, activeTags]);

  return {
    activeTags,
    filteredTracks,
    addFilterTag,
    removeFilterTag,
    clearFilters,
  };
}