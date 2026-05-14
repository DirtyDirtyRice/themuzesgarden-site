"use client";

import Link from "next/link";
import { useMemo } from "react";

import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import { getFindItRelationshipSummariesForSearch } from "./findItRelationshipAdapter";

type RelationshipSummary = ReturnType<
  typeof getFindItRelationshipSummariesForSearch
>[number];

function cleanSearchValue(searchValue: string) {
  return searchValue.trim();
}

function getRelationshipLimit(
  searchValue: string,
  selectedResult: NavigationSearchResult | null,
) {
  if (selectedResult) {
    return 8;
  }

  return cleanSearchValue(searchValue).length > 0 ? 6 : 4;
}

function getSelectedRoute(selectedResult: NavigationSearchResult | null) {
  return selectedResult?.node.href ?? null;
}

function getRelationshipRoute(relationship: RelationshipSummary) {
  return relationship.targetSlug ? `/metadata/${relationship.targetSlug}` : null;
}

function getPanelStatusLabel({
  selectedResult,
  relationshipCount,
}: {
  selectedResult: NavigationSearchResult | null;
  relationshipCount: number;
}) {
  if (selectedResult && relationshipCount > 0) {
    return "Explore next";
  }

  if (selectedResult) {
    return "Selected context";
  }

  if (relationshipCount > 0) {
    return "Related ideas";
  }

  return "Connection preview";
}

function getPanelIntroCopy({
  searchValue,
  selectedResult,
  relationshipCount,
}: {
  searchValue: string;
  selectedResult: NavigationSearchResult | null;
  relationshipCount: number;
}) {
  const cleanSearch = cleanSearchValue(searchValue);

  if (selectedResult && relationshipCount > 0) {
    return `Find It found related ideas for "${cleanSearch || selectedResult.node.label}". Use this panel to keep exploring without losing the selected destination.`;
  }

  if (selectedResult) {
    return `Find It selected "${selectedResult.node.label}". More relationship links will appear as metadata records grow.`;
  }

  if (relationshipCount > 0) {
    return `Find It found metadata relationships for "${cleanSearch}". These are useful next ideas to explore.`;
  }

  if (cleanSearch) {
    return `No relationship links are available for "${cleanSearch}" yet. Try C Major, Major Scale, major, scale, or find.`;
  }

  return "Find It connects navigation, metadata, and relationships. After you search, this panel can show connected ideas to explore next.";
}

function getRelationshipActionLabel(relationship: RelationshipSummary) {
  if (relationship.targetSlug) {
    return "Open related";
  }

  return "Related";
}

function RelationshipCard({
  relationship,
}: {
  relationship: RelationshipSummary;
}) {
  const relationshipRoute = getRelationshipRoute(relationship);

  return (
    <article className="rounded-xl border border-white/10 bg-black/40 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">
            {relationship.sourceLabel} → {relationship.targetLabel}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/55">
            {relationship.note || "Related metadata idea."}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
          {relationship.type}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] leading-5 text-white/40">
          Source: {relationship.sourceSlug}
        </p>

        {relationshipRoute ? (
          <Link
            href={relationshipRoute}
            className="rounded-lg border border-white/15 bg-white px-3 py-2 text-xs font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
          >
            {getRelationshipActionLabel(relationship)}
          </Link>
        ) : (
          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/45">
            {getRelationshipActionLabel(relationship)}
          </span>
        )}
      </div>
    </article>
  );
}

export default function FindItMoreInfoPreview({
  searchValue = "",
  selectedResult = null,
}: {
  searchValue?: string;
  selectedResult?: NavigationSearchResult | null;
}) {
  const relationshipSummaries = useMemo(() => {
    const limit = getRelationshipLimit(searchValue, selectedResult);

    if (!searchValue && !selectedResult) {
      return [];
    }

    return getFindItRelationshipSummariesForSearch(
      searchValue || selectedResult?.node.label || "",
    ).slice(0, limit);
  }, [searchValue, selectedResult]);

  const selectedRoute = getSelectedRoute(selectedResult);
  const statusLabel = getPanelStatusLabel({
    selectedResult,
    relationshipCount: relationshipSummaries.length,
  });
  const introCopy = getPanelIntroCopy({
    searchValue,
    selectedResult,
    relationshipCount: relationshipSummaries.length,
  });

  return (
    <section className="rounded-2xl border border-white/10 bg-black/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            More info
          </p>

          <p className="mt-2 text-sm leading-6 text-white/65">
            {introCopy}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
          {statusLabel}
        </span>
      </div>

      {selectedResult ? (
        <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-100/70">
                Selected destination
              </p>

              <p className="mt-2 text-sm font-semibold text-white">
                {selectedResult.node.label}
              </p>

              <p className="mt-1 text-xs leading-5 text-white/60">
                {selectedResult.node.description}
              </p>
            </div>

            {selectedRoute ? (
              <Link
                href={selectedRoute}
                className="rounded-lg border border-white/15 bg-white px-3 py-2 text-xs font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
              >
                Open selected
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {relationshipSummaries.length > 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
                Related ideas
              </p>

              <p className="mt-1 text-xs leading-5 text-white/55">
                These are metadata relationship paths connected to your search.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
              {relationshipSummaries.length} shown
            </span>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {relationshipSummaries.map((relationship) => (
              <RelationshipCard
                key={`${relationship.id}-${relationship.sourceSlug}-${relationship.targetLabel}`}
                relationship={relationship}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
            Related ideas
          </p>

          <p className="mt-2 text-sm leading-6 text-white/60">
            No related metadata links are available for this search yet. This is
            where future relationship records will appear.
          </p>
        </div>
      )}
    </section>
  );
}