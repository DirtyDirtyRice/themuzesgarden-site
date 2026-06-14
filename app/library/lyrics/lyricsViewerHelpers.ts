import type { LyricEntry } from "./lyricsTypes";

export function findLyricEntryById(
  entries: LyricEntry[],
  entryId: string | null
): LyricEntry | null {
  if (!entryId) return null;

  return entries.find((entry) => entry.id === entryId) || null;
}