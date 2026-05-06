"use client";

import MetadataRecordDeleteButton from "./MetadataRecordDeleteButton";

type MetadataRecordActionsSectionProps = {
  recordId?: string | number | null;
  attachTrackId?: string | null;
  attached?: boolean;
  onAttach: () => void | Promise<void>;
};

function cleanText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function StatusLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-white/90">{value}</p>
    </div>
  );
}

export default function MetadataRecordActionsSection({
  recordId,
  attachTrackId,
  attached = false,
  onAttach,
}: MetadataRecordActionsSectionProps) {
  const cleanRecordId = cleanText(recordId);
  const cleanAttachTrackId = cleanText(attachTrackId);
  const hasAttachRequest = cleanAttachTrackId.length > 0;
  const hasRecordId = cleanRecordId.length > 0;

  if (!hasAttachRequest && !hasRecordId) return null;

  return (
    <section className="rounded-2xl border border-white/20 bg-black p-4 text-white">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
            Record actions
          </p>

          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-white/95">
            Quick controls
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasAttachRequest ? (
            <form action={onAttach}>
              <button
                type="submit"
                className="rounded-xl border border-white bg-white px-3 py-2 text-sm font-black text-black hover:bg-white/85"
              >
                {attached ? "Attach again" : "Attach to this track"}
              </button>
            </form>
          ) : null}

          {hasRecordId ? (
            <MetadataRecordDeleteButton recordId={cleanRecordId} />
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <StatusLine
          label="Attach"
          value={hasAttachRequest ? "Ready" : "Not active"}
        />

        <StatusLine
          label="Saved"
          value={hasRecordId ? "Database id found" : "Seed record"}
        />

        <StatusLine
          label="Status"
          value={attached ? "Attached" : "Open"}
        />
      </div>
    </section>
  );
}