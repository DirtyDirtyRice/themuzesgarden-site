"use client";

import type {
  MultiTrackEngineBridgeAdapter,
  MultiTrackEngineBridgeSignal,
  MultiTrackEngineBridgeState,
  MultiTrackEngineBridgeStatus,
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

type DiagnosticItem = {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: MultiTrackEngineBridgeStatus;
  action: string;
};

function getStatusLabel(status: MultiTrackEngineBridgeStatus): string {
  if (status === "connected") return "Connected";
  if (status === "warning") return "Warning";
  if (status === "blocked") return "Blocked";
  if (status === "waiting") return "Waiting";
  return "Idle";
}

function getBooleanLabel(value: boolean): string {
  return value ? "Yes" : "No";
}

function getReadySignalCount(signals: MultiTrackEngineBridgeSignal[]): number {
  return signals.filter((signal) => signal.ready).length;
}

function getConnectedAdapterCount(adapters: MultiTrackEngineBridgeAdapter[]): number {
  return adapters.filter((adapter) => adapter.connected).length;
}

function getWaitingSignalCount(signals: MultiTrackEngineBridgeSignal[]): number {
  return signals.filter((signal) => !signal.ready).length;
}

function getWaitingAdapterCount(adapters: MultiTrackEngineBridgeAdapter[]): number {
  return adapters.filter((adapter) => !adapter.connected).length;
}

function getBridgeCompletionPercent(state: MultiTrackEngineBridgeState): number {
  const totalItems = state.signals.length + state.adapters.length;

  if (totalItems === 0) return 0;

  const readyItems =
    getReadySignalCount(state.signals) + getConnectedAdapterCount(state.adapters);

  return Math.round((readyItems / totalItems) * 100);
}

function getDiagnosticItems(state: MultiTrackEngineBridgeState): DiagnosticItem[] {
  const completionPercent = getBridgeCompletionPercent(state);
  const readySignalCount = getReadySignalCount(state.signals);
  const connectedAdapterCount = getConnectedAdapterCount(state.adapters);
  const waitingSignalCount = getWaitingSignalCount(state.signals);
  const waitingAdapterCount = getWaitingAdapterCount(state.adapters);

  return [
    {
      id: "bridge-status",
      label: "Bridge Status",
      value: getStatusLabel(state.status),
      detail: state.summary,
      status: state.status,
      action: "Keep bridge state seed-backed until active dashboard wiring is verified.",
    },
    {
      id: "bridge-completion",
      label: "Completion",
      value: `${completionPercent}%`,
      detail: "Combined readiness across bridge signals and workspace adapters.",
      status: completionPercent >= 80 ? "connected" : completionPercent > 0 ? "warning" : "waiting",
      action: "Raise completion by connecting verified signals only.",
    },
    {
      id: "ready-signals",
      label: "Ready Signals",
      value: `${readySignalCount}/${state.signals.length}`,
      detail: "Signals that can already move information between systems.",
      status: readySignalCount === state.signals.length ? "connected" : "waiting",
      action: "Do not mark a signal ready until the source system exists.",
    },
    {
      id: "connected-adapters",
      label: "Connected Adapters",
      value: `${connectedAdapterCount}/${state.adapters.length}`,
      detail: "Adapters currently marked as connected.",
      status: connectedAdapterCount === state.adapters.length ? "connected" : "waiting",
      action: "Connect adapters through workspace wrappers, not page-level imports.",
    },
    {
      id: "waiting-signals",
      label: "Waiting Signals",
      value: String(waitingSignalCount),
      detail: "Signals still waiting for future engine wiring.",
      status: waitingSignalCount > 0 ? "waiting" : "connected",
      action: "Keep waiting signals visible but inactive.",
    },
    {
      id: "waiting-adapters",
      label: "Waiting Adapters",
      value: String(waitingAdapterCount),
      detail: "Adapters still waiting for active workspace routing.",
      status: waitingAdapterCount > 0 ? "waiting" : "connected",
      action: "Preserve adapter plans until the target workspace exists.",
    },
  ];
}

function DiagnosticCard({ item }: { item: DiagnosticItem }) {
  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Diagnostic
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{item.label}</h3>
        </div>

        <span className={pillClass}>{getStatusLabel(item.status)}</span>
      </div>

      <p className="mt-4 text-3xl font-black text-white">{item.value}</p>
      <p className="mt-3 text-sm leading-6 text-white/70">{item.detail}</p>
      <p className="mt-3 text-sm font-black leading-6 text-white">{item.action}</p>
    </article>
  );
}

function SignalDiagnosticRows({ signals }: { signals: MultiTrackEngineBridgeSignal[] }) {
  return (
    <div className="mt-5 grid gap-2">
      {signals.map((signal) => (
        <div key={signal.id} className={rowClass}>
          <div>
            <p className="font-black text-white">{signal.label}</p>
            <p className="mt-1 text-xs text-white/60">
              {signal.source} → {signal.destination}
            </p>
          </div>

          <span className={pillClass}>{getBooleanLabel(signal.ready)}</span>
        </div>
      ))}
    </div>
  );
}

function AdapterDiagnosticRows({ adapters }: { adapters: MultiTrackEngineBridgeAdapter[] }) {
  return (
    <div className="mt-5 grid gap-2">
      {adapters.map((adapter) => (
        <div key={adapter.id} className={rowClass}>
          <div>
            <p className="font-black text-white">{adapter.label}</p>
            <p className="mt-1 text-xs text-white/60">
              {adapter.sourceWorkspace} → {adapter.destinationWorkspace}
            </p>
          </div>

          <span className={pillClass}>{getBooleanLabel(adapter.connected)}</span>
        </div>
      ))}
    </div>
  );
}

export function MultiTrackEngineBridgeDiagnosticsPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const diagnosticItems = getDiagnosticItems(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Diagnostics
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Engine Bridge Health Check
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Diagnostic view for the future bridge between engine state,
            dashboard panels, sync routing, relationship scoring, save
            preparation, timeline mapping, and AI analysis systems.
          </p>
        </div>

        <span className={pillClass}>{getStatusLabel(bridgeState.status)}</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {diagnosticItems.map((item) => (
          <DiagnosticCard key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <article className={cardClass}>
          <h3 className="text-xl font-black text-white">Signal Diagnostics</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Shows which bridge signals are ready to move information.
          </p>
          <SignalDiagnosticRows signals={bridgeState.signals} />
        </article>

        <article className={cardClass}>
          <h3 className="text-xl font-black text-white">Adapter Diagnostics</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Shows which workspace adapters are connected.
          </p>
          <AdapterDiagnosticRows adapters={bridgeState.adapters} />
        </article>
      </div>
    </section>
  );
}