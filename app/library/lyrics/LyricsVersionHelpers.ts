import type { LyricEntry } from "./lyricsTypes";
import type {
  LyricsVersionCandidate,
  LyricsVersionComparison,
  LyricsVersionComparisonVerdict,
  LyricsVersionCreateInput,
  LyricsVersionEntry,
  LyricsVersionFilter,
  LyricsVersionKind,
  LyricsVersionLineChange,
  LyricsVersionPanelSection,
  LyricsVersionPriority,
  LyricsVersionReadiness,
  LyricsVersionSectionFocus,
  LyricsVersionSectionScore,
  LyricsVersionSortMode,
  LyricsVersionStats,
  LyricsVersionStatus,
  LyricsVersionWorkspaceModel,
} from "./LyricsVersionTypes";
import {
  LYRICS_VERSION_PANEL_SECTIONS,
  LYRICS_VERSION_STARTER_VERSION,
} from "./LyricsVersionSeed";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function hasText(value: string): boolean {
  return normalizeText(value).length > 0;
}

function splitLines(value: string): string[] {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function buildVersionId(lyric: LyricEntry, kind: LyricsVersionKind): string {
  const safeKind = kind.replaceAll(" ", "-").toLowerCase();
  return `version-${lyric.id}-${safeKind}`;
}

function nowLabel(): string {
  return new Date().toLocaleString();
}

export function getLyricsVersionReadiness(
  version: LyricsVersionEntry
): LyricsVersionReadiness {
  if (version.status === "archived") return "archived";
  if (!hasText(version.body)) return "missing-lyrics";
  if (version.kind !== "original" && !version.parentVersionId) {
    return "missing-parent";
  }
  if (version.kind !== "original" && version.lineChanges.length === 0) {
    return "needs-comparison";
  }
  if (version.status === "review") return "needs-review";
  return "ready";
}

export function getLyricsVersionPriorityScore(
  priority: LyricsVersionPriority
): number {
  if (priority === "critical") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

export function createLyricsVersionFromLyric(
  input: LyricsVersionCreateInput
): LyricsVersionEntry {
  const createdAt = nowLabel();
  const kind = input.kind;
  const status = input.status || (kind === "original" ? "active" : "draft");
  const source = input.source || (kind === "original" ? "manual" : "duplicate");
  const priority = input.priority || "medium";
  const focus = input.focus || "full-song";

  const version: LyricsVersionEntry = {
    id: buildVersionId(input.lyric, kind),
    lyricEntryId: input.lyric.id,
    parentVersionId: kind === "original" ? null : `version-${input.lyric.id}-original`,
    title: input.lyric.title,
    artist: input.lyric.artist,
    tags: input.lyric.tags,
    body: input.lyric.body,
    kind,
    status,
    source,
    priority,
    focus,
    readiness: "ready",
    createdAt,
    updatedAt: createdAt,
    notes: input.notes || "",
    changeSummary: input.changeSummary || "Version created from current lyric.",
    lineChanges: [],
    sectionScores: scoreLyricsVersionSections(input.lyric.body, focus),
  };

  return {
    ...version,
    readiness: getLyricsVersionReadiness(version),
  };
}

export function buildStarterVersionsForLyrics(
  entries: LyricEntry[]
): LyricsVersionEntry[] {
  return entries.map((entry) => {
    if (entry.id === LYRICS_VERSION_STARTER_VERSION.lyricEntryId) {
      return {
        ...LYRICS_VERSION_STARTER_VERSION,
        title: entry.title,
        artist: entry.artist,
        tags: entry.tags,
        body: entry.body,
      };
    }

    return createLyricsVersionFromLyric({
      lyric: entry,
      kind: "original",
      source: entry.source || "manual",
      status: entry.status === "archived" ? "archived" : "active",
      priority: entry.status === "keeper" ? "high" : "medium",
      focus: "full-song",
      notes: entry.notes || "",
      changeSummary: "Original version generated from the current lyric entry.",
    });
  });
}

export function scoreLyricsVersionSections(
  body: string,
  focus: LyricsVersionSectionFocus
): LyricsVersionSectionScore[] {
  const lines = splitLines(body).filter((line) => hasText(line));
  const lineCount = lines.length;
  const lowerBody = normalizeText(body);

  const hasChorusWord = lowerBody.includes("chorus");
  const hasVerseWord = lowerBody.includes("verse");
  const hasBridgeWord = lowerBody.includes("bridge");
  const repeatedLines = countRepeatedLines(lines);

  const fullSongScore = Math.min(100, 20 + lineCount * 4);
  const verseScore = hasVerseWord ? 80 : Math.min(70, 15 + lineCount * 3);
  const chorusScore = hasChorusWord || repeatedLines > 0 ? 80 : 25;
  const bridgeScore = hasBridgeWord ? 75 : 20;
  const hookScore = repeatedLines > 0 ? 75 : 30;

  return [
    {
      section: "full-song",
      score: focus === "full-song" ? Math.max(fullSongScore, 70) : fullSongScore,
      reason: `${lineCount} usable lyric lines detected.`,
    },
    {
      section: "verse",
      score: focus === "verse" ? Math.max(verseScore, 70) : verseScore,
      reason: hasVerseWord
        ? "Verse label found in lyric body."
        : "Verse strength estimated from total line count.",
    },
    {
      section: "chorus",
      score: focus === "chorus" ? Math.max(chorusScore, 70) : chorusScore,
      reason: hasChorusWord
        ? "Chorus label found in lyric body."
        : "Chorus strength estimated from repeated lines.",
    },
    {
      section: "bridge",
      score: focus === "bridge" ? Math.max(bridgeScore, 70) : bridgeScore,
      reason: hasBridgeWord
        ? "Bridge label found in lyric body."
        : "No bridge label detected yet.",
    },
    {
      section: "hook",
      score: focus === "hook" ? Math.max(hookScore, 70) : hookScore,
      reason:
        repeatedLines > 0
          ? `${repeatedLines} repeated lyric line patterns detected.`
          : "No repeated hook line detected yet.",
    },
  ];
}

function countRepeatedLines(lines: string[]): number {
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const line of lines) {
    const normalized = normalizeText(line);
    if (!normalized) continue;
    if (seen.has(normalized)) {
      repeated.add(normalized);
    }
    seen.add(normalized);
  }

  return repeated.size;
}

export function compareLyricsVersions(
  left: LyricsVersionEntry,
  right: LyricsVersionEntry
): LyricsVersionComparison {
  const leftLines = splitLines(left.body);
  const rightLines = splitLines(right.body);
  const maxLines = Math.max(leftLines.length, rightLines.length);

  let changedLineCount = 0;
  let unchangedLineCount = 0;
  let addedLineCount = 0;
  let removedLineCount = 0;
  const warnings: string[] = [];

  for (let index = 0; index < maxLines; index += 1) {
    const before = leftLines[index];
    const after = rightLines[index];

    if (before === undefined && after !== undefined) {
      addedLineCount += 1;
      continue;
    }

    if (before !== undefined && after === undefined) {
      removedLineCount += 1;
      continue;
    }

    if (before === after) {
      unchangedLineCount += 1;
    } else {
      changedLineCount += 1;
    }
  }

  if (left.lyricEntryId !== right.lyricEntryId) {
    warnings.push("Versions belong to different lyric entries.");
  }

  const verdict = getComparisonVerdict(
    left,
    right,
    changedLineCount,
    addedLineCount,
    removedLineCount
  );

  return {
    id: `comparison-${left.id}-${right.id}`,
    lyricEntryId: right.lyricEntryId,
    leftVersionId: left.id,
    rightVersionId: right.id,
    verdict,
    changedLineCount,
    unchangedLineCount,
    addedLineCount,
    removedLineCount,
    summary: buildComparisonSummary(
      verdict,
      changedLineCount,
      addedLineCount,
      removedLineCount
    ),
    warnings,
  };
}

function getComparisonVerdict(
  left: LyricsVersionEntry,
  right: LyricsVersionEntry,
  changedLineCount: number,
  addedLineCount: number,
  removedLineCount: number
): LyricsVersionComparisonVerdict {
  if (left.body === right.body) return "same";
  if (right.status === "keeper") return "stronger";
  if (right.status === "review") return "needs-listen";
  if (removedLineCount > changedLineCount + addedLineCount) return "weaker";
  if (changedLineCount > 0 || addedLineCount > 0) return "different";
  return "not-compared";
}

function buildComparisonSummary(
  verdict: LyricsVersionComparisonVerdict,
  changedLineCount: number,
  addedLineCount: number,
  removedLineCount: number
): string {
  const pieces = [
    `${changedLineCount} changed`,
    `${addedLineCount} added`,
    `${removedLineCount} removed`,
  ];

  if (verdict === "same") return "No lyric line differences detected.";
  if (verdict === "stronger") return `Keeper version detected: ${pieces.join(", ")}.`;
  if (verdict === "weaker") return `Possible weaker version: ${pieces.join(", ")}.`;
  if (verdict === "needs-listen") return `Needs listening review: ${pieces.join(", ")}.`;
  return `Version differs: ${pieces.join(", ")}.`;
}

export function buildLyricsVersionLineChanges(
  left: LyricsVersionEntry,
  right: LyricsVersionEntry
): LyricsVersionLineChange[] {
  const leftLines = splitLines(left.body);
  const rightLines = splitLines(right.body);
  const maxLines = Math.max(leftLines.length, rightLines.length);
  const changes: LyricsVersionLineChange[] = [];

  for (let index = 0; index < maxLines; index += 1) {
    const before = leftLines[index] || "";
    const after = rightLines[index] || "";

    if (before === after) continue;

    changes.push({
      id: `line-change-${right.id}-${index + 1}`,
      lineNumber: index + 1,
      before,
      after,
      changeType: "wording",
      note: before && after ? "Line wording changed." : "Line added or removed.",
    });
  }

  return changes;
}

export function buildLyricsVersionCandidates(
  entries: LyricEntry[],
  versions: LyricsVersionEntry[]
): LyricsVersionCandidate[] {
  return entries.map((lyric) => {
    const lyricVersions = versions.filter((version) => version.lyricEntryId === lyric.id);
    const activeVersion =
      lyricVersions.find((version) => version.status === "active") ||
      lyricVersions[0] ||
      null;
    const keeperVersion =
      lyricVersions.find((version) => version.status === "keeper") || null;
    const needsReviewCount = lyricVersions.filter(
      (version) => getLyricsVersionReadiness(version) !== "ready"
    ).length;

    return {
      lyric,
      versions: lyricVersions,
      activeVersion,
      keeperVersion,
      needsReviewCount,
    };
  });
}

export function buildLyricsVersionStats(
  entries: LyricEntry[],
  versions: LyricsVersionEntry[]
): LyricsVersionStats {
  const originals = versions.filter((version) => version.kind === "original").length;
  const rewrites = versions.filter((version) => version.kind !== "original").length;
  const keepers = versions.filter((version) => version.status === "keeper").length;
  const reviewCount = versions.filter(
    (version) => getLyricsVersionReadiness(version) !== "ready"
  ).length;
  const archivedCount = versions.filter((version) => version.status === "archived").length;
  const missingParentCount = versions.filter(
    (version) => getLyricsVersionReadiness(version) === "missing-parent"
  ).length;

  return {
    totalLyrics: entries.length,
    totalVersions: versions.length,
    originals,
    rewrites,
    keepers,
    reviewCount,
    archivedCount,
    missingParentCount,
    averageVersionsPerLyric:
      entries.length === 0 ? 0 : Number((versions.length / entries.length).toFixed(2)),
  };
}

export function buildLyricsVersionWorkspaceModel(
  entries: LyricEntry[]
): LyricsVersionWorkspaceModel {
  const versions = buildStarterVersionsForLyrics(entries);
  const candidates = buildLyricsVersionCandidates(entries, versions);
  const comparisons = buildDefaultComparisons(candidates);
  const stats = buildLyricsVersionStats(entries, versions);
  const activeCandidate = candidates[0] || null;

  return {
    candidates,
    comparisons,
    stats,
    activeCandidate,
    summary: buildWorkspaceSummary(stats),
    warnings: buildWorkspaceWarnings(stats, candidates),
  };
}

function buildDefaultComparisons(
  candidates: LyricsVersionCandidate[]
): LyricsVersionComparison[] {
  const comparisons: LyricsVersionComparison[] = [];

  for (const candidate of candidates) {
    if (!candidate.activeVersion || !candidate.keeperVersion) continue;
    comparisons.push(compareLyricsVersions(candidate.activeVersion, candidate.keeperVersion));
  }

  return comparisons;
}

function buildWorkspaceSummary(stats: LyricsVersionStats): string {
  if (stats.totalLyrics === 0) return "No lyrics are available for version tracking.";
  if (stats.totalVersions === stats.totalLyrics) {
    return "Every lyric has a starter original version ready for future rewrites.";
  }
  return `${stats.totalVersions} versions are mapped across ${stats.totalLyrics} lyrics.`;
}

function buildWorkspaceWarnings(
  stats: LyricsVersionStats,
  candidates: LyricsVersionCandidate[]
): string[] {
  const warnings: string[] = [];

  if (stats.reviewCount > 0) {
    warnings.push(`${stats.reviewCount} version records need review.`);
  }

  if (stats.missingParentCount > 0) {
    warnings.push(`${stats.missingParentCount} rewrite records are missing a parent.`);
  }

  if (candidates.some((candidate) => candidate.versions.length === 0)) {
    warnings.push("Some lyrics do not have a version record yet.");
  }

  if (warnings.length === 0) {
    warnings.push("Version workspace is ready.");
  }

  return warnings;
}

export function filterLyricsVersions(
  versions: LyricsVersionEntry[],
  filter: LyricsVersionFilter
): LyricsVersionEntry[] {
  const search = normalizeText(filter.searchValue);

  return versions.filter((version) => {
    const matchesStatus = filter.status === "all" || version.status === filter.status;
    const matchesKind = filter.kind === "all" || version.kind === filter.kind;
    const matchesFocus = filter.focus === "all" || version.focus === filter.focus;
    const haystack = normalizeText(
      [version.title, version.artist, version.tags, version.body, version.notes].join(" ")
    );
    const matchesSearch = !search || haystack.includes(search);

    return matchesStatus && matchesKind && matchesFocus && matchesSearch;
  });
}

export function sortLyricsVersions(
  versions: LyricsVersionEntry[],
  sortMode: LyricsVersionSortMode
): LyricsVersionEntry[] {
  const sorted = [...versions];

  if (sortMode === "oldest") {
    return sorted.sort((first, second) => first.updatedAt.localeCompare(second.updatedAt));
  }

  if (sortMode === "title-a-z") {
    return sorted.sort((first, second) => first.title.localeCompare(second.title));
  }

  if (sortMode === "title-z-a") {
    return sorted.sort((first, second) => second.title.localeCompare(first.title));
  }

  if (sortMode === "status") {
    return sorted.sort((first, second) => first.status.localeCompare(second.status));
  }

  if (sortMode === "kind") {
    return sorted.sort((first, second) => first.kind.localeCompare(second.kind));
  }

  if (sortMode === "priority") {
    return sorted.sort(
      (first, second) =>
        getLyricsVersionPriorityScore(second.priority) -
        getLyricsVersionPriorityScore(first.priority)
    );
  }

  return sorted.sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
}

export function buildLyricsVersionPanelSections(
  model: LyricsVersionWorkspaceModel
): LyricsVersionPanelSection[] {
  return LYRICS_VERSION_PANEL_SECTIONS.map((section) => {
    if (section.id === "version-overview") {
      return { ...section, count: model.stats.totalVersions };
    }

    if (section.id === "rewrite-lane") {
      return { ...section, count: model.stats.rewrites };
    }

    if (section.id === "comparison-lane") {
      return { ...section, count: model.comparisons.length };
    }

    if (section.id === "keeper-lane") {
      return { ...section, count: model.stats.keepers };
    }

    return section;
  });
}

export function getLyricsVersionStatusLabel(status: LyricsVersionStatus): string {
  if (status === "active") return "Active";
  if (status === "review") return "Review";
  if (status === "keeper") return "Keeper";
  if (status === "rejected") return "Rejected";
  if (status === "archived") return "Archived";
  return "Draft";
}

export function getLyricsVersionKindLabel(kind: LyricsVersionKind): string {
  if (kind === "verse-pass") return "Verse Pass";
  if (kind === "chorus-pass") return "Chorus Pass";
  if (kind === "bridge-pass") return "Bridge Pass";
  if (kind === "hook-pass") return "Hook Pass";
  if (kind === "keeper-pass") return "Keeper Pass";
  if (kind === "suno-prompt-pass") return "Suno Prompt Pass";
  if (kind === "performance-pass") return "Performance Pass";
  if (kind === "archive-pass") return "Archive Pass";
  if (kind === "rewrite") return "Rewrite";
  return "Original";
}
