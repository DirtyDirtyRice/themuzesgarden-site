import { STARTER_LYRICS } from "./lyricsSeed";
import type { LyricEntry } from "./lyricsTypes";

export const LYRICS_STORAGE_KEY = "muzesgarden.library.lyrics.v2";

export function normalizeEntry(entry: Partial<LyricEntry>): LyricEntry {
  const now = new Date().toLocaleString();

  return {
    id: entry.id || `lyric-${Date.now()}`,
    title: entry.title || "Untitled Lyrics",
    artist: entry.artist || "",
    tags: entry.tags || "",
    body: entry.body || "",
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || entry.createdAt || now,
  };
}

export function getStartingLyrics(): LyricEntry[] {
  if (typeof window === "undefined") return STARTER_LYRICS;

  try {
    const savedV2 = window.localStorage.getItem(LYRICS_STORAGE_KEY);
    const savedV1 = window.localStorage.getItem("muzesgarden.library.lyrics.v1");
    const saved = savedV2 || savedV1;

    if (!saved) return STARTER_LYRICS;

    const parsed = JSON.parse(saved) as Partial<LyricEntry>[];
    if (!Array.isArray(parsed)) return STARTER_LYRICS;

    return parsed.map(normalizeEntry);
  } catch {
    return STARTER_LYRICS;
  }
}

export function saveLyricsToBrowser(entries: LyricEntry[]): boolean {
  try {
    window.localStorage.setItem(LYRICS_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}