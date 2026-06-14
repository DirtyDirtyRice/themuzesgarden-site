import { STARTER_MULTI_STEMS } from "./multiStemsSeed";
import type { MultiStemEntry } from "./multiStemsTypes";

export const MULTI_STEMS_STORAGE_KEY = "muzesgarden.library.multi-stems.v1";

export function normalizeMultiStemEntry(
  entry: Partial<MultiStemEntry>
): MultiStemEntry {
  const now = new Date().toLocaleString();

  return {
    id: entry.id || `multi-stem-${Date.now()}`,
    title: entry.title || "Untitled Stem Set",
    songTitle: entry.songTitle || "",
    bpm: entry.bpm || "",
    songKey: entry.songKey || "",
    stemTypes: entry.stemTypes || "",
    sourceFolder: entry.sourceFolder || "",
    notes: entry.notes || "",
    tags: entry.tags || "",
    trackLink: entry.trackLink || "",
    projectLink: entry.projectLink || "",
    metadataLink: entry.metadataLink || "",
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || entry.createdAt || now,
  };
}

export function getStartingMultiStems(): MultiStemEntry[] {
  if (typeof window === "undefined") return STARTER_MULTI_STEMS;

  try {
    const saved = window.localStorage.getItem(MULTI_STEMS_STORAGE_KEY);

    if (!saved) return STARTER_MULTI_STEMS;

    const parsed = JSON.parse(saved) as Partial<MultiStemEntry>[];

    if (!Array.isArray(parsed)) return STARTER_MULTI_STEMS;

    return parsed.map(normalizeMultiStemEntry);
  } catch {
    return STARTER_MULTI_STEMS;
  }
}

export function saveMultiStemsToBrowser(entries: MultiStemEntry[]): boolean {
  try {
    window.localStorage.setItem(MULTI_STEMS_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}