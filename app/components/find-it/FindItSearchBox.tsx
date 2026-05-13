import type { KeyboardEvent, RefObject } from "react";

import FindItSearchStatus from "./FindItSearchStatus";

const EXAMPLE_SEARCHES = [
  "metadata",
  "projects",
  "C Major",
  "relationships",
  "generator",
];

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

        <p className="mt-1 text-sm leading-6 text-white/55">
          Type a normal word or idea. Find It searches pages, metadata records,
          and related ideas, then shows the safest path before you move.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/50 p-3">
        <input
          ref={inputRef}
          id="find-it-search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Try: metadata, projects, C Major, relationships, generator"
          className="rounded-xl border border-white/15 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/35 focus:border-white/40"
        />

        <div className="rounded-xl border border-white/10 bg-black/45 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Quick examples
          </p>

          <p className="mt-1 text-xs leading-5 text-white/55">
            Click one to test the system without guessing what to type.
          </p>

          <div className="mt-3">
            <FindItExampleSearches onSearchChange={onSearchChange} />
          </div>
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
              onClick={onClear}
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