import MiscellaneousLibraryEntryCard from "./MiscellaneousLibraryEntryCard";
import type { MiscellaneousEntry } from "./miscellaneousTypes";

type MiscellaneousLibrarySearchPanelProps = {
  filteredEntries: MiscellaneousEntry[];
  searchValue: string;
  folderStatus: string;
  onSearchChange: (value: string) => void;
  onSaveShownToFolder: () => void;
  onEditEntry: (entry: MiscellaneousEntry) => void;
  onDownloadEntry: (entry: MiscellaneousEntry) => void;
  onDuplicateEntry: (entry: MiscellaneousEntry) => void;
  onDeleteEntry: (entryId: string) => void;
};

export default function MiscellaneousLibrarySearchPanel({
  filteredEntries,
  searchValue,
  folderStatus,
  onSearchChange,
  onSaveShownToFolder,
  onEditEntry,
  onDownloadEntry,
  onDuplicateEntry,
  onDeleteEntry,
}: MiscellaneousLibrarySearchPanelProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Search Miscellaneous
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Search by title, category, related song, tags, body, notes, or
            future links.
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
        placeholder="Search miscellaneous notes..."
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
          <MiscellaneousLibraryEntryCard
            key={entry.id}
            entry={entry}
            onEditEntry={onEditEntry}
            onDownloadEntry={onDownloadEntry}
            onDuplicateEntry={onDuplicateEntry}
            onDeleteEntry={onDeleteEntry}
          />
        ))}

        {filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-white/15 bg-black p-5 text-sm text-white/65">
            No miscellaneous notes found for that search.
          </div>
        ) : null}
      </div>
    </div>
  );
}