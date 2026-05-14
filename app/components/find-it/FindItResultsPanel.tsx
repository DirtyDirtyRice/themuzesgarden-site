import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import FindItResultRow from "./FindItResultRow";
import FindItResultsBrainSummary from "./FindItResultsBrainSummary";
import { useFindItResultsBrain } from "./useFindItResultsBrain";

function getResultBadgeClasses() {
  return "rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60";
}

function EmptyResultsPanel() {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-sm font-semibold text-white">
        Start typing to search
      </p>

      <p className="mt-2 text-sm leading-6 text-white/70">
        Search for pages, metadata, projects, or system concepts.
      </p>
    </section>
  );
}

function DebounceResultsPanel() {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-sm font-semibold text-white">
        Updating results…
      </p>

      <p className="mt-2 text-sm leading-6 text-white/70">
        Checking navigation, metadata, and fuzzy matches.
      </p>
    </section>
  );
}

function NoResultsPanel() {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-sm font-semibold text-white">
        No results yet
      </p>

      <p className="mt-2 text-sm text-white/70">
        Try broader or simpler words.
      </p>
    </section>
  );
}

function getPredictionRing(isPredicted: boolean) {
  if (!isPredicted) {
    return "";
  }

  return "rounded-xl ring-2 ring-indigo-400/40";
}

export default function FindItResultsPanel({
  hasSearchText,
  isWaitingForDebounce,
  matches,
  safeSelectedIndex,
  searchValue = "",
  selectResult,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matches: NavigationSearchResult[];
  safeSelectedIndex: number;
  searchValue?: string;
  selectResult: (result: NavigationSearchResult) => void;
}) {
  const brain = useFindItResultsBrain({
    searchValue,
    matches,
    safeSelectedIndex,
    selectResult,
  });

  const badgeClasses = getResultBadgeClasses();
  const predictedNodeId = brain.prediction.predictedNodeId;

  if (!hasSearchText) {
    return <EmptyResultsPanel />;
  }

  if (isWaitingForDebounce) {
    return <DebounceResultsPanel />;
  }

  if (matches.length === 0) {
    return <NoResultsPanel />;
  }

  return (
    <section className={`rounded-2xl border p-4 ${brain.panelTone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Results</p>

          <p className="mt-1 text-xs text-white/55">
            Navigate with arrows. Select before opening.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={badgeClasses}>{matches.length} found</span>
          <span className={badgeClasses}>{brain.confidenceLabel}</span>
        </div>
      </div>

      <FindItResultsBrainSummary
        intent={brain.intent}
        memory={brain.memory}
        prediction={brain.prediction}
      />

      <div className="mt-4 rounded-xl border border-indigo-400/30 bg-indigo-400/10 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/70">
          Interpretation
        </p>

        <p className="mt-1 text-sm text-indigo-100/80">
          {brain.interpretation}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-3">
        <p className="text-xs uppercase text-white/45">
          Intent
        </p>

        <p className="mt-1 text-sm font-semibold text-white">
          {brain.intent.headline}
        </p>

        <p className="mt-1 text-sm text-white/70">
          {brain.intent.explanation}
        </p>

        <p className="mt-2 text-xs text-white/50">
          Next: {brain.intent.nextStep}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-amber-200/70">
          Decision guidance
        </p>

        <p className="mt-1 text-sm text-amber-100/80">
          {brain.guidance.strategy}
        </p>

        {brain.guidance.warning ? (
          <p className="mt-1 text-xs text-amber-200/70">
            ⚠ {brain.guidance.warning}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-3">
        <p className="text-xs uppercase text-white/45">
          Current target
        </p>

        <p className="mt-1 text-sm font-semibold text-white">
          {brain.selectedResult?.node.label ?? "None"}
        </p>

        <p className="mt-1 text-xs text-white/60">
          {brain.confidenceCopy}
        </p>

        <p className="mt-2 text-[11px] text-white/45">
          Type: {brain.resultKindLabel}
        </p>
      </div>

      {brain.comparisonHint ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-2">
          <p className="text-xs text-white/55">{brain.comparisonHint}</p>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {matches.map((result, index) => {
          const isPredicted = predictedNodeId === result.node.id;

          return (
            <div
              className={getPredictionRing(isPredicted)}
              key={result.node.id}
            >
              <FindItResultRow
                isSelected={index === brain.activeSelectedIndex}
                onSelect={brain.selectResultWithMemory}
                result={result}
              />

              {isPredicted ? (
                <div className="mt-1 rounded-lg border border-indigo-300/20 bg-indigo-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-100/75">
                  Predicted best match
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}