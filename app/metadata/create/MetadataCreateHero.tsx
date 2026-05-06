import Link from "next/link";

export default function MetadataCreateHero() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              Metadata Create
            </span>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Create Record v3
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
              This page builds a record with stronger structure. The goal is not
              just to name something, but to place it intentionally, describe it
              meaningfully, and begin connecting it to the rest of the library.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/metadata"
              className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Library
            </Link>

            <Link
              href="/metadata/system"
              className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              View System
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Rule 1
            </p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Content must exist before something becomes a child.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Rule 2
            </p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              A child becomes a father only when it has children.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Rule 3
            </p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Depth is earned, not assumed.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Rule 4
            </p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              The interface must stay clean even when the system gets deep.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}