"use client";

import { useMemo } from "react";

import MetadataLibraryRelationshipInsightPanel from "./MetadataLibraryRelationshipInsightPanel";
import MetadataLibraryRelationshipStrengthSection from "./MetadataLibraryRelationshipStrengthSection";
import { buildRelationshipInsightSummary } from "./MetadataLibraryRelationshipIntelligence";
import { groupByStrength } from "./MetadataLibraryStructureHelpers";
import type { MetadataLibraryStructureRelationshipsPanelProps } from "./MetadataLibraryRelationshipTypes";

export default function MetadataLibraryStructureRelationshipsPanel({
  activeQuery,
  openRecord,
  visibleRelatedByShelf,
  visibleRelatedBySection,
  hiddenRelatedByShelfCount,
  hiddenRelatedBySectionCount,
  relationshipSnapshot,
  onOpenRelatedRecord,
}: MetadataLibraryStructureRelationshipsPanelProps) {
  const shelfGroups = useMemo(
    () =>
      groupByStrength(
        visibleRelatedByShelf,
        openRecord,
        "shelf",
        activeQuery,
      ),
    [activeQuery, openRecord, visibleRelatedByShelf],
  );

  const sectionGroups = useMemo(
    () =>
      groupByStrength(
        visibleRelatedBySection,
        openRecord,
        "section",
        activeQuery,
      ),
    [activeQuery, openRecord, visibleRelatedBySection],
  );

  const insightSummary = useMemo(() => {
    const allScoredRecords = [
      ...shelfGroups.strong,
      ...shelfGroups.medium,
      ...shelfGroups.light,
      ...sectionGroups.strong,
      ...sectionGroups.medium,
      ...sectionGroups.light,
    ];

    return buildRelationshipInsightSummary({
      records: allScoredRecords,
    });
  }, [shelfGroups, sectionGroups]);

  return (
    <>
      <div className="rounded-xl border border-white bg-black p-3">
        <p className="text-sm font-semibold text-white">
          Structure Intelligence Bridge
        </p>

        <p className="mt-2 text-sm leading-6 text-white/70">
          {relationshipSnapshot.structureSignal}
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Meaning Hand-Off
            </p>

            <p className="mt-1 text-xs leading-5 text-white/70">
              {relationshipSnapshot.meaningSignal}
            </p>
          </div>

          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Usage Hand-Off
            </p>

            <p className="mt-1 text-xs leading-5 text-white/70">
              {relationshipSnapshot.usageSignal}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Smart Sorting
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            Each relationship group now sorts by confidence score first, then
            structure, meaning, and usage signals. Stronger candidates float up
            automatically before real semantic fields exist.
          </p>
        </div>
      </div>

      <MetadataLibraryRelationshipInsightPanel summary={insightSummary} />

      <div className="rounded-xl border border-white bg-black p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Structure / Same Shelf
            </p>

            <p className="mt-1 text-xs leading-5 text-white/55">
              Records that share the same top-level metadata shelf.
            </p>
          </div>

          <span className="rounded-full border border-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
            {visibleRelatedByShelf.length}
          </span>
        </div>

        <MetadataLibraryRelationshipStrengthSection
          title="Strong Matches"
          records={shelfGroups.strong}
          strength="strong"
          source="shelf"
          openRecord={openRecord}
          activeQuery={activeQuery}
          onOpenRelatedRecord={onOpenRelatedRecord}
        />

        <MetadataLibraryRelationshipStrengthSection
          title="Related"
          records={shelfGroups.medium}
          strength="medium"
          source="shelf"
          openRecord={openRecord}
          activeQuery={activeQuery}
          onOpenRelatedRecord={onOpenRelatedRecord}
        />

        <MetadataLibraryRelationshipStrengthSection
          title="Loosely Related"
          records={shelfGroups.light}
          strength="light"
          source="shelf"
          openRecord={openRecord}
          activeQuery={activeQuery}
          onOpenRelatedRecord={onOpenRelatedRecord}
        />

        {hiddenRelatedByShelfCount > 0 && (
          <p className="mt-3 text-xs text-white/60">
            + {hiddenRelatedByShelfCount} more same-shelf records in filtered
            results.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-white bg-black p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Structure / Same Section
            </p>

            <p className="mt-1 text-xs leading-5 text-white/55">
              Records that share the same focused metadata section.
            </p>
          </div>

          <span className="rounded-full border border-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
            {visibleRelatedBySection.length}
          </span>
        </div>

        <MetadataLibraryRelationshipStrengthSection
          title="Strong Matches"
          records={sectionGroups.strong}
          strength="strong"
          source="section"
          openRecord={openRecord}
          activeQuery={activeQuery}
          onOpenRelatedRecord={onOpenRelatedRecord}
        />

        <MetadataLibraryRelationshipStrengthSection
          title="Related"
          records={sectionGroups.medium}
          strength="medium"
          source="section"
          openRecord={openRecord}
          activeQuery={activeQuery}
          onOpenRelatedRecord={onOpenRelatedRecord}
        />

        <MetadataLibraryRelationshipStrengthSection
          title="Loosely Related"
          records={sectionGroups.light}
          strength="light"
          source="section"
          openRecord={openRecord}
          activeQuery={activeQuery}
          onOpenRelatedRecord={onOpenRelatedRecord}
        />

        {hiddenRelatedBySectionCount > 0 && (
          <p className="mt-3 text-xs text-white/60">
            + {hiddenRelatedBySectionCount} more same-section records in
            filtered results.
          </p>
        )}
      </div>
    </>
  );
}