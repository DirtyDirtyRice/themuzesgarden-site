import type { Dispatch, SetStateAction } from "react";

import type { LyricEntry } from "./lyricsTypes";

type SetString = Dispatch<SetStateAction<string>>;
type SetNullableString = Dispatch<SetStateAction<string | null>>;
type SetEntries = Dispatch<SetStateAction<LyricEntry[]>>;

export type LyricsFormResetActions = {
  setTitle: SetString;
  setArtist: SetString;
  setTags: SetString;
  setBody: SetString;
  setEditingEntryId: SetNullableString;
};

export type SaveLyricEntryActions = LyricsFormResetActions & {
  title: string;
  artist: string;
  tags: string;
  body: string;
  editingEntryId: string | null;
  setEntries: SetEntries;
  setSelectedViewerEntryId: SetNullableString;
  setSaveStatus: SetString;
};

export type EditLyricEntryActions = LyricsFormResetActions & {
  entry: LyricEntry;
  setSelectedViewerEntryId: SetNullableString;
  setSaveStatus: SetString;
};

export type DuplicateLyricEntryActions = {
  entry: LyricEntry;
  setEntries: SetEntries;
  setSelectedViewerEntryId: SetNullableString;
  setSaveStatus: SetString;
};

export type DeleteLyricEntryActions = {
  entryId: string;
  editingEntryId: string | null;
  selectedViewerEntryId: string | null;
  setEntries: SetEntries;
  setSelectedViewerEntryId: SetNullableString;
  setSaveStatus: SetString;
  resetForm: () => void;
};

export function resetLyricsForm({
  setTitle,
  setArtist,
  setTags,
  setBody,
  setEditingEntryId,
}: LyricsFormResetActions) {
  setTitle("");
  setArtist("");
  setTags("");
  setBody("");
  setEditingEntryId(null);
}

export function saveLyricEntry({
  title,
  artist,
  tags,
  body,
  editingEntryId,
  setEntries,
  setSelectedViewerEntryId,
  setSaveStatus,
  setTitle,
  setArtist,
  setTags,
  setBody,
  setEditingEntryId,
}: SaveLyricEntryActions) {
  const cleanTitle = title.trim();
  const cleanBody = body.trim();

  if (!cleanTitle || !cleanBody) {
    setSaveStatus("Title and lyrics are required");
    return;
  }

  const now = new Date().toLocaleString();

  if (editingEntryId) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === editingEntryId
          ? {
              ...entry,
              title: cleanTitle,
              artist: artist.trim() || "Unknown artist",
              tags: tags.trim(),
              body: cleanBody,
              updatedAt: now,
            }
          : entry
      )
    );

    setSelectedViewerEntryId(editingEntryId);
    setSaveStatus("Lyric entry updated and saved");

    resetLyricsForm({
      setTitle,
      setArtist,
      setTags,
      setBody,
      setEditingEntryId,
    });

    return;
  }

  const newEntry: LyricEntry = {
    id: `lyric-${Date.now()}`,
    title: cleanTitle,
    artist: artist.trim() || "Unknown artist",
    tags: tags.trim(),
    body: cleanBody,
    createdAt: now,
    updatedAt: now,
  };

  setEntries((current) => [newEntry, ...current]);
  setSelectedViewerEntryId(newEntry.id);
  setSaveStatus("Lyric entry added and saved");

  resetLyricsForm({
    setTitle,
    setArtist,
    setTags,
    setBody,
    setEditingEntryId,
  });
}

export function editLyricEntry({
  entry,
  setEditingEntryId,
  setSelectedViewerEntryId,
  setTitle,
  setArtist,
  setTags,
  setBody,
  setSaveStatus,
}: EditLyricEntryActions) {
  setEditingEntryId(entry.id);
  setSelectedViewerEntryId(entry.id);
  setTitle(entry.title);
  setArtist(entry.artist);
  setTags(entry.tags);
  setBody(entry.body);
  setSaveStatus(`Editing ${entry.title}`);
}

export function duplicateLyricEntry({
  entry,
  setEntries,
  setSelectedViewerEntryId,
  setSaveStatus,
}: DuplicateLyricEntryActions) {
  const now = new Date().toLocaleString();

  const duplicatedEntry: LyricEntry = {
    ...entry,
    id: `lyric-${Date.now()}`,
    title: `${entry.title} Copy`,
    createdAt: now,
    updatedAt: now,
  };

  setEntries((current) => [duplicatedEntry, ...current]);
  setSelectedViewerEntryId(duplicatedEntry.id);
  setSaveStatus("Lyric entry duplicated and saved");
}

export function deleteLyricEntry({
  entryId,
  editingEntryId,
  selectedViewerEntryId,
  setEntries,
  setSelectedViewerEntryId,
  setSaveStatus,
  resetForm,
}: DeleteLyricEntryActions) {
  setEntries((current) => current.filter((entry) => entry.id !== entryId));

  if (editingEntryId === entryId) {
    resetForm();
  }

  if (selectedViewerEntryId === entryId) {
    setSelectedViewerEntryId(null);
  }

  setSaveStatus("Lyric entry deleted and saved");
}