"use client";

import { multiTrackCompatibilityIntelligenceWorkspaceState } from "./MultiTrackCompatibilityIntelligenceSeed";
import {
  getMultiTrackCompatibilityCategoryLabel,
  getMultiTrackCompatibilityEvidenceSourceLabel,
  getMultiTrackCompatibilityEvidenceSummary,
  getMultiTrackCompatibilityLanePairs,
  getMultiTrackCompatibilityLaneSignals,
  getMultiTrackCompatibilityPairSignals,
  getMultiTrackCompatibilityRatingLabel,
  getMultiTrackCompatibilityRiskSummary,
  getMultiTrackCompatibilityStatusClass,
  getMultiTrackCompatibilityStatusLabel,
  getMultiTrackCompatibilityUseCaseLabel,
  getMultiTrackCompatibilityWorkspaceSummary,
} from "./MultiTrackCompatibilityIntelligenceHelpers";
import type {
  MultiTrackCompatibilityChecklistItem,
  MultiTrackCompatibilityLane,
  MultiTrackCompatibilityPair,
  MultiTrackCompatibilitySignal,
} from "./MultiTrackCompatibilityIntelligenceTypes";

function CompatibilityStatusPill({
  status,
}: {
  status: MultiTrackCompatibilityChecklistItem["status"];
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getMultiTrackCompatibilityStatusClass(
        status,
      )}`}
    >
      {getMultiTrackCompatibilityStatusLabel(status)}
    </span>
  );
}

function CompatibilityBlockHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
        {eyebrow}
      </p>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="max-w-4xl text-sm leading-6 text-white/70">
        {description}
      </p>
    </div>
  );
}

function CompatibilityMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">{detail}</p>
    </div>
  );
}

function CompatibilitySignalCard({
  signal,
}: {
  signal: MultiTrackCompatibilitySignal;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackCompatibilityCategoryLabel(signal.category)}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {signal.label}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {signal.summary}
          </p>
        </div>
        <CompatibilityStatusPill status={signal.readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Rating
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackCompatibilityRatingLabel(signal.rating)}
          </p>
          <p className="mt-1 text-xs text-white/50">{signal.scoreLabel}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackCompatibilityEvidenceSourceLabel(
              signal.evidenceSource,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Risks
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackCompatibilityRiskSummary(signal.risks)}
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {signal.reviewNote}
      </p>
    </article>
  );
}

function CompatibilityPairCard({
  pair,
  signals,
}: {
  pair: MultiTrackCompatibilityPair;
  signals: MultiTrackCompatibilitySignal[];
}) {
  const pairSignals = getMultiTrackCompatibilityPairSignals(pair, signals);

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackCompatibilityUseCaseLabel(pair.useCase)}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {pair.title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {pair.recommendation}
          </p>
        </div>
        <CompatibilityStatusPill status={pair.readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Rating
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackCompatibilityRatingLabel(pair.rating)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackCompatibilityEvidenceSummary(pair.evidenceSources)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Signals
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {pairSignals.map((signal) => (
            <span
              key={signal.id}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70"
            >
              {signal.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Risks
        </p>
        <p className="mt-2 text-sm leading-6 text-white/65">
          {getMultiTrackCompatibilityRiskSummary(pair.risks)}
        </p>
      </div>
    </article>
  );
}

function CompatibilityLaneCard({
  lane,
  signals,
  pairs,
}: {
  lane: MultiTrackCompatibilityLane;
  signals: MultiTrackCompatibilitySignal[];
  pairs: MultiTrackCompatibilityPair[];
}) {
  const laneSignals = getMultiTrackCompatibilityLaneSignals(lane, signals);
  const lanePairs = getMultiTrackCompatibilityLanePairs(lane, pairs);

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackCompatibilityUseCaseLabel(lane.useCase)}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {lane.title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {lane.description}
          </p>
        </div>
        <CompatibilityStatusPill status={lane.status} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Lane Signals
          </p>
          <div className="mt-3 space-y-2">
            {laneSignals.map((signal) => (
              <p key={signal.id} className="text-sm text-white/75">
                {signal.label}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Lane Pairs
          </p>
          <div className="mt-3 space-y-2">
            {lanePairs.map((pair) => (
              <p key={pair.id} className="text-sm text-white/75">
                {pair.title}
              </p>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {lane.reviewGoal}
      </p>
    </article>
  );
}

function CompatibilityChecklistRow({
  item,
}: {
  item: MultiTrackCompatibilityChecklistItem;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">{item.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/65">{item.detail}</p>
        </div>
        <CompatibilityStatusPill status={item.status} />
      </div>
    </div>
  );
}

export function MultiTrackCompatibilityIntelligenceWorkspacePanel() {
  const workspace = multiTrackCompatibilityIntelligenceWorkspaceState;
  const readySignalCount = workspace.signals.filter(
    (signal) => signal.readinessStatus === "ready",
  ).length;
  const reviewSignalCount = workspace.signals.filter(
    (signal) => signal.readinessStatus === "needs-review",
  ).length;
  const readyPairCount = workspace.pairs.filter(
    (pair) => pair.readinessStatus === "ready",
  ).length;
  const futureLaneCount = workspace.lanes.filter(
    (lane) => lane.status === "future",
  ).length;

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-black p-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              Waveform Workstation
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {workspace.title}
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
              {workspace.description}
            </p>
            <p className="mt-3 text-sm font-semibold text-white/75">
              {getMultiTrackCompatibilityWorkspaceSummary(workspace)}
            </p>
          </div>
          <CompatibilityStatusPill status={workspace.status} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <CompatibilityMetricCard
          label="Ready Signals"
          value={String(readySignalCount)}
          detail="Compatibility signals safe for read-only display."
        />
        <CompatibilityMetricCard
          label="Review Signals"
          value={String(reviewSignalCount)}
          detail="Signals that need stronger evidence before recommendation."
        />
        <CompatibilityMetricCard
          label="Ready Pairs"
          value={String(readyPairCount)}
          detail="Track-pair views ready for A/B review."
        />
        <CompatibilityMetricCard
          label="Future Lanes"
          value={String(futureLaneCount)}
          detail="Reserved lanes for future analyzer compatibility."
        />
      </div>

      <div className="space-y-4">
        <CompatibilityBlockHeader
          eyebrow="Signals"
          title="Compatibility signals"
          description="Read-only signals for tempo, key, sections, stems, arrangement, energy, lineage, confidence, and hybrid readiness."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.signals.map((signal) => (
            <CompatibilitySignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <CompatibilityBlockHeader
          eyebrow="Pairs"
          title="Track compatibility pairs"
          description="A/B review pairs that combine multiple signals into safe planning recommendations."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.pairs.map((pair) => (
            <CompatibilityPairCard
              key={pair.id}
              pair={pair}
              signals={workspace.signals}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <CompatibilityBlockHeader
          eyebrow="Lanes"
          title="Compatibility review lanes"
          description="Grouped lanes for basic review, musical fit, hybrid fit, and future AI compatibility."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.lanes.map((lane) => (
            <CompatibilityLaneCard
              key={lane.id}
              lane={lane}
              signals={workspace.signals}
              pairs={workspace.pairs}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <CompatibilityBlockHeader
          eyebrow="Checklist"
          title="Recovery-safe checklist"
          description="Guardrails for keeping compatibility review read-only, confidence-gated, and safe before future hybrid building."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {workspace.checklist.map((item) => (
            <CompatibilityChecklistRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}