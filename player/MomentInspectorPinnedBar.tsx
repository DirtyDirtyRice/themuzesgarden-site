"use client";

export default function MomentInspectorPinnedBar(props: {
  pinnedCount: number;
  totalCount: number;
  visibleCount: number;
  pinnedOnly: boolean;
  onTogglePinnedOnly: () => void;
  onResetPins: () => void;
}) {
  const {
    pinnedCount,
    totalCount,
    visibleCount,
    pinnedOnly,
    onTogglePinnedOnly,
    onResetPins,
  } = props;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTogglePinnedOnly}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              pinnedOnly
                ? "border-violet-300 bg-violet-50 text-violet-800"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
            aria-pressed={pinnedOnly}
            title="Show only pinned families"
          >
            {pinnedOnly ? "Pinned Only On" : "Pinned Only Off"}
          </button>

          <button
            type="button"
            onClick={onResetPins}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            title="Clear all pinned families"
          >
            Clear Pins
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
          <span>
            Pinned{" "}
            <span className="font-semibold text-zinc-900">{pinnedCount}</span>{" "}
            of{" "}
            <span className="font-semibold text-zinc-900">{totalCount}</span>
          </span>

          <span>
            Visible{" "}
            <span className="font-semibold text-zinc-900">{visibleCount}</span>
          </span>

          <span>
            Mode{" "}
            <span className="font-semibold text-zinc-900">
              {pinnedOnly ? "pinned-only" : "all-visible"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}