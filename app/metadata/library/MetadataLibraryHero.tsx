import Link from "next/link";
import type { MetadataLibraryShape } from "./MetadataLibraryPageTypes";

type MetadataLibraryHeroProps = {
  library: MetadataLibraryShape;
  recordsCount: number;
  showingCount: number;
  usingSeedFallback: boolean;
};

export default function MetadataLibraryHero({
  library,
  recordsCount,
  showingCount,
  usingSeedFallback,
}: MetadataLibraryHeroProps) {
  return (
    <section className="rounded-2xl border border-white bg-black p-5 md:p-6">
      <div className="flex flex-col gap-3">
        <span
          className="text-xs font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--text-normal)" }}
        >
          Metadata Library
        </span>

        <h1
          className="text-3xl font-semibold tracking-tight md:text-4xl"
          style={{ color: "var(--text-strong)" }}
        >
          {library.label}
        </h1>

        <p
          className="max-w-3xl text-sm leading-6 md:text-base"
          style={{ color: "var(--text-normal)" }}
        >
          {library.description}
        </p>

        <div className="flex flex-wrap gap-3 pt-2 text-sm">
          <div className="rounded-lg border border-white bg-black px-3 py-2">
            <span style={{ color: "var(--text-normal)" }}>Shelves:</span>{" "}
            <span style={{ color: "var(--text-strong)" }}>
              {library.shelves.length}
            </span>
          </div>

          <div className="rounded-lg border border-white bg-black px-3 py-2">
            <span style={{ color: "var(--text-normal)" }}>Records:</span>{" "}
            <span style={{ color: "var(--text-strong)" }}>{recordsCount}</span>
          </div>

          <div className="rounded-lg border border-white bg-black px-3 py-2">
            <span style={{ color: "var(--text-normal)" }}>Showing:</span>{" "}
            <span style={{ color: "var(--text-strong)" }}>{showingCount}</span>
          </div>

          <div className="rounded-lg border border-white bg-black px-3 py-2">
            <span style={{ color: "var(--text-normal)" }}>Mode:</span>{" "}
            <span style={{ color: "var(--text-strong)" }}>
              {usingSeedFallback ? "Seed Fallback Active" : "Persistence Phase"}
            </span>
          </div>
        </div>

        {usingSeedFallback ? (
          <div
            className="rounded-lg border border-white bg-black px-3 py-2 text-sm"
            style={{ color: "var(--text-normal)" }}
          >
            Database records are currently empty, so the library is showing seed
            records.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/metadata"
            className="inline-flex rounded-md border border-white bg-black px-3 py-2 text-sm font-medium"
            style={{ color: "var(--text-strong)" }}
          >
            Back to Metadata Home
          </Link>

          <Link
            href="/metadata/create"
            className="inline-flex rounded-md border border-white bg-black px-3 py-2 text-sm font-medium"
            style={{ color: "var(--text-strong)" }}
          >
            + Create Record
          </Link>
        </div>
      </div>
    </section>
  );
}