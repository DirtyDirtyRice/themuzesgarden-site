import type {
  LyricEntry,
  LyricEntryReadiness,
  LyricEntryStatus,
  LyricsLibraryStats,
  LyricsLibraryValidationResult,
} from "./lyricsTypes";

function getEntryStatus(entry: LyricEntry): LyricEntryStatus {
  return entry.status || "draft";
}

function hasText(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function getLyricEntryReadiness(entry: LyricEntry): LyricEntryReadiness {
  if (entry.status === "archived") return "archived";
  if (!hasText(entry.title)) return "missing-title";
  if (!hasText(entry.body)) return "missing-lyrics";
  if (entry.readiness) return entry.readiness;

  return "ready";
}

export function validateLyricEntry(entry: LyricEntry): LyricsLibraryValidationResult {
  const messages: string[] = [];
  const readiness = getLyricEntryReadiness(entry);

  if (!hasText(entry.title)) {
    messages.push("Missing title");
  }

  if (!hasText(entry.body)) {
    messages.push("Missing lyrics");
  }

  if (!hasText(entry.artist)) {
    messages.push("Artist is blank");
  }

  if (!hasText(entry.tags)) {
    messages.push("Tags are blank");
  }

  return {
    isValid: readiness === "ready",
    readiness,
    messages,
  };
}

export function buildLyricsLibraryStats(
  entries: LyricEntry[],
  shownEntries: LyricEntry[]
): LyricsLibraryStats {
  let draftCount = 0;
  let workingCount = 0;
  let keeperCount = 0;
  let finishedCount = 0;
  let archivedCount = 0;
  let needsReviewCount = 0;

  for (const entry of entries) {
    const status = getEntryStatus(entry);
    const readiness = getLyricEntryReadiness(entry);

    if (status === "draft") draftCount += 1;
    if (status === "working") workingCount += 1;
    if (status === "keeper") keeperCount += 1;
    if (status === "finished") finishedCount += 1;
    if (status === "archived") archivedCount += 1;

    if (readiness !== "ready") {
      needsReviewCount += 1;
    }
  }

  return {
    totalEntries: entries.length,
    shownEntries: shownEntries.length,
    draftCount,
    workingCount,
    keeperCount,
    finishedCount,
    archivedCount,
    needsReviewCount,
  };
}

export function getLyricsLibraryStatsLabel(stats: LyricsLibraryStats): string {
  return `${stats.shownEntries} shown of ${stats.totalEntries} total`;
}

export function getLyricStatusLabel(status: LyricEntryStatus | undefined): string {
  if (status === "working") return "Working";
  if (status === "keeper") return "Keeper";
  if (status === "finished") return "Finished";
  if (status === "archived") return "Archived";

  return "Draft";
}

export function getLyricReadinessLabel(
  readiness: LyricEntryReadiness | undefined
): string {
  if (readiness === "missing-title") return "Missing Title";
  if (readiness === "missing-lyrics") return "Missing Lyrics";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "archived") return "Archived";

  return "Ready";
}

export function getMostRecentLyricEntry(entries: LyricEntry[]): LyricEntry | null {
  if (entries.length === 0) return null;

  return [...entries].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt)
  )[0];
}

export function getKeeperLyricEntries(entries: LyricEntry[]): LyricEntry[] {
  return entries.filter((entry) => entry.status === "keeper");
}

export function getNeedsReviewLyricEntries(entries: LyricEntry[]): LyricEntry[] {
  return entries.filter((entry) => getLyricEntryReadiness(entry) !== "ready");
}