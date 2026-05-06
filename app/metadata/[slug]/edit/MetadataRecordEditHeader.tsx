import Link from "next/link";
import MetadataRecordDeleteButton from "../MetadataRecordDeleteButton";

type Props = {
  recordId: string;
  recordSlug: string;
  recordTitle: string;
};

export default function MetadataRecordEditHeader({
  recordId,
  recordSlug,
  recordTitle,
}: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              Metadata Edit
            </span>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Edit Record
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
              Update the record while keeping the same structural rules used by
              the create system.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/metadata/${recordSlug}`}
              className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Record
            </Link>

            <Link
              href="/metadata"
              className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Library
            </Link>

            <MetadataRecordDeleteButton
              recordId={recordId}
              recordTitle={recordTitle}
            />
          </div>
        </div>
      </div>
    </section>
  );
}