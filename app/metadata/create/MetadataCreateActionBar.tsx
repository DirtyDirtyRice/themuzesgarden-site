import Link from "next/link";

type MetadataCreateActionBarProps = {
  saveReady: boolean;
  isSubmitting: boolean;
  createdSlug: string;
  onCreateRecord: () => void;
};

function createButtonClass(isEnabled: boolean, isSubmitting: boolean) {
  if (isEnabled && !isSubmitting) {
    return "border border-white/10 bg-white text-black";
  }

  return "cursor-not-allowed border border-white/10 bg-white/5 text-white/35";
}

function getCreateButtonText(saveReady: boolean, isSubmitting: boolean) {
  if (isSubmitting) {
    return "Creating Record...";
  }

  if (!saveReady) {
    return "Complete required fields first";
  }

  return "Create Record Now";
}

export default function MetadataCreateActionBar({
  saveReady,
  isSubmitting,
  createdSlug,
  onCreateRecord,
}: MetadataCreateActionBarProps) {
  const isCreateDisabled = !saveReady || isSubmitting;

  return (
    <section className="sticky top-3 z-20 rounded-2xl border border-white/10 bg-black/85 p-4 backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Create Navigation
            </p>

            <p className="text-sm text-white/75">
              Jump faster, keep actions visible, and finish the required form
              fields before the create button turns on.
            </p>

            {!saveReady ? (
              <p className="text-xs text-white/45">
                Create is currently blocked. Open Create Form, finish the
                missing required fields, then return to Save.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/metadata/library"
              className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:opacity-85 hover:scale-[0.98]"
            >
              Library
            </Link>

            <Link
              href="/metadata/system"
              className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:opacity-85 hover:scale-[0.98]"
            >
              System
            </Link>

            {createdSlug ? (
              <Link
                href={`/metadata/${createdSlug}`}
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:opacity-85 hover:scale-[0.98]"
              >
                Open Created Record
              </Link>
            ) : null}

            <button
              type="button"
              onClick={onCreateRecord}
              disabled={isCreateDisabled}
              aria-disabled={isCreateDisabled}
              title={
                saveReady
                  ? "Create this metadata record."
                  : "Create is blocked until the required fields are complete."
              }
              className={[
                "inline-flex rounded-md px-4 py-2 text-sm font-medium transition",
                createButtonClass(saveReady, isSubmitting),
              ].join(" ")}
            >
              {getCreateButtonText(saveReady, isSubmitting)}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="#metadata-create-builder"
            className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:opacity-85 hover:scale-[0.98]"
          >
            Builder
          </a>

          <a
            href="#metadata-create-output"
            className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:opacity-85 hover:scale-[0.98]"
          >
            Output
          </a>

          <a
            href="#metadata-create-bridge"
            className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:opacity-85 hover:scale-[0.98]"
          >
            Bridge
          </a>

          <a
            href="#metadata-create-action"
            className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:opacity-85 hover:scale-[0.98]"
          >
            Final Create
          </a>
        </div>
      </div>
    </section>
  );
}