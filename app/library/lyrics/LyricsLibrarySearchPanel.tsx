import LyricsLibraryEntryCard from "./LyricsLibraryEntryCard";
import type { LyricEntry } from "./lyricsTypes";

type LyricsLibrarySearchPanelProps = {
  filteredEntries: LyricEntry[];
  searchValue: string;
  folderStatus: string;
  onSearchChange: (value: string) => void;
  onSaveShownToFolder: () => void;
  onViewEntry: (entry: LyricEntry) => void;
  onEditEntry: (entry: LyricEntry) => void;
  onDownloadEntry: (entry: LyricEntry) => void;
  onDuplicateEntry: (entry: LyricEntry) => void;
  onDeleteEntry: (entryId: string) => void;
};

export default function LyricsLibrarySearchPanel({
  filteredEntries,
  searchValue,
  folderStatus,
  onSearchChange,
  onSaveShownToFolder,
  onViewEntry,
  onEditEntry,
  onDownloadEntry,
  onDuplicateEntry,
  onDeleteEntry,
}: LyricsLibrarySearchPanelProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Search Lyrics</h2>

          <p className="mt-1 text-sm text-white/60">
            Search by title, artist, tag, or words inside the lyrics.
          </p>
        </div>

        <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
          {filteredEntries.length} shown
        </div>
      </div>

      <input
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        className="mt-5 w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
        placeholder="Search lyrics..."
      />

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={onSaveShownToFolder}
          className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
        >
          Choose Folder + Save Shown TXT
        </button>

        {folderStatus ? (
          <p className="text-xs text-white/60">{folderStatus}</p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {filteredEntries.map((entry) => (
          <LyricsLibraryEntryCard
            key={entry.id}
            entry={entry}
            onViewEntry={onViewEntry}
            onEditEntry={onEditEntry}
            onDownloadEntry={onDownloadEntry}
            onDuplicateEntry={onDuplicateEntry}
            onDeleteEntry={onDeleteEntry}
          />
        ))}

        {filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-white/15 bg-black p-5 text-sm text-white/65">
            No lyrics found for that search.
          </div>
        ) : null}
      </div>
    </div>
  );
}