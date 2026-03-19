import type {
  MomentInspectorBookmarkRecord,
  MomentInspectorBookmarksState,
  MomentInspectorBookmarksStoragePayload,
} from "./momentInspectorBookmarks.types";
import { createMomentInspectorBookmarksState } from "./momentInspectorBookmarksState";
import { normalizeBookmarkSnapshot, normalizeBookmarkLabel } from "./momentInspectorBookmarks.utils";

export const MOMENT_INSPECTOR_BOOKMARKS_STORAGE_KEY =
  "moment-inspector-bookmarks";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeBookmarkRecord(
  value: Partial<MomentInspectorBookmarkRecord> | null | undefined
): MomentInspectorBookmarkRecord | null {
  const id = String(value?.id ?? "").trim();
  if (!id) return null;

  const createdAt = String(value?.createdAt ?? "").trim() || new Date().toISOString();
  const updatedAt = String(value?.updatedAt ?? "").trim() || createdAt;

  return {
    id,
    label: normalizeBookmarkLabel(value?.label),
    createdAt,
    updatedAt,
    snapshot: normalizeBookmarkSnapshot(value?.snapshot),
  };
}

export function serializeMomentInspectorBookmarksState(
  state: MomentInspectorBookmarksState
): MomentInspectorBookmarksStoragePayload {
  return {
    bookmarks: state.bookmarks,
  };
}

export function saveMomentInspectorBookmarksState(
  state: MomentInspectorBookmarksState
): void {
  if (!canUseStorage()) return;

  try {
    const payload = serializeMomentInspectorBookmarksState(state);
    window.localStorage.setItem(
      MOMENT_INSPECTOR_BOOKMARKS_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // ignore storage failures
  }
}

export function loadMomentInspectorBookmarksState(): MomentInspectorBookmarksState {
  if (!canUseStorage()) {
    return createMomentInspectorBookmarksState([]);
  }

  try {
    const raw = window.localStorage.getItem(
      MOMENT_INSPECTOR_BOOKMARKS_STORAGE_KEY
    );

    if (!raw) {
      return createMomentInspectorBookmarksState([]);
    }

    const parsed = JSON.parse(raw) as Partial<MomentInspectorBookmarksStoragePayload>;
    const bookmarks = Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [];
    const normalized = bookmarks
      .map((bookmark) => normalizeBookmarkRecord(bookmark))
      .filter(Boolean) as MomentInspectorBookmarkRecord[];

    return createMomentInspectorBookmarksState(normalized);
  } catch {
    return createMomentInspectorBookmarksState([]);
  }
}