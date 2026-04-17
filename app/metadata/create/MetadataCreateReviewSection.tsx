export default function MetadataCreateReviewSection({
  requiredReadyCount,
  hasRelationshipStarter,
  missingItems,
  canContinue,
  recordType,
  activeShelfLabel,
  activeSectionLabel,
  visibility,
  generatedSlug,
}: {
  requiredReadyCount: number;
  hasRelationshipStarter: boolean;
  missingItems: string[];
  canContinue: boolean;
  recordType: string;
  activeShelfLabel: string;
  activeSectionLabel: string;
  visibility: string;
  generatedSlug: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            Continue Panel
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Foundation readiness
          </h3>
        </div>

        <div className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/70">
          {requiredReadyCount} / 7 required complete
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm font-semibold text-white">Current state</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {canContinue
              ? "This record has enough real structure to move into the next creation phase and already supports a valid structural output model."
              : "This draft is not ready yet. It still needs more real structure before it should move forward into the next creation phase."}
          </p>

          <div className="mt-3 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white/70">
            Optional relationship starter:{" "}
            <span className="text-white">
              {hasRelationshipStarter ? "included" : "not added yet"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm font-semibold text-white">Missing items</p>

          {missingItems.length ? (
            <div className="mt-2 flex flex-col gap-2 text-sm text-white/70">
              {missingItems.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-black px-3 py-2"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-white/70">
              No missing required items. This record has a real foundation.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
          Review before continue
        </p>
        <div className="mt-3 grid gap-2 text-sm text-white/70">
          <div className="rounded-lg border border-white/10 bg-black px-3 py-2">
            Type: <span className="text-white capitalize">{recordType}</span>
          </div>
          <div className="rounded-lg border border-white/10 bg-black px-3 py-2">
            Placement:{" "}
            <span className="text-white">
              {activeShelfLabel || "No shelf"} →{" "}
              {activeSectionLabel || "No section"}
            </span>
          </div>
          <div className="rounded-lg border border-white/10 bg-black px-3 py-2">
            Visibility:{" "}
            <span className="text-white capitalize">{visibility}</span>
          </div>
          <div className="rounded-lg border border-white/10 bg-black px-3 py-2">
            Slug path:{" "}
            <span className="text-white">
              {generatedSlug ? `/metadata/${generatedSlug}` : "/metadata/"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
          Next phase intent
        </p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          The next system phase can turn this structural model into real
          creation flow, add stronger field validation, allow relationship
          stacking, and save the record into the metadata library.
        </p>
      </div>

      <div className="mt-4">
        <button
          type="button"
          disabled={!canContinue}
          className={[
            "inline-flex rounded-md px-4 py-2 text-sm font-medium transition",
            canContinue
              ? "border border-white/10 bg-white text-black hover:bg-white/90"
              : "cursor-not-allowed border border-white/10 bg-white/5 text-white/35",
          ].join(" ")}
        >
          Continue to Next Step
        </button>

        <p className="mt-3 text-xs text-white/45">
          Still intentionally non-submitting for now. This button is a readiness
          gate, not a fake save action.
        </p>
      </div>
    </div>
  );
}