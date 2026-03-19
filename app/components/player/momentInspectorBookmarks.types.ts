export type MomentInspectorBookmarkSnapshot = {
  selectedTrackId: string;
  selectedPhraseFamilyId: string;
  selectedVerdict: "all" | "stable" | "watch" | "repair" | "blocked";
  pinnedFamilyIds: string[];
  pinnedOnly: boolean;
  comparePrimaryFamilyId: string;
  compareSecondaryFamilyId: string;
};

export type MomentInspectorBookmarkRecord = {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  snapshot: MomentInspectorBookmarkSnapshot;
};

export type MomentInspectorBookmarksState = {
  bookmarks: MomentInspectorBookmarkRecord[];
};

export type MomentInspectorBookmarkOption = {
  id: string;
  label: string;
  subtitle: string;
};

export type MomentInspectorCreateBookmarkInput = {
  label: string;
  snapshot: MomentInspectorBookmarkSnapshot;
};

export type MomentInspectorBookmarksStoragePayload = {
  bookmarks: MomentInspectorBookmarkRecord[];
};