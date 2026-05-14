import type { KeyboardEvent, RefObject } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import FindItSearchStatus from "./FindItSearchStatus";

const EXAMPLE_SEARCHES = [
  "metadata",
  "projects",
  "C Major",
  "relationships",
  "generator",
  "major",
  "c maj",
  "find",
];

const RECENT_SEARCHES_STORAGE_KEY = "muzes-garden-find-it-recent-searches";
const MAX_RECENT_SEARCHES = 10;

function normalizeStoredSearch(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getUniqueSearches(searches: string[]) {
  const seen = new Set<string>();
  const cleanSearches: string[] = [];

  searches.forEach((search) => {
    const cleanSearch = normalizeStoredSearch(search);
    const key = cleanSearch.toLowerCase();

    if (!cleanSearch || seen.has(key)) {
      return;
    }

    seen.add(key);
    cleanSearches.push(cleanSearch);
  });

  return cleanSearches;
}

function readRecentSearchesFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return getUniqueSearches(
      parsedValue.filter((item): item is string => typeof item === "string"),
    ).slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

function writeRecentSearchesToStorage(searches: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RECENT_SEARCHES_STORAGE_KEY,
      JSON.stringify(searches),
    );
  } catch {
    // Recent searches are helpful, but storage should never break Find It.
  }
}

function buildRecentSearches(nextSearch: string, currentSearches: string[]) {
  return getUniqueSearches([nextSearch, ...currentSearches]).slice(
    0,
    MAX_RECENT_SEARCHES,
  );
}

function FindItKeyboardHelp() {
  const shortcuts = [
    "Arrow keys move",
    "Page keys jump",
    "Home / End snap",
    "Esc clears",
    "Enter stays safe",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {shortcuts.map((shortcut) => (
        <span
          key={shortcut}
          className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/55"
        >
          {shortcut}
        </span>
      ))}
    </div>
  );
}

function FindItExampleSearches({
  onSearchChange,
}: {
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLE_SEARCHES.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => onSearchChange(example)}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:border-white/30 hover:text-white"
        >
          {example}
        </button>
      ))}
    </div>
  );
}

function FindItRecentSearches({
  recentSearches,
  onClearRecentSearches,
  onSearchChange,
}: {
  recentSearches: string[];
  onClearRecentSearches: () => void;
  onSearchChange: (value: string) => void;
}) {
  if (recentSearches.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/45 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          Recent searches
        </p>

        <p className="mt-1 text-xs leading-5 text-white/55">
          Your last searches will appear here after you use Find It.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/45 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Recent searches
          </p>

          <p className="mt-1 text-xs leading-5 text-white/55">
            Click one to rerun it without retyping.
          </p>
        </div>

        <button
          type="button"
          onClick={onClearRecentSearches}
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/65 transition hover:border-white/30 hover:text-white active:scale-[0.98]"
        >
          Clear history
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {recentSearches.map((recentSearch) => (
          <button
            key={recentSearch}
            type="button"
            onClick={() => onSearchChange(recentSearch)}
            className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.04] px-3 py-1.5 text-xs font-semibold text-emerald-50/75 transition hover:border-emerald-200/40 hover:text-white"
          >
            {recentSearch}
          </button>
        ))}
      </div>
    </div>
  );
}

function FindItSearchMemorySummary({
  hasSearchText,
  matchCount,
  recentSearchCount,
  searchValue,
  selectedLabel,
}: {
  hasSearchText: boolean;
  matchCount: number;
  recentSearchCount: number;
  searchValue: string;
  selectedLabel: string | null;
}) {
  const cleanSearchValue = normalizeStoredSearch(searchValue);

  if (!hasSearchText) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          Memory status
        </p>

        <p className="mt-1 text-xs leading-5 text-white/55">
          Find It remembers recent searches on this browser. You have{" "}
          {recentSearchCount} saved search{recentSearchCount === 1 ? "" : "es"}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        Current search
      </p>

      <p className="mt-1 text-xs leading-5 text-white/60">
        “{cleanSearchValue}” has {matchCount} match
        {matchCount === 1 ? "" : "es"}
        {selectedLabel ? `, with "${selectedLabel}" selected.` : "."}
      </p>
    </div>
  );
}

export default function FindItSearchBox({
  canClearSearch,
  hasSearchText,
  inputRef,
  isWaitingForDebounce,
  matchCount,
  searchValue,
  selectedIndex,
  selectedLabel,
  topResultLabel,
  onClear,
  onKeyDown,
  onSearchChange,
}: {
  canClearSearch: boolean;
  hasSearchText: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  isWaitingForDebounce: boolean;
  matchCount: number;
  searchValue: string;
  selectedIndex: number;
  selectedLabel: string | null;
  topResultLabel: string | null;
  onClear: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSearchChange: (value: string) => void;
}) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const cleanSearchValue = useMemo(
    () => normalizeStoredSearch(searchValue),
    [searchValue],
  );

  useEffect(() => {
    setRecentSearches(readRecentSearchesFromStorage());
  }, []);

  useEffect(() => {
    if (!hasSearchText || cleanSearchValue.length < 2) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentSearches((currentSearches) => {
        const nextSearches = buildRecentSearches(
          cleanSearchValue,
          currentSearches,
        );

        writeRecentSearchesToStorage(nextSearches);

        return nextSearches;
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [cleanSearchValue, hasSearchText]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    writeRecentSearchesToStorage([]);
    inputRef.current?.focus();
  }, [inputRef]);

  const handleExampleSearchChange = useCallback(
    (value: string) => {
      onSearchChange(value);
      inputRef.current?.focus();
    },
    [inputRef, onSearchChange],
  );

  const handleClear = useCallback(() => {
    onClear();
    inputRef.current?.focus();
  }, [inputRef, onClear]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60">
          Find It
        </p>

        <label
          htmlFor="find-it-search"
          className="text-xl font-semibold text-white"
        >
          What are you trying to find?
        </label>

        <p className="mt-1 text-sm leading-6 text-white/60">
          Type a normal word or idea. Find It searches pages, metadata records,
          and related ideas, then shows the safest path before you move.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/50 p-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-2">
          <input
            ref={inputRef}
            id="find-it-search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Try: metadata, projects, C Major, relationships, generator"
            className="w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/35 focus:border-white/40"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[11px] leading-5 text-white/45">
              Search is fuzzy: try major, c maj, scale, find, metadata, or
              projects.
            </p>

            {cleanSearchValue ? (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                {cleanSearchValue.length} chars
              </span>
            ) : null}
          </div>
        </div>

        <FindItSearchMemorySummary
          hasSearchText={hasSearchText}
          matchCount={matchCount}
          recentSearchCount={recentSearches.length}
          searchValue={searchValue}
          selectedLabel={selectedLabel}
        />

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/45 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Quick examples
            </p>

            <p className="mt-1 text-xs leading-5 text-white/55">
              Click one to test the system without guessing what to type.
            </p>

            <div className="mt-3">
              <FindItExampleSearches
                onSearchChange={handleExampleSearchChange}
              />
            </div>
          </div>

          <FindItRecentSearches
            recentSearches={recentSearches}
            onClearRecentSearches={clearRecentSearches}
            onSearchChange={handleExampleSearchChange}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/45 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Safe controls
              </p>

              <p className="mt-1 text-xs leading-5 text-white/55">
                Enter stays safe. Clear resets the search, removes the selected
                destination, and keeps your cursor in this box.
              </p>
            </div>

            <button
              type="button"
              disabled={!canClearSearch}
              onClick={handleClear}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Clear / Reset
            </button>
          </div>

          <FindItKeyboardHelp />
        </div>

        <FindItSearchStatus
          hasSearchText={hasSearchText}
          isWaitingForDebounce={isWaitingForDebounce}
          matchCount={matchCount}
          selectedIndex={selectedIndex}
          selectedLabel={selectedLabel}
          topResultLabel={topResultLabel}
        />
      </div>
    </div>
  );
}