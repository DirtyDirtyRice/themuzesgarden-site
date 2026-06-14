import { STARTER_STORIES } from "./storiesSeed";
import type { StoryEntry } from "./storiesTypes";

export const STORIES_STORAGE_KEY = "muzesgarden.library.stories.v1";

export function normalizeStoryEntry(entry: Partial<StoryEntry>): StoryEntry {
  const now = new Date().toLocaleString();

  return {
    id: entry.id || `story-${Date.now()}`,
    title: entry.title || "Untitled Story",
    songTitle: entry.songTitle || "",
    inspiration: entry.inspiration || "",
    body: entry.body || "",
    notes: entry.notes || "",
    tags: entry.tags || "",
    lyricLink: entry.lyricLink || "",
    trackLink: entry.trackLink || "",
    metadataLink: entry.metadataLink || "",
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || entry.createdAt || now,
  };
}

export function getStartingStories(): StoryEntry[] {
  if (typeof window === "undefined") return STARTER_STORIES;

  try {
    const saved = window.localStorage.getItem(STORIES_STORAGE_KEY);

    if (!saved) return STARTER_STORIES;

    const parsed = JSON.parse(saved) as Partial<StoryEntry>[];

    if (!Array.isArray(parsed)) return STARTER_STORIES;

    return parsed.map(normalizeStoryEntry);
  } catch {
    return STARTER_STORIES;
  }
}

export function saveStoriesToBrowser(entries: StoryEntry[]): boolean {
  try {
    window.localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}