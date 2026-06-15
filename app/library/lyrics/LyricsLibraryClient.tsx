"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import LyricsLibraryEditor from "./LyricsLibraryEditor";
import LyricsLibraryHero from "./LyricsLibraryHero";
import LyricsLibraryImportStatusPanel from "./LyricsLibraryImportStatusPanel";
import LyricsLibrarySearchPanel from "./LyricsLibrarySearchPanel";
import LyricsLibraryViewerClient from "./LyricsLibraryViewerClient";
import { downloadLyricTextFile } from "./lyricsFileActions";
import {
  deleteLyricEntry,
  duplicateLyricEntry,
  editLyricEntry,
  resetLyricsForm,
  saveLyricEntry,
} from "./lyricsCrudHelpers";
import {
  importLyricsFromInput,
  saveShownLyricsToFolder,
} from "./lyricsImportController";
import { EMPTY_IMPORT_REPORT } from "./lyricsImportTypes";
import { STARTER_LYRICS } from "./lyricsSeed";
import { getStartingLyrics, saveLyricsToBrowser } from "./lyricsStorage";
import type { LyricEntry } from "./lyricsTypes";
import {
  closeLyricViewer,
  getSelectedLyricViewerEntry,
  viewLyricEntry,
} from "./lyricsViewerController";

export default function LyricsLibraryClient() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [entries, setEntries] = useState<LyricEntry[]>(STARTER_LYRICS);
  const [hasLoadedBrowserLyrics, setHasLoadedBrowserLyrics] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [folderStatus, setFolderStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("Loading browser lyrics...");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedViewerEntryId, setSelectedViewerEntryId] =
    useState<string | null>(null);
  const [importReport, setImportReport] = useState(EMPTY_IMPORT_REPORT);

  useEffect(() => {
    let isActive = true;

    async function loadBrowserLyrics() {
      const loadedLyrics = await getStartingLyrics();

      if (!isActive) return;

      setEntries(loadedLyrics);
      setHasLoadedBrowserLyrics(true);
      setSaveStatus("Saved in this browser");
    }

    void loadBrowserLyrics();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserLyrics) return;

    let isActive = true;

    async function saveBrowserLyrics() {
      const saved = await saveLyricsToBrowser(entries);

      if (!isActive) return;

      setSaveStatus(saved ? "Saved in this browser" : "Browser save blocked");
    }

    void saveBrowserLyrics();

    return () => {
      isActive = false;
    };
  }, [entries, hasLoadedBrowserLyrics]);

  const filteredEntries = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    if (!search) return entries;

    return entries.filter((entry) => {
      const haystack = [entry.title, entry.artist, entry.tags, entry.body]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [entries, searchValue]);

  const selectedViewerEntry = useMemo(
    () => getSelectedLyricViewerEntry(entries, selectedViewerEntryId),
    [entries, selectedViewerEntryId]
  );

  function clearForm() {
    resetLyricsForm({
      setTitle,
      setArtist,
      setTags,
      setBody,
      setEditingEntryId,
    });
  }

  function handleViewEntry(entry: LyricEntry) {
    viewLyricEntry({
      entry,
      setSelectedViewerEntryId,
      setSaveStatus,
    });
  }

  function handleCloseViewer() {
    closeLyricViewer({
      setSelectedViewerEntryId,
      setSaveStatus,
    });
  }

  function handleSaveEntry() {
    saveLyricEntry({
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
    });
  }

  function handleEditEntry(entry: LyricEntry) {
    editLyricEntry({
      entry,
      setEditingEntryId,
      setSelectedViewerEntryId,
      setTitle,
      setArtist,
      setTags,
      setBody,
      setSaveStatus,
    });
  }

  function handleDuplicateEntry(entry: LyricEntry) {
    duplicateLyricEntry({
      entry,
      setEntries,
      setSelectedViewerEntryId,
      setSaveStatus,
    });
  }

  function handleDeleteEntry(entryId: string) {
    deleteLyricEntry({
      entryId,
      editingEntryId,
      selectedViewerEntryId,
      setEntries,
      setSelectedViewerEntryId,
      setSaveStatus,
      resetForm: clearForm,
    });
  }

  function handleResetStarter() {
    setEntries(STARTER_LYRICS);
    setSearchValue("");
    setSelectedViewerEntryId(null);
    clearForm();
    setImportReport(EMPTY_IMPORT_REPORT);
    setSaveStatus("Lyrics reset to starter entry");
  }

  function handleSaveShownToFolder() {
    void saveShownLyricsToFolder({
      filteredEntries,
      setFolderStatus,
    });
  }

  function handleImportFiles(files: FileList | null) {
    void importLyricsFromInput({
      files,
      sourceLabel: "File import",
      fileInputRef,
      folderInputRef,
      setEntries,
      setSelectedViewerEntryId,
      setSearchValue,
      setSaveStatus,
      setImportReport,
    });
  }

  function handleImportFolder(files: FileList | null) {
    void importLyricsFromInput({
      files,
      sourceLabel: "Folder import",
      fileInputRef,
      folderInputRef,
      setEntries,
      setSelectedViewerEntryId,
      setSearchValue,
      setSaveStatus,
      setImportReport,
    });
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <LyricsLibraryHero entryCount={entries.length} saveStatus={saveStatus} />

        <LyricsLibraryImportStatusPanel importReport={importReport} />

        <LyricsLibraryViewerClient
          entry={selectedViewerEntry}
          onEditEntry={handleEditEntry}
          onDownloadEntry={downloadLyricTextFile}
          onCloseViewer={handleCloseViewer}
        />

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <LyricsLibraryEditor
            editingEntryId={editingEntryId}
            title={title}
            artist={artist}
            tags={tags}
            body={body}
            fileInputRef={fileInputRef}
            folderInputRef={folderInputRef}
            onTitleChange={setTitle}
            onArtistChange={setArtist}
            onTagsChange={setTags}
            onBodyChange={setBody}
            onSaveEntry={handleSaveEntry}
            onClearForm={clearForm}
            onResetStarter={handleResetStarter}
            onImportFiles={handleImportFiles}
            onImportFolder={handleImportFolder}
          />

          <LyricsLibrarySearchPanel
            filteredEntries={filteredEntries}
            searchValue={searchValue}
            folderStatus={folderStatus}
            onSearchChange={setSearchValue}
            onSaveShownToFolder={handleSaveShownToFolder}
            onViewEntry={handleViewEntry}
            onEditEntry={handleEditEntry}
            onDownloadEntry={downloadLyricTextFile}
            onDuplicateEntry={handleDuplicateEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </section>
      </div>
    </main>
  );
}