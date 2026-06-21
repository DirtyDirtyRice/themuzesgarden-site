"use client";

import { useMemo, useState } from "react";

function getTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function getSearchText(track: unknown): string {
  const record = track as {
    title?: unknown;
    name?: unknown;
    fileName?: unknown;
    filename?: unknown;
    artist?: unknown;
    tags?: unknown;
    searchText?: unknown;
  };

  return [
    record.searchText,
    record.title,
    record.name,
    record.fileName,
    record.filename,
    record.artist,
    ...getTagIds(record.tags),
  ]
    .join(" ")
    .toLowerCase();
}

type Args<TTrack> = {
  visibleTracks: TTrack[];
};

export function useLibraryFilters<TTrack>({ visibleTracks }: Args<TTrack>) {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  function addFilterTag(tagId: string) {
    setActiveTags((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
  }

  function removeFilterTag(tagId: string) {
    setActiveTags((prev) => prev.filter((t) => t !== tagId));
  }

  function clearFilters() {
    setActiveTags([]);
  }

  function clearSearch() {
    setSearchQuery("");
  }

  const filteredTracks = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    return visibleTracks.filter((track) => {
      const tags = (track as { tags?: unknown }).tags;
      const ids = getTagIds(tags);

      const matchesTags = activeTags.every((tag) => ids.includes(tag));

      if (!matchesTags) return false;
      if (!cleanSearch) return true;

      return getSearchText(track).includes(cleanSearch);
    });
  }, [visibleTracks, activeTags, searchQuery]);

  return {
    activeTags,
    searchQuery,
    filteredTracks,
    setSearchQuery,
    addFilterTag,
    removeFilterTag,
    clearFilters,
    clearSearch,
  };
}