"use client";

import { useMemo, useState } from "react";
import { searchLibraryTracks } from "./libraryTrackSearchIndex";

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

export function useLibraryFilters<TTrack extends Record<string, unknown>>({
  visibleTracks,
}: Args<TTrack>) {
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
    const tracksMatchingTags = visibleTracks.filter((track) => {
      const ids = getTagIds(track.tags);
      return activeTags.every((tag) => ids.includes(tag));
    });

    return searchLibraryTracks(tracksMatchingTags, searchQuery);
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