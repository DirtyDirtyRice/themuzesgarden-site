"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import MiscellaneousLibraryEditor from "./MiscellaneousLibraryEditor";
import MiscellaneousLibraryHero from "./MiscellaneousLibraryHero";
import MiscellaneousLibrarySearchPanel from "./MiscellaneousLibrarySearchPanel";
import {
  downloadMiscellaneousTextFile,
  getMiscellaneousTitleFromImportedFileName,
  readMiscellaneousTextFile,
  saveMiscellaneousToFolder,
} from "./miscellaneousFileActions";
import { STARTER_MISCELLANEOUS } from "./miscellaneousSeed";
import {
  getStartingMiscellaneous,
  saveMiscellaneousToBrowser,
} from "./miscellaneousStorage";
import type { MiscellaneousEntry } from "./miscellaneousTypes";

export default function MiscellaneousLibraryClient() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [entries, setEntries] = useState<MiscellaneousEntry[]>(
    getStartingMiscellaneous
  );
  const [searchValue, setSearchValue] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [relatedSong, setRelatedSong] = useState("");
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [lyricLink, setLyricLink] = useState("");
  const [storyLink, setStoryLink] = useState("");
  const [trackLink, setTrackLink] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [metadataLink, setMetadataLink] = useState("");
  const [folderStatus, setFolderStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("Saved in this browser");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const saved = saveMiscellaneousToBrowser(entries);
    setSaveStatus(saved ? "Saved in this browser" : "Browser save blocked");
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    if (!search) return entries;

    return entries.filter((entry) => {
      const haystack = [
        entry.title,
        entry.category,
        entry.relatedSong,
        entry.body,
        entry.notes,
        entry.tags,
        entry.lyricLink,
        entry.storyLink,
        entry.trackLink,
        entry.projectLink,
        entry.metadataLink,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [entries, searchValue]);

  function clearForm() {
    setTitle("");
    setCategory("");
    setRelatedSong("");
    setBody("");
    setNotes("");
    setTags("");
    setLyricLink("");
    setStoryLink("");
    setTrackLink("");
    setProjectLink("");
    setMetadataLink("");
    setEditingEntryId(null);
  }

  function handleSaveEntry() {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle || !cleanBody) {
      setSaveStatus("Title and main text are required");
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
                category: category.trim(),
                relatedSong: relatedSong.trim(),
                body: cleanBody,
                notes: notes.trim(),
                tags: tags.trim(),
                lyricLink: lyricLink.trim(),
                storyLink: storyLink.trim(),
                trackLink: trackLink.trim(),
                projectLink: projectLink.trim(),
                metadataLink: metadataLink.trim(),
                updatedAt: now,
              }
            : entry
        )
      );
      setSaveStatus("Miscellaneous entry updated and saved");
      clearForm();
      return;
    }

    const newEntry: MiscellaneousEntry = {
      id: `miscellaneous-${Date.now()}`,
      title: cleanTitle,
      category: category.trim(),
      relatedSong: relatedSong.trim(),
      body: cleanBody,
      notes: notes.trim(),
      tags: tags.trim(),
      lyricLink: lyricLink.trim(),
      storyLink: storyLink.trim(),
      trackLink: trackLink.trim(),
      projectLink: projectLink.trim(),
      metadataLink: metadataLink.trim(),
      createdAt: now,
      updatedAt: now,
    };

    setEntries((current) => [newEntry, ...current]);
    setSaveStatus("Miscellaneous entry added and saved");
    clearForm();
  }

  function handleEditEntry(entry: MiscellaneousEntry) {
    setEditingEntryId(entry.id);
    setTitle(entry.title);
    setCategory(entry.category);
    setRelatedSong(entry.relatedSong);
    setBody(entry.body);
    setNotes(entry.notes);
    setTags(entry.tags);
    setLyricLink(entry.lyricLink);
    setStoryLink(entry.storyLink);
    setTrackLink(entry.trackLink);
    setProjectLink(entry.projectLink);
    setMetadataLink(entry.metadataLink);
    setSaveStatus(`Editing ${entry.title}`);
  }

  function handleDuplicateEntry(entry: MiscellaneousEntry) {
    const now = new Date().toLocaleString();

    const duplicatedEntry: MiscellaneousEntry = {
      ...entry,
      id: `miscellaneous-${Date.now()}`,
      title: `${entry.title} Copy`,
      createdAt: now,
      updatedAt: now,
    };

    setEntries((current) => [duplicatedEntry, ...current]);
    setSaveStatus("Miscellaneous entry duplicated and saved");
  }

  function handleDeleteEntry(entryId: string) {
    setEntries((current) => current.filter((entry) => entry.id !== entryId));

    if (editingEntryId === entryId) {
      clearForm();
    }

    setSaveStatus("Miscellaneous entry deleted and saved");
  }

  function handleResetStarter() {
    setEntries(STARTER_MISCELLANEOUS);
    setSearchValue("");
    clearForm();
    setSaveStatus("Miscellaneous reset to starter entry");
  }

  async function handleSaveShownToFolder() {
    try {
      setFolderStatus("Opening folder picker...");
      await saveMiscellaneousToFolder(filteredEntries);
      setFolderStatus(
        `Saved ${filteredEntries.length} miscellaneous text file(s).`
      );
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
          const fileText = await readMiscellaneousTextFile(file);

          return {
            id: `miscellaneous-import-${Date.now()}-${file.name}`,
            title: getMiscellaneousTitleFromImportedFileName(file.name),
            category: "imported txt",
            relatedSong: "",
            body: fileText.trim() || "Empty imported miscellaneous file.",
            notes: "",
            tags: "imported, txt, miscellaneous",
            lyricLink: "",
            storyLink: "",
            trackLink: "",
            projectLink: "",
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
        <MiscellaneousLibraryHero
          entryCount={entries.length}
          saveStatus={saveStatus}
        />

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <MiscellaneousLibraryEditor
            editingEntryId={editingEntryId}
            title={title}
            category={category}
            relatedSong={relatedSong}
            body={body}
            notes={notes}
            tags={tags}
            lyricLink={lyricLink}
            storyLink={storyLink}
            trackLink={trackLink}
            projectLink={projectLink}
            metadataLink={metadataLink}
            fileInputRef={fileInputRef}
            onTitleChange={setTitle}
            onCategoryChange={setCategory}
            onRelatedSongChange={setRelatedSong}
            onBodyChange={setBody}
            onNotesChange={setNotes}
            onTagsChange={setTags}
            onLyricLinkChange={setLyricLink}
            onStoryLinkChange={setStoryLink}
            onTrackLinkChange={setTrackLink}
            onProjectLinkChange={setProjectLink}
            onMetadataLinkChange={setMetadataLink}
            onSaveEntry={handleSaveEntry}
            onClearForm={clearForm}
            onResetStarter={handleResetStarter}
            onImportFiles={handleImportFiles}
          />

          <MiscellaneousLibrarySearchPanel
            filteredEntries={filteredEntries}
            searchValue={searchValue}
            folderStatus={folderStatus}
            onSearchChange={setSearchValue}
            onSaveShownToFolder={handleSaveShownToFolder}
            onEditEntry={handleEditEntry}
            onDownloadEntry={downloadMiscellaneousTextFile}
            onDuplicateEntry={handleDuplicateEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </section>
      </div>
    </main>
  );
}