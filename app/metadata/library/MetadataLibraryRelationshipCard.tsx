"use client";

import { useState } from "react";

import { formatLabel, highlightText } from "./metadataLibraryHelpers";
import { buildReasonSnapshot } from "./MetadataLibraryRelationshipIntelligence";
import {
  getRelationshipReason,
  getSourceDescription,
  getTrailLabel,
} from "./MetadataLibraryStructureHelpers";
import type {
  MetadataLibraryRelationshipCardProps,
  MetadataLibraryRelationshipContextRecord,
} from "./MetadataLibraryRelationshipTypes";

export default function MetadataLibraryRelationshipCard({
  activeQuery,
  record,
  strength,
  source,
  openRecord,
  score,
  onOpenRelatedRecord,
}: MetadataLibraryRelationshipCardProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const reason = getRelationshipReason({
    strength,
    source,
    record,
    openRecord,
  });

  const trailLabel = getTrailLabel(strength, source);

  const reasonSnapshot = buildReasonSnapshot({
    record,
    score,
    layer: "structure",
  });

  function handleClick() {
    if (isOpening) return;

    setIsOpening(true);

    const enrichedRecord: MetadataLibraryRelationshipContextRecord = {
      ...record,
      __relationshipContext: {
        strength,
        source,
        fromId: openRecord.id,
        fromTitle: openRecord.title,
        fromRecord: openRecord,
        reason,
        trailLabel,
        score: score.confidenceScore,
        clickedLayer: "structure",
        reasonSnapshot,
        whyItMatters: score.whyItMatters,
        meaningPotential: score.meaningPotential,
        usagePotential: score.usagePotential,
        crossLayerHint: score.crossLayerHint,
      },
    };

    setTimeout(() => {
      onOpenRelatedRecord(enrichedRecord);
    }, 120);
  }

  return (
    <div
      className={`group rounded-lg border px-3 py-3 text-left text-sm transition ${
        isOpening
          ? "border-white bg-white text-black"
          : "border-white bg-black text-white hover:-translate-y-0.5 hover:shadow-lg"
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        className="block w-full text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
            {trailLabel}
          </span>

          <span className="text-right text-[10px] opacity-70">
            {score.confidenceLabel}
          </span>
        </div>

        <div className="mt-2 font-semibold">
          {highlightText(record.title, activeQuery)}
        </div>

        <div className="mt-1 text-xs opacity-70">
          {formatLabel(record.shelf)} / {formatLabel(record.section)}
        </div>

        {record.excerpt && (
          <div className="mt-2 line-clamp-2 text-xs leading-5 opacity-70">
            {record.excerpt}
          </div>
        )}

        <div className="mt-2 rounded border border-white/30 px-2 py-1 text-xs leading-5">
          {reason}
        </div>

        <div className="mt-2 rounded border border-white/20 px-2 py-1 text-xs leading-5 opacity-75">
          Trail context: {getSourceDescription(source)}
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div className="rounded border border-white/20 px-2 py-1 text-xs leading-5 opacity-80">
            {score.meaningPotential}
          </div>

          <div className="rounded border border-white/20 px-2 py-1 text-xs leading-5 opacity-80">
            {score.usagePotential}
          </div>
        </div>

        <div className="mt-2 rounded border border-white/20 px-2 py-1 text-xs leading-5 opacity-75">
          {score.crossLayerHint}
        </div>

        <div className="mt-3 rounded border border-white/30 px-2 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
              Confidence Score
            </p>

            <p className="text-xs font-semibold">{score.confidenceScore}/100</p>
          </div>

          <div className="mt-2 h-1.5 rounded-full border border-white/30">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${score.confidenceScore}%` }}
            />
          </div>
        </div>

        <div className="mt-2 text-xs">
          {isOpening ? "Opening with trail…" : "Click to open with trail"}
        </div>
      </button>

      <button
        type="button"
        onClick={() => setShowReasoning((value) => !value)}
        className="mt-3 rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 hover:border-white hover:text-white"
      >
        {showReasoning ? "Hide reasoning" : "Why this matters"}
      </button>

      {showReasoning && (
        <div className="mt-3 grid gap-2">
          <div className="rounded border border-white/30 px-2 py-2 text-xs leading-5 text-white/75">
            {score.whyItMatters}
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded border border-white/20 px-2 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Structure
              </p>

              <p className="mt-1 text-xs text-white/70">
                {score.structureScore}/100
              </p>
            </div>

            <div className="rounded border border-white/20 px-2 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Meaning
              </p>

              <p className="mt-1 text-xs text-white/70">
                {score.meaningScore}/100
              </p>

              <p className="mt-1 text-[10px] leading-4 text-white/50">
                {score.meaningPotential}
              </p>
            </div>

            <div className="rounded border border-white/20 px-2 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Usage
              </p>

              <p className="mt-1 text-xs text-white/70">
                {score.usageScore}/100
              </p>

              <p className="mt-1 text-[10px] leading-4 text-white/50">
                {score.usagePotential}
              </p>
            </div>
          </div>

          <p className="rounded border border-white/20 px-2 py-2 text-xs leading-5 text-white/60">
            {score.confidenceDetail}
          </p>

          <p className="rounded border border-white/20 px-2 py-2 text-xs leading-5 text-white/60">
            {score.crossLayerHint}
          </p>
        </div>
      )}
    </div>
  );
}