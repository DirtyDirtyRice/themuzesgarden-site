import type { LyricEntry } from "./lyricsTypes";

export type LyricsVersionKind =
  | "original"
  | "rewrite"
  | "verse-pass"
  | "chorus-pass"
  | "bridge-pass"
  | "hook-pass"
  | "keeper-pass"
  | "suno-prompt-pass"
  | "performance-pass"
  | "archive-pass";

export type LyricsVersionStatus =
  | "draft"
  | "active"
  | "review"
  | "keeper"
  | "rejected"
  | "archived";

export type LyricsVersionSource =
  | "manual"
  | "duplicate"
  | "rewrite-session"
  | "imported"
  | "file-import"
  | "folder-import"
  | "starter"
  | "unknown";

export type LyricsVersionPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type LyricsVersionSectionFocus =
  | "full-song"
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "bridge"
  | "hook"
  | "outro"
  | "notes";

export type LyricsVersionChangeType =
  | "wording"
  | "structure"
  | "melody-fit"
  | "suno-fit"
  | "title"
  | "artist"
  | "tagging"
  | "cleanup"
  | "unknown";

export type LyricsVersionReadiness =
  | "ready"
  | "needs-review"
  | "missing-lyrics"
  | "missing-parent"
  | "needs-comparison"
  | "archived";

export type LyricsVersionComparisonVerdict =
  | "stronger"
  | "weaker"
  | "different"
  | "same"
  | "needs-listen"
  | "not-compared";

export type LyricsVersionLineChange = {
  id: string;
  lineNumber: number;
  before: string;
  after: string;
  changeType: LyricsVersionChangeType;
  note: string;
};

export type LyricsVersionSectionScore = {
  section: LyricsVersionSectionFocus;
  score: number;
  reason: string;
};

export type LyricsVersionEntry = {
  id: string;
  lyricEntryId: string;
  parentVersionId: string | null;
  title: string;
  artist: string;
  tags: string;
  body: string;
  kind: LyricsVersionKind;
  status: LyricsVersionStatus;
  source: LyricsVersionSource;
  priority: LyricsVersionPriority;
  focus: LyricsVersionSectionFocus;
  readiness: LyricsVersionReadiness;
  createdAt: string;
  updatedAt: string;
  notes: string;
  changeSummary: string;
  lineChanges: LyricsVersionLineChange[];
  sectionScores: LyricsVersionSectionScore[];
};

export type LyricsVersionCandidate = {
  lyric: LyricEntry;
  versions: LyricsVersionEntry[];
  activeVersion: LyricsVersionEntry | null;
  keeperVersion: LyricsVersionEntry | null;
  needsReviewCount: number;
};

export type LyricsVersionComparison = {
  id: string;
  lyricEntryId: string;
  leftVersionId: string;
  rightVersionId: string;
  verdict: LyricsVersionComparisonVerdict;
  changedLineCount: number;
  unchangedLineCount: number;
  addedLineCount: number;
  removedLineCount: number;
  summary: string;
  warnings: string[];
};

export type LyricsVersionStats = {
  totalLyrics: number;
  totalVersions: number;
  originals: number;
  rewrites: number;
  keepers: number;
  reviewCount: number;
  archivedCount: number;
  missingParentCount: number;
  averageVersionsPerLyric: number;
};

export type LyricsVersionWorkspaceModel = {
  candidates: LyricsVersionCandidate[];
  comparisons: LyricsVersionComparison[];
  stats: LyricsVersionStats;
  activeCandidate: LyricsVersionCandidate | null;
  summary: string;
  warnings: string[];
};

export type LyricsVersionCreateInput = {
  lyric: LyricEntry;
  kind: LyricsVersionKind;
  status?: LyricsVersionStatus;
  source?: LyricsVersionSource;
  priority?: LyricsVersionPriority;
  focus?: LyricsVersionSectionFocus;
  notes?: string;
  changeSummary?: string;
};

export type LyricsVersionUpdateInput = {
  id: string;
  title?: string;
  artist?: string;
  tags?: string;
  body?: string;
  kind?: LyricsVersionKind;
  status?: LyricsVersionStatus;
  source?: LyricsVersionSource;
  priority?: LyricsVersionPriority;
  focus?: LyricsVersionSectionFocus;
  notes?: string;
  changeSummary?: string;
};

export type LyricsVersionFilter = {
  searchValue: string;
  status: LyricsVersionStatus | "all";
  kind: LyricsVersionKind | "all";
  focus: LyricsVersionSectionFocus | "all";
};

export type LyricsVersionSortMode =
  | "newest"
  | "oldest"
  | "title-a-z"
  | "title-z-a"
  | "status"
  | "kind"
  | "priority";

export type LyricsVersionPanelSection = {
  id: string;
  title: string;
  detail: string;
  count: number;
};

export type LyricsVersionAction = {
  id: string;
  label: string;
  detail: string;
  actionType:
    | "create-original"
    | "create-rewrite"
    | "mark-keeper"
    | "compare"
    | "archive"
    | "review";
};