"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import LyricsLibraryEditor from "./LyricsLibraryEditor";
import LyricsLibraryHero from "./LyricsLibraryHero";
import LyricsLibraryImportStatusPanel from "./LyricsLibraryImportStatusPanel";
import LyricsLibrarySearchPanel from "./LyricsLibrarySearchPanel";
import { downloadLyricTextFile, saveLyricsToFolder } from "./lyricsFileActions";
import { importLyricFilesFromFileList } from "./lyricsImportHelpers";
import { EMPTY_IMPORT_REPORT } from "./lyricsImportTypes";
import { STARTER_LYRICS } from "./lyricsSeed";
import { getStartingLyrics, saveLyricsToBrowser } from "./lyricsStorage";
import type { LyricEntry } from "./lyricsTypes";
import { findLyricEntryById } from "./lyricsViewerHelpers";

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
    () => findLyricEntryById(entries, selectedViewerEntryId),
    [entries, selectedViewerEntryId]
  );

  function clearForm() {
    setTitle("");
    setArtist("");
    setTags("");
    setBody("");
    setEditingEntryId(null);
  }

  function handleViewEntry(entry: LyricEntry) {
    setSelectedViewerEntryId(entry.id);
    setSaveStatus(`Viewing ${entry.title}`);
  }

  function handleSaveEntry() {
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
      clearForm();
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
    clearForm();
  }

  function handleEditEntry(entry: LyricEntry) {
    setEditingEntryId(entry.id);
    setSelectedViewerEntryId(entry.id);
    setTitle(entry.title);
    setArtist(entry.artist);
    setTags(entry.tags);
    setBody(entry.body);
    setSaveStatus(`Editing ${entry.title}`);
  }

  function handleDuplicateEntry(entry: LyricEntry) {
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

  function handleDeleteEntry(entryId: string) {
    setEntries((current) => current.filter((entry) => entry.id !== entryId));

    if (editingEntryId === entryId) {
      clearForm();
    }

    if (selectedViewerEntryId === entryId) {
      setSelectedViewerEntryId(null);
    }

    setSaveStatus("Lyric entry deleted and saved");
  }

  function handleResetStarter() {
    setEntries(STARTER_LYRICS);
    setSearchValue("");
    setSelectedViewerEntryId(null);
    clearForm();
    setImportReport(EMPTY_IMPORT_REPORT);
    setSaveStatus("Lyrics reset to starter entry");
  }

  async function handleSaveShownToFolder() {
    try {
      setFolderStatus("Opening folder picker...");
      await saveLyricsToFolder(filteredEntries);
      setFolderStatus(`Saved ${filteredEntries.length} lyric text file(s).`);
    } catch {
      setFolderStatus("Folder save was canceled or blocked.");
    }
  }

  async function importLyricFiles(files: FileList | null, sourceLabel: string) {
    if (!files || files.length === 0) {
      setImportReport({
        ...EMPTY_IMPORT_REPORT,
        status: `${sourceLabel} canceled or found 0 files`,
      });
      return;
    }

    try {
      const result = await importLyricFilesFromFileList({
        files,
        onProgress: setImportReport,
      });

      setEntries((current) => [...result.entries, ...current]);
      setSelectedViewerEntryId(result.entries[0]?.id || null);
      setSearchValue("");
      setSaveStatus(
        `Imported ${result.entries.length} readable lyric file(s). Skipped ${result.skippedFiles} file(s).`
      );
      setImportReport(result.report);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (folderInputRef.current) {
        folderInputRef.current.value = "";
      }
    } catch {
      setSaveStatus("Import failed");
      setImportReport({
        ...EMPTY_IMPORT_REPORT,
        status: "FAILED",
      });
    }
  }

  function handleImportFiles(files: FileList | null) {
    void importLyricFiles(files, "File import");
  }

  function handleImportFolder(files: FileList | null) {
    void importLyricFiles(files, "Folder import");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <LyricsLibraryHero entryCount={entries.length} saveStatus={saveStatus} />

        <LyricsLibraryImportStatusPanel importReport={importReport} />

        {selectedViewerEntry ? (
          <section className="rounded-2xl border border-white/15 bg-black p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/55">
                  Viewing Lyrics
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  {selectedViewerEntry.title}
                </h2>

                <p className="mt-1 text-sm text-white/70">
                  {selectedViewerEntry.artist || "Unknown artist"}
                </p>

                <p className="mt-2 text-xs text-white/55">
                  Tags: {selectedViewerEntry.tags || "None"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleEditEntry(selectedViewerEntry)}
                  className="rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => downloadLyricTextFile(selectedViewerEntry)}
                  className="rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                >
                  Download TXT
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedViewerEntryId(null)}
                  className="rounded-lg border border-white/35 bg-black px-3 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                >
                  Close Viewer
                </button>
              </div>
            </div>

            <pre className="mt-5 min-h-[320px] whitespace-pre-wrap rounded-xl border border-white/10 bg-black p-5 text-base leading-7 text-white">
              {selectedViewerEntry.body}
            </pre>
          </section>
        ) : null}

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