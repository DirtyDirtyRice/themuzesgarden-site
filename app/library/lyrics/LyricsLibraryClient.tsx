"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import LyricsLibraryEditor from "./LyricsLibraryEditor";
import LyricsLibraryHero from "./LyricsLibraryHero";
import LyricsLibrarySearchPanel from "./LyricsLibrarySearchPanel";
import {
  downloadLyricTextFile,
  getFileExtension,
  getTitleFromImportedFileName,
  isBlockedLyricFile,
  isFutureLyricFile,
  isReadableLyricFile,
  readLyricImportFile,
  saveLyricsToFolder,
} from "./lyricsFileActions";
import { STARTER_LYRICS } from "./lyricsSeed";
import { getStartingLyrics, saveLyricsToBrowser } from "./lyricsStorage";
import type { LyricEntry } from "./lyricsTypes";

type LyricImportReport = {
  status: string;
  selectedFiles: number;
  readableFiles: number;
  txtFiles: number;
  docxFiles: number;
  pdfFiles: number;
  futureFiles: number;
  blockedFiles: number;
  skippedFiles: number;
  importedFiles: number;
  failedFiles: number;
  skippedExtensions: string;
};

const EMPTY_IMPORT_REPORT: LyricImportReport = {
  status: "No import running",
  selectedFiles: 0,
  readableFiles: 0,
  txtFiles: 0,
  docxFiles: 0,
  pdfFiles: 0,
  futureFiles: 0,
  blockedFiles: 0,
  skippedFiles: 0,
  importedFiles: 0,
  failedFiles: 0,
  skippedExtensions: "None",
};

function summarizeExtensions(files: File[]): string {
  const counts = new Map<string, number>();

  files.forEach((file) => {
    const extension = getFileExtension(file.name) || "no extension";
    counts.set(extension, (counts.get(extension) || 0) + 1);
  });

  if (counts.size === 0) return "None";

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([extension, count]) => `${extension}: ${count}`)
    .join(" · ");
}

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
  const [importReport, setImportReport] =
    useState<LyricImportReport>(EMPTY_IMPORT_REPORT);

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

  function clearForm() {
    setTitle("");
    setArtist("");
    setTags("");
    setBody("");
    setEditingEntryId(null);
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
    setSaveStatus("Lyric entry added and saved");
    clearForm();
  }

  function handleEditEntry(entry: LyricEntry) {
    setEditingEntryId(entry.id);
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
    setSaveStatus("Lyric entry duplicated and saved");
  }

  function handleDeleteEntry(entryId: string) {
    setEntries((current) => current.filter((entry) => entry.id !== entryId));

    if (editingEntryId === entryId) {
      clearForm();
    }

    setSaveStatus("Lyric entry deleted and saved");
  }

  function handleResetStarter() {
    setEntries(STARTER_LYRICS);
    setSearchValue("");
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

    const allFiles = Array.from(files);
    const readableFiles = allFiles.filter((file) =>
      isReadableLyricFile(file.name)
    );
    const txtFiles = allFiles.filter((file) =>
      [".txt", ".text", ".md", ".markdown"].includes(
        getFileExtension(file.name)
      )
    );
    const docxFiles = allFiles.filter(
      (file) => getFileExtension(file.name) === ".docx"
    );
    const pdfFiles = allFiles.filter(
      (file) => getFileExtension(file.name) === ".pdf"
    );
    const futureFiles = allFiles.filter((file) =>
      isFutureLyricFile(file.name)
    );
    const blockedFiles = allFiles.filter((file) =>
      isBlockedLyricFile(file.name)
    );
    const skippedFiles = allFiles.filter(
      (file) => !isReadableLyricFile(file.name)
    );

    setImportReport({
      status: "READING - - - -",
      selectedFiles: allFiles.length,
      readableFiles: readableFiles.length,
      txtFiles: txtFiles.length,
      docxFiles: docxFiles.length,
      pdfFiles: pdfFiles.length,
      futureFiles: futureFiles.length,
      blockedFiles: blockedFiles.length,
      skippedFiles: skippedFiles.length,
      importedFiles: 0,
      failedFiles: 0,
      skippedExtensions: summarizeExtensions(skippedFiles),
    });

    if (readableFiles.length === 0) {
      setSaveStatus(`${sourceLabel} found 0 readable lyric files`);
      setImportReport({
        status: "Done: no readable lyric files found",
        selectedFiles: allFiles.length,
        readableFiles: 0,
        txtFiles: txtFiles.length,
        docxFiles: docxFiles.length,
        pdfFiles: pdfFiles.length,
        futureFiles: futureFiles.length,
        blockedFiles: blockedFiles.length,
        skippedFiles: skippedFiles.length,
        importedFiles: 0,
        failedFiles: 0,
        skippedExtensions: summarizeExtensions(skippedFiles),
      });
      return;
    }

    try {
      const importStartedAt = Date.now();
      const importedEntries: LyricEntry[] = [];
      let failedFiles = 0;

      for (let index = 0; index < readableFiles.length; index += 1) {
        const file = readableFiles[index];

        try {
          const now = new Date().toLocaleString();
          const fileText = await readLyricImportFile(file);

          importedEntries.push({
            id: `lyric-import-${importStartedAt}-${index}-${file.name}`,
            title: getTitleFromImportedFileName(file.name),
            artist: "Unknown artist",
            tags: `imported, ${getFileExtension(file.name).replace(".", "")}`,
            body: fileText.trim() || "Empty imported lyric file.",
            createdAt: now,
            updatedAt: now,
          });
        } catch {
          failedFiles += 1;
        }

        setImportReport({
          status: `READING - - - - ${index + 1} / ${readableFiles.length}`,
          selectedFiles: allFiles.length,
          readableFiles: readableFiles.length,
          txtFiles: txtFiles.length,
          docxFiles: docxFiles.length,
          pdfFiles: pdfFiles.length,
          futureFiles: futureFiles.length,
          blockedFiles: blockedFiles.length,
          skippedFiles: skippedFiles.length,
          importedFiles: importedEntries.length,
          failedFiles,
          skippedExtensions: summarizeExtensions(skippedFiles),
        });
      }

      setImportReport({
        status: "SAVING - - - -",
        selectedFiles: allFiles.length,
        readableFiles: readableFiles.length,
        txtFiles: txtFiles.length,
        docxFiles: docxFiles.length,
        pdfFiles: pdfFiles.length,
        futureFiles: futureFiles.length,
        blockedFiles: blockedFiles.length,
        skippedFiles: skippedFiles.length,
        importedFiles: importedEntries.length,
        failedFiles,
        skippedExtensions: summarizeExtensions(skippedFiles),
      });

      setEntries((current) => [...importedEntries, ...current]);
      setSearchValue("");
      setSaveStatus(
        `Imported ${importedEntries.length} readable lyric file(s). Skipped ${skippedFiles.length} file(s).`
      );

      setImportReport({
        status: "DONE",
        selectedFiles: allFiles.length,
        readableFiles: readableFiles.length,
        txtFiles: txtFiles.length,
        docxFiles: docxFiles.length,
        pdfFiles: pdfFiles.length,
        futureFiles: futureFiles.length,
        blockedFiles: blockedFiles.length,
        skippedFiles: skippedFiles.length,
        importedFiles: importedEntries.length,
        failedFiles,
        skippedExtensions: summarizeExtensions(skippedFiles),
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (folderInputRef.current) {
        folderInputRef.current.value = "";
      }
    } catch {
      setSaveStatus("Import failed");
      setImportReport({
        status: "FAILED",
        selectedFiles: allFiles.length,
        readableFiles: readableFiles.length,
        txtFiles: txtFiles.length,
        docxFiles: docxFiles.length,
        pdfFiles: pdfFiles.length,
        futureFiles: futureFiles.length,
        blockedFiles: blockedFiles.length,
        skippedFiles: skippedFiles.length,
        importedFiles: 0,
        failedFiles: readableFiles.length,
        skippedExtensions: summarizeExtensions(skippedFiles),
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

        <section className="rounded-2xl border border-white/15 bg-black p-5">
          <h2 className="text-xl font-semibold text-white">
            Lyrics Import Status
          </h2>
          <p className="mt-2 text-sm text-white/70">{importReport.status}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Selected
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {importReport.selectedFiles}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Readable
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {importReport.readableFiles}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                TXT/MD
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {importReport.txtFiles}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                DOCX
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {importReport.docxFiles}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                PDF Later
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {importReport.pdfFiles}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Future Later
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {importReport.futureFiles}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Imported
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {importReport.importedFiles}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Failed
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {importReport.failedFiles}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">
              Skipped Extensions
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {importReport.skippedExtensions}
            </p>
          </div>
        </section>

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