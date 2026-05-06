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
  onContinue,
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
  onContinue?: () => void;
}) {
  function isDone(label: string) {
    return !missingItems.includes(label);
  }

  function StatusRow({
    label,
    done,
  }: {
    label: string;
    done: boolean;
  }) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black px-3 py-2 text-sm">
        <span className="text-white/80">{label}</span>
        <span className={done ? "text-green-400" : "text-red-400"}>
          {done ? "DONE" : "NOT DONE"}
        </span>
      </div>
    );
  }

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

          <p className="mt-2 text-sm leading-6 text-white/60">
            Review all required fields. This checklist shows exactly what is complete and what still needs work.
          </p>
        </div>

        <div className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/70">
          {requiredReadyCount} / 7 required complete
        </div>
      </div>

      {/* CHECKLIST */}
      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="text-sm font-semibold text-white">
          Completion checklist
        </p>

        <div className="mt-3 flex flex-col gap-2">
          <StatusRow label="Title" done={isDone("title")} />
          <StatusRow label="Description" done={isDone("description")} />
          <StatusRow label="Placement" done={isDone("placement")} />
          <StatusRow label="Visibility" done={isDone("visibility")} />
          <StatusRow label="Slug" done={isDone("slug")} />
          <StatusRow
            label="Relationship starter"
            done={hasRelationshipStarter}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm font-semibold text-white">Current state</p>

          <p className="mt-2 text-sm leading-6 text-white/70">
            {canContinue
              ? "This record is ready to move into the Save panel."
              : "This record is not ready yet. Use the checklist above to complete missing fields."}
          </p>
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
              Nothing missing. Ready to save.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
          Review before save
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

      <div className="mt-4">
        <button
          type="button"
          disabled={!canContinue}
          onClick={canContinue ? onContinue : undefined}
          className={[
            "inline-flex rounded-md px-4 py-2 text-sm font-medium transition",
            canContinue
              ? "border border-white/10 bg-white text-black hover:opacity-85 hover:scale-[0.98]"
              : "cursor-not-allowed border border-white/10 bg-white/5 text-white/35",
          ].join(" ")}
        >
          {canContinue ? "Continue to Save" : "Complete required fields first"}
        </button>

        <p className="mt-3 text-xs text-white/45">
          Complete all required fields shown above to unlock this button.
        </p>
      </div>
    </div>
  );
}