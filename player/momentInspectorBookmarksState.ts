import type {
  MomentInspectorBookmarkRecord,
  MomentInspectorBookmarksState,
  MomentInspectorCreateBookmarkInput,
} from "./momentInspectorBookmarks.types";
import {
  buildBookmarkOptions,
  createBookmarkRecord,
  updateBookmarkRecord,
} from "./momentInspectorBookmarks.utils";

export function createMomentInspectorBookmarksState(
  bookmarks?: MomentInspectorBookmarkRecord[]
): MomentInspectorBookmarksState {
  return {
    bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
  };
}

export function addMomentInspectorBookmark(
  state: MomentInspectorBookmarksState,
  input: MomentInspectorCreateBookmarkInput
): MomentInspectorBookmarksState {
  const bookmark = createBookmarkRecord(input);

  return {
    ...state,
    bookmarks: [bookmark, ...state.bookmarks],
  };
}

export function removeMomentInspectorBookmark(
  state: MomentInspectorBookmarksState,
  bookmarkId: string
): MomentInspectorBookmarksState {
  return {
    ...state,
    bookmarks: state.bookmarks.filter((bookmark) => bookmark.id !== bookmarkId),
  };
}

export function replaceMomentInspectorBookmark(
  state: MomentInspectorBookmarksState,
  bookmarkId: string,
  input: Partial<Pick<MomentInspectorBookmarkRecord, "label" | "snapshot">>
): MomentInspectorBookmarksState {
  return {
    ...state,
    bookmarks: state.bookmarks.map((bookmark) =>
      bookmark.id === bookmarkId ? updateBookmarkRecord(bookmark, input) : bookmark
    ),
  };
}

export function getMomentInspectorBookmarkById(
  state: MomentInspectorBookmarksState,
  bookmarkId: string
): MomentInspectorBookmarkRecord | null {
  return state.bookmarks.find((bookmark) => bookmark.id === bookmarkId) ?? null;
}

export function buildMomentInspectorBookmarkOptions(
  state: MomentInspectorBookmarksState
) {
  return buildBookmarkOptions(state.bookmarks);
}