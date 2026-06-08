"use client";

import { DEFAULT_MULTI_TRACK_EXPERIMENT_WORKSPACE_STATE } from "./MultiTrackExperimentSeed";
import {
  getMultiTrackExperimentAverageKnobValue,
  getMultiTrackExperimentBankKeeperLane,
  getMultiTrackExperimentBankSummary,
  getMultiTrackExperimentComparePlanSummary,
  getMultiTrackExperimentDistanceLabel,
  getMultiTrackExperimentKnobKindLabel,
  getMultiTrackExperimentKnobSpread,
  getMultiTrackExperimentKnobSummary,
  getMultiTrackExperimentReadinessPercent,
  getMultiTrackExperimentRenderPlanSummary,
  getMultiTrackExperimentStatusLabel,
  getMultiTrackExperimentWorkspaceMetrics,
} from "./MultiTrackExperimentHelpers";
import type {
  MultiTrackExperimentBank,
  MultiTrackExperimentComparePlan,
  MultiTrackExperimentKnob,
  MultiTrackExperimentLane,
  MultiTrackExperimentRenderPlan,
} from "./MultiTrackExperimentTypes";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

function WorkspaceSummary() {
  const state = DEFAULT_MULTI_TRACK_EXPERIMENT_WORKSPACE_STATE;
  const metrics = getMultiTrackExperimentWorkspaceMetrics(state);
  const readiness = getMultiTrackExperimentReadinessPercent(state);
  const distance = getMultiTrackExperimentDistanceLabel(state);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-5">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Banks
        </p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.bankCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Lanes
        </p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.laneCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Selected
        </p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.selectedCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Keepers
        </p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.keeperCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Ready
        </p>
        <p className="mt-2 text-3xl font-black text-white">{readiness}%</p>
        <p className="mt-2 text-sm font-black text-white">{distance}</p>
      </article>
    </div>
  );
}

function KnobCard({ knob }: { knob: MultiTrackExperimentKnob }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{knob.label}</p>
          <p className="mt-1 text-xs leading-5 text-white/60">{knob.detail}</p>
        </div>
        <span className={pillClass}>
          {knob.value}
          {knob.unit}
        </span>
      </div>

      <p className="mt-3 text-xs font-black text-white">
        {getMultiTrackExperimentKnobSummary(knob)}
      </p>
    </div>
  );
}

function ExperimentLaneCard({ lane }: { lane: MultiTrackExperimentLane }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Lane {lane.laneNumber}
          </p>
          <h4 className="mt-2 text-lg font-black text-white">{lane.label}</h4>
          <p className="mt-2 text-xs leading-5 text-white/70">{lane.notes}</p>
        </div>

        <span className={pillClass}>
          {getMultiTrackExperimentStatusLabel(lane.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {lane.knobs.map((knob) => (
          <KnobCard key={knob.id} knob={knob} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={pillClass}>{lane.selected ? "Selected" : "Not Selected"}</span>
        <span className={pillClass}>{lane.locked ? "Locked" : "Editable"}</span>
        {lane.editTargets.map((target) => (
          <span key={target} className={pillClass}>
            {target}
          </span>
        ))}
      </div>
    </article>
  );
}

function ExperimentBankCard({ bank }: { bank: MultiTrackExperimentBank }) {
  const keeper = getMultiTrackExperimentBankKeeperLane(bank);

  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {bank.color} · {bank.riffGroupLabel}
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">{bank.label}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{bank.detail}</p>
        </div>

        <span className={pillClass}>{bank.duplicateCount} duplicates</span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Summary</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {getMultiTrackExperimentBankSummary(bank)}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Keeper</span>
          <span className="text-right text-sm font-black text-white">
            {keeper?.label ?? "No keeper"}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {(["pitch", "timing", "gain", "stretch"] as const).map((kind) => (
          <div key={kind} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs text-white/60">{getMultiTrackExperimentKnobKindLabel(kind)}</p>
            <p className="mt-1 text-lg font-black text-white">
              Avg {getMultiTrackExperimentAverageKnobValue(bank.lanes, kind)}
            </p>
            <p className="mt-1 text-xs text-white/70">
              Spread {getMultiTrackExperimentKnobSpread(bank.lanes, kind)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {bank.lanes.map((lane) => (
          <ExperimentLaneCard key={lane.id} lane={lane} />
        ))}
      </div>
    </article>
  );
}

function ComparePlanCard({ plan }: { plan: MultiTrackExperimentComparePlan }) {
  return (
    <article className={cardClass}>
      <h3 className="text-lg font-black text-white">{plan.label}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{plan.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Compare</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {getMultiTrackExperimentComparePlanSummary(plan)}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Ready</span>
          <span className="text-sm font-black text-white">{plan.ready ? "Yes" : "No"}</span>
        </div>
      </div>
    </article>
  );
}

function RenderPlanCard({ plan }: { plan: MultiTrackExperimentRenderPlan }) {
  return (
    <article className={cardClass}>
      <h3 className="text-lg font-black text-white">{plan.label}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{plan.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Render</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {getMultiTrackExperimentRenderPlanSummary(plan)}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Ready</span>
          <span className="text-sm font-black text-white">{plan.ready ? "Yes" : "No"}</span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackExperimentWorkspacePanel() {
  const state = DEFAULT_MULTI_TRACK_EXPERIMENT_WORKSPACE_STATE;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Multi Track Experiment Engine
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            Duplicate Riff Knob-Turning Lab
          </h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {state.summary}
          </p>
        </div>

        <span className={pillClass}>
          {state.targetKey} · {state.targetBpm} BPM · {state.microEditStepSeconds}s
        </span>
      </div>

      <WorkspaceSummary />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {state.comparePlans.map((plan) => (
          <ComparePlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {state.renderPlans.map((plan) => (
          <RenderPlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-5 grid gap-5">
        {state.banks.map((bank) => (
          <ExperimentBankCard key={bank.id} bank={bank} />
        ))}
      </div>
    </section>
  );
}