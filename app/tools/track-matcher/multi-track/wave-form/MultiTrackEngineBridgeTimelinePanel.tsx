"use client";

import type {
  MultiTrackEngineBridgeSignal,
  MultiTrackEngineBridgeState,
  MultiTrackEngineBridgeStatus,
} from "./MultiTrackEngineBridgeTypes";
import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

type BridgeTimelineStep = {
  id: string;
  label: string;
  phase: string;
  detail: string;
  status: MultiTrackEngineBridgeStatus;
  source: string;
  destination: string;
  order: number;
  safeNext: string;
};

function getStatusLabel(status: MultiTrackEngineBridgeStatus): string {
  if (status === "connected") return "Connected";
  if (status === "warning") return "Warning";
  if (status === "blocked") return "Blocked";
  if (status === "waiting") return "Waiting";
  return "Idle";
}

function getSignalPhase(signal: MultiTrackEngineBridgeSignal, index: number): string {
  if (signal.ready) return "Active";
  if (index === 0) return "Foundation";
  if (index === 1) return "Routing";
  return "Expansion";
}

function buildTimelineSteps(state: MultiTrackEngineBridgeState): BridgeTimelineStep[] {
  const signalSteps: BridgeTimelineStep[] = state.signals.map((signal, index) => ({
    id: `signal-step-${signal.id}`,
    label: signal.label,
    phase: getSignalPhase(signal, index),
    detail: signal.detail,
    status: signal.status,
    source: signal.source,
    destination: signal.destination,
    order: index + 1,
    safeNext: signal.ready
      ? "Keep visible as a ready bridge route."
      : "Keep inactive until route ownership is verified.",
  }));

  const adapterSteps: BridgeTimelineStep[] = state.adapters.map((adapter, index) => ({
    id: `adapter-step-${adapter.id}`,
    label: adapter.label,
    phase: adapter.connected ? "Connected Adapter" : "Adapter Prep",
    detail: adapter.detail,
    status: adapter.connected ? "connected" : "waiting",
    source: adapter.sourceWorkspace,
    destination: adapter.destinationWorkspace,
    order: signalSteps.length + index + 1,
    safeNext: adapter.connected
      ? "Keep adapter visible as connected planning data."
      : "Do not route through this adapter until workspace connection is verified.",
  }));

  return [...signalSteps, ...adapterSteps].sort((left, right) => left.order - right.order);
}

function getNextTimelineStep(steps: BridgeTimelineStep[]): BridgeTimelineStep | null {
  return steps.find((step) => step.status !== "connected") ?? steps[0] ?? null;
}

function getCompletedStepCount(steps: BridgeTimelineStep[]): number {
  return steps.filter((step) => step.status === "connected").length;
}

function TimelineStepCard({ step }: { step: BridgeTimelineStep }) {
  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Step {step.order} · {step.phase}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{step.label}</h3>
        </div>

        <span className={pillClass}>{getStatusLabel(step.status)}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{step.detail}</p>
      <p className="mt-3 text-sm font-black leading-6 text-white">{step.safeNext}</p>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">
            Source
          </p>
          <p className="mt-2 font-black text-white">{step.source}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">
            Destination
          </p>
          <p className="mt-2 font-black text-white">{step.destination}</p>
        </div>
      </div>
    </article>
  );
}

function TimelineSummary({
  steps,
  nextStep,
}: {
  steps: BridgeTimelineStep[];
  nextStep: BridgeTimelineStep | null;
}) {
  const completedCount = getCompletedStepCount(steps);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-3">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Total Steps
        </p>
        <p className="mt-2 text-3xl font-black text-white">{steps.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Completed
        </p>
        <p className="mt-2 text-3xl font-black text-white">{completedCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Next Step
        </p>
        <p className="mt-2 text-lg font-black text-white">
          {nextStep?.label ?? "No step available"}
        </p>
      </article>
    </div>
  );
}

export function MultiTrackEngineBridgeTimelinePanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const steps = buildTimelineSteps(bridgeState);
  const nextStep = getNextTimelineStep(steps);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Timeline
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Engine Bridge Activation Timeline
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Planned activation order for connecting engine intelligence into
            workspace panels. This turns isolated bridge contracts into a
            visible routing path for future audio, analysis, sync, save, and
            metadata systems.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <TimelineSummary steps={steps} nextStep={nextStep} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {steps.map((step) => (
          <TimelineStepCard key={step.id} step={step} />
        ))}
      </div>
    </section>
  );
}