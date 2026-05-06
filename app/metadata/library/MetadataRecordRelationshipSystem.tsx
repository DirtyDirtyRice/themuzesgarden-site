"use client";

import { useMemo, useState } from "react";

import MetadataLibraryRelationshipTypesPanel from "./MetadataLibraryRelationshipTypesPanel";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import RelationshipExplorerHeader from "./RelationshipExplorerHeader";
import RelationshipExplorerQuickRecords from "./RelationshipExplorerQuickRecords";
import type {
  ExplorerStep,
  RelationshipExplorerStats,
  RelationshipExplorerStatus,
} from "./relationshipExplorerTypes";
import {
  getExplorerHealthLabel,
  getExplorerStep,
  getRecordLabel,
  getRecordSlug,
  getRelationshipCount,
  getRelatedRecordSignals,
  getUniqueHistory,
  normalizeRelationshipRecords,
} from "./relationshipExplorerUtils";

type Props = {
  record: MetadataLibraryRecordSummary;
};

export default function MetadataRecordRelationshipSystem({ record }: Props) {
  const allRecords = useMemo(() => normalizeRelationshipRecords(), []);

  const originalRecord = useMemo(
    () => allRecords.find((candidate) => candidate.id === record.id) ?? null,
    [allRecords, record.id]
  );

  const fallbackOriginalRecord = originalRecord ?? record;
  const originalStep = getExplorerStep(fallbackOriginalRecord);

  const [activeRecord, setActiveRecord] =
    useState<MetadataLibraryRecordSummary | null>(fallbackOriginalRecord);
  const [open, setOpen] = useState(getRelationshipCount(record) > 0);
  const [history, setHistory] = useState<ExplorerStep[]>([originalStep]);
  const [showMoreQuickRecords, setShowMoreQuickRecords] = useState(false);

  const activeRecordLabel = getRecordLabel(activeRecord);
  const activeRecordSlug = getRecordSlug(activeRecord);
  const originalRecordLabel = getRecordLabel(fallbackOriginalRecord);
  const relationshipCount = getRelationshipCount(record);

  const relatedRecordSignals = useMemo(
    () => getRelatedRecordSignals(allRecords, activeRecord),
    [allRecords, activeRecord]
  );

  const relatedRecords = useMemo(
    () => relatedRecordSignals.map((signal) => signal.record),
    [relatedRecordSignals]
  );

  const quickRelatedSignals = useMemo(
    () => relatedRecordSignals.slice(0, showMoreQuickRecords ? 12 : 6),
    [relatedRecordSignals, showMoreQuickRecords]
  );

  const strongestSignal = relatedRecordSignals[0] ?? null;

  const relatedByShelfCount = useMemo(() => {
    if (!activeRecord) return 0;

    return allRecords.filter((candidate) => {
      if (candidate.id === activeRecord.id) return false;
      return candidate.shelf === activeRecord.shelf;
    }).length;
  }, [allRecords, activeRecord]);

  const relatedBySectionCount = useMemo(() => {
    if (!activeRecord) return 0;

    return allRecords.filter((candidate) => {
      if (candidate.id === activeRecord.id) return false;
      return candidate.section === activeRecord.section;
    }).length;
  }, [allRecords, activeRecord]);

  const titleMatchCount = useMemo(
    () => relatedRecordSignals.filter((signal) => signal.titleMatch).length,
    [relatedRecordSignals]
  );

  const uniqueHistory = useMemo(() => getUniqueHistory(history), [history]);

  const isViewingOriginal =
    Boolean(activeRecord?.id) && activeRecord?.id === fallbackOriginalRecord.id;

  const buttonLabel = open ? "Hide Relationships" : "Relationships";
  const relationshipBadge =
    relationshipCount > 0
      ? `${relationshipCount} saved`
      : `${relatedRecords.length} suggested`;

  const explorerHealthLabel = getExplorerHealthLabel(
    relatedRecords.length,
    relationshipCount
  );

  const status: RelationshipExplorerStatus = {
    activeRecordLabel,
    activeRecordSlug,
    originalRecordLabel,
    isViewingOriginal,
    relationshipBadge,
    explorerHealthLabel,
  };

  const stats: RelationshipExplorerStats = {
    relatedByShelfCount,
    relatedBySectionCount,
    titleMatchCount,
    relationshipCount,
    relatedRecordsCount: relatedRecords.length,
    historyCount: uniqueHistory.length,
  };

  function openRecordInExplorer(next: MetadataLibraryRecordSummary) {
    setActiveRecord(next);
    setOpen(true);

    setHistory((current) =>
      getUniqueHistory([...current, getExplorerStep(next)]).slice(-8)
    );
  }

  function handleOpenRelatedRecord(next: MetadataLibraryRecordSummary) {
    openRecordInExplorer(next);
  }

  function handleResetToOriginal() {
    setActiveRecord(fallbackOriginalRecord);
    setOpen(true);
    setHistory([originalStep]);
    setShowMoreQuickRecords(false);
  }

  function handleOpenRecordPage() {
    if (!activeRecordSlug) return;
    window.location.href = `/metadata/${encodeURIComponent(activeRecordSlug)}`;
  }

  return (
    <div className="mt-4 w-full">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="rounded border border-white bg-black px-3 py-2 text-sm text-white transition hover:bg-white hover:text-black"
        >
          {buttonLabel}
        </button>

        <span className="rounded border border-white/40 bg-black px-2.5 py-1.5 text-xs text-white/70">
          {relationshipBadge}
        </span>

        <span className="rounded border border-white/30 bg-black px-2.5 py-1.5 text-xs text-white/55">
          {open ? "Explorer open" : "Explorer closed"}
        </span>

        <span className="rounded border border-white/30 bg-black px-2.5 py-1.5 text-xs text-white/55">
          {explorerHealthLabel}
        </span>

        <span className="rounded border border-white/30 bg-black px-2.5 py-1.5 text-xs text-white/55">
          Structure · Meaning · Usage
        </span>

        {!isViewingOriginal ? (
          <button
            type="button"
            onClick={handleResetToOriginal}
            className="rounded border border-white/40 bg-black px-2.5 py-1.5 text-xs text-white/70 transition hover:border-white hover:text-white"
          >
            Back to {originalRecordLabel}
          </button>
        ) : null}
      </div>

      {open ? (
        <section className="mt-6 rounded-2xl border border-white bg-black p-4">
          <div className="mb-4 rounded-xl border border-white/30 bg-black p-3">
            <RelationshipExplorerHeader
              activeRecord={activeRecord}
              allRecords={allRecords}
              status={status}
              stats={stats}
              uniqueHistory={uniqueHistory}
              onOpenRecordInExplorer={openRecordInExplorer}
              onResetToOriginal={handleResetToOriginal}
            />

            <RelationshipExplorerQuickRecords
              quickRelatedSignals={quickRelatedSignals}
              strongestSignal={strongestSignal}
              relatedSignalCount={relatedRecordSignals.length}
              showMoreQuickRecords={showMoreQuickRecords}
              onToggleShowMoreQuickRecords={() =>
                setShowMoreQuickRecords((current) => !current)
              }
              onOpenRecordInExplorer={openRecordInExplorer}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOpenRecordPage}
                disabled={!activeRecordSlug}
                className="rounded border border-white/40 bg-black px-3 py-2 text-xs text-white/70 transition hover:border-white hover:text-white disabled:opacity-40"
              >
                Open active record page
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-white/30 bg-black px-3 py-2 text-xs text-white/60 transition hover:border-white hover:text-white"
              >
                Collapse explorer
              </button>
            </div>
          </div>

          {activeRecord ? (
            <MetadataLibraryRelationshipTypesPanel
              activeQuery=""
              allRecords={allRecords}
              openRecord={activeRecord}
              onOpenRelatedRecord={handleOpenRelatedRecord}
            />
          ) : (
            <div className="rounded-xl border border-white/30 bg-black p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Relationship system
              </p>

              <p className="mt-2 text-sm leading-6 text-white/70">
                This record is open, but the relationship workspace could not
                resolve it inside the library record list yet.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}