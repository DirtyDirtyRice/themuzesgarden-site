"use client";

import { formatLabel, highlightText } from "./metadataLibraryHelpers";
import {
  buildRelationshipTrailSummary,
  explainRelationshipSource,
  explainRelationshipStrength,
  getRelationshipLayerLabel,
  labelRelationshipSource,
  labelRelationshipStrength,
  type MetadataRelationshipLayerKey,
  type MetadataRelationshipRecordWithContext,
  type MetadataRelationshipSnapshot,
  type MetadataRelationshipSource,
  type MetadataRelationshipStrength,
} from "./MetadataLibraryRelationshipIntelligence";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

type Props = {
  activeLayer: MetadataRelationshipLayerKey;
  activeQuery: string;
  openRecord: MetadataRelationshipRecordWithContext;
  relatedByShelfLength: number;
  relatedBySectionLength: number;
  relationshipSnapshot: MetadataRelationshipSnapshot;
  onOpenRelatedRecord: (record: MetadataLibraryRecordSummary) => void;
};

type Strength = MetadataRelationshipStrength;
type Source = MetadataRelationshipSource;

function labelStrength(strength: Strength) {
  return labelRelationshipStrength(strength);
}

function labelSource(source: Source) {
  return labelRelationshipSource(source);
}

function explainStrength(strength: Strength) {
  return explainRelationshipStrength(strength);
}

function explainSource(source: Source) {
  return explainRelationshipSource(source);
}

export default function MetadataLibraryRelationshipHeaderPanel({
  activeLayer,
  activeQuery,
  openRecord,
  relatedByShelfLength,
  relatedBySectionLength,
  relationshipSnapshot,
  onOpenRelatedRecord,
}: Props) {
  const relationshipContext = openRecord.__relationshipContext;

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          Relationships
        </p>

        <p className="mt-2 text-sm leading-6 text-white/75">
          Relationship intelligence starts with structure, then expands into
          meaning and usage layers. This panel keeps related metadata inside the
          workspace while preserving the record trail you are exploring.
        </p>
      </div>

      <div className="rounded-xl border border-white bg-black p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Current Relationship Context
            </p>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Viewing{" "}
              <span className="font-semibold text-white">
                {highlightText(openRecord.title, activeQuery)}
              </span>{" "}
              in {formatLabel(openRecord.shelf)} /{" "}
              {formatLabel(openRecord.section)}.
            </p>
          </div>

          <span className="rounded-full border border-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
            {getRelationshipLayerLabel(activeLayer)}
          </span>
        </div>

        <div className="mt-3 rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Structure Path
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {formatLabel(openRecord.shelf)} →{" "}
            {formatLabel(openRecord.section)} →{" "}
            {formatLabel(openRecord.visibility)}
          </p>
        </div>

        <div className="mt-3 rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Layer Memory
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {relationshipSnapshot.layerMemoryLabel}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/55">
            {relationshipSnapshot.layerPurpose}
          </p>
        </div>

        {relationshipContext ? (
          <div className="mt-3 rounded-lg border border-white/50 bg-white px-3 py-2 text-black">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                Opened from relationship
              </p>

              <span className="rounded-full border border-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
                {relationshipContext.trailLabel ?? "Trail carried"}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6">
              Came from{" "}
              <span className="font-semibold">
                {formatLabel(relationshipContext.fromTitle)}
              </span>{" "}
              through{" "}
              <span className="font-semibold">
                {labelStrength(relationshipContext.strength)}
              </span>{" "}
              /{" "}
              <span className="font-semibold">
                {labelSource(relationshipContext.source)}
              </span>
              .
            </p>

            {typeof relationshipContext.score === "number" && (
              <div className="mt-2 rounded-md border border-black/20 px-2 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                    Carried confidence
                  </p>

                  <span className="text-xs font-semibold">
                    {relationshipContext.score}/100
                  </span>
                </div>

                <div className="mt-2 h-1.5 rounded-full border border-black/30">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{ width: `${relationshipContext.score}%` }}
                  />
                </div>
              </div>
            )}

            {(relationshipContext.meaningPotential ||
              relationshipContext.usagePotential ||
              relationshipContext.crossLayerHint) && (
              <div className="mt-2 rounded-md border border-black/20 px-2 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                  Cross-layer signal
                </p>

                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {relationshipContext.meaningPotential && (
                    <p className="rounded border border-black/20 px-2 py-1 text-xs leading-5 text-black/75">
                      {relationshipContext.meaningPotential}
                    </p>
                  )}

                  {relationshipContext.usagePotential && (
                    <p className="rounded border border-black/20 px-2 py-1 text-xs leading-5 text-black/75">
                      {relationshipContext.usagePotential}
                    </p>
                  )}
                </div>

                {relationshipContext.crossLayerHint && (
                  <p className="mt-2 rounded border border-black/20 px-2 py-1 text-xs leading-5 text-black/75">
                    {relationshipContext.crossLayerHint}
                  </p>
                )}
              </div>
            )}

            {relationshipContext.reason && (
              <p className="mt-2 rounded-md border border-black/20 px-2 py-1 text-xs leading-5 text-black/75">
                {relationshipContext.reason}
              </p>
            )}

            {relationshipContext.reasonSnapshot && (
              <p className="mt-2 rounded-md border border-black/20 px-2 py-1 text-xs leading-5 text-black/75">
                {relationshipContext.reasonSnapshot}
              </p>
            )}

            {relationshipContext.whyItMatters && (
              <p className="mt-2 rounded-md border border-black/20 px-2 py-1 text-xs leading-5 text-black/75">
                {relationshipContext.whyItMatters}
              </p>
            )}

            <p className="mt-2 text-xs leading-5 text-black/70">
              {explainStrength(relationshipContext.strength)}
            </p>

            <p className="mt-1 text-xs leading-5 text-black/70">
              {explainSource(relationshipContext.source)}
            </p>

            <p className="mt-2 rounded-md border border-black/20 px-2 py-1 text-xs leading-5 text-black/75">
              {buildRelationshipTrailSummary(relationshipContext)}
            </p>

            {relationshipContext.clickedLayer && (
              <p className="mt-2 rounded-md border border-black/20 px-2 py-1 text-xs leading-5 text-black/75">
                The relationship was opened from the{" "}
                {getRelationshipLayerLabel(relationshipContext.clickedLayer)}{" "}
                layer, so the header now remembers the layer that created this
                trail.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  onOpenRelatedRecord(relationshipContext.fromRecord)
                }
                className="rounded-full border border-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
              >
                Back to {formatLabel(relationshipContext.fromTitle)}
              </button>

              <span className="rounded-full border border-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/70">
                Trail preserved
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Open context
            </p>

            <p className="mt-1 text-xs leading-5 text-white/70">
              This record was opened directly, so no relationship source has
              been carried into the header yet.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white bg-black p-3">
        <p className="text-sm font-semibold text-white">
          Relationship Intelligence Summary
        </p>

        <div className="mt-3 grid gap-2">
          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Same Shelf
            </p>

            <p className="mt-1 text-sm leading-6 text-white/75">
              {relatedByShelfLength} records share this record&apos;s shelf.
            </p>
          </div>

          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Same Section
            </p>

            <p className="mt-1 text-sm leading-6 text-white/75">
              {relatedBySectionLength} records share this record&apos;s section.
            </p>
          </div>

          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Meaning Ready
            </p>

            <p className="mt-1 text-sm leading-6 text-white/75">
              This record is ready for future meaning-based comparisons once
              semantic fields are introduced.
            </p>
          </div>

          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Usage Ready
            </p>

            <p className="mt-1 text-sm leading-6 text-white/75">
              This record is ready for future usage tracking across tracks,
              prompts, instruments, workflows, and app features.
            </p>
          </div>

          <div className="rounded-lg border border-white/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Cross-Layer Bridge
            </p>

            <p className="mt-1 text-sm leading-6 text-white/75">
              {relationshipSnapshot.crossLayerBridge}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}