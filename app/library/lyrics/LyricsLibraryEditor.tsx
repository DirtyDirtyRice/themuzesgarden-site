import type { InputHTMLAttributes, RefObject } from "react";

type FolderInputProps = InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory?: string;
  directory?: string;
};

type LyricsLibraryEditorProps = {
  editingEntryId: string | null;
  title: string;
  artist: string;
  tags: string;
  body: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  folderInputRef: RefObject<HTMLInputElement | null>;
  onTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSaveEntry: () => void;
  onClearForm: () => void;
  onResetStarter: () => void;
  onImportFiles: (files: FileList | null) => void;
  onImportFolder: (files: FileList | null) => void;
};

const folderInputProps: FolderInputProps = {
  webkitdirectory: "",
  directory: "",
};

export default function LyricsLibraryEditor({
  editingEntryId,
  title,
  artist,
  tags,
  body,
  fileInputRef,
  folderInputRef,
  onTitleChange,
  onArtistChange,
  onTagsChange,
  onBodyChange,
  onSaveEntry,
  onClearForm,
  onResetStarter,
  onImportFiles,
  onImportFolder,
}: LyricsLibraryEditorProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {editingEntryId ? "Edit Lyrics" : "Add Lyrics"}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {editingEntryId
              ? "Update the selected lyric entry."
              : "Paste lyrics, import TXT files, or import a TXT folder."}
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
        Song Title
      </label>
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: 14 Days"
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Artist
      </label>
      <input
        value={artist}
        onChange={(event) => onArtistChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: The Muzes Garden"
      />

      <label className="mt-4 block text-sm font-semibold text-white">Tags</label>
      <input
        value={tags}
        onChange={(event) => onTagsChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: rock, funk, keeper, suno"
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Lyrics
      </label>
      <textarea
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        className="mt-2 min-h-[260px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="Paste or type lyrics here..."
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveEntry}
          className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
        >
          {editingEntryId ? "Save Changes" : "Add Lyrics Entry"}
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
          Import TXT Files
        </button>

        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          className="rounded-lg border border-white/35 bg-black px-4 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
        >
          Import TXT Folder
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

      <input
        ref={folderInputRef}
        type="file"
        accept=".txt,text/plain"
        multiple
        className="hidden"
        onChange={(event) => onImportFolder(event.target.files)}
        {...folderInputProps}
      />

      <p className="mt-3 text-xs leading-5 text-white/55">
        Use Import TXT Folder to bring in a folder of TXT lyric files. Each TXT
        file becomes its own searchable lyric entry. Choose Folder + Save Shown
        TXT is export only.
      </p>
    </div>
  );
}