"use client";

import type {
  MultiTrackEngineBridgeAdapter,
  MultiTrackEngineBridgeSignal,
  MultiTrackEngineBridgeState,
} from "./MultiTrackEngineBridgeTypes";
import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

type ReadinessLaneKind = "signal" | "adapter" | "guardrail" | "dashboard";

type ReadinessLane = {
  id: string;
  label: string;
  kind: ReadinessLaneKind;
  ready: boolean;
  score: number;
  detail: string;
  source: string;
  blocker: string;
  unlocks: string;
};

function getSignalReadinessScore(signal: MultiTrackEngineBridgeSignal): number {
  if (signal.ready && signal.status === "connected") return 100;
  if (signal.ready) return 80;
  if (signal.status === "warning") return 50;
  if (signal.status === "blocked") return 0;
  return 20;
}

function getAdapterReadinessScore(adapter: MultiTrackEngineBridgeAdapter): number {
  return adapter.connected ? 100 : 15;
}

function buildSignalReadinessLanes(
  signals: MultiTrackEngineBridgeSignal[],
): ReadinessLane[] {
  return signals.map((signal) => ({
    id: `signal-readiness-${signal.id}`,
    label: signal.label,
    kind: "signal",
    ready: signal.ready,
    score: getSignalReadinessScore(signal),
    detail: signal.detail,
    source: `${signal.source} → ${signal.destination}`,
    blocker: signal.ready
      ? "No blocker. Signal is marked ready."
      : "Signal is not ready for live bridge routing.",
    unlocks:
      "Allows the future dashboard to show this signal as verified bridge data.",
  }));
}

function buildAdapterReadinessLanes(
  adapters: MultiTrackEngineBridgeAdapter[],
): ReadinessLane[] {
  return adapters.map((adapter) => ({
    id: `adapter-readiness-${adapter.id}`,
    label: adapter.label,
    kind: "adapter",
    ready: adapter.connected,
    score: getAdapterReadinessScore(adapter),
    detail: adapter.detail,
    source: `${adapter.sourceWorkspace} → ${adapter.destinationWorkspace}`,
    blocker: adapter.connected
      ? "No blocker. Adapter is connected."
      : "Adapter is preserved but not connected to a live dashboard wrapper.",
    unlocks:
      "Allows bridge data to move between workspaces without direct page wiring.",
  }));
}

function buildGuardrailReadinessLanes(state: MultiTrackEngineBridgeState): ReadinessLane[] {
  return [
    {
      id: "guardrail-readiness-wave-form-only",
      label: "Wave-form Preservation Boundary",
      kind: "guardrail",
      ready: true,
      score: 100,
      detail:
        "Bridge files are preserved in wave-form and are not active page wiring yet.",
      source: "wave-form → future dashboard wrapper",
      blocker: "No blocker. This is the safe current boundary.",
      unlocks:
        "Allows bridge panels to grow without risking the active green page.",
    },
    {
      id: "guardrail-readiness-insight-excluded",
      label: "Insight Layer Excluded",
      kind: "guardrail",
      ready: true,
      score: 100,
      detail:
        "The removed Insight layer remains excluded from this bridge expansion.",
      source: "recovery boundary → bridge panels",
      blocker: "No blocker. This avoids known missing import/type failures.",
      unlocks:
        "Allows a clean future Insight rebuild from verified contracts.",
    },
    {
      id: "dashboard-readiness-wrapper-needed",
      label: "Dashboard Wrapper Needed",
      kind: "dashboard",
      ready: false,
      score: state.status === "connected" ? 65 : 35,
      detail:
        "The bridge should be routed through a dashboard wrapper before any page-level import.",
      source: "bridge panels → engine dashboard",
      blocker:
        "No wrapper is confirmed in this slice, so direct page wiring stays off.",
      unlocks:
        "Will allow safe grouped rendering after this preserved bridge slice stays green.",
    },
  ];
}

function buildReadinessLanes(state: MultiTrackEngineBridgeState): ReadinessLane[] {
  return [
    ...buildSignalReadinessLanes(state.signals),
    ...buildAdapterReadinessLanes(state.adapters),
    ...buildGuardrailReadinessLanes(state),
  ];
}

function getAverageReadinessScore(lanes: ReadinessLane[]): number {
  if (lanes.length === 0) return 0;

  const total = lanes.reduce((sum, lane) => sum + lane.score, 0);
  return Math.round(total / lanes.length);
}

function getReadinessLabel(score: number): string {
  if (score >= 90) return "Ready";
  if (score >= 65) return "Strong";
  if (score >= 40) return "Partial";
  if (score > 0) return "Waiting";
  return "Blocked";
}

function getReadyLaneCount(lanes: ReadinessLane[]): number {
  return lanes.filter((lane) => lane.ready).length;
}

function getLaneCountByKind(lanes: ReadinessLane[], kind: ReadinessLaneKind): number {
  return lanes.filter((lane) => lane.kind === kind).length;
}

function ReadinessSummary({ lanes }: { lanes: ReadinessLane[] }) {
  const averageScore = getAverageReadinessScore(lanes);
  const readyCount = getReadyLaneCount(lanes);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Average Readiness
        </p>
        <p className="mt-2 text-3xl font-black text-white">{averageScore}%</p>
        <p className="mt-2 text-sm text-white/70">{getReadinessLabel(averageScore)}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Ready Lanes
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {readyCount}/{lanes.length}
        </p>
        <p className="mt-2 text-sm text-white/70">
          Signals, adapters, and guardrails.
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Guardrails
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getLaneCountByKind(lanes, "guardrail")}
        </p>
        <p className="mt-2 text-sm text-white/70">
          Safety lanes keeping the build green.
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Waiting
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {lanes.length - readyCount}
        </p>
        <p className="mt-2 text-sm text-white/70">
          Lanes not ready for live routing.
        </p>
      </article>
    </div>
  );
}

function ReadinessLaneCard({ lane }: { lane: ReadinessLane }) {
  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {lane.kind}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{lane.label}</h3>
        </div>

        <span className={pillClass}>{lane.score}%</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{lane.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Route</span>
          <span className="text-right text-sm font-black text-white">{lane.source}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Ready</span>
          <span className="text-sm font-black text-white">{lane.ready ? "Yes" : "No"}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Status</span>
          <span className="text-sm font-black text-white">
            {getReadinessLabel(lane.score)}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Blocker</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {lane.blocker}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Unlocks</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {lane.unlocks}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackEngineBridgeReadinessPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const lanes = buildReadinessLanes(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Readiness
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Bridge Lane Readiness
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Readiness scoring for every signal, adapter, guardrail, and future
            dashboard lane. This shows what is wired, what is preserved, and
            what must stay waiting.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <ReadinessSummary lanes={lanes} />

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lanes.map((lane) => (
          <ReadinessLaneCard key={lane.id} lane={lane} />
        ))}
      </div>
    </section>
  );
}