import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import { HighlightedResultLabel } from "./FindItMatchingHighlight";

export function DidYouMeanPanel({
  suggestions,
  onSuggestionClick,
}: {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200/20 bg-amber-200/10 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-100">
        Try one of these
      </p>

      <p className="mt-1 text-xs leading-5 text-amber-50/70">
        These shortcuts fill the search box and keep focus in Find It.
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
            className="rounded-full border border-amber-100/20 bg-black/50 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:opacity-85 active:scale-[0.98]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchPrecisionSummary({
  hasSearchText,
  matchCount,
  searchTokens,
  selectedMatchScore,
  topMatchScore,
}: {
  hasSearchText: boolean;
  matchCount: number;
  searchTokens: string[];
  selectedMatchScore: number;
  topMatchScore: number;
}) {
  if (!hasSearchText) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
          Ready to search
        </p>

        <p className="mt-1 text-xs leading-5 text-white/45">
          Results will rank visually by match strength while navigation remains
          click-only and safe.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
          Tokens
        </p>

        <p className="mt-1 text-sm font-semibold text-white/75">
          {searchTokens.length || 0}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
          Matches
        </p>

        <p className="mt-1 text-sm font-semibold text-white/75">
          {matchCount}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
          Strength
        </p>

        <p className="mt-1 text-sm font-semibold text-white/75">
          {selectedMatchScore || topMatchScore || 0}
        </p>
      </div>
    </div>
  );
}

export function TopResultPreview({
  result,
  searchTokens,
  topMatchScore,
}: {
  result: NavigationSearchResult | null;
  searchTokens: string[];
  topMatchScore: number;
}) {
  if (!result) {
    return null;
  }

  return (
    <div className="sticky top-2 z-10 rounded-xl border border-emerald-200/25 bg-black/95 p-3 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/85">
          Sticky top result
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-emerald-100/20 bg-emerald-300/[0.08] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-50/70">
            Best match
          </span>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-white/55">
            Strength {topMatchScore}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm font-semibold leading-6 text-white">
        <HighlightedResultLabel
          label={result.node.label}
          tokens={searchTokens}
        />
      </p>

      <p className="mt-1 text-xs leading-5 text-emerald-50/65">
        This stays visible while you scan longer result lists. Enter still stays
        safe; click the matching option, path step, or Go button to navigate.
      </p>
    </div>
  );
}