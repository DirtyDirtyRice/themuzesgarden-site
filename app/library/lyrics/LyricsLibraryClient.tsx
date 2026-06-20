"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import LyricsLibraryEditor from "./LyricsLibraryEditor";
import LyricsLibraryImportStatusPanel from "./LyricsLibraryImportStatusPanel";
import LyricsLibraryInsightsPanel from "./LyricsLibraryInsightsPanel";
import LyricsLibrarySearchPanel from "./LyricsLibrarySearchPanel";
import LyricsLibraryStatsPanel from "./LyricsLibraryStatsPanel";
import {
  deleteLyricEntry,
  duplicateLyricEntry,
  editLyricEntry,
  resetLyricsForm,
  saveLyricEntry,
} from "./lyricsCrudHelpers";
import { downloadLyricTextFile } from "./lyricsFileActions";
import {
  importLyricsFromInput,
  saveShownLyricsToFolder,
} from "./lyricsImportController";
import { EMPTY_IMPORT_REPORT } from "./lyricsImportTypes";
import { buildLyricsLibraryInsights } from "./lyricsLibraryInsightsHelpers";
import { buildLyricsLibraryStats } from "./lyricsLibraryStatsHelpers";
import { STARTER_LYRICS } from "./lyricsSeed";
import { getStartingLyrics, saveLyricsToBrowser } from "./lyricsStorage";
import type { LyricEntry } from "./lyricsTypes";

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

function getTitleMatchScore(trackTitle: string, lyricTitle: string): number {
  const track = normalizeTitle(trackTitle);
  const lyric = normalizeTitle(lyricTitle);

  if (!track || !lyric) return 0;
  if (track === lyric) return 100;
  if (track.includes(lyric) || lyric.includes(track)) return 80;

  const trackWords = track.split(/\s+/).filter(Boolean);
  const lyricWords = lyric.split(/\s+/).filter(Boolean);

  if (trackWords.length === 0 || lyricWords.length === 0) return 0;

  const sharedWords = trackWords.filter((word) => lyricWords.includes(word));

  return Math.round((sharedWords.length / trackWords.length) * 60);
}

export default function LyricsLibraryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openedFromTrackId = searchParams.get("trackId");
  const openedFromTrackTitle = searchParams.get("trackTitle") || "";

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
  const [showMoreLyricInfo, setShowMoreLyricInfo] = useState(false);

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

  const exactTrackTitleMatch = useMemo(() => {
    const trackTitle = normalizeTitle(openedFromTrackTitle);

    if (!trackTitle) return null;

    return (
      entries.find((entry) => normalizeTitle(entry.title) === trackTitle) || null
    );
  }, [entries, openedFromTrackTitle]);

  const possibleTrackTitleMatches = useMemo(() => {
    if (!openedFromTrackTitle || exactTrackTitleMatch) return [];

    return entries
      .map((entry) => ({
        entry,
        score: getTitleMatchScore(openedFromTrackTitle, entry.title),
      }))
      .filter((item) => item.score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, 6);
  }, [entries, exactTrackTitleMatch, openedFromTrackTitle]);

  const filteredEntries = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    if (!search) return entries;

    return entries.filter((entry) =>
      entry.title.toLowerCase().includes(search)
    );
  }, [entries, searchValue]);

  const lyricsStats = useMemo(
    () => buildLyricsLibraryStats(entries, filteredEntries),
    [entries, filteredEntries]
  );

  const lyricsInsights = useMemo(
    () => buildLyricsLibraryInsights(entries, lyricsStats),
    [entries, lyricsStats]
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
    setSaveStatus(`Opening ${entry.title}`);
    router.push(`/library/lyric-view?lyricId=${encodeURIComponent(entry.id)}`);
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

  function handleRenameLyricToTrackTitle(entry: LyricEntry) {
    setEditingEntryId(entry.id);
    setSelectedViewerEntryId(entry.id);
    setTitle(openedFromTrackTitle);
    setArtist(entry.artist);
    setTags(entry.tags);
    setBody(entry.body);
    setSaveStatus("Review title change, then save lyric");
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
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="rounded-2xl border border-white/15 bg-black p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/55">
                Library Lyrics
              </p>

              <h1 className="mt-1 text-2xl font-bold text-white">
                Lyrics Library
              </h1>

              <p className="mt-1 text-sm text-white/65">
                {entries.length} total lyrics · {filteredEntries.length} matched
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMoreLyricInfo((current) => !current)}
              className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
            >
              {showMoreLyricInfo ? "Hide Lyric Info" : "More Lyric Info"}
            </button>
          </div>

          {showMoreLyricInfo ? (
            <div className="mt-5 flex flex-col gap-5">
              <LyricsLibraryStatsPanel stats={lyricsStats} />
              <LyricsLibraryInsightsPanel insights={lyricsInsights} />
              <LyricsLibraryImportStatusPanel importReport={importReport} />
            </div>
          ) : null}
        </section>

        {openedFromTrackId ? (
          <section className="rounded-2xl border border-white/15 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-white/55">
              Opened From Library Track
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              {openedFromTrackTitle || "Track title not provided"}
            </h2>

            <p className="mt-2 text-sm text-white/65">
              Track ID: {openedFromTrackId}
            </p>

            {exactTrackTitleMatch ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black p-4">
                <p className="text-sm font-semibold text-white">
                  Exact lyric title match found.
                </p>

                <p className="mt-1 text-sm text-white/65">
                  {exactTrackTitleMatch.title}
                </p>

                <button
                  type="button"
                  onClick={() => handleViewEntry(exactTrackTitleMatch)}
                  className="mt-3 rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                >
                  Open Lyrics
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/10 bg-black p-4">
                <p className="text-sm font-semibold text-white">
                  No exact lyric title match found.
                </p>

                <p className="mt-1 text-sm text-white/65">
                  Search for close lyric titles below.
                </p>

                {possibleTrackTitleMatches.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-3">
                    {possibleTrackTitleMatches.map((item) => (
                      <div
                        key={item.entry.id}
                        className="rounded-lg border border-white/10 bg-black p-3"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {item.entry.title}
                            </p>

                            <p className="mt-1 text-xs text-white/55">
                              Match score: {item.score}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewEntry(item.entry)}
                              className="rounded-lg border border-white bg-black px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                            >
                              Open Lyrics
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleRenameLyricToTrackTitle(item.entry)
                              }
                              className="rounded-lg border border-white/35 bg-black px-3 py-2 text-xs font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                            >
                              Rename To Track Title
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/60">
                    No close lyric title matches found.
                  </p>
                )}
              </div>
            )}
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
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
            totalEntries={entries.length}
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