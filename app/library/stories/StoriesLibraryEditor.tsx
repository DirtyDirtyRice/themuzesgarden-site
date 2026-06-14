import type { RefObject } from "react";

type StoriesLibraryEditorProps = {
  editingEntryId: string | null;
  title: string;
  songTitle: string;
  inspiration: string;
  body: string;
  notes: string;
  tags: string;
  lyricLink: string;
  trackLink: string;
  metadataLink: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onTitleChange: (value: string) => void;
  onSongTitleChange: (value: string) => void;
  onInspirationChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onLyricLinkChange: (value: string) => void;
  onTrackLinkChange: (value: string) => void;
  onMetadataLinkChange: (value: string) => void;
  onSaveEntry: () => void;
  onClearForm: () => void;
  onResetStarter: () => void;
  onImportFiles: (files: FileList | null) => void;
};

export default function StoriesLibraryEditor({
  editingEntryId,
  title,
  songTitle,
  inspiration,
  body,
  notes,
  tags,
  lyricLink,
  trackLink,
  metadataLink,
  fileInputRef,
  onTitleChange,
  onSongTitleChange,
  onInspirationChange,
  onBodyChange,
  onNotesChange,
  onTagsChange,
  onLyricLinkChange,
  onTrackLinkChange,
  onMetadataLinkChange,
  onSaveEntry,
  onClearForm,
  onResetStarter,
  onImportFiles,
}: StoriesLibraryEditorProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {editingEntryId ? "Edit Story" : "Add Story"}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {editingEntryId
              ? "Update the selected story."
              : "Write the story behind the song."}
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
        Story Title
      </label>
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: 14 Days Origin Story"
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

      <label className="mt-4 block text-sm font-semibold text-white">
        Inspiration
      </label>
      <textarea
        value={inspiration}
        onChange={(event) => onInspirationChange(event.target.value)}
        className="mt-2 min-h-[90px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="What sparked this song?"
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Story
      </label>
      <textarea
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        className="mt-2 min-h-[220px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="Write the story here..."
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Notes
      </label>
      <textarea
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        className="mt-2 min-h-[120px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="Suno version notes, production notes, recording notes..."
      />

      <label className="mt-4 block text-sm font-semibold text-white">Tags</label>
      <input
        value={tags}
        onChange={(event) => onTagsChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: suno, keeper, origin, rock, funk"
      />

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold text-white">
            Future Lyric Link
          </label>
          <input
            value={lyricLink}
            onChange={(event) => onLyricLinkChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
            placeholder="/library/lyrics"
          />
        </div>

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
          {editingEntryId ? "Save Changes" : "Add Story Entry"}
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