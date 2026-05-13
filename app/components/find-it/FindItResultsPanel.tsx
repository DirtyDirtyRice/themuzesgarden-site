import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import FindItResultRow from "./FindItResultRow";

export default function FindItResultsPanel({
  hasSearchText,
  isWaitingForDebounce,
  matches,
  safeSelectedIndex,
  selectResult,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matches: NavigationSearchResult[];
  safeSelectedIndex: number;
  selectResult: (result: NavigationSearchResult) => void;
}) {
  if (!hasSearchText) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <p className="text-sm font-semibold text-white">
          Start typing to search
        </p>

        <p className="mt-2 text-sm leading-6 text-white/60">
          Search for a page, system, metadata record, project area, or manual
          topic.
        </p>
      </section>
    );
  }

  if (isWaitingForDebounce) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <p className="text-sm font-semibold text-white">
          Updating results…
        </p>

        <p className="mt-2 text-sm leading-6 text-white/60">
          Find It is checking navigation pages and metadata records.
        </p>
      </section>
    );
  }

  if (matches.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <p className="text-sm font-semibold text-white">
          No matching results yet
        </p>

        <p className="mt-2 text-sm leading-6 text-white/60">
          Try a broader word like metadata, projects, player, generator, manual,
          C Major, or Find It.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            Results
          </p>

          <p className="mt-1 text-xs leading-5 text-white/45">
            Use the arrow keys to move through results. Click Open when you are
            ready to move.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
          {matches.length} found
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {matches.map((result, index) => (
          <FindItResultRow
            key={result.node.id}
            isSelected={index === safeSelectedIndex}
            onSelect={selectResult}
            result={result}
          />
        ))}
      </div>
    </section>
  );
}