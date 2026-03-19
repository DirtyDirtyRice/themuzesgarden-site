"use client";

export default function MomentInspectorSnapshotBar(props: {
  filename: string;
  selectedTrackId: string;
  selectedPhraseFamilyId: string;
  selectedVerdict: string;
  pinnedCount: number;
  pinnedOnly: boolean;
  compareReady: boolean;
  onExportSnapshot: () => void;
}) {
  const {
    filename,
    selectedTrackId,
    selectedPhraseFamilyId,
    selectedVerdict,
    pinnedCount,
    pinnedOnly,
    compareReady,
    onExportSnapshot,
  } = props;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-3">
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            Snapshot Export
          </div>
          <div className="text-xs text-zinc-600">
            Export the current inspector host state as JSON.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportSnapshot}
            className="rounded-full border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
          >
            Export Snapshot
          </button>

          <span className="text-xs text-zinc-500">
            {filename}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-600">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Track{" "}
              <span className="font-semibold text-zinc-900">
                {selectedTrackId || "none"}
              </span>
            </span>

            <span>
              Family{" "}
              <span className="font-semibold text-zinc-900">
                {selectedPhraseFamilyId || "none"}
              </span>
            </span>

            <span>
              Verdict{" "}
              <span className="font-semibold text-zinc-900">
                {selectedVerdict}
              </span>
            </span>

            <span>
              Pins{" "}
              <span className="font-semibold text-zinc-900">
                {pinnedCount}
              </span>
            </span>

            <span>
              Mode{" "}
              <span className="font-semibold text-zinc-900">
                {pinnedOnly ? "pinned-only" : "all-visible"}
              </span>
            </span>

            <span>
              Compare{" "}
              <span className="font-semibold text-zinc-900">
                {compareReady ? "ready" : "not-ready"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}