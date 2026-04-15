import Link from "next/link";
import {
  getMetadataLibrary,
  getMetadataRecordSummaries,
} from "@/lib/metadata/metadataLibrarySeed";

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MetadataPage() {
  const library = getMetadataLibrary();
  const records = getMetadataRecordSummaries();

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              Metadata Library
            </span>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {library.label}
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
              {library.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2 text-sm text-white/70">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                Shelves:{" "}
                <span className="font-semibold text-white">
                  {library.shelves.length}
                </span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                Records:{" "}
                <span className="font-semibold text-white">
                  {records.length}
                </span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                Mode:{" "}
                <span className="font-semibold text-white">
                  Foundation Phase
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {library.shelves.map((shelf) => (
            <article
              key={shelf.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                    Shelf
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    {shelf.label}
                  </h2>
                </div>

                <p className="text-sm leading-6 text-white/70">
                  {shelf.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {shelf.sections.map((section) => (
                    <span
                      key={section.id}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/75"
                    >
                      {section.label}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Starter Records
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Record Shells
              </h2>
            </div>

            <Link
              href="/metadata/create"
              className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              + Create Record
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {records.map((record) => (
              <article
                key={record.id}
                className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
              >
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

                <h3 className="text-lg font-semibold text-white">
                  {record.title}
                </h3>

                <p className="text-sm leading-6 text-white/70">
                  {record.excerpt}
                </p>

                <div className="mt-auto pt-2">
                  <Link
                    href={`/metadata/${record.slug}`}
                    className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    More Information
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}