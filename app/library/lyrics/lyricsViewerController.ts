import type { Dispatch, SetStateAction } from "react";

import type { LyricEntry } from "./lyricsTypes";
import { findLyricEntryById } from "./lyricsViewerHelpers";

type SetString = Dispatch<SetStateAction<string>>;
type SetNullableString = Dispatch<SetStateAction<string | null>>;

export type ViewLyricEntryActions = {
  entry: LyricEntry;
  setSelectedViewerEntryId: SetNullableString;
  setSaveStatus: SetString;
};

export type CloseLyricViewerActions = {
  setSelectedViewerEntryId: SetNullableString;
  setSaveStatus: SetString;
};

export function getSelectedLyricViewerEntry(
  entries: LyricEntry[],
  selectedViewerEntryId: string | null
) {
  return findLyricEntryById(entries, selectedViewerEntryId);
}

export function viewLyricEntry({
  entry,
  setSelectedViewerEntryId,
  setSaveStatus,
}: ViewLyricEntryActions) {
  setSelectedViewerEntryId(entry.id);
  setSaveStatus(`Viewing ${entry.title}`);
}

export function closeLyricViewer({
  setSelectedViewerEntryId,
  setSaveStatus,
}: CloseLyricViewerActions) {
  setSelectedViewerEntryId(null);
  setSaveStatus("Lyrics viewer closed");
}