import { useEffect, useRef } from "react";

import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import FindItSuggestionButton from "./FindItSuggestionButton";
import {
  getMatchedTokenCount,
  HighlightedResultLabel,
} from "./FindItMatchingHighlight";

export default function FindItMatchingResultRow({
  active,
  isTopResult,
  result,
  searchTokens,
  matchScore,
  onSelect,
}: {
  active: boolean;
  isTopResult: boolean;
  result: NavigationSearchResult;
  searchTokens: string[];
  matchScore: number;
  onSelect: (result: NavigationSearchResult) => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const matchedTokenCount = getMatchedTokenCount(result.node.label, searchTokens);

  useEffect(() => {
    if (!active) {
      return;
    }

    rowRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [active]);

  return (
    <div
      ref={rowRef}
      className={[
        "rounded-xl border p-1 transition",
        active
          ? "border-emerald-200/45 bg-emerald-300/[0.065] shadow-[0_0_0_1px_rgba(167,243,208,0.16)]"
          : "border-white/5 bg-black/20",
      ].join(" ")}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 px-2 pt-1">
        <p className="text-[11px] font-semibold leading-5 text-white/65">
          <HighlightedResultLabel
            label={result.node.label}
            tokens={searchTokens}
          />
        </p>

        <div className="flex flex-wrap gap-1.5">
          {isTopResult ? (
            <span className="rounded-full border border-emerald-100/20 bg-emerald-300/[0.08] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-50/80">
              Top
            </span>
          ) : null}

          {active ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">
              Selected
            </span>
          ) : null}

          {matchedTokenCount > 0 ? (
            <span className="rounded-full border border-amber-100/15 bg-amber-200/[0.08] px-2 py-0.5 text-[10px] font-semibold text-amber-50/75">
              {matchedTokenCount} hit{matchedTokenCount === 1 ? "" : "s"}
            </span>
          ) : null}

          {matchScore > 0 ? (
            <span className="rounded-full border border-sky-100/15 bg-sky-200/[0.06] px-2 py-0.5 text-[10px] font-semibold text-sky-50/70">
              score {matchScore}
            </span>
          ) : null}
        </div>
      </div>

      <FindItSuggestionButton
        result={result}
        active={active}
        onSelect={onSelect}
      />
    </div>
  );
}