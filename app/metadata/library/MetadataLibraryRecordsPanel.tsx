"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import MetadataLibraryRecordFilters from "./MetadataLibraryRecordFilters";
import MetadataLibraryOpenRecordPanel from "./MetadataLibraryOpenRecordPanel";
import MetadataLibraryQuickPreview from "./MetadataLibraryQuickPreview";
import MetadataLibraryRecordCard from "./MetadataLibraryRecordCard";
import { formatLabel } from "./metadataLibraryHelpers";
import type {
  MetadataLibraryRecordSummary,
  RecordFilterOption,
} from "./MetadataLibraryPageTypes";

/* =========================
   SORT SYSTEM (NEW)
========================= */

type SortKey = "title" | "shelf" | "visibility";
type SortDirection = "asc" | "desc";

function sortRecords(
  records: MetadataLibraryRecordSummary[],
  key: SortKey,
  direction: SortDirection,
) {
  const sorted = [...records].sort((a, b) => {
    const aVal = String(a[key] ?? "").toLowerCase();
    const bVal = String(b[key] ?? "").toLowerCase();

    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });

  return direction === "asc" ? sorted : sorted.reverse();
}

/* ========================= */

type MetadataLibraryRecordsPanelProps = {
  activeQuery: string;
  activeShelf: string;
  activeVisibility: string;
  filteredRecords: MetadataLibraryRecordSummary[];
  hasActiveRecordFilters: boolean;
  shelfOptions: RecordFilterOption[];
  totalRecordsCount: number;
  visibilityOptions: RecordFilterOption[];
};

type OpenRecordTab = "overview" | "relationships" | "notes";
type KeyboardMode = "scroll" | "select";

/* =========================
   COMMAND BAR (NEW)
========================= */

function CommandBar({
  sortKey,
  sortDirection,
  setSortKey,
  setSortDirection,
  filteredCount,
  totalCount,
}: {
  sortKey: SortKey;
  sortDirection: SortDirection;
  setSortKey: (v: SortKey) => void;
  setSortDirection: (v: SortDirection) => void;
  filteredCount: number;
  totalCount: number;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-xs text-white/70">
        Showing <span className="text-white">{filteredCount}</span> / {totalCount}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-md border border-white bg-black px-2 py-1 text-xs text-white"
        >
          <option value="title">Title</option>
          <option value="shelf">Shelf</option>
          <option value="visibility">Visibility</option>
        </select>

        <button
          onClick={() =>
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
          }
          className="rounded-md border border-white bg-white px-2 py-1 text-xs text-black transition hover:opacity-85"
        >
          {sortDirection === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>
    </div>
  );
}

/* ========================= */

function isTypingTarget(target: HTMLElement | null) {
  const tagName = target?.tagName?.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    Boolean(target?.isContentEditable)
  );
}

function getNextRecordIndex({
  current,
  direction,
  total,
}: {
  current: number;
  direction: "next" | "previous";
  total: number;
}) {
  if (total <= 0) return 0;

  if (direction === "next") {
    return current + 1 >= total ? 0 : current + 1;
  }

  return current - 1 < 0 ? total - 1 : current - 1;
}

function ActiveFilterPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-white bg-white px-3 py-1 text-xs font-medium text-black transition hover:opacity-85"
    >
      {label} ✕
    </Link>
  );
}

function KeyboardModePill({ mode }: { mode: KeyboardMode }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/80">
      Keyboard: {mode === "scroll" ? "Page scroll" : "Record select"}
    </span>
  );
}

/* ========================= */

export default function MetadataLibraryRecordsPanel({
  activeQuery,
  activeShelf,
  activeVisibility,
  filteredRecords,
  hasActiveRecordFilters,
  shelfOptions,
  totalRecordsCount,
  visibilityOptions,
}: MetadataLibraryRecordsPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("scroll");

  const [openRecord, setOpenRecord] =
    useState<MetadataLibraryRecordSummary | null>(null);
  const [openRecordTab, setOpenRecordTab] =
    useState<OpenRecordTab>("overview");

  /* SORT STATE */
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const sortedRecords = useMemo(
    () => sortRecords(filteredRecords, sortKey, sortDirection),
    [filteredRecords, sortKey, sortDirection],
  );

  const hoveredRecord = useMemo(
    () => sortedRecords[activeIndex] ?? null,
    [activeIndex, sortedRecords],
  );

  const selectedRecord = useMemo(
    () => sortedRecords.find((r) => r.id === selectedRecordId) ?? null,
    [sortedRecords, selectedRecordId],
  );

  const activeRecord = selectedRecord ?? hoveredRecord;

  useEffect(() => {
    setActiveIndex(0);
    setSelectedRecordId(null);
    setKeyboardMode("scroll");
  }, [activeQuery, activeShelf, activeVisibility, sortedRecords.length]);

  useEffect(() => {
    if (!openRecord) setOpenRecordTab("overview");
  }, [openRecord]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (isTypingTarget(target)) return;

      if (event.key === "Escape") {
        setOpenRecord(null);
        setKeyboardMode("scroll");
        return;
      }

      if (sortedRecords.length === 0) return;

      if (event.key === "ArrowDown" && event.shiftKey) {
        event.preventDefault();
        setKeyboardMode("select");
        setSelectedRecordId(null);
        setActiveIndex((current) =>
          getNextRecordIndex({
            current,
            direction: "next",
            total: sortedRecords.length,
          }),
        );
        return;
      }

      if (event.key === "ArrowUp" && event.shiftKey) {
        event.preventDefault();
        setKeyboardMode("select");
        setSelectedRecordId(null);
        setActiveIndex((current) =>
          getNextRecordIndex({
            current,
            direction: "previous",
            total: sortedRecords.length,
          }),
        );
        return;
      }

      if (event.key === "Enter" && keyboardMode === "select") {
        event.preventDefault();
        const record =
          sortedRecords[activeIndex] ?? sortedRecords[0];

        if (record) {
          setSelectedRecordId(record.id);
          setOpenRecord(record);
          setOpenRecordTab("overview");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, sortedRecords, keyboardMode]);

  function openRecordInPanel(record: MetadataLibraryRecordSummary) {
    const nextIndex = sortedRecords.findIndex(
      (item) => item.id === record.id,
    );

    setSelectedRecordId(record.id);
    setKeyboardMode("select");

    if (nextIndex >= 0) setActiveIndex(nextIndex);

    setOpenRecord(record);
    setOpenRecordTab("overview");
  }

  function previewRecord(index: number) {
    if (!selectedRecordId) setActiveIndex(index);
  }

  return (
    <section className="rounded-2xl border border-white bg-black p-4 text-white md:p-5">

      {/* COMMAND BAR */}
      <CommandBar
        sortKey={sortKey}
        sortDirection={sortDirection}
        setSortKey={setSortKey}
        setSortDirection={setSortDirection}
        filteredCount={sortedRecords.length}
        totalCount={totalRecordsCount}
      />

      <MetadataLibraryRecordFilters
        activeQuery={activeQuery}
        activeShelf={activeShelf}
        activeVisibility={activeVisibility}
        filteredCount={sortedRecords.length}
        hasActiveRecordFilters={hasActiveRecordFilters}
        shelfOptions={shelfOptions}
        totalCount={totalRecordsCount}
        visibilityOptions={visibilityOptions}
      />

      {sortedRecords.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-black p-4 text-sm text-white/80">
          No metadata records match the current filters.
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedRecords.map((record, index) => (
              <MetadataLibraryRecordCard
                key={record.id}
                activeQuery={activeQuery}
                isActive={
                  record.id === selectedRecordId ||
                  (!selectedRecordId && index === activeIndex)
                }
                record={record}
                onOpenRecord={() => openRecordInPanel(record)}
                onPreviewRecord={() => previewRecord(index)}
              />
            ))}
          </div>

          <MetadataLibraryQuickPreview
            activeIndex={activeIndex}
            activeQuery={activeQuery}
            activeRecord={activeRecord}
            filteredRecordsCount={sortedRecords.length}
            onOpenSelected={() => {
              if (activeRecord) openRecordInPanel(activeRecord);
            }}
          />
        </div>
      )}

      {openRecord && (
        <MetadataLibraryOpenRecordPanel
          activeQuery={activeQuery}
          allRecords={sortedRecords}
          openRecord={openRecord}
          openRecordTab={openRecordTab}
          onClose={() => setOpenRecord(null)}
          onOpenRelatedRecord={openRecordInPanel}
          onSetOpenRecordTab={setOpenRecordTab}
        />
      )}
    </section>
  );
}