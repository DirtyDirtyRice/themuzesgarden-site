import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { FindItMatch, FindItTarget } from "./findItTypes";
import FindItTreeStep from "./FindItTreeStep";
import {
  findItMatches,
  getCurrentLocationSummary,
  getDefaultFindItMatches,
  getFindItEmptyMessage,
  getFindItSuggestionPhrases,
} from "./findItPathUtils";

function ExactStepsList({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/70 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
        Exact steps
      </p>

      <ol className="mt-3 flex flex-col gap-2 text-sm leading-6 text-white/80">
        {steps.map((step, index) => (
          <li
            key={`${step}-${index}`}
            className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <span className="shrink-0 font-bold text-white">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FindItSuggestionButton({
  match,
  active,
  onSelect,
}: {
  match: FindItMatch;
  active: boolean;
  onSelect: (target: FindItTarget) => void;
}) {
  const { target, matchedWords } = match;

  return (
    <button
      type="button"
      onClick={() => onSelect(target)}
      className={[
        "w-full rounded-xl border p-3 text-left transition duration-150",
        "hover:scale-[0.995] hover:opacity-90 active:scale-[0.985]",
        active
          ? "border-white bg-white text-black"
          : "border-white/10 bg-black text-white",
      ].join(" ")}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">{target.shortLabel}</span>
        <span
          className={[
            "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
            active
              ? "border-black/20 text-black/70"
              : "border-white/15 text-white/50",
          ].join(" ")}
        >
          {target.category}
        </span>
      </span>

      <span
        className={[
          "mt-2 block text-xs leading-5",
          active ? "text-black/70" : "text-white/55",
        ].join(" ")}
      >
        {target.detail}
      </span>

      {matchedWords.length > 0 ? (
        <span
          className={[
            "mt-2 block text-[11px]",
            active ? "text-black/55" : "text-white/40",
          ].join(" ")}
        >
          Matched: {matchedWords.join(", ")}
        </span>
      ) : null}
    </button>
  );
}

function CurrentPagePanel({ pathname }: { pathname: string }) {
  const currentSummary = useMemo(
    () => getCurrentLocationSummary(pathname),
    [pathname],
  );
  const currentFinalStep =
    currentSummary.steps[currentSummary.steps.length - 1] ?? "Current page";

  return (
    <div className="rounded-xl border border-sky-300/25 bg-sky-300/10 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
        Current page
      </p>

      <p className="mt-2 text-base font-semibold text-white">
        {currentSummary.label}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {currentSummary.steps.map((step) => (
          <FindItTreeStep
            key={`current-${step}`}
            label={step}
            marker={step === currentFinalStep ? "here" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function TargetPathPanel({ target }: { target: FindItTarget | null }) {
  const targetSteps = target?.steps ?? ["Type what you are trying to find"];
  const targetFinalStep = targetSteps[targetSteps.length - 1];
  const startButtonText = target?.startButtonLabel || "Go to starting page";

  return (
    <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
        Target path
      </p>

      <p className="mt-2 text-base font-semibold text-white">
        {target?.label ?? "Type a destination to build the path"}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {targetSteps.map((step) => (
          <FindItTreeStep
            key={`target-${step}`}
            label={step}
            marker={target && step === targetFinalStep ? "target" : undefined}
          />
        ))}
      </div>

      {target ? (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/60 p-3">
          <p className="text-sm leading-6 text-white/75">{target.detail}</p>

          <ExactStepsList steps={target.exactSteps} />

          <Link
            href={target.route}
            aria-label={startButtonText}
            className="inline-flex w-fit items-center justify-center rounded-lg border border-white/15 bg-white px-4 py-2 text-sm font-bold !text-black transition hover:opacity-85 active:scale-[0.98]"
          >
            {startButtonText}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

type GroupedMatches = {
  category: FindItTarget["category"];
  matches: FindItMatch[];
};

const CATEGORY_ORDER: FindItTarget["category"][] = [
  "Record",
  "Create",
  "Metadata",
  "Navigation",
  "Help",
];

const CATEGORY_HELP_TEXT: Record<FindItTarget["category"], string> = {
  Record: "Actions for opening, editing, deleting, or reading a record.",
  Create: "Actions for building a new metadata record.",
  Metadata: "Metadata library and structure destinations.",
  Navigation: "Main app pages outside the metadata workflow.",
  Help: "Explanation, guidance, and navigation support.",
};

function groupMatchesByCategory(matches: FindItMatch[]): GroupedMatches[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    matches: matches.filter((match) => match.target.category === category),
  })).filter((group) => group.matches.length > 0);
}

function DidYouMeanPanel({
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
        Did you mean?
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

function MatchingOptionsPanel({
  matches,
  selectedTargetId,
  searchValue,
  suggestions,
  onSelect,
  onSuggestionClick,
}: {
  matches: FindItMatch[];
  selectedTargetId: string | null;
  searchValue: string;
  suggestions: string[];
  onSelect: (target: FindItTarget) => void;
  onSuggestionClick: (suggestion: string) => void;
}) {
  const groupedMatches = useMemo(() => groupMatchesByCategory(matches), [matches]);
  const cleanSearchValue = searchValue.trim().toLowerCase();
  const visibleSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.trim().toLowerCase() !== cleanSearchValue &&
      suggestion.trim().length > 3,
  );
  const resultCount = matches.length;
  const resultLabel = resultCount === 1 ? "1 option" : `${resultCount} options`;

  return (
    <div className="rounded-xl border border-white/10 bg-black/70 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
            Matching options
          </p>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {getFindItEmptyMessage(searchValue)}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
          {resultLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-4">
        <DidYouMeanPanel
          suggestions={visibleSuggestions}
          onSuggestionClick={onSuggestionClick}
        />

        {groupedMatches.map((group) => (
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
                  {CATEGORY_HELP_TEXT[group.category]}
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold text-white/45">
                {group.matches.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {group.matches.map((match) => (
                <FindItSuggestionButton
                  key={match.target.id}
                  match={match}
                  active={match.target.id === selectedTargetId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MoreInfoPreview() {
  return (
    <div className="rounded-xl border border-white/10 bg-black px-3 py-3">
      <button
        type="button"
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98]"
      >
        More info?
      </button>

      <p className="mt-2 text-sm leading-6 text-white/60">
        This is still the preview version of the global navigation helper. The
        next future upgrade is the full app tree, deeper page explanations, and
        encyclopedia-style route help.
      </p>
    </div>
  );
}

function clampSelectedIndex(index: number, matches: FindItMatch[]) {
  if (matches.length === 0) return 0;
  if (index < 0) return matches.length - 1;
  if (index >= matches.length) return 0;
  return index;
}

export default function FindItPanel({
  pathname,
  searchValue,
  onSearchChange,
}: {
  pathname: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  const router = useRouter();
  const typedMatches = useMemo(() => findItMatches(searchValue), [searchValue]);
  const defaultMatches = useMemo(
    () => getDefaultFindItMatches(pathname),
    [pathname],
  );
  const suggestions = useMemo(
    () => getFindItSuggestionPhrases(searchValue),
    [searchValue],
  );
  const matches = typedMatches.length > 0 ? typedMatches : defaultMatches;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedTarget =
    matches[selectedIndex]?.target ?? matches[0]?.target ?? null;

  function selectTarget(target: FindItTarget) {
    const nextIndex = matches.findIndex((match) => match.target.id === target.id);

    setSelectedIndex(nextIndex >= 0 ? nextIndex : 0);
  }

  function goToSelectedTarget() {
    if (!selectedTarget) return;

    router.push(selectedTarget.route);
  }

  function handleSearchChange(value: string) {
    setSelectedIndex(0);
    onSearchChange(value);
  }

  function handleSuggestionClick(suggestion: string) {
    handleSearchChange(suggestion);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => clampSelectedIndex(current + 1, matches));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => clampSelectedIndex(current - 1, matches));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      goToSelectedTarget();
    }
  }

  return (
    <div className="border-t border-white/10 bg-black/95 px-4 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-2xl border border-white/15 bg-white/[0.03] p-4 text-white shadow-2xl">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60">
            Find It
          </p>

          <label
            htmlFor="find-it-search"
            className="text-xl font-semibold text-white"
          >
            What are you trying to find?
          </label>

          <input
            id="find-it-search"
            value={searchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Example: relationships, create record, required fields, placement, library"
            className="rounded-xl border border-white/15 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/35 focus:border-white/40"
          />

          <p className="text-xs leading-5 text-white/45">
            Keyboard: use ↑ and ↓ to move through options, then press Enter to
            go to the selected starting page.
          </p>
        </div>

        <div className="grid gap-3 xl:grid-cols-[0.85fr_1fr_1.2fr]">
          <CurrentPagePanel pathname={pathname} />

          <MatchingOptionsPanel
            matches={matches}
            selectedTargetId={selectedTarget?.id ?? null}
            searchValue={searchValue}
            suggestions={suggestions}
            onSelect={selectTarget}
            onSuggestionClick={handleSuggestionClick}
          />

          <TargetPathPanel target={selectedTarget} />
        </div>

        <MoreInfoPreview />
      </div>
    </div>
  );
}