"use client";

import { useEffect, useMemo, useState } from "react";

import MetadataRecordRelationshipDashboard from "./MetadataRecordRelationshipDashboard";
import MetadataRecordRelationshipGroups from "./MetadataRecordRelationshipGroups";
import type {
  RelationshipTypeSummary,
  RemoveRelationshipAction,
  ResolvedRelationship,
} from "./metadataRecordRelationshipTypes";

type RelationshipInteractivePanelProps = {
  totalCount: number;
  primaryRelationship: ResolvedRelationship | null;
  typeSummaries: RelationshipTypeSummary[];
  groupedRelationships: Record<string, ResolvedRelationship[]>;
  onRemove: RemoveRelationshipAction;
};

type FilterPulseState = "idle" | "active";

function getFilteredTypeSummaries(
  typeSummaries: RelationshipTypeSummary[],
  activeType: string | null,
) {
  if (!activeType) {
    return typeSummaries;
  }

  return typeSummaries.filter((summary) => summary.type === activeType);
}

function getFilteredRelationshipCount({
  activeType,
  totalCount,
  groupedRelationships,
}: {
  activeType: string | null;
  totalCount: number;
  groupedRelationships: Record<string, ResolvedRelationship[]>;
}) {
  if (!activeType) {
    return totalCount;
  }

  return groupedRelationships[activeType]?.length ?? 0;
}

function getActiveSummary(
  typeSummaries: RelationshipTypeSummary[],
  activeType: string | null,
) {
  if (!activeType) {
    return null;
  }

  return typeSummaries.find((summary) => summary.type === activeType) ?? null;
}

function scrollToRelationshipGroup(summary: RelationshipTypeSummary | null) {
  if (!summary || typeof window === "undefined") {
    return;
  }

  window.requestAnimationFrame(() => {
    const target = document.getElementById(summary.anchor);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function RelationshipFilterStatusPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white/80">
      <span className="text-white/55">{label}: </span>
      <span className="text-white/95">{value}</span>
    </span>
  );
}

function RelationshipActiveFilterBar({
  activeType,
  filteredCount,
  totalCount,
  openCardId,
  pulseState,
  onClearFilter,
}: {
  activeType: string | null;
  filteredCount: number;
  totalCount: number;
  openCardId: string | null;
  pulseState: FilterPulseState;
  onClearFilter: () => void;
}) {
  const openStateLabel = openCardId ? "1 detail open" : "No detail open";

  if (!activeType) {
    return (
      <div className="sticky top-2 z-10 my-2 rounded-xl border border-white/15 bg-black/90 px-3 py-2 shadow-lg shadow-black/30 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold leading-5 text-white/72">
            Showing all relationship groups. Click any group chip to focus the
            list.
          </p>

          <div className="flex flex-wrap gap-2">
            <RelationshipFilterStatusPill
              label="Visible"
              value={`${totalCount} connections`}
            />

            <RelationshipFilterStatusPill label="Cards" value={openStateLabel} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "sticky top-2 z-10 my-2 rounded-xl border px-3 py-2 shadow-lg shadow-black/35 backdrop-blur transition",
        pulseState === "active"
          ? "border-white/50 bg-white/[0.12]"
          : "border-white/25 bg-black/90",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
            Active relationship filter
          </p>

          <p className="mt-0.5 text-sm font-black text-white">
            {activeType}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <RelationshipFilterStatusPill
            label="Showing"
            value={`${filteredCount} of ${totalCount}`}
          />

          <RelationshipFilterStatusPill label="Cards" value={openStateLabel} />

          <button
            type="button"
            onClick={onClearFilter}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-black text-white/85 transition hover:border-white/45 hover:bg-white/[0.08]"
          >
            Show all
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MetadataRecordRelationshipInteractivePanel({
  totalCount,
  primaryRelationship,
  typeSummaries,
  groupedRelationships,
  onRemove,
}: RelationshipInteractivePanelProps) {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [pulseState, setPulseState] = useState<FilterPulseState>("idle");

  const activeSummary = useMemo(() => {
    return getActiveSummary(typeSummaries, activeType);
  }, [activeType, typeSummaries]);

  const visibleTypeSummaries = useMemo(() => {
    return getFilteredTypeSummaries(typeSummaries, activeType);
  }, [activeType, typeSummaries]);

  const filteredCount = useMemo(() => {
    return getFilteredRelationshipCount({
      activeType,
      totalCount,
      groupedRelationships,
    });
  }, [activeType, groupedRelationships, totalCount]);

  useEffect(() => {
    if (!activeType) {
      setPulseState("idle");
      return;
    }

    setPulseState("active");
    setOpenCardId(null);
    scrollToRelationshipGroup(activeSummary);

    const pulseTimer = window.setTimeout(() => {
      setPulseState("idle");
    }, 700);

    return () => {
      window.clearTimeout(pulseTimer);
    };
  }, [activeSummary, activeType]);

  function toggleTypeFilter(type: string) {
    setActiveType((currentType) => (currentType === type ? null : type));
  }

  function clearTypeFilter() {
    setActiveType(null);
    setOpenCardId(null);
  }

  function toggleOpenCard(cardId: string) {
    setOpenCardId((currentCardId) =>
      currentCardId === cardId ? null : cardId,
    );
  }

  return (
    <>
      <MetadataRecordRelationshipDashboard
        totalCount={totalCount}
        primaryRelationship={primaryRelationship}
        typeSummaries={typeSummaries}
        activeType={activeType}
        filteredCount={filteredCount}
        onTypeFilterChange={toggleTypeFilter}
        onClearTypeFilter={clearTypeFilter}
      />

      <RelationshipActiveFilterBar
        activeType={activeType}
        filteredCount={filteredCount}
        totalCount={totalCount}
        openCardId={openCardId}
        pulseState={pulseState}
        onClearFilter={clearTypeFilter}
      />

      <MetadataRecordRelationshipGroups
        typeSummaries={visibleTypeSummaries}
        groupedRelationships={groupedRelationships}
        activeType={activeType}
        openCardId={openCardId}
        onOpenCardChange={toggleOpenCard}
        onTypeFilterChange={toggleTypeFilter}
        onRemove={onRemove}
      />
    </>
  );
}