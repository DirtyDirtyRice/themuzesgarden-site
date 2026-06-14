import { STARTER_MISCELLANEOUS } from "./miscellaneousSeed";
import type { MiscellaneousEntry } from "./miscellaneousTypes";

export const MISCELLANEOUS_STORAGE_KEY =
  "muzesgarden.library.miscellaneous.v1";

export function normalizeMiscellaneousEntry(
  entry: Partial<MiscellaneousEntry>
): MiscellaneousEntry {
  const now = new Date().toLocaleString();

  return {
    id: entry.id || `miscellaneous-${Date.now()}`,
    title: entry.title || "Untitled Miscellaneous Note",
    category: entry.category || "",
    relatedSong: entry.relatedSong || "",
    body: entry.body || "",
    notes: entry.notes || "",
    tags: entry.tags || "",
    lyricLink: entry.lyricLink || "",
    storyLink: entry.storyLink || "",
    trackLink: entry.trackLink || "",
    projectLink: entry.projectLink || "",
    metadataLink: entry.metadataLink || "",
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || entry.createdAt || now,
  };
}

export function getStartingMiscellaneous(): MiscellaneousEntry[] {
  if (typeof window === "undefined") return STARTER_MISCELLANEOUS;

  try {
    const saved = window.localStorage.getItem(MISCELLANEOUS_STORAGE_KEY);

    if (!saved) return STARTER_MISCELLANEOUS;

    const parsed = JSON.parse(saved) as Partial<MiscellaneousEntry>[];

    if (!Array.isArray(parsed)) return STARTER_MISCELLANEOUS;

    return parsed.map(normalizeMiscellaneousEntry);
  } catch {
    return STARTER_MISCELLANEOUS;
  }
}

export function saveMiscellaneousToBrowser(
  entries: MiscellaneousEntry[]
): boolean {
  try {
    window.localStorage.setItem(
      MISCELLANEOUS_STORAGE_KEY,
      JSON.stringify(entries)
    );
    return true;
  } catch {
    return false;
  }
}