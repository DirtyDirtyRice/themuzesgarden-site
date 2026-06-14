"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import MultiStemsLibraryEditor from "./MultiStemsLibraryEditor";
import MultiStemsLibraryHero from "./MultiStemsLibraryHero";
import MultiStemsLibrarySearchPanel from "./MultiStemsLibrarySearchPanel";
import {
  downloadMultiStemTextFile,
  getMultiStemTitleFromImportedFileName,
  readMultiStemTextFile,
  saveMultiStemsToFolder,
} from "./multiStemsFileActions";
import { STARTER_MULTI_STEMS } from "./multiStemsSeed";
import {
  getStartingMultiStems,
  saveMultiStemsToBrowser,
} from "./multiStemsStorage";
import type { MultiStemEntry } from "./multiStemsTypes";

export default function MultiStemsLibraryClient() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [entries, setEntries] = useState<MultiStemEntry[]>(
    getStartingMultiStems
  );
  const [searchValue, setSearchValue] = useState("");
  const [title, setTitle] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [bpm, setBpm] = useState("");
  const [songKey, setSongKey] = useState("");
  const [stemTypes, setStemTypes] = useState("");
  const [sourceFolder, setSourceFolder] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [trackLink, setTrackLink] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [metadataLink, setMetadataLink] = useState("");
  const [folderStatus, setFolderStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("Saved in this browser");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const saved = saveMultiStemsToBrowser(entries);
    setSaveStatus(saved ? "Saved in this browser" : "Browser save blocked");
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    if (!search) return entries;

    return entries.filter((entry) => {
      const haystack = [
        entry.title,
        entry.songTitle,
        entry.bpm,
        entry.songKey,
        entry.stemTypes,
        entry.sourceFolder,
        entry.notes,
        entry.tags,
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
    setSongTitle("");
    setBpm("");
    setSongKey("");
    setStemTypes("");
    setSourceFolder("");
    setNotes("");
    setTags("");
    setTrackLink("");
    setProjectLink("");
    setMetadataLink("");
    setEditingEntryId(null);
  }

  function handleSaveEntry() {
    const cleanTitle = title.trim();
    const cleanStemTypes = stemTypes.trim();

    if (!cleanTitle || !cleanStemTypes) {
      setSaveStatus("Stem set title and stem types are required");
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
                bpm: bpm.trim(),
                songKey: songKey.trim(),
                stemTypes: cleanStemTypes,
                sourceFolder: sourceFolder.trim(),
                notes: notes.trim(),
                tags: tags.trim(),
                trackLink: trackLink.trim(),
                projectLink: projectLink.trim(),
                metadataLink: metadataLink.trim(),
                updatedAt: now,
              }
            : entry
        )
      );
      setSaveStatus("Stem set updated and saved");
      clearForm();
      return;
    }

    const newEntry: MultiStemEntry = {
      id: `multi-stem-${Date.now()}`,
      title: cleanTitle,
      songTitle: songTitle.trim(),
      bpm: bpm.trim(),
      songKey: songKey.trim(),
      stemTypes: cleanStemTypes,
      sourceFolder: sourceFolder.trim(),
      notes: notes.trim(),
      tags: tags.trim(),
      trackLink: trackLink.trim(),
      projectLink: projectLink.trim(),
      metadataLink: metadataLink.trim(),
      createdAt: now,
      updatedAt: now,
    };

    setEntries((current) => [newEntry, ...current]);
    setSaveStatus("Stem set added and saved");
    clearForm();
  }

  function handleEditEntry(entry: MultiStemEntry) {
    setEditingEntryId(entry.id);
    setTitle(entry.title);
    setSongTitle(entry.songTitle);
    setBpm(entry.bpm);
    setSongKey(entry.songKey);
    setStemTypes(entry.stemTypes);
    setSourceFolder(entry.sourceFolder);
    setNotes(entry.notes);
    setTags(entry.tags);
    setTrackLink(entry.trackLink);
    setProjectLink(entry.projectLink);
    setMetadataLink(entry.metadataLink);
    setSaveStatus(`Editing ${entry.title}`);
  }

  function handleDuplicateEntry(entry: MultiStemEntry) {
    const now = new Date().toLocaleString();

    const duplicatedEntry: MultiStemEntry = {
      ...entry,
      id: `multi-stem-${Date.now()}`,
      title: `${entry.title} Copy`,
      createdAt: now,
      updatedAt: now,
    };

    setEntries((current) => [duplicatedEntry, ...current]);
    setSaveStatus("Stem set duplicated and saved");
  }

  function handleDeleteEntry(entryId: string) {
    setEntries((current) => current.filter((entry) => entry.id !== entryId));

    if (editingEntryId === entryId) {
      clearForm();
    }

    setSaveStatus("Stem set deleted and saved");
  }

  function handleResetStarter() {
    setEntries(STARTER_MULTI_STEMS);
    setSearchValue("");
    clearForm();
    setSaveStatus("Multi-stems reset to starter entry");
  }

  async function handleSaveShownToFolder() {
    try {
      setFolderStatus("Opening folder picker...");
      await saveMultiStemsToFolder(filteredEntries);
      setFolderStatus(`Saved ${filteredEntries.length} stem text file(s).`);
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
          const fileText = await readMultiStemTextFile(file);

          return {
            id: `multi-stem-import-${Date.now()}-${file.name}`,
            title: getMultiStemTitleFromImportedFileName(file.name),
            songTitle: "",
            bpm: "",
            songKey: "",
            stemTypes: "imported txt",
            sourceFolder: file.name,
            notes: fileText.trim() || "Empty imported stem file.",
            tags: "imported, txt, stems",
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
        <MultiStemsLibraryHero
          entryCount={entries.length}
          saveStatus={saveStatus}
        />

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <MultiStemsLibraryEditor
            editingEntryId={editingEntryId}
            title={title}
            songTitle={songTitle}
            bpm={bpm}
            songKey={songKey}
            stemTypes={stemTypes}
            sourceFolder={sourceFolder}
            notes={notes}
            tags={tags}
            trackLink={trackLink}
            projectLink={projectLink}
            metadataLink={metadataLink}
            fileInputRef={fileInputRef}
            onTitleChange={setTitle}
            onSongTitleChange={setSongTitle}
            onBpmChange={setBpm}
            onSongKeyChange={setSongKey}
            onStemTypesChange={setStemTypes}
            onSourceFolderChange={setSourceFolder}
            onNotesChange={setNotes}
            onTagsChange={setTags}
            onTrackLinkChange={setTrackLink}
            onProjectLinkChange={setProjectLink}
            onMetadataLinkChange={setMetadataLink}
            onSaveEntry={handleSaveEntry}
            onClearForm={clearForm}
            onResetStarter={handleResetStarter}
            onImportFiles={handleImportFiles}
          />

          <MultiStemsLibrarySearchPanel
            filteredEntries={filteredEntries}
            searchValue={searchValue}
            folderStatus={folderStatus}
            onSearchChange={setSearchValue}
            onSaveShownToFolder={handleSaveShownToFolder}
            onEditEntry={handleEditEntry}
            onDownloadEntry={downloadMultiStemTextFile}
            onDuplicateEntry={handleDuplicateEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </section>
      </div>
    </main>
  );
}