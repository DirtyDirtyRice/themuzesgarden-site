"use client";

import { useMemo, useState } from "react";

import type { LyricEntry } from "./lyricsTypes";

type LyricsSearchMode = "title" | "letter" | "all";

type LyricsLibrarySearchPanelProps = {
  filteredEntries: LyricEntry[];
  totalEntries: number;
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

type LyricsTitleGroup = {
  titleKey: string;
  title: string;
  entries: LyricEntry[];
  allBodiesMatch: boolean;
  displayEntry: LyricEntry;
  displayBody: string;
  hasReadableLyrics: boolean;
};

const LETTER_FILTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeBody(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function removeFileExtension(value: string): string {
  return value.replace(/\.(txt|text|md|markdown|doc|docx|pdf|rtf|odt)$/i, "");
}

function normalizeComparableLine(value: string): string {
  return removeFileExtension(value)
    .replace(/[-_]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isImportPlaceholderLine(line: string): boolean {
  const cleaned = line.trim().toLowerCase();

  if (!cleaned) return true;
  if (cleaned.startsWith("[imported ")) return true;
  if (cleaned.startsWith("file type accepted")) return true;
  if (cleaned.startsWith("current version imports")) return true;
  if (cleaned.startsWith("title:")) return true;
  if (cleaned.startsWith("artist:")) return true;
  if (cleaned.startsWith("tags:")) return true;
  if (cleaned.startsWith("created:")) return true;
  if (cleaned.startsWith("updated:")) return true;
  if (cleaned === "lyrics") return true;

  return false;
}

function getComparableLyricBody(entry: LyricEntry): string {
  const titleLine = normalizeComparableLine(entry.title);

  const lyricLines = entry.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (isImportPlaceholderLine(line)) {
        return false;
      }

      const comparableLine = normalizeComparableLine(line);

      if (!comparableLine) {
        return false;
      }

      if (comparableLine === titleLine) {
        return false;
      }

      return true;
    });

  return lyricLines.join("\n").trim();
}

function getDisplayLyricBody(entry: LyricEntry): string {
  const cleanedBody = getComparableLyricBody(entry);

  return cleanedBody || entry.body;
}

function buildLyricsTitleGroups(entries: LyricEntry[]): LyricsTitleGroup[] {
  const groupMap = new Map<string, LyricEntry[]>();

  entries.forEach((entry) => {
    const titleKey = normalizeTitle(entry.title) || entry.id;
    const currentEntries = groupMap.get(titleKey) || [];

    currentEntries.push(entry);
    groupMap.set(titleKey, currentEntries);
  });

  return Array.from(groupMap.entries())
    .map(([titleKey, groupEntries]) => {
      const displayEntry =
        groupEntries.find((entry) => getComparableLyricBody(entry)) ||
        groupEntries[0];

      const bodyKeys = new Set(
        groupEntries.map((entry) => normalizeBody(getComparableLyricBody(entry)))
      );

      const displayBody = getDisplayLyricBody(displayEntry);
      const hasReadableLyrics = Boolean(getComparableLyricBody(displayEntry));

      return {
        titleKey,
        title: displayEntry?.title || "Untitled Lyrics",
        entries: groupEntries,
        allBodiesMatch: bodyKeys.size <= 1,
        displayEntry,
        displayBody,
        hasReadableLyrics,
      };
    })
    .sort((first, second) => first.title.localeCompare(second.title));
}

function getVersionLabel(count: number): string {
  if (count === 1) return "1 lyric record";

  return `${count} musical versions`;
}

export default function LyricsLibrarySearchPanel({
  filteredEntries,
  totalEntries,
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
  const [searchMode, setSearchMode] = useState<LyricsSearchMode>("title");
  const [selectedLetter, setSelectedLetter] = useState("A");

  const hasSearchValue = searchValue.trim().length > 0;

  const displayEntries = useMemo(() => {
    if (searchMode === "all") return filteredEntries;

    if (searchMode === "letter") {
      return filteredEntries.filter((entry) =>
        entry.title.trim().toUpperCase().startsWith(selectedLetter)
      );
    }

    if (hasSearchValue) return filteredEntries;

    return [];
  }, [filteredEntries, hasSearchValue, searchMode, selectedLetter]);

  const titleGroups = useMemo(
    () => buildLyricsTitleGroups(displayEntries),
    [displayEntries]
  );

  function handleSearchModeChange(value: LyricsSearchMode) {
    setSearchMode(value);

    if (value !== "title") {
      onSearchChange("");
    }
  }

  function handleSearchChange(value: string) {
    setSearchMode("title");
    onSearchChange(value);
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Search Lyrics</h2>

          <p className="mt-1 text-sm text-white/60">
            {displayEntries.length} shown of {totalEntries}
          </p>
        </div>

        <button
          type="button"
          onClick={onSaveShownToFolder}
          className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
        >
          Save Shown TXT
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[220px_1fr]">
        <select
          value={searchMode}
          onChange={(event) =>
            handleSearchModeChange(event.target.value as LyricsSearchMode)
          }
          className="w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm font-semibold text-white outline-none"
        >
          <option value="title">Search by title</option>
          <option value="letter">Search by letter</option>
          <option value="all">Show all lyrics</option>
        </select>

        {searchMode === "title" ? (
          <input
            value={searchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
            placeholder="Search lyric title..."
          />
        ) : null}

        {searchMode === "letter" ? (
          <select
            value={selectedLetter}
            onChange={(event) => setSelectedLetter(event.target.value)}
            className="w-full rounded-lg border border-white/25 bg-black px-3 py-2 text-sm font-semibold text-white outline-none"
          >
            {LETTER_FILTERS.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>
        ) : null}

        {searchMode === "all" ? (
          <div className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white/65">
            Showing all lyrics.
          </div>
        ) : null}
      </div>

      {folderStatus ? (
        <p className="mt-3 text-xs text-white/60">{folderStatus}</p>
      ) : null}

      <div className="mt-5 flex flex-col gap-4">
        {searchMode === "title" && !hasSearchValue ? (
          <div className="rounded-xl border border-white/15 bg-black p-5 text-sm text-white/65">
            Search a lyric title, switch to letter search, or choose show all.
          </div>
        ) : null}

        {titleGroups.map((group) => (
          <div
            key={group.titleKey}
            className="rounded-2xl border border-white/15 bg-black p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xl font-semibold uppercase text-white">
                  {group.title}
                </h3>

                <p className="mt-2 text-sm text-white/65">
                  {getVersionLabel(group.entries.length)}
                </p>

                {group.entries.length > 1 && group.allBodiesMatch ? (
                  <p className="mt-2 text-sm font-semibold text-white">
                    Same lyrics found across all musical versions.
                  </p>
                ) : null}

                {group.entries.length > 1 && !group.allBodiesMatch ? (
                  <p className="mt-2 text-sm font-semibold text-white">
                    Different lyric bodies found. Choose a version below.
                  </p>
                ) : null}

                {!group.hasReadableLyrics ? (
                  <p className="mt-2 text-sm text-white/60">
                    This import has no readable lyric text yet. DOC, DOCX, and
                    PDF files are placeholders until text extraction is wired.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onViewEntry(group.displayEntry)}
                  className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                >
                  Open Lyrics
                </button>

                <button
                  type="button"
                  onClick={() => onEditEntry(group.displayEntry)}
                  className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onDownloadEntry(group.displayEntry)}
                  className="rounded-lg border border-white bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                >
                  Download TXT
                </button>
              </div>
            </div>

            <pre className="mt-5 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black p-4 font-mono text-sm leading-7 text-white">
              {group.displayBody}
            </pre>

            {group.entries.length > 1 && !group.allBodiesMatch ? (
              <div className="mt-5 flex flex-col gap-3">
                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-white/10 bg-black p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {entry.title}
                        </p>

                        <p className="mt-1 text-xs text-white/55">
                          Tags: {entry.tags || "none"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onViewEntry(entry)}
                          className="rounded-lg border border-white bg-black px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                        >
                          Open Lyrics
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditEntry(entry)}
                          className="rounded-lg border border-white bg-black px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDownloadEntry(entry)}
                          className="rounded-lg border border-white bg-black px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                        >
                          Download TXT
                        </button>

                        <button
                          type="button"
                          onClick={() => onDuplicateEntry(entry)}
                          className="rounded-lg border border-white/35 bg-black px-3 py-2 text-xs font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                        >
                          Duplicate
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          className="rounded-lg border border-white/35 bg-black px-3 py-2 text-xs font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {(group.entries.length === 1 || group.allBodiesMatch) &&
            group.entries.length > 1 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {group.entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onViewEntry(entry)}
                    className="rounded-lg border border-white/25 bg-black px-3 py-2 text-xs font-semibold text-white/75 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                  >
                    {entry.title}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {searchMode !== "title" || hasSearchValue ? (
          titleGroups.length === 0 ? (
            <div className="rounded-xl border border-white/15 bg-black p-5 text-sm text-white/65">
              No lyrics found for that search.
            </div>
          ) : null
        ) : null}
      </div>
    </div>
  );
}