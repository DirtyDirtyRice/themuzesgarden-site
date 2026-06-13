"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import LyricsLibraryEditor from "./LyricsLibraryEditor";
import LyricsLibraryHero from "./LyricsLibraryHero";
import LyricsLibrarySearchPanel from "./LyricsLibrarySearchPanel";
import {
  downloadLyricTextFile,
  getTitleFromImportedFileName,
  readTextFile,
  saveLyricsToFolder,
} from "./lyricsFileActions";
import { STARTER_LYRICS } from "./lyricsSeed";
import { getStartingLyrics, saveLyricsToBrowser } from "./lyricsStorage";
import type { LyricEntry } from "./lyricsTypes";

export default function LyricsLibraryClient() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [entries, setEntries] = useState<LyricEntry[]>(getStartingLyrics);
  const [searchValue, setSearchValue] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [folderStatus, setFolderStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("Saved in this browser");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const saved = saveLyricsToBrowser(entries);
    setSaveStatus(saved ? "Saved in this browser" : "Browser save blocked");
  }, [entries]);

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
                artist: artist.trim(),
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
      artist: artist.trim(),
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

  async function handleImportFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    try {
      const importedEntries = await Promise.all(
        Array.from(files).map(async (file) => {
          const now = new Date().toLocaleString();
          const fileText = await readTextFile(file);

          return {
            id: `lyric-import-${Date.now()}-${file.name}`,
            title: getTitleFromImportedFileName(file.name),
            artist: "",
            tags: "imported, txt",
            body: fileText.trim() || "Empty imported lyric file.",
            createdAt: now,
            updatedAt: now,
          };
        })
      );

      setEntries((current) => [...importedEntries, ...current]);
      setSaveStatus(`Imported ${importedEntries.length} text file(s).`);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setSaveStatus("Import failed");
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <LyricsLibraryHero entryCount={entries.length} saveStatus={saveStatus} />

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <LyricsLibraryEditor
            editingEntryId={editingEntryId}
            title={title}
            artist={artist}
            tags={tags}
            body={body}
            fileInputRef={fileInputRef}
            onTitleChange={setTitle}
            onArtistChange={setArtist}
            onTagsChange={setTags}
            onBodyChange={setBody}
            onSaveEntry={handleSaveEntry}
            onClearForm={clearForm}
            onResetStarter={handleResetStarter}
            onImportFiles={handleImportFiles}
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