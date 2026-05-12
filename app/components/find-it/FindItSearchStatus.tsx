export default function FindItSearchStatus({
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  selectedIndex,
  selectedLabel,
  topResultLabel,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  selectedIndex: number;
  selectedLabel: string | null;
  topResultLabel: string | null;
}) {
  if (!hasSearchText) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          Empty state
        </p>

        <p className="mt-1 text-xs leading-5 text-white/55">
          Type what you need. Find It will show matching pages, keep the safest
          destination selected, and wait for you to click before navigating.
        </p>
      </div>
    );
  }

  if (isWaitingForDebounce) {
    return (
      <div className="rounded-xl border border-sky-200/15 bg-sky-300/[0.04] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/75">
          Updating
        </p>

        <p className="mt-1 text-xs leading-5 text-sky-100/70">
          Refreshing results while you type. Your selected destination will
          stabilize as soon as the search catches up.
        </p>
      </div>
    );
  }

  if (matchCount === 0) {
    return (
      <div className="rounded-xl border border-amber-200/20 bg-amber-300/[0.05] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">
          No match yet
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-100/75">
          Try a simpler word like metadata, library, relationships, create,
          fields, placement, panel, or record.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200/15 bg-emerald-300/[0.04] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
        Results ready
      </p>

      <p className="mt-1 text-xs leading-5 text-emerald-100/70">
        {matchCount} result{matchCount === 1 ? "" : "s"} found. Result{" "}
        {selectedIndex + 1} is selected
        {selectedLabel ? `: ${selectedLabel}` : ""}. Enter is locked, so click
        a result, path step, or Go button when you are ready.
      </p>

      {topResultLabel && topResultLabel !== selectedLabel ? (
        <p className="mt-1 text-xs leading-5 text-white/45">
          Top result: {topResultLabel}
        </p>
      ) : null}
    </div>
  );
}