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
  saveStatus: string;
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

const LYRIC_FILE_ACCEPT =
  ".txt,.text,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf";

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
  saveStatus,
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
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {editingEntryId ? "Edit Lyrics" : "Add Lyrics"}
          </h2>

          <p className="mt-1 text-sm text-white/60">
            {editingEntryId
              ? "Update the selected lyric entry."
              : "Paste lyrics, import lyric files, or import a lyric folder."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSaveEntry}
            className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            {editingEntryId ? "Replace Saved Lyrics" : "Add Lyrics Entry"}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            Import Lyric Files
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            Import Lyric Folder
          </button>

          <button
            type="button"
            onClick={onClearForm}
            className="rounded-lg border border-white/35 bg-black px-4 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            {editingEntryId ? "Cancel Edit" : "Clear Form"}
          </button>

          <button
            type="button"
            onClick={onResetStarter}
            className="rounded-lg border border-white/35 bg-black px-4 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            Reset Starter
          </button>
        </div>

        <p className="text-xs leading-5 text-white/55">
          Import supports TXT, MD, and PDF lyric files. DOC and DOCX can be
          tracked, but real text extraction is not wired yet.
        </p>
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

      <label className="mt-4 block text-sm font-semibold text-white">
        Tags
      </label>
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
        className="mt-2 min-h-[220px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="Paste or type lyrics here..."
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSaveEntry}
          className="rounded-lg border border-emerald-200 bg-emerald-200 px-4 py-2 text-sm font-black text-black"
        >
          {editingEntryId ? "Replace Saved Lyrics" : "Save New Lyrics"}
        </button>
        <span className="text-sm text-white/65">{saveStatus}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={LYRIC_FILE_ACCEPT}
        multiple
        className="hidden"
        onChange={(event) => onImportFiles(event.target.files)}
      />

      <input
        ref={folderInputRef}
        type="file"
        accept={LYRIC_FILE_ACCEPT}
        multiple
        className="hidden"
        onChange={(event) => onImportFolder(event.target.files)}
        {...folderInputProps}
      />
    </div>
  );
}
