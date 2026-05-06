"use client";

import { useEffect, useMemo, useState } from "react";

import MetadataLibraryMeaningPreviewPanel from "./MetadataLibraryMeaningPreviewPanel";
import MetadataLibraryRelationshipHeaderPanel from "./MetadataLibraryRelationshipHeaderPanel";
import MetadataLibraryRelationshipMemoryPanel from "./MetadataLibraryRelationshipMemoryPanel";
import {
  buildRelationshipMemoryItems,
  buildRelationshipSnapshot,
  getRelationshipLayerLabel,
  type MetadataRelationshipLayerKey,
} from "./MetadataLibraryRelationshipIntelligence";
import MetadataLibraryStructureRelationshipsPanel from "./MetadataLibraryStructureRelationshipsPanel";
import MetadataLibraryUsagePreviewPanel from "./MetadataLibraryUsagePreviewPanel";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

type MetadataLibraryRelationshipTypesPanelProps = {
  activeQuery: string;
  allRecords: MetadataLibraryRecordSummary[];
  openRecord: MetadataLibraryRecordSummary;
  onOpenRelatedRecord: (record: MetadataLibraryRecordSummary) => void;
};

const STORAGE_KEY = "muzes_relationship_active_layer";

function getRelatedRecords(params: {
  allRecords: MetadataLibraryRecordSummary[];
  openRecord: MetadataLibraryRecordSummary;
  matchType: "shelf" | "section";
}) {
  const { allRecords, openRecord, matchType } = params;

  return allRecords.filter((record) => {
    if (record.id === openRecord.id) return false;

    if (matchType === "shelf") {
      return record.shelf === openRecord.shelf;
    }

    return record.section === openRecord.section;
  });
}

export default function MetadataLibraryRelationshipTypesPanel({
  activeQuery,
  allRecords,
  openRecord,
  onOpenRelatedRecord,
}: MetadataLibraryRelationshipTypesPanelProps) {
  const [activeLayer, setActiveLayer] =
    useState<MetadataRelationshipLayerKey>("structure");
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        STORAGE_KEY,
      ) as MetadataRelationshipLayerKey | null;

      if (saved === "structure" || saved === "meaning" || saved === "usage") {
        setActiveLayer(saved);
      }
    } catch {
      // keep default layer
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, activeLayer);
    } catch {
      // ignore unavailable storage
    }
  }, [activeLayer]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "1") setActiveLayer("structure");
      if (event.key === "2") setActiveLayer("meaning");
      if (event.key === "3") setActiveLayer("usage");
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    setFadeKey((current) => current + 1);
  }, [activeLayer]);

  const relatedByShelf = getRelatedRecords({
    allRecords,
    openRecord,
    matchType: "shelf",
  });

  const relatedBySection = getRelatedRecords({
    allRecords,
    openRecord,
    matchType: "section",
  });

  const visibleRelatedByShelf = relatedByShelf.slice(0, 5);
  const hiddenRelatedByShelfCount = Math.max(relatedByShelf.length - 5, 0);

  const visibleRelatedBySection = relatedBySection.slice(0, 5);
  const hiddenRelatedBySectionCount = Math.max(
    relatedBySection.length - 5,
    0,
  );

  const relationshipSnapshot = useMemo(
    () =>
      buildRelationshipSnapshot({
        activeLayer,
        activeQuery,
        openRecord,
        relatedByShelfLength: relatedByShelf.length,
        relatedBySectionLength: relatedBySection.length,
      }),
    [
      activeLayer,
      activeQuery,
      openRecord,
      relatedByShelf.length,
      relatedBySection.length,
    ],
  );

  const relationshipMemoryItems = useMemo(
    () =>
      buildRelationshipMemoryItems({
        activeLayer,
        activeQuery,
        openRecord,
        relatedByShelfLength: relatedByShelf.length,
        relatedBySectionLength: relatedBySection.length,
      }),
    [
      activeLayer,
      activeQuery,
      openRecord,
      relatedByShelf.length,
      relatedBySection.length,
    ],
  );

  return (
    <div className="flex flex-col gap-5">
      <MetadataLibraryRelationshipHeaderPanel
        activeLayer={activeLayer}
        activeQuery={activeQuery}
        openRecord={openRecord}
        relatedByShelfLength={relatedByShelf.length}
        relatedBySectionLength={relatedBySection.length}
        relationshipSnapshot={relationshipSnapshot}
        onOpenRelatedRecord={onOpenRelatedRecord}
      />

      <div className="rounded-xl border border-white bg-black p-3">
        <p className="text-xs uppercase text-white/60">
          Relationship Layers
        </p>

        <p className="mt-2 text-xs leading-5 text-white/65">
          Use the buttons or keyboard shortcuts: 1 for Structure, 2 for Meaning,
          3 for Usage. The active layer is remembered so the workspace keeps
          your relationship lens while you explore.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveLayer("structure")}
            className={`rounded-lg border px-3 py-2 transition ${
              activeLayer === "structure"
                ? "border-white bg-white text-black"
                : "border-white/40 text-white hover:border-white"
            }`}
          >
            Structure (1)
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer("meaning")}
            className={`rounded-lg border px-3 py-2 transition ${
              activeLayer === "meaning"
                ? "border-white bg-white text-black"
                : "border-white/40 text-white hover:border-white"
            }`}
          >
            Meaning (2)
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer("usage")}
            className={`rounded-lg border px-3 py-2 transition ${
              activeLayer === "usage"
                ? "border-white bg-white text-black"
                : "border-white/40 text-white hover:border-white"
            }`}
          >
            Usage (3)
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-white/30 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Active memory
            </p>

            <span className="rounded-full border border-white/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
              {getRelationshipLayerLabel(activeLayer)}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-white/70">
            {relationshipSnapshot.layerMemoryLabel}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/55">
            {relationshipSnapshot.querySignal}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white bg-black p-3">
        <p className="text-sm font-semibold text-white">
          Cross-Layer Awareness
        </p>

        <p className="mt-2 text-sm leading-6 text-white/70">
          {relationshipSnapshot.crossLayerBridge}
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Structure Signal
            </p>

            <p className="mt-1 text-xs leading-5 text-white/70">
              {relationshipSnapshot.structureSignal}
            </p>
          </div>

          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Meaning Signal
            </p>

            <p className="mt-1 text-xs leading-5 text-white/70">
              {relationshipSnapshot.meaningSignal}
            </p>
          </div>

          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Usage Signal
            </p>

            <p className="mt-1 text-xs leading-5 text-white/70">
              {relationshipSnapshot.usageSignal}
            </p>
          </div>
        </div>
      </div>

      <MetadataLibraryRelationshipMemoryPanel
        activeLayer={activeLayer}
        memoryItems={relationshipMemoryItems}
        relationshipSnapshot={relationshipSnapshot}
      />

      <div
        key={fadeKey}
        className="transition-opacity duration-200 ease-in opacity-100"
      >
        {activeLayer === "structure" && (
          <MetadataLibraryStructureRelationshipsPanel
            activeQuery={activeQuery}
            openRecord={openRecord}
            visibleRelatedByShelf={visibleRelatedByShelf}
            visibleRelatedBySection={visibleRelatedBySection}
            hiddenRelatedByShelfCount={hiddenRelatedByShelfCount}
            hiddenRelatedBySectionCount={hiddenRelatedBySectionCount}
            relationshipSnapshot={relationshipSnapshot}
            onOpenRelatedRecord={onOpenRelatedRecord}
          />
        )}

        {activeLayer === "meaning" && (
          <MetadataLibraryMeaningPreviewPanel
            activeQuery={activeQuery}
            openRecord={openRecord}
            relatedByShelfLength={relatedByShelf.length}
            relatedBySectionLength={relatedBySection.length}
            relationshipSnapshot={relationshipSnapshot}
          />
        )}

        {activeLayer === "usage" && (
          <MetadataLibraryUsagePreviewPanel
            activeQuery={activeQuery}
            openRecord={openRecord}
            relatedByShelfLength={relatedByShelf.length}
            relatedBySectionLength={relatedBySection.length}
            relationshipSnapshot={relationshipSnapshot}
          />
        )}
      </div>
    </div>
  );
}