import type { RefObject } from "react";

type MultiStemsLibraryEditorProps = {
  editingEntryId: string | null;
  title: string;
  songTitle: string;
  bpm: string;
  songKey: string;
  stemTypes: string;
  sourceFolder: string;
  notes: string;
  tags: string;
  trackLink: string;
  projectLink: string;
  metadataLink: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onTitleChange: (value: string) => void;
  onSongTitleChange: (value: string) => void;
  onBpmChange: (value: string) => void;
  onSongKeyChange: (value: string) => void;
  onStemTypesChange: (value: string) => void;
  onSourceFolderChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onTrackLinkChange: (value: string) => void;
  onProjectLinkChange: (value: string) => void;
  onMetadataLinkChange: (value: string) => void;
  onSaveEntry: () => void;
  onClearForm: () => void;
  onResetStarter: () => void;
  onImportFiles: (files: FileList | null) => void;
};

export default function MultiStemsLibraryEditor({
  editingEntryId,
  title,
  songTitle,
  bpm,
  songKey,
  stemTypes,
  sourceFolder,
  notes,
  tags,
  trackLink,
  projectLink,
  metadataLink,
  fileInputRef,
  onTitleChange,
  onSongTitleChange,
  onBpmChange,
  onSongKeyChange,
  onStemTypesChange,
  onSourceFolderChange,
  onNotesChange,
  onTagsChange,
  onTrackLinkChange,
  onProjectLinkChange,
  onMetadataLinkChange,
  onSaveEntry,
  onClearForm,
  onResetStarter,
  onImportFiles,
}: MultiStemsLibraryEditorProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {editingEntryId ? "Edit Stem Set" : "Add Stem Set"}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {editingEntryId
              ? "Update the selected stem group."
              : "Track stems, BPM, key, folders, and notes."}
          </p>
        </div>

        {editingEntryId ? (
          <button
            type="button"
            onClick={onClearForm}
            className="rounded-lg border border-white/35 bg-black px-3 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            Cancel Edit
          </button>
        ) : null}
      </div>

      <label className="mt-5 block text-sm font-semibold text-white">
        Stem Set Title
      </label>
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: 14 Days Stem Set"
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Song Title
      </label>
      <input
        value={songTitle}
        onChange={(event) => onSongTitleChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: 14 Days"
      />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-white">BPM</label>
          <input
            value={bpm}
            onChange={(event) => onBpmChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
            placeholder="Example: 120"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white">Key</label>
          <input
            value={songKey}
            onChange={(event) => onSongKeyChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
            placeholder="Example: C#m"
          />
        </div>
      </div>

      <label className="mt-4 block text-sm font-semibold text-white">
        Stem Types
      </label>
      <textarea
        value={stemTypes}
        onChange={(event) => onStemTypesChange(event.target.value)}
        className="mt-2 min-h-[90px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="Example: vocal, drums, bass, guitar, keys, instrumental"
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Source Folder / File Notes
      </label>
      <textarea
        value={sourceFolder}
        onChange={(event) => onSourceFolderChange(event.target.value)}
        className="mt-2 min-h-[100px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="Paste folder notes, filenames, or where these stems live..."
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Notes
      </label>
      <textarea
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        className="mt-2 min-h-[140px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="Stem quality, keeper notes, mix notes, render notes..."
      />

      <label className="mt-4 block text-sm font-semibold text-white">Tags</label>
      <input
        value={tags}
        onChange={(event) => onTagsChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: stems, vocal, instrumental, keeper, suno"
      />

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold text-white">
            Future Track Link
          </label>
          <input
            value={trackLink}
            onChange={(event) => onTrackLinkChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
            placeholder="/library"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white">
            Future Project Link
          </label>
          <input
            value={projectLink}
            onChange={(event) => onProjectLinkChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
            placeholder="/workspace/projects"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white">
            Future Metadata Link
          </label>
          <input
            value={metadataLink}
            onChange={(event) => onMetadataLinkChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
            placeholder="/metadata/library"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveEntry}
          className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
        >
          {editingEntryId ? "Save Changes" : "Add Stem Set"}
        </button>

        <button
          type="button"
          onClick={onClearForm}
          className="rounded-lg border border-white/35 bg-black px-4 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
        >
          Clear Form
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-white/35 bg-black px-4 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
        >
          Import TXT
        </button>

        <button
          type="button"
          onClick={onResetStarter}
          className="rounded-lg border border-white/35 bg-black px-4 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
        >
          Reset Starter
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        multiple
        className="hidden"
        onChange={(event) => onImportFiles(event.target.files)}
      />
    </div>
  );
}