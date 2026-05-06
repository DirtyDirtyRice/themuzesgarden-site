"use client";

import Link from "next/link";

import MetadataLibraryRelationshipTypesPanel from "./MetadataLibraryRelationshipTypesPanel";
import { formatLabel, highlightText } from "./metadataLibraryHelpers";
import { getPanelTabClass } from "./metadataLibraryPanelHelpers";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

type OpenRecordTab = "overview" | "relationships" | "notes";

type MetadataLibraryOpenRecordPanelProps = {
  activeQuery: string;
  allRecords: MetadataLibraryRecordSummary[];
  openRecord: MetadataLibraryRecordSummary;
  openRecordTab: OpenRecordTab;
  onClose: () => void;
  onOpenRelatedRecord: (record: MetadataLibraryRecordSummary) => void;
  onSetOpenRecordTab: (tab: OpenRecordTab) => void;
};

export default function MetadataLibraryOpenRecordPanel({
  activeQuery,
  allRecords,
  openRecord,
  openRecordTab,
  onClose,
  onOpenRelatedRecord,
  onSetOpenRecordTab,
}: MetadataLibraryOpenRecordPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close record panel overlay"
        className="flex-1 bg-black/70"
        onClick={onClose}
      />

      <div className="flex w-full max-w-[520px] flex-col border-l border-white bg-black p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Open Record
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-white">
              {highlightText(openRecord.title, activeQuery)}
            </h2>

            <p className="mt-2 text-xs leading-5 text-white/50">
              {formatLabel(openRecord.shelf)} /{" "}
              {formatLabel(openRecord.section)} /{" "}
              {formatLabel(openRecord.visibility)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white px-3 py-2 text-sm font-medium text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-4 h-px w-full bg-white/10" />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSetOpenRecordTab("overview")}
            className={getPanelTabClass(openRecordTab === "overview")}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => onSetOpenRecordTab("relationships")}
            className={getPanelTabClass(openRecordTab === "relationships")}
          >
            Relationships
          </button>

          <button
            type="button"
            onClick={() => onSetOpenRecordTab("notes")}
            className={getPanelTabClass(openRecordTab === "notes")}
          >
            Notes
          </button>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto rounded-2xl border border-white bg-black p-4">
          {openRecordTab === "overview" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  Summary
                </p>

                <p className="mt-2 text-sm leading-6 text-white/75">
                  {highlightText(openRecord.excerpt, activeQuery)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white px-2 py-1 text-white">
                  Shelf: {formatLabel(openRecord.shelf)}
                </span>

                <span className="rounded-full border border-white px-2 py-1 text-white">
                  Section: {formatLabel(openRecord.section)}
                </span>

                <span className="rounded-full border border-white px-2 py-1 text-white">
                  Visibility: {formatLabel(openRecord.visibility)}
                </span>
              </div>

              <div className="rounded-xl border border-white bg-black p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  Record Actions
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/metadata/${openRecord.slug}`}
                    className="rounded-md border border-white bg-white px-3 py-2 text-sm font-semibold text-black"
                  >
                    Open Full Page
                  </Link>

                  <Link
                    href={`/metadata/${openRecord.slug}/edit`}
                    className="rounded-md border border-white px-3 py-2 text-sm text-white"
                  >
                    Open Edit Workspace
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-white bg-black p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  Workspace Status
                </p>

                <p className="mt-2 text-sm leading-6 text-white/75">
                  This in-page panel keeps the library open while you review the
                  selected record. Use the buttons below when you need the full
                  page or editing workspace.
                </p>
              </div>
            </div>
          )}

          {openRecordTab === "relationships" && (
            <MetadataLibraryRelationshipTypesPanel
              activeQuery={activeQuery}
              allRecords={allRecords}
              openRecord={openRecord}
              onOpenRelatedRecord={onOpenRelatedRecord}
            />
          )}

          {openRecordTab === "notes" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-white/75">
                  Notes will become the place for quick review comments, record
                  intent, and future metadata decisions. This is a safe
                  placeholder panel only.
                </p>
              </div>

              <div className="rounded-xl border border-white bg-black p-3">
                <p className="text-sm font-semibold text-white">
                  No notes yet
                </p>

                <p className="mt-2 text-sm leading-6 text-white/70">
                  Later this can connect to saved notes. Today it keeps the
                  workspace behavior ready without adding backend risk.
                </p>
              </div>

              <div className="rounded-xl border border-white bg-black p-3">
                <p className="text-sm font-semibold text-white">
                  Future note types
                </p>

                <p className="mt-2 text-sm leading-6 text-white/70">
                  Review notes, intent notes, relationship notes, and build
                  notes can live here later.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/metadata/${openRecord.slug}`}
            className="rounded-md border border-white bg-white px-3 py-2 text-sm font-semibold text-black"
          >
            Full Page
          </Link>

          <Link
            href={`/metadata/${openRecord.slug}/edit`}
            className="rounded-md border border-white px-3 py-2 text-sm text-white"
          >
            Edit Workspace
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white px-3 py-2 text-sm text-white"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}