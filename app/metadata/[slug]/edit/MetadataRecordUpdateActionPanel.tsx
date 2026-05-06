import Link from "next/link";

type Props = {
  updatedRecordJson: string;
  canSubmitUpdate: boolean;
  isSubmitting: boolean;
  updatedSlug: string;
  submitMessage: string;
  submitError: string;
  hasDuplicateRelationshipSelection: boolean;
  onUpdateRecord: () => void;
  onEditAgain: () => void;
};

export default function MetadataRecordUpdateActionPanel({
  updatedRecordJson,
  canSubmitUpdate,
  isSubmitting,
  updatedSlug,
  submitMessage,
  submitError,
  hasDuplicateRelationshipSelection,
  onUpdateRecord,
  onEditAgain,
}: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
            Updated Record Output
          </span>

          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Updated Record Output
          </h2>

          <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
            This is the updated record that will be saved back to the database.
            The original record id stays stable.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Updated MetadataRecord JSON
            </p>
          </div>

          <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-white/85 md:text-sm">
            {updatedRecordJson}
          </pre>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Real edit action
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onEditAgain}
              className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Edit Again → Back to Form
            </button>

            <button
              type="button"
              onClick={onUpdateRecord}
              disabled={!canSubmitUpdate || isSubmitting}
              className={[
                "inline-flex rounded-md px-4 py-2 text-sm font-medium transition",
                canSubmitUpdate && !isSubmitting
                  ? "border border-white/10 bg-white text-black hover:bg-white/90"
                  : "cursor-not-allowed border border-white/10 bg-white/5 text-white/35",
              ].join(" ")}
            >
              {isSubmitting ? "Updating Record..." : "Update Record Now"}
            </button>

            {updatedSlug ? (
              <Link
                href={`/metadata/${updatedSlug}`}
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Open Updated Record
              </Link>
            ) : null}
          </div>

          {submitMessage ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white/85">
              {submitMessage}
            </div>
          ) : null}

          {submitError ? (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {submitError}
            </div>
          ) : null}

          {!submitError && hasDuplicateRelationshipSelection ? (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              That relationship already exists on this record.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}