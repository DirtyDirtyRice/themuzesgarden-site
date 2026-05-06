import {
  getMetadataLibrary,
  getMetadataRecords,
} from "@/lib/metadata/metadataLibrarySeed";
import { getMetadataRecordSummariesFromDb } from "@/lib/metadata/metadataFetch";

import MetadataLibraryHero from "./MetadataLibraryHero";
import MetadataLibraryRecordsPanel from "./MetadataLibraryRecordsPanel";
import MetadataLibraryShelvesPanel from "./MetadataLibraryShelvesPanel";
import MetadataLibraryWorkspaceTabs from "./MetadataLibraryWorkspaceTabs";
import {
  cleanFilterValue,
  filterRecords,
  getUniqueFilterOptions,
} from "./metadataLibraryHelpers";
import type {
  MetadataLibraryPanel,
  MetadataLibraryRecordSummary,
} from "./MetadataLibraryPageTypes";

type MetadataLibraryPageProps = {
  searchParams?: Promise<{
    panel?: string;
    q?: string;
    shelf?: string;
    visibility?: string;
  }>;
};

type LibraryPageStats = {
  filteredRecordsCount: number;
  recordsCount: number;
  shelfCount: number;
  usingSeedFallback: boolean;
  sourceLabel: string;
};

function getActivePanel(value: string | undefined): MetadataLibraryPanel {
  return value === "shelves" ? "shelves" : "records";
}

function getShowingCount({
  activePanel,
  filteredRecordsCount,
  recordsCount,
}: {
  activePanel: MetadataLibraryPanel;
  filteredRecordsCount: number;
  recordsCount: number;
}) {
  return activePanel === "records" ? filteredRecordsCount : recordsCount;
}

/* 🔥 NEW — strict source control */
function resolveRecordSource(
  dbRecords: MetadataLibraryRecordSummary[] | null,
  seedRecords: MetadataLibraryRecordSummary[],
) {
  if (dbRecords === null) {
    return {
      records: seedRecords,
      usingSeedFallback: true,
      sourceLabel: "Seed fallback",
    };
  }

  if (Array.isArray(dbRecords)) {
    if (dbRecords.length === 0) {
      return {
        records: [],
        usingSeedFallback: false,
        sourceLabel: "Database (empty)",
      };
    }

    return {
      records: dbRecords,
      usingSeedFallback: false,
      sourceLabel: "Database",
    };
  }

  return {
    records: seedRecords,
    usingSeedFallback: true,
    sourceLabel: "Seed fallback",
  };
}

function LibraryPageContextStrip({
  activePanel,
  activeQuery,
  activeShelf,
  activeVisibility,
  stats,
}: {
  activePanel: MetadataLibraryPanel;
  activeQuery: string;
  activeShelf: string;
  activeVisibility: string;
  stats: LibraryPageStats;
}) {
  const activeFilterCount = [activeQuery, activeShelf, activeVisibility].filter(
    Boolean,
  ).length;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-white">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Panel
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {activePanel === "records" ? "Records" : "Shelves"}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Records
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {stats.filteredRecordsCount} shown / {stats.recordsCount} total
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Filters
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {activeFilterCount === 0
              ? "None active"
              : `${activeFilterCount} active`}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Source
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {stats.sourceLabel}
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function MetadataLibraryPage({
  searchParams,
}: MetadataLibraryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const activePanel = getActivePanel(resolvedSearchParams?.panel);
  const activeQuery = cleanFilterValue(resolvedSearchParams?.q);
  const activeShelf = cleanFilterValue(resolvedSearchParams?.shelf);
  const activeVisibility = cleanFilterValue(resolvedSearchParams?.visibility);

  const library = getMetadataLibrary();

  const rawDbRecords = await getMetadataRecordSummariesFromDb();
  const dbRecords = Array.isArray(rawDbRecords) ? rawDbRecords : null;

  const seedRecords = getMetadataRecords();

  const { records, usingSeedFallback, sourceLabel } = resolveRecordSource(
    dbRecords,
    seedRecords,
  );

  const shelfOptions = getUniqueFilterOptions(
    records.map((record) => String(record.shelf ?? "")),
  );

  const visibilityOptions = getUniqueFilterOptions(
    records.map((record) => String(record.visibility ?? "")),
  );

  const filteredRecords = filterRecords({
    records,
    query: activeQuery,
    shelf: activeShelf,
    visibility: activeVisibility,
  });

  const hasActiveRecordFilters = Boolean(
    activeQuery || activeShelf || activeVisibility,
  );

  const showingCount = getShowingCount({
    activePanel,
    filteredRecordsCount: filteredRecords.length,
    recordsCount: records.length,
  });

  const stats: LibraryPageStats = {
    filteredRecordsCount: filteredRecords.length,
    recordsCount: records.length,
    shelfCount: library.shelves.length,
    usingSeedFallback,
    sourceLabel,
  };

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-5">
        <MetadataLibraryHero
          library={library}
          recordsCount={records.length}
          showingCount={showingCount}
          usingSeedFallback={usingSeedFallback}
        />

        <LibraryPageContextStrip
          activePanel={activePanel}
          activeQuery={activeQuery}
          activeShelf={activeShelf}
          activeVisibility={activeVisibility}
          stats={stats}
        />

        <MetadataLibraryWorkspaceTabs
          activePanel={activePanel}
          activeQuery={activeQuery}
          activeShelf={activeShelf}
          activeVisibility={activeVisibility}
        />

        <section className="min-h-[420px]">
          {activePanel === "shelves" ? (
            <MetadataLibraryShelvesPanel shelves={library.shelves} />
          ) : null}

          {activePanel === "records" ? (
            <MetadataLibraryRecordsPanel
              activeQuery={activeQuery}
              activeShelf={activeShelf}
              activeVisibility={activeVisibility}
              filteredRecords={filteredRecords}
              hasActiveRecordFilters={hasActiveRecordFilters}
              shelfOptions={shelfOptions}
              totalRecordsCount={records.length}
              visibilityOptions={visibilityOptions}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}