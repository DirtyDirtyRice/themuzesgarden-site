type SaveReadinessMessageProps = {
  saveReady: boolean;
  saveBlockedReasons: string[];
  directSaveBlockedReason: string;
  hasSaved: boolean;
  hasDuplicateRecord: boolean;
};

export default function CreateBridgeReadiness({
  saveReady,
  saveBlockedReasons,
  directSaveBlockedReason,
  hasSaved,
  hasDuplicateRecord,
}: SaveReadinessMessageProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        Save blockers
      </p>

      <SaveReadinessMessage
        saveReady={saveReady}
        saveBlockedReasons={saveBlockedReasons}
        hasSaved={hasSaved}
        hasDuplicateRecord={hasDuplicateRecord}
      />

      {directSaveBlockedReason ? (
        <p className="mt-3 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white/65">
          Save check: {directSaveBlockedReason}
        </p>
      ) : null}
    </div>
  );
}

function SaveReadinessMessage({
  saveReady,
  saveBlockedReasons,
  hasSaved,
  hasDuplicateRecord,
}: {
  saveReady: boolean;
  saveBlockedReasons: string[];
  hasSaved: boolean;
  hasDuplicateRecord: boolean;
}) {
  if (hasSaved) {
    return (
      <p className="mt-3 text-sm leading-6 text-emerald-100">
        Saved. The save button is locked so the same record is not inserted
        twice.
      </p>
    );
  }

  if (hasDuplicateRecord) {
    return (
      <p className="mt-3 text-sm leading-6 text-yellow-100">
        This record already exists. Use View Record or Create Another instead of
        saving this same slug again.
      </p>
    );
  }

  if (saveReady) {
    return (
      <p className="mt-3 text-sm leading-6 text-white/80">
        This record is ready. Save it once, then use View Record or Create
        Another.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black px-3 py-3">
      <p className="text-sm font-semibold text-white">
        Save is blocked right now.
      </p>

      <p className="mt-1 text-sm leading-6 text-white/60">
        Finish the missing required fields before saving this metadata record.
      </p>

      {saveBlockedReasons.length ? (
        <div className="mt-3 flex flex-col gap-2">
          {saveBlockedReasons.map((reason) => (
            <div
              key={reason}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80"
            >
              {reason}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}