import type {
  LyricEntry,
  LyricEntryReadiness,
  LyricsLibraryStats,
} from "./lyricsTypes";
import { getLyricEntryReadiness } from "./lyricsLibraryStatsHelpers";

export type LyricsLibraryInsightItem = {
  label: string;
  value: string;
  detail: string;
};

export type LyricsLibraryInsights = {
  mostRecentEntry: LyricEntry | null;
  readinessLabel: string;
  sourceLabel: string;
  summaryItems: LyricsLibraryInsightItem[];
};

function getEntrySourceLabel(entry: LyricEntry): string {
  if (entry.source === "manual") return "Manual";
  if (entry.source === "file-import") return "File Import";
  if (entry.source === "folder-import") return "Folder Import";
  if (entry.source === "starter") return "Starter";
  return "Unknown";
}

function getReadinessSummaryLabel(readiness: LyricEntryReadiness): string {
  if (readiness === "missing-title") return "Missing Title";
  if (readiness === "missing-lyrics") return "Missing Lyrics";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "archived") return "Archived";
  return "Ready";
}

function getMostRecentlyUpdatedEntry(entries: LyricEntry[]): LyricEntry | null {
  if (entries.length === 0) return null;

  return [...entries].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt)
  )[0];
}

function countStarterEntries(entries: LyricEntry[]): number {
  return entries.filter(
    (entry) => entry.source === "starter" || entry.createdAt === "Starter"
  ).length;
}

function countImportedEntries(entries: LyricEntry[]): number {
  return entries.filter(
    (entry) => entry.source === "file-import" || entry.source === "folder-import"
  ).length;
}

export function buildLyricsLibraryInsights(
  entries: LyricEntry[],
  stats: LyricsLibraryStats
): LyricsLibraryInsights {
  const mostRecentEntry = getMostRecentlyUpdatedEntry(entries);
  const readiness = mostRecentEntry
    ? getLyricEntryReadiness(mostRecentEntry)
    : "needs-review";

  const importedCount = countImportedEntries(entries);
  const starterCount = countStarterEntries(entries);

  return {
    mostRecentEntry,
    readinessLabel: getReadinessSummaryLabel(readiness),
    sourceLabel: mostRecentEntry ? getEntrySourceLabel(mostRecentEntry) : "None",
    summaryItems: [
      {
        label: "Keepers",
        value: String(stats.keeperCount),
        detail: "Lyrics marked as keeper candidates.",
      },
      {
        label: "Needs Review",
        value: String(stats.needsReviewCount),
        detail: "Lyrics missing key information or marked for review.",
      },
      {
        label: "Imported",
        value: String(importedCount),
        detail: "Lyrics brought in through file or folder import.",
      },
      {
        label: "Starter",
        value: String(starterCount),
        detail: "Starter/demo lyrics still present in the library.",
      },
    ],
  };
}