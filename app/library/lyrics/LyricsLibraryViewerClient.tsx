"use client";

import type { LyricEntry } from "./lyricsTypes";

type LyricsLibraryViewerClientProps = {
  entry: LyricEntry | null;
  onEditEntry: (entry: LyricEntry) => void;
  onDownloadEntry: (entry: LyricEntry) => void;
  onCloseViewer: () => void;
};

export default function LyricsLibraryViewerClient({
  entry,
  onEditEntry,
  onDownloadEntry,
  onCloseViewer,
}: LyricsLibraryViewerClientProps) {
  if (!entry) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/55">
            Viewing Lyrics
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">{entry.title}</h2>

          <p className="mt-1 text-sm text-white/70">
            {entry.artist || "Unknown artist"}
          </p>

          <p className="mt-2 text-xs text-white/55">
            Tags: {entry.tags || "None"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
            onClick={onCloseViewer}
            className="rounded-lg border border-white/35 bg-black px-3 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          >
            Close Viewer
          </button>
        </div>
      </div>

      <pre className="mt-5 min-h-[320px] whitespace-pre-wrap rounded-xl border border-white/10 bg-black p-5 text-base leading-7 text-white">
        {entry.body}
      </pre>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/55">
        <span>Created: {entry.createdAt}</span>
        <span>Updated: {entry.updatedAt}</span>
      </div>
    </section>
  );
}