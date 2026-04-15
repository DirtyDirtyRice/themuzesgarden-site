import Link from "next/link";
import { getMetadataRecordBySlug } from "@/lib/metadata/metadataLibrarySeed";

type MetadataRecordMorePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderFieldValue(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

export default async function MetadataRecordMorePage({
  params,
}: MetadataRecordMorePageProps) {
  const { slug } = await params;
  const record = getMetadataRecordBySlug(slug);

  if (!record) {
    return (
      <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-white/45">
              Metadata More Information
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Record Not Found
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              The deeper information page could not be opened because this
              metadata record does not exist in the current foundation dataset.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/metadata"
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back to Metadata Library
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {formatLabel(record.shelf)}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {formatLabel(record.section)}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {formatLabel(record.visibility)}
              </span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              More Information
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {record.title}
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
              {record.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/metadata/${record.slug}`}
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back to Record
              </Link>

              <Link
                href="/metadata"
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back to Metadata Library
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Expanded Explanation
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Why This Record Matters
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-white/75 md:text-base">
            <p>
              This page is the deeper explanation layer for the metadata library
              system. The short record page gives the fast summary. This page is
              where longer explanations, examples, workflows, hierarchy notes,
              beginner guidance, and future tutorial material can live.
            </p>

            <p>
              In the current foundation phase, this section acts as a structured
              shell. It gives the system a place to grow before the full
              knowledge network, advanced help content, and create-system
              explanations are filled in.
            </p>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Current Record Summary
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {record.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {record.description}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Example Uses
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Future Guidance Slots
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Beginner Explanation
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                This area can later explain the term in plain English for first
                time users, including what it means and where it fits in the
                larger system.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Practical Example
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                This area can later show a concrete musical or interface example
                so users understand how the record is used in practice.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Hierarchy Placement
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                This area can later explain parent-child structure, related
                records, and where this record belongs inside the library.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Create-System Connection
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                This area can later connect create actions, tooltips, buttons,
                and help popups back into the metadata knowledge system.
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Record Fields
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Source Data Snapshot
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {record.fields.map((field) => (
              <article
                key={field.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  {field.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {renderFieldValue(field.value)}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}