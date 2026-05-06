import Link from "next/link";
import type { MetadataLibraryShelf } from "./MetadataLibraryPageTypes";

type MetadataLibraryShelvesPanelProps = {
  shelves: MetadataLibraryShelf[];
};

export default function MetadataLibraryShelvesPanel({
  shelves,
}: MetadataLibraryShelvesPanelProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {shelves.map((shelf) => (
        <Link
          key={shelf.id}
          href={`/metadata/shelf/${shelf.key}`}
          className="group block rounded-2xl border border-white bg-black p-5 transition hover:border-white"
        >
          <div className="flex h-full flex-col gap-3">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--text-normal)" }}
              >
                Shelf
              </p>

              <h2
                className="mt-1 text-xl font-semibold"
                style={{ color: "var(--text-strong)" }}
              >
                {shelf.label}
              </h2>
            </div>

            <p
              className="text-sm leading-6"
              style={{ color: "var(--text-normal)" }}
            >
              {shelf.description}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {shelf.sections.map((section) => (
                <span
                  key={section.id}
                  className="rounded-full border border-white bg-black px-3 py-1 text-xs"
                  style={{ color: "var(--text-normal)" }}
                >
                  {section.label}
                </span>
              ))}
            </div>

            <div className="mt-auto pt-3">
              <span
                className="inline-flex rounded-md border border-white bg-black px-3 py-2 text-sm font-medium"
                style={{ color: "var(--text-strong)" }}
              >
                Open Shelf
              </span>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}