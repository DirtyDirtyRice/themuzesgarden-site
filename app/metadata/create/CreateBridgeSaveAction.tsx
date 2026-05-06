import Link from "next/link";

import {
  createButtonClass,
  getDirectSaveStatusClass,
  getSaveButtonText,
  secondaryButtonClass,
} from "./createBridgeHelpers";
import type { DirectSaveStatus } from "./createBridgeTypes";

type SaveActionLinksProps = {
  recordSlug: string;
  hasSaved: boolean;
  hasDuplicateRecord: boolean;
};

export default function CreateBridgeSaveAction({
  canDirectSave,
  directSaveStatus,
  hasSaved,
  hasDuplicateRecord,
  recordViewSlug,
  submitMessage,
  submitError,
  onDirectSaveRecord,
}: {
  canDirectSave: boolean;
  directSaveStatus: DirectSaveStatus;
  hasSaved: boolean;
  hasDuplicateRecord: boolean;
  recordViewSlug: string;
  submitMessage: string;
  submitError: string;
  onDirectSaveRecord: () => void;
}) {
  return (
    <div
      id="metadata-create-action"
      className="rounded-2xl border border-white/10 bg-black/30 p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        Save action
      </p>

      <p className="mt-2 text-sm leading-6 text-white/70">
        Click Save Record one time. A successful save will lock the button so
        the same record is not inserted twice.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onDirectSaveRecord}
          disabled={!canDirectSave}
          aria-disabled={!canDirectSave}
          title={
            canDirectSave
              ? "Save this metadata record."
              : "Save is blocked, already complete, or currently running."
          }
          className={[
            "inline-flex rounded-md px-4 py-2 text-sm font-medium transition",
            createButtonClass(canDirectSave),
          ].join(" ")}
        >
          {getSaveButtonText(directSaveStatus, hasSaved)}
        </button>

        {recordViewSlug && (hasSaved || hasDuplicateRecord) ? (
          <Link
            href={`/metadata/${recordViewSlug}`}
            className={secondaryButtonClass()}
          >
            View Record
          </Link>
        ) : null}

        {hasSaved || hasDuplicateRecord ? (
          <Link href="/metadata/create" className={secondaryButtonClass()}>
            Create Another
          </Link>
        ) : null}
      </div>

      <DirectSaveStatusMessage status={directSaveStatus} />

      <SaveActionLinks
        recordSlug={recordViewSlug}
        hasSaved={hasSaved}
        hasDuplicateRecord={hasDuplicateRecord}
      />

      {submitMessage ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white/85">
          Previous save message: {submitMessage}
        </div>
      ) : null}

      {submitError ? (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Previous save error: {submitError}
        </div>
      ) : null}
    </div>
  );
}

function DirectSaveStatusMessage({ status }: { status: DirectSaveStatus }) {
  if (!status.message) return null;

  return (
    <div
      className={["mt-3 rounded-lg border", getDirectSaveStatusClass(status)].join(
        " ",
      )}
    >
      {status.message}
    </div>
  );
}

function SaveActionLinks({
  recordSlug,
  hasSaved,
  hasDuplicateRecord,
}: SaveActionLinksProps) {
  if (!hasSaved && !hasDuplicateRecord) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        Next actions
      </p>

      <p className="mt-2 text-sm leading-6 text-white/70">
        Use View Record to open the saved metadata page, or Create Another to
        start a fresh metadata record.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {recordSlug ? (
          <Link href={`/metadata/${recordSlug}`} className={secondaryButtonClass()}>
            View Record
          </Link>
        ) : null}

        <Link href="/metadata/create" className={secondaryButtonClass()}>
          Create Another
        </Link>
      </div>
    </div>
  );
}