import { useEffect, useState } from "react";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";
import { getMetadataMeaningForSearch } from "@/lib/metadata/metadataLibrarySeed";

type MetadataSearchMeaning = {
  title: string;
  excerpt: string;
  slug?: string;
};

type MeaningTone = "idle" | "confident" | "compare" | "fallback";

function formatQuery(query: string): string {
  return query.trim();
}

function getSelectedResult(
  matches: NavigationSearchResult[],
  safeSelectedIndex: number,
): NavigationSearchResult | null {
  return matches[safeSelectedIndex] ?? matches[0] ?? null;
}

function getMeaningTone({
  hasQuery,
  hasMeaning,
  hasSelectedResult,
  matchCount,
}: {
  hasQuery: boolean;
  hasMeaning: boolean;
  hasSelectedResult: boolean;
  matchCount: number;
}): MeaningTone {
  if (!hasQuery) {
    return "idle";
  }

  if (hasMeaning && matchCount <= 1) {
    return "confident";
  }

  if (hasSelectedResult && matchCount > 1) {
    return "compare";
  }

  return "fallback";
}

function getToneLabel(tone: MeaningTone): string {
  if (tone === "confident") {
    return "Confident read";
  }

  if (tone === "compare") {
    return "Compare choices";
  }

  if (tone === "fallback") {
    return "Best available read";
  }

  return "Meaning helper";
}

function getToneCopy(tone: MeaningTone): string {
  if (tone === "confident") {
    return "Find It has a clear meaning match for your search.";
  }

  if (tone === "compare") {
    return "Find It found more than one possible target, so compare the selected result with the list before opening it.";
  }

  if (tone === "fallback") {
    return "Find It can explain the selected result, but the metadata meaning may need more records later.";
  }

  return "Start typing to let Find It explain what your search points toward.";
}

function getResultTypeLabel(result: NavigationSearchResult | null): string {
  if (!result) {
    return "No selected result";
  }

  const cleanKind = result.node.kind.replace(/_/g, " ");

  return cleanKind.charAt(0).toUpperCase() + cleanKind.slice(1);
}

function buildExplanation({
  query,
  result,
  meaning,
  matchCount,
  isLocked,
}: {
  query: string;
  result: NavigationSearchResult | null;
  meaning: MetadataSearchMeaning | null;
  matchCount: number;
  isLocked: boolean;
}) {
  const cleanQuery = formatQuery(query);
  const lockNote = isLocked
    ? " The meaning layer is locked to the stable target so it does not jump while you compare."
    : "";

  if (!cleanQuery) {
    return null;
  }

  if (meaning) {
    const comparisonNote =
      matchCount > 1
        ? " Because there are multiple results, use the selected row and path panel to confirm this is the one you want."
        : "";

    return `You searched "${cleanQuery}". This most likely refers to "${meaning.title}", which ${meaning.excerpt.toLowerCase()}${comparisonNote}${lockNote}`;
  }

  if (result) {
    return `You searched "${cleanQuery}". Find It matched this to "${result.node.label}" based on the closest available navigation or metadata result.${lockNote}`;
  }

  return `You searched "${cleanQuery}". Find It is still trying to determine the best match. Try a broader word if this feels too specific.`;
}

function buildWhyMatch({
  query,
  result,
  meaning,
  matchCount,
  isLocked,
}: {
  query: string;
  result: NavigationSearchResult | null;
  meaning: MetadataSearchMeaning | null;
  matchCount: number;
  isLocked: boolean;
}) {
  const cleanQuery = formatQuery(query);

  if (!cleanQuery || !result) {
    return null;
  }

  const lockNote = isLocked
    ? " This explanation is pinned to the stable target chosen by the intelligence layer."
    : "";

  if (meaning) {
    return `"${cleanQuery}" matched known metadata language for "${meaning.title}". The selected result is the current target Find It will use for path guidance.${lockNote}`;
  }

  if (matchCount > 1) {
    return `"${cleanQuery}" matched multiple places. This row is selected because it is currently the closest result in the list.${lockNote}`;
  }

  return `"${cleanQuery}" matched "${result.node.label}" within the navigation tree.${lockNote}`;
}

function buildNextStep({
  result,
  matchCount,
  isLocked,
}: {
  result: NavigationSearchResult | null;
  matchCount: number;
  isLocked: boolean;
}) {
  if (!result) {
    return "Select a result to continue. If no result appears, try one broader word.";
  }

  if (isLocked) {
    return `Next step: meaning is locked to "${result.node.label}". Check the path panel, then open it when it looks right.`;
  }

  if (matchCount > 1) {
    return `Next step: compare the selected result, then use the path panel below to open "${result.node.label}" when it looks right.`;
  }

  return `Next step: use the path panel below, then open "${result.node.label}" to move forward.`;
}

function buildSelectedSummary({
  result,
  meaning,
  matchCount,
  isLocked,
}: {
  result: NavigationSearchResult | null;
  meaning: MetadataSearchMeaning | null;
  matchCount: number;
  isLocked: boolean;
}) {
  if (!result) {
    return "No selected destination yet.";
  }

  const lockText = isLocked ? " The meaning layer is locked to this stable destination." : "";

  if (meaning) {
    return `${meaning.title} is the meaning layer. ${result.node.label} is the selected destination.${lockText}`;
  }

  if (matchCount > 1) {
    return `${result.node.label} is selected out of ${matchCount} possible matches.${lockText}`;
  }

  return `${result.node.label} is the selected destination.${lockText}`;
}

function QueryPill({ query }: { query: string }) {
  const cleanQuery = formatQuery(query);

  if (!cleanQuery) {
    return null;
  }

  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/70">
      “{cleanQuery}”
    </span>
  );
}

function getShouldLockMeaning({
  selectedResult,
  matchCount,
  hasQuery,
}: {
  selectedResult: NavigationSearchResult | null;
  matchCount: number;
  hasQuery: boolean;
}) {
  return Boolean(selectedResult && hasQuery && matchCount > 0 && matchCount <= 3);
}

export default function FindItMeaningPanel({
  searchText,
  matches,
  safeSelectedIndex,
}: {
  searchText: string;
  matches: NavigationSearchResult[];
  safeSelectedIndex: number;
}) {
  const selectedResult = getSelectedResult(matches, safeSelectedIndex);
  const cleanSearchText = formatQuery(searchText);
  const shouldLockMeaning = getShouldLockMeaning({
    selectedResult,
    matchCount: matches.length,
    hasQuery: cleanSearchText.length > 0,
  });
  const [lockedResult, setLockedResult] = useState<NavigationSearchResult | null>(null);

  useEffect(() => {
    if (!shouldLockMeaning || !selectedResult) {
      setLockedResult(null);
      return;
    }

    setLockedResult(selectedResult);
  }, [selectedResult, shouldLockMeaning]);

  const activeResult = lockedResult ?? selectedResult;
  const isLocked = Boolean(lockedResult);
  const meaning = getMetadataMeaningForSearch(searchText);
  const tone = getMeaningTone({
    hasQuery: cleanSearchText.length > 0,
    hasMeaning: Boolean(meaning),
    hasSelectedResult: Boolean(activeResult),
    matchCount: matches.length,
  });

  const explanation = buildExplanation({
    query: searchText,
    result: activeResult,
    meaning,
    matchCount: matches.length,
    isLocked,
  });
  const whyMatch = buildWhyMatch({
    query: searchText,
    result: activeResult,
    meaning,
    matchCount: matches.length,
    isLocked,
  });
  const nextStep = buildNextStep({
    result: activeResult,
    matchCount: matches.length,
    isLocked,
  });
  const selectedSummary = buildSelectedSummary({
    result: activeResult,
    meaning,
    matchCount: matches.length,
    isLocked,
  });
  const resultTypeLabel = getResultTypeLabel(activeResult);

  if (!cleanSearchText) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Meaning
            </p>

            <p className="mt-2 text-sm leading-6 text-white/65">
              Start typing in Find It to understand what your search refers to.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
            {getToneLabel(tone)}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            What this panel does
          </p>

          <p className="mt-2 text-sm leading-6 text-white/65">
            It connects your search words to meaning, explains why the selected
            result makes sense, and tells you the next safe step.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">
              Meaning
            </p>

            <QueryPill query={searchText} />
          </div>

          <p className="mt-2 text-sm leading-6 text-white/65">
            {getToneCopy(tone)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isLocked ? (
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/80">
              Locked
            </span>
          ) : null}

          <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
            {getToneLabel(tone)}
          </span>

          <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
            {resultTypeLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {explanation ? (
            <div className="rounded-xl border border-white/10 bg-black/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                What this means
              </p>

              <p className="mt-2 text-sm leading-6 text-white">
                {explanation}
              </p>
            </div>
          ) : null}

          {whyMatch ? (
            <div className="rounded-xl border border-white/10 bg-black/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                Why this result
              </p>

              <p className="mt-2 text-sm leading-6 text-white/70">
                {whyMatch}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/35 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Selected target
            </p>

            <p className="mt-2 text-sm leading-6 text-white/75">
              {selectedSummary}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/70">
              Next step
            </p>

            <p className="mt-2 text-sm leading-6 text-white/75">
              {nextStep}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}