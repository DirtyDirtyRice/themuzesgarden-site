import { useMemo } from "react";

import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import {
  getCategoryMatchScore,
  getFindItResultSourceLabel,
  getResultMatchScore,
  getSearchTokens,
} from "./FindItMatchingHighlight";
import {
  DidYouMeanPanel,
  SearchPrecisionSummary,
  TopResultPreview,
} from "./FindItMatchingPanels";
import FindItMatchingResultRow from "./FindItMatchingResultRow";
import {
  FIND_IT_CATEGORY_HELP_TEXT,
  getFindItResultLabel,
  groupFindItMatchesByCategory,
} from "./findItPanelUtils";

export default function FindItMatchingOptionsPanel({
  matches,
  selectedNodeId,
  searchValue,
  suggestions,
  onSelect,
  onSuggestionClick,
}: {
  matches: NavigationSearchResult[];
  selectedNodeId: string | null;
  searchValue: string;
  suggestions: string[];
  onSelect: (result: NavigationSearchResult) => void;
  onSuggestionClick: (suggestion: string) => void;
}) {
  const searchTokens = useMemo(() => getSearchTokens(searchValue), [
    searchValue,
  ]);
  const groupedMatches = useMemo(() => {
    const groups = groupFindItMatchesByCategory(matches);

    if (searchTokens.length === 0) {
      return groups;
    }

    return [...groups].sort((first, second) => {
      const firstScore = getCategoryMatchScore(first.matches, searchTokens);
      const secondScore = getCategoryMatchScore(second.matches, searchTokens);

      return secondScore - firstScore;
    });
  }, [matches, searchTokens]);
  const resultLabel = getFindItResultLabel(matches.length);
  const topResult = matches[0] ?? null;
  const selectedResult =
    matches.find((result) => result.node.id === selectedNodeId) ?? null;
  const hasSearchText = searchValue.trim().length > 0;
  const metadataCount = matches.filter(
    (result) => getFindItResultSourceLabel(result) === "Metadata",
  ).length;
  const navigationCount = matches.length - metadataCount;
  const topMatchScore = topResult
    ? getResultMatchScore(topResult, searchTokens)
    : 0;
  const selectedMatchScore = selectedResult
    ? getResultMatchScore(selectedResult, searchTokens)
    : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-black/70 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
            Matching options
          </p>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {hasSearchText
              ? "Choose the closest match below. Navigation pages and metadata records now show together."
              : "Start typing, or use one of the common destinations."}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
          {resultLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-4">
        <DidYouMeanPanel
          suggestions={suggestions}
          onSuggestionClick={onSuggestionClick}
        />

        <SearchPrecisionSummary
          hasSearchText={hasSearchText}
          matchCount={matches.length}
          metadataCount={metadataCount}
          navigationCount={navigationCount}
          searchTokens={searchTokens}
          selectedMatchScore={selectedMatchScore}
          topMatchScore={topMatchScore}
        />

        <TopResultPreview
          result={topResult}
          searchTokens={searchTokens}
          topMatchScore={topMatchScore}
        />

        {groupedMatches.map((group) => {
          const categoryScore = getCategoryMatchScore(
            group.matches,
            searchTokens,
          );

          return (
            <section
              key={group.category}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-2"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                    {group.category}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/40">
                    {FIND_IT_CATEGORY_HELP_TEXT[group.category] ??
                      "Navigation tree destination."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categoryScore > 0 ? (
                    <span className="rounded-full border border-sky-100/15 bg-sky-200/[0.06] px-2 py-1 text-[10px] font-semibold text-sky-50/70">
                      score {categoryScore}
                    </span>
                  ) : null}

                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold text-white/45">
                    {group.matches.length}
                  </span>
                </div>
              </div>

              <div className="max-h-[22rem] scroll-py-3 overflow-y-auto pr-1">
                <div className="flex flex-col gap-2">
                  {group.matches.map((result) => (
                    <FindItMatchingResultRow
                      key={result.node.id}
                      active={result.node.id === selectedNodeId}
                      isTopResult={result.node.id === topResult?.node.id}
                      result={result}
                      searchTokens={searchTokens}
                      matchScore={getResultMatchScore(result, searchTokens)}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}