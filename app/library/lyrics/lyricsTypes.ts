export type LyricEntryStatus =
  | "draft"
  | "working"
  | "keeper"
  | "finished"
  | "archived";

export type LyricEntrySource =
  | "manual"
  | "file-import"
  | "folder-import"
  | "starter"
  | "unknown";

export type LyricEntryReadiness =
  | "ready"
  | "needs-review"
  | "missing-title"
  | "missing-lyrics"
  | "archived";

export type LyricEntry = {
  id: string;
  title: string;
  artist: string;
  tags: string;
  body: string;
  createdAt: string;
  updatedAt: string;

  status?: LyricEntryStatus;
  source?: LyricEntrySource;
  readiness?: LyricEntryReadiness;
  notes?: string;
  lastViewedAt?: string;
};

export type LyricsLibraryStats = {
  totalEntries: number;
  shownEntries: number;
  draftCount: number;
  workingCount: number;
  keeperCount: number;
  finishedCount: number;
  archivedCount: number;
  needsReviewCount: number;
};

export type LyricsLibrarySearchMode =
  | "all"
  | "title"
  | "artist"
  | "tags"
  | "body";

export type LyricsLibrarySortMode =
  | "newest-updated"
  | "oldest-updated"
  | "newest-created"
  | "oldest-created"
  | "title-a-z"
  | "title-z-a";

export type LyricsLibraryViewMode = "cards" | "compact" | "viewer-first";

export type LyricsLibraryWorkspaceState = {
  searchValue: string;
  searchMode: LyricsLibrarySearchMode;
  sortMode: LyricsLibrarySortMode;
  viewMode: LyricsLibraryViewMode;
};

export type LyricsLibraryActionStatus = {
  label: string;
  detail: string;
  updatedAt: string;
};

export type LyricsLibraryValidationResult = {
  isValid: boolean;
  readiness: LyricEntryReadiness;
  messages: string[];
};

export type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };