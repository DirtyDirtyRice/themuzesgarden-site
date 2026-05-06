"use client";

type HeaderRecordLike = {
  title?: string | number | null;
  slug?: string | number | null;
  excerpt?: string | number | null;
  description?: string | number | null;
  shelf?: string | number | null;
  section?: string | number | null;
  visibility?: string | number | null;
  status?: string | number | null;
  recordType?: string | number | null;
};

function asText(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function asRecord(value: unknown): HeaderRecordLike {
  if (value && typeof value === "object") return value as HeaderRecordLike;
  return {};
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }

  return "";
}

function formatLabel(value: unknown, fallback = "Not set") {
  const text = asText(value);

  if (!text) return fallback;

  return text
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function HeaderChip({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-white/90">
        {formatLabel(value)}
      </p>
    </div>
  );
}

export default function MetadataRecordPageHeader(props: Record<string, unknown>) {
  const record = asRecord(props.record);

  const title = firstText(
    props.title,
    record.title,
    props.recordTitle,
    "Metadata Record",
  );

  const slug = firstText(props.slug, record.slug);

  const excerpt = firstText(
    props.excerpt,
    record.excerpt,
    props.description,
    record.description,
    "Review relationships first, then supporting fields lower on the page.",
  );

  const shelf = firstText(props.shelf, record.shelf);
  const section = firstText(props.section, record.section);
  const visibility = firstText(props.visibility, record.visibility, "Draft");
  const status = firstText(props.status, record.status, "Active");
  const recordType = firstText(props.recordType, record.recordType, "Record");

  return (
    <header className="rounded-2xl border border-white/20 bg-black p-4 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
            Metadata record
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white/95 sm:text-4xl">
            {title}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
            {excerpt}
          </p>

          {slug ? (
            <p className="mt-2 break-all text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              Slug: {slug}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            className="rounded-xl border border-white/25 px-3 py-2 text-sm font-bold text-white/90 hover:bg-white/[0.06]"
            href="/metadata/library"
          >
            Back to Library
          </a>

          <a
            className="rounded-xl border border-white/25 px-3 py-2 text-sm font-bold text-white/90 hover:bg-white/[0.06]"
            href="/metadata"
          >
            Metadata Home
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <HeaderChip label="Shelf" value={shelf} />
        <HeaderChip label="Section" value={section} />
        <HeaderChip label="Type" value={recordType} />
        <HeaderChip label="Visibility" value={visibility} />
        <HeaderChip label="Status" value={status} />
      </div>
    </header>
  );
}