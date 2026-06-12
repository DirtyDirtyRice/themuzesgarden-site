"use client";

import { multiTrackRiffColorEngineSeedState } from "./MultiTrackRiffColorEngineSeed";
import {
  getRiffColorConflictSeverityLabel,
  getRiffColorEngineDistanceLabel,
  getRiffColorEngineMetrics,
  getRiffColorFamilyAction,
  getRiffColorFamilyAverageConfidence,
  getRiffColorFamilyAverageSimilarity,
  getRiffColorFamilyScore,
  getRiffColorLabel,
  getRiffColorReadinessLabel,
  getRiffColorRegionRiskLabel,
  getRiffColorStatusLabel,
} from "./MultiTrackRiffColorEngineHelpers";
import type {
  MultiTrackRiffColorConflict,
  MultiTrackRiffColorFamily,
  MultiTrackRiffColorRegion,
} from "./MultiTrackRiffColorEngineTypes";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

function RiffColorSummary() {
  const state = multiTrackRiffColorEngineSeedState;
  const metrics = getRiffColorEngineMetrics(state);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4 xl:grid-cols-8">
      <article className={cardClass}><p className="text-xs text-white/60">Families</p><p className="mt-2 text-3xl font-black text-white">{metrics.familyCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Regions</p><p className="mt-2 text-3xl font-black text-white">{metrics.regionCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Ready</p><p className="mt-2 text-3xl font-black text-white">{metrics.readyRegionCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Review</p><p className="mt-2 text-3xl font-black text-white">{metrics.reviewRegionCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Conflicts</p><p className="mt-2 text-3xl font-black text-white">{metrics.conflictCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Open</p><p className="mt-2 text-3xl font-black text-white">{metrics.unresolvedConflictCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Extract</p><p className="mt-2 text-3xl font-black text-white">{metrics.extractionReadyCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Confidence</p><p className="mt-2 text-3xl font-black text-white">{metrics.averageConfidence}%</p></article>
    </div>
  );
}

function RegionCard({ region }: { region: MultiTrackRiffColorRegion }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">
            {region.versionLabel} · {getRiffColorLabel(region.color)}
          </p>
          <h4 className="mt-2 text-lg font-black text-white">{region.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">{region.notes}</p>
        </div>
        <span className={pillClass}>{getRiffColorStatusLabel(region.status)}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Time</p>
          <p className="mt-1 text-sm font-black text-white">{region.timeRange.label}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Similarity</p>
          <p className="mt-1 text-2xl font-black text-white">{region.similarityPercent}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Confidence</p>
          <p className="mt-1 text-2xl font-black text-white">{region.confidencePercent}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Readiness</p>
          <p className="mt-1 text-sm font-black text-white">
            {getRiffColorReadinessLabel(region.readiness)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Risks</p>
          <p className="mt-1 text-xs font-black leading-5 text-white">
            {getRiffColorRegionRiskLabel(region)}
          </p>
        </div>
      </div>
    </article>
  );
}

function FamilyCard({ family }: { family: MultiTrackRiffColorFamily }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">
            {getRiffColorLabel(family.color)} · {family.phraseFamilyId}
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">{family.label}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{family.detail}</p>
        </div>
        <span className={pillClass}>{getRiffColorFamilyScore(family)}</span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Action</span>
          <span className="text-right text-sm font-black text-white">
            {getRiffColorFamilyAction(family)}
          </span>
        </div>
        <div className={rowClass}>
          <span className="text-sm text-white/70">Average</span>
          <span className="text-sm font-black text-white">
            {getRiffColorFamilyAverageSimilarity(family)}% similarity ·{" "}
            {getRiffColorFamilyAverageConfidence(family)}% confidence
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {family.regions.map((region) => (
          <RegionCard key={region.id} region={region} />
        ))}
      </div>
    </article>
  );
}

function ConflictCard({ conflict }: { conflict: MultiTrackRiffColorConflict }) {
  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">{conflict.label}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">{conflict.detail}</p>
        </div>
        <span className={pillClass}>{getRiffColorConflictSeverityLabel(conflict)}</span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Color Decision</span>
          <span className="text-sm font-black text-white">
            {conflict.currentColor} → {conflict.suggestedColor}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackRiffColorEngineWorkspacePanel() {
  const state = multiTrackRiffColorEngineSeedState;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">
            Multi Track Riff Color Engine
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">{state.title}</h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <span className={pillClass}>
          {state.targetKey} · {state.targetBpm} BPM · {getRiffColorEngineDistanceLabel(state)}
        </span>
      </div>

      <RiffColorSummary />

      <div className="mt-5 grid gap-5">
        {state.families.map((family) => (
          <FamilyCard key={family.id} family={family} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {state.conflicts.map((conflict) => (
          <ConflictCard key={conflict.id} conflict={conflict} />
        ))}
      </div>
    </section>
  );
}

export default MultiTrackRiffColorEngineWorkspacePanel;