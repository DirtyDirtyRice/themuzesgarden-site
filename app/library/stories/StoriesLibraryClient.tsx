"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import StoriesLibraryEditor from "./StoriesLibraryEditor";
import StoriesLibraryHero from "./StoriesLibraryHero";
import StoriesLibrarySearchPanel from "./StoriesLibrarySearchPanel";
import {
  downloadStoryTextFile,
  getStoryTitleFromImportedFileName,
  readStoryTextFile,
  saveStoriesToFolder,
} from "./storiesFileActions";
import { STARTER_STORIES } from "./storiesSeed";
import { getStartingStories, saveStoriesToBrowser } from "./storiesStorage";
import type { StoryEntry } from "./storiesTypes";

export default function StoriesLibraryClient() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [entries, setEntries] = useState<StoryEntry[]>(getStartingStories);
  const [searchValue, setSearchValue] = useState("");
  const [title, setTitle] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [lyricLink, setLyricLink] = useState("");
  const [trackLink, setTrackLink] = useState("");
  const [metadataLink, setMetadataLink] = useState("");
  const [folderStatus, setFolderStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("Saved in this browser");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const saved = saveStoriesToBrowser(entries);
    setSaveStatus(saved ? "Saved in this browser" : "Browser save blocked");
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    if (!search) return entries;

    return entries.filter((entry) => {
      const haystack = [
        entry.title,
        entry.songTitle,
        entry.inspiration,
        entry.body,
        entry.notes,
        entry.tags,
        entry.lyricLink,
        entry.trackLink,
        entry.metadataLink,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [entries, searchValue]);

  function clearForm() {
    setTitle("");
    setSongTitle("");
    setInspiration("");
    setBody("");
    setNotes("");
    setTags("");
    setLyricLink("");
    setTrackLink("");
    setMetadataLink("");
    setEditingEntryId(null);
  }

  function handleSaveEntry() {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle || !cleanBody) {
      setSaveStatus("Story title and story body are required");
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
                songTitle: songTitle.trim(),
                inspiration: inspiration.trim(),
                body: cleanBody,
                notes: notes.trim(),
                tags: tags.trim(),
                lyricLink: lyricLink.trim(),
                trackLink: trackLink.trim(),
                metadataLink: metadataLink.trim(),
                updatedAt: now,
              }
            : entry
        )
      );
      setSaveStatus("Story updated and saved");
      clearForm();
      return;
    }

    const newEntry: StoryEntry = {
      id: `story-${Date.now()}`,
      title: cleanTitle,
      songTitle: songTitle.trim(),
      inspiration: inspiration.trim(),
      body: cleanBody,
      notes: notes.trim(),
      tags: tags.trim(),
      lyricLink: lyricLink.trim(),
      trackLink: trackLink.trim(),
      metadataLink: metadataLink.trim(),
      createdAt: now,
      updatedAt: now,
    };

    setEntries((current) => [newEntry, ...current]);
    setSaveStatus("Story added and saved");
    clearForm();
  }

  function handleEditEntry(entry: StoryEntry) {
    setEditingEntryId(entry.id);
    setTitle(entry.title);
    setSongTitle(entry.songTitle);
    setInspiration(entry.inspiration);
    setBody(entry.body);
    setNotes(entry.notes);
    setTags(entry.tags);
    setLyricLink(entry.lyricLink);
    setTrackLink(entry.trackLink);
    setMetadataLink(entry.metadataLink);
    setSaveStatus(`Editing ${entry.title}`);
  }

  function handleDuplicateEntry(entry: StoryEntry) {
    const now = new Date().toLocaleString();

    const duplicatedEntry: StoryEntry = {
      ...entry,
      id: `story-${Date.now()}`,
      title: `${entry.title} Copy`,
      createdAt: now,
      updatedAt: now,
    };

    setEntries((current) => [duplicatedEntry, ...current]);
    setSaveStatus("Story duplicated and saved");
  }

  function handleDeleteEntry(entryId: string) {
    setEntries((current) => current.filter((entry) => entry.id !== entryId));

    if (editingEntryId === entryId) {
      clearForm();
    }

    setSaveStatus("Story deleted and saved");
  }

  function handleResetStarter() {
    setEntries(STARTER_STORIES);
    setSearchValue("");
    clearForm();
    setSaveStatus("Stories reset to starter entry");
  }

  async function handleSaveShownToFolder() {
    try {
      setFolderStatus("Opening folder picker...");
      await saveStoriesToFolder(filteredEntries);
      setFolderStatus(`Saved ${filteredEntries.length} story text file(s).`);
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
          const fileText = await readStoryTextFile(file);

          return {
            id: `story-import-${Date.now()}-${file.name}`,
            title: getStoryTitleFromImportedFileName(file.name),
            songTitle: "",
            inspiration: "Imported TXT story file.",
            body: fileText.trim() || "Empty imported story file.",
            notes: "",
            tags: "imported, txt",
            lyricLink: "",
            trackLink: "",
            metadataLink: "",
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
        <StoriesLibraryHero
          entryCount={entries.length}
          saveStatus={saveStatus}
        />

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <StoriesLibraryEditor
            editingEntryId={editingEntryId}
            title={title}
            songTitle={songTitle}
            inspiration={inspiration}
            body={body}
            notes={notes}
            tags={tags}
            lyricLink={lyricLink}
            trackLink={trackLink}
            metadataLink={metadataLink}
            fileInputRef={fileInputRef}
            onTitleChange={setTitle}
            onSongTitleChange={setSongTitle}
            onInspirationChange={setInspiration}
            onBodyChange={setBody}
            onNotesChange={setNotes}
            onTagsChange={setTags}
            onLyricLinkChange={setLyricLink}
            onTrackLinkChange={setTrackLink}
            onMetadataLinkChange={setMetadataLink}
            onSaveEntry={handleSaveEntry}
            onClearForm={clearForm}
            onResetStarter={handleResetStarter}
            onImportFiles={handleImportFiles}
          />

          <StoriesLibrarySearchPanel
            filteredEntries={filteredEntries}
            searchValue={searchValue}
            folderStatus={folderStatus}
            onSearchChange={setSearchValue}
            onSaveShownToFolder={handleSaveShownToFolder}
            onEditEntry={handleEditEntry}
            onDownloadEntry={downloadStoryTextFile}
            onDuplicateEntry={handleDuplicateEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </section>
      </div>
    </main>
  );
}