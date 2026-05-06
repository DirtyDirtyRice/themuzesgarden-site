type MetadataCreateOutputPanelProps = {
  finalRecord: {
    id: string;
    slug: string;
    fields: { id: string }[];
    relationships: { id: string }[];
  };
  finalRecordJson: string;
};

export default function MetadataCreateOutputPanel({
  finalRecord,
  finalRecordJson,
}: MetadataCreateOutputPanelProps) {
  return (
    <section
      id="metadata-create-output"
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
            Final Record Output
          </span>

          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Final Record Output
          </h2>

          <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
            This is the full structured record object generated from the current
            builder state. It includes the metadata record shape, starter
            fields, and relationship structure.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Record ID
            </p>
            <p className="mt-2 break-all text-sm leading-6 text-white/85">
              {finalRecord.id}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Slug
            </p>
            <p className="mt-2 break-all text-sm leading-6 text-white/85">
              {finalRecord.slug}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Fields
            </p>
            <p className="mt-2 text-sm leading-6 text-white/85">
              {finalRecord.fields.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Relationships
            </p>
            <p className="mt-2 text-sm leading-6 text-white/85">
              {finalRecord.relationships.length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              MetadataRecord JSON
            </p>
          </div>

          <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-white/85 md:text-sm">
            {finalRecordJson}
          </pre>
        </div>
      </div>
    </section>
  );
}