import type { RefObject } from "react";

type MiscellaneousLibraryEditorProps = {
  editingEntryId: string | null;
  title: string;
  category: string;
  relatedSong: string;
  body: string;
  notes: string;
  tags: string;
  lyricLink: string;
  storyLink: string;
  trackLink: string;
  projectLink: string;
  metadataLink: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onRelatedSongChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onLyricLinkChange: (value: string) => void;
  onStoryLinkChange: (value: string) => void;
  onTrackLinkChange: (value: string) => void;
  onProjectLinkChange: (value: string) => void;
  onMetadataLinkChange: (value: string) => void;
  onSaveEntry: () => void;
  onClearForm: () => void;
  onResetStarter: () => void;
  onImportFiles: (files: FileList | null) => void;
};

export default function MiscellaneousLibraryEditor({
  editingEntryId,
  title,
  category,
  relatedSong,
  body,
  notes,
  tags,
  lyricLink,
  storyLink,
  trackLink,
  projectLink,
  metadataLink,
  fileInputRef,
  onTitleChange,
  onCategoryChange,
  onRelatedSongChange,
  onBodyChange,
  onNotesChange,
  onTagsChange,
  onLyricLinkChange,
  onStoryLinkChange,
  onTrackLinkChange,
  onProjectLinkChange,
  onMetadataLinkChange,
  onSaveEntry,
  onClearForm,
  onResetStarter,
  onImportFiles,
}: MiscellaneousLibraryEditorProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {editingEntryId ? "Edit Misc Entry" : "Add Misc Entry"}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {editingEntryId
              ? "Update the selected miscellaneous note."
              : "Save anything that does not fit the other Library sections."}
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
        Title
      </label>
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: Suno Prompt Idea"
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Category
      </label>
      <input
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: prompt, note, idea, file note, production"
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Related Song
      </label>
      <input
        value={relatedSong}
        onChange={(event) => onRelatedSongChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: 14 Days"
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Main Text
      </label>
      <textarea
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        className="mt-2 min-h-[220px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="Write or paste miscellaneous text here..."
      />

      <label className="mt-4 block text-sm font-semibold text-white">
        Notes
      </label>
      <textarea
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        className="mt-2 min-h-[130px] w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm leading-6 text-white outline-none"
        placeholder="Extra notes..."
      />

      <label className="mt-4 block text-sm font-semibold text-white">Tags</label>
      <input
        value={tags}
        onChange={(event) => onTagsChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Example: suno, prompt, keeper, idea"
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
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
            Future Story Link
          </label>
          <input
            value={storyLink}
            onChange={(event) => onStoryLinkChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
            placeholder="/library/stories"
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
          {editingEntryId ? "Save Changes" : "Add Misc Entry"}
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