"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type MetadataLibraryPanel = "records";

type RecordFilterOption = {
  label: string;
  value: string;
};

type MetadataLibraryRecordFiltersProps = {
  activeQuery: string;
  activeShelf: string;
  activeVisibility: string;
  filteredCount: number;
  hasActiveRecordFilters: boolean;
  shelfOptions: RecordFilterOption[];
  totalCount: number;
  visibilityOptions: RecordFilterOption[];
};

function buildLibraryHref(params: {
  panel: MetadataLibraryPanel;
  q?: string;
  shelf?: string;
  visibility?: string;
}) {
  const query = new URLSearchParams();

  query.set("panel", params.panel);

  if (params.q) query.set("q", params.q);
  if (params.shelf) query.set("shelf", params.shelf);
  if (params.visibility) query.set("visibility", params.visibility);

  return `/metadata/library?${query.toString()}`;
}

function getChipClass(active: boolean) {
  return [
    "rounded-full border px-3 py-1 text-xs transition duration-150",
    "hover:opacity-85 active:scale-[0.98]",
    active
      ? "border-white bg-white text-black"
      : "border-white text-white",
  ].join(" ");
}

export default function MetadataLibraryRecordFilters({
  activeQuery,
  activeShelf,
  activeVisibility,
  filteredCount,
  hasActiveRecordFilters,
  shelfOptions,
  totalCount,
  visibilityOptions,
}: MetadataLibraryRecordFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchText, setSearchText] = useState(activeQuery);

  useEffect(() => {
    setSearchText(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    const nextQuery = searchText.trim();
    if (nextQuery === activeQuery) return;

    const timeout = window.setTimeout(() => {
      startTransition(() => {
        router.replace(
          buildLibraryHref({
            panel: "records",
            q: nextQuery,
            shelf: activeShelf,
            visibility: activeVisibility,
          }),
          { scroll: false },
        );
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchText, activeQuery, activeShelf, activeVisibility, router]);

  function goTo(params: {
    q?: string;
    shelf?: string;
    visibility?: string;
  }) {
    startTransition(() => {
      router.replace(
        buildLibraryHref({
          panel: "records",
          q: params.q,
          shelf: params.shelf,
          visibility: params.visibility,
        }),
        { scroll: false },
      );
    });
  }

  return (
    <>
      <div className="mb-5 rounded-2xl border border-white bg-black p-4 text-white">
        {/* SEARCH */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Search Records
          </label>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search title or excerpt"
              className="min-h-11 flex-1 rounded-md border border-white bg-black px-3 py-2 text-sm text-white outline-none"
            />

            {hasActiveRecordFilters && (
              <button
                onClick={() => goTo({})}
                className="rounded-md border border-white bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-85 active:scale-[0.98]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* SHELF */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Shelf
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  goTo({
                    q: activeQuery,
                    visibility: activeVisibility,
                  })
                }
                className={getChipClass(!activeShelf)}
              >
                All
              </button>

              {shelfOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    goTo({
                      q: activeQuery,
                      shelf: opt.value,
                      visibility: activeVisibility,
                    })
                  }
                  className={getChipClass(activeShelf === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* VISIBILITY */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Visibility
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  goTo({
                    q: activeQuery,
                    shelf: activeShelf,
                  })
                }
                className={getChipClass(!activeVisibility)}
              >
                All
              </button>

              {visibilityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    goTo({
                      q: activeQuery,
                      shelf: activeShelf,
                      visibility: opt.value,
                    })
                  }
                  className={getChipClass(activeVisibility === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STATUS */}
      <div className="mb-4 rounded-lg border border-white bg-black px-3 py-2 text-sm text-white/70">
        Showing {filteredCount} of {totalCount} records
        {isPending && (
          <span className="text-white"> • Updating...</span>
        )}
      </div>
    </>
  );
}