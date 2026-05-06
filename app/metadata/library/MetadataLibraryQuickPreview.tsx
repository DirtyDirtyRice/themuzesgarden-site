"use client";

import Link from "next/link";

import { formatLabel, highlightText } from "./metadataLibraryHelpers";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

type MetadataLibraryQuickPreviewProps = {
  activeIndex: number;
  activeQuery: string;
  activeRecord: MetadataLibraryRecordSummary | null;
  filteredRecordsCount: number;
  onOpenSelected: () => void;
};

export default function MetadataLibraryQuickPreview({
  activeIndex,
  activeQuery,
  activeRecord,
  filteredRecordsCount,
  onOpenSelected,
}: MetadataLibraryQuickPreviewProps) {
  return (
    <aside className="rounded-2xl border border-white bg-black p-4 xl:sticky xl:top-6 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--text-normal)" }}
          >
            Quick Preview
          </p>

          <p className="mt-1 text-xs text-white/50">
            Selected record workspace shortcut
          </p>
        </div>

        {activeRecord && (
          <span className="rounded-full border border-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
            Active
          </span>
        )}
      </div>

      {activeRecord ? (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Metadata Record
            </p>

            <h3
              className="mt-1 text-xl font-semibold"
              style={{ color: "var(--text-strong)" }}
            >
              {highlightText(activeRecord.title, activeQuery)}
            </h3>
          </div>

          <div className="rounded-xl border border-white bg-black p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Summary
            </p>

            <p
              className="mt-2 text-sm leading-6"
              style={{ color: "var(--text-normal)" }}
            >
              {highlightText(activeRecord.excerpt, activeQuery)}
            </p>
          </div>

          <div className="rounded-xl border border-white bg-black p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Record Location
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white px-2 py-1 text-white">
                {formatLabel(activeRecord.shelf)}
              </span>
              <span className="rounded-full border border-white px-2 py-1 text-white">
                {formatLabel(activeRecord.section)}
              </span>
              <span className="rounded-full border border-white px-2 py-1 text-white">
                {formatLabel(activeRecord.visibility)}
              </span>
            </div>
          </div>

          <div
            className="rounded-lg border border-white bg-black px-3 py-2 text-xs leading-5"
            style={{ color: "var(--text-normal)" }}
          >
            Selected {activeIndex + 1} of {filteredRecordsCount}. Use arrow
            keys to move through results.
          </div>

          <div className="rounded-xl border border-white bg-black p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Actions
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenSelected}
                className="inline-flex rounded-md border border-white bg-white px-3 py-2 text-sm font-semibold text-black"
              >
                Open Selected
              </button>

              <Link
                href={`/metadata/${activeRecord.slug}`}
                className="inline-flex rounded-md border border-white bg-black px-3 py-2 text-sm font-medium text-white"
              >
                Full Page
              </Link>

              <Link
                href={`/metadata/${activeRecord.slug}/edit`}
                className="inline-flex rounded-md border border-white bg-black px-3 py-2 text-sm font-medium text-white"
              >
                Edit Selected
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-white bg-black p-3">
          <p className="text-sm" style={{ color: "var(--text-normal)" }}>
            Select a record to preview it here.
          </p>
        </div>
      )}
    </aside>
  );
}