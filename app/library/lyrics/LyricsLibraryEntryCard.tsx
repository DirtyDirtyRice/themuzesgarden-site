import type { LyricEntry } from "./lyricsTypes";

type LyricsLibraryEntryCardProps = {
  entry: LyricEntry;
  onViewEntry: (entry: LyricEntry) => void;
  onEditEntry: (entry: LyricEntry) => void;
  onDownloadEntry: (entry: LyricEntry) => void;
  onDuplicateEntry: (entry: LyricEntry) => void;
  onDeleteEntry: (entryId: string) => void;
};

export default function LyricsLibraryEntryCard({
  entry,
  onViewEntry,
  onEditEntry,
  onDownloadEntry,
  onDuplicateEntry,
  onDeleteEntry,
}: LyricsLibraryEntryCardProps) {
  return (
    <article className="rounded-xl border border-white/15 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{entry.title}</h3>

          <p className="mt-1 text-sm text-white/65">
            {entry.artist || "Unknown artist"}
          </p>

          <p className="mt-2 text-xs text-white/55">
            Tags: {entry.tags || "None"}
          </p>

          <p className="mt-2 text-xs text-white/45">
            Created: {entry.createdAt} · Updated: {entry.updatedAt}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onViewEntry(entry)}
            className="rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            View
          </button>

          <button
            type="button"
            onClick={() => onEditEntry(entry)}
            className="rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDownloadEntry(entry)}
            className="rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            Download TXT
          </button>

          <button
            type="button"
            onClick={() => onDuplicateEntry(entry)}
            className="rounded-lg border border-white/35 bg-black px-3 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            Duplicate
          </button>

          <button
            type="button"
            onClick={() => onDeleteEntry(entry.id)}
            className="rounded-lg border border-white/35 bg-black px-3 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            Delete
          </button>
        </div>
      </div>

      <pre className="mt-4 max-h-[180px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black p-3 text-sm leading-6 text-white/75">
        {entry.body}
      </pre>
    </article>
  );
}