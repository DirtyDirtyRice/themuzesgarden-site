import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import FindItResultRow from "./FindItResultRow";

function getResultKindLabel(result: NavigationSearchResult | null): string {
  if (!result) {
    return "No result selected";
  }

  const cleanKind = result.node.kind.replace(/_/g, " ");

  return cleanKind.charAt(0).toUpperCase() + cleanKind.slice(1);
}

function getResultConfidenceLabel(matchCount: number): string {
  if (matchCount === 1) {
    return "Strong match";
  }

  if (matchCount <= 3) {
    return "Good match list";
  }

  return "Multiple possible matches";
}

function getResultConfidenceCopy(matchCount: number): string {
  if (matchCount === 1) {
    return "Find It found one clear place to send you next.";
  }

  if (matchCount <= 3) {
    return "Find It found a small set of likely choices. The selected row is the current best target.";
  }

  return "Find It found several possible choices. Use the arrow keys to compare them before opening one.";
}

function getNoResultsSuggestionCopy(): string {
  return [
    "Try one broader word first.",
    "Good examples: metadata, projects, player, generator, manual, C Major, major, scale, or Find It.",
  ].join(" ");
}

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
  const selectedResult = matches[safeSelectedIndex] ?? matches[0] ?? null;
  const resultKindLabel = getResultKindLabel(selectedResult);
  const confidenceLabel = getResultConfidenceLabel(matches.length);
  const confidenceCopy = getResultConfidenceCopy(matches.length);

  if (!hasSearchText) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <p className="text-sm font-semibold text-white">
          Start typing to search
        </p>

        <p className="mt-2 text-sm leading-6 text-white/70">
          Search for a page, system, metadata record, project area, manual
          topic, or fuzzy phrase like major, c maj, scale, or find.
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Smart search is on
          </p>

          <p className="mt-1 text-xs leading-5 text-white/60">
            Find It can now understand partial metadata words and common short
            names before sending you to a page.
          </p>
        </div>
      </section>
    );
  }

  if (isWaitingForDebounce) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <p className="text-sm font-semibold text-white">
          Updating results…
        </p>

        <p className="mt-2 text-sm leading-6 text-white/70">
          Find It is checking navigation pages, metadata records, partial
          matches, and known short names.
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

        <p className="mt-2 text-sm leading-6 text-white/70">
          {getNoResultsSuggestionCopy()}
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Try this next
          </p>

          <p className="mt-1 text-xs leading-5 text-white/60">
            Use fewer words first. After Find It shows results, use the selected
            row, path panel, meaning panel, and action panel together.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            Results
          </p>

          <p className="mt-1 text-xs leading-5 text-white/55">
            Use the arrow keys to move through results. Click Open when you are
            ready to move.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
            {matches.length} found
          </span>

          <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
            {confidenceLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
          Current best target
        </p>

        <p className="mt-2 text-sm font-semibold text-white">
          {selectedResult?.node.label ?? "No selected result"}
        </p>

        <p className="mt-1 text-xs leading-5 text-white/60">
          {confidenceCopy}
        </p>

        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Type: {resultKindLabel}
        </p>
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