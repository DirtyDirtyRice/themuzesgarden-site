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
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

type BridgeExportFormat = "json" | "record" | "summary" | "future";

type BridgeExportItem = {
  id: string;
  label: string;
  format: BridgeExportFormat;
  ready: boolean;
  detail: string;
  source: string;
  destination: string;
  safeUse: string;
  blockedUse: string;
};

function buildSignalExports(signals: MultiTrackEngineBridgeSignal[]): BridgeExportItem[] {
  return signals.map((signal) => ({
    id: `export-signal-${signal.id}`,
    label: `${signal.label} Export`,
    format: "json",
    ready: signal.ready,
    detail: signal.detail,
    source: signal.source,
    destination: signal.destination,
    safeUse: "Export as read-only bridge summary data.",
    blockedUse: "Do not treat this as a live engine action.",
  }));
}

function buildAdapterExports(adapters: MultiTrackEngineBridgeAdapter[]): BridgeExportItem[] {
  return adapters.map((adapter) => ({
    id: `export-adapter-${adapter.id}`,
    label: `${adapter.label} Export`,
    format: "record",
    ready: adapter.connected,
    detail: adapter.detail,
    source: adapter.sourceWorkspace,
    destination: adapter.destinationWorkspace,
    safeUse: "Export adapter state only after source and destination are verified.",
    blockedUse: "Do not create save records from disconnected adapters.",
  }));
}

function buildExportItems(state: MultiTrackEngineBridgeState): BridgeExportItem[] {
  return [
    {
      id: "export-bridge-summary",
      label: "Bridge Summary Export",
      format: "summary",
      ready: true,
      detail: state.summary,
      source: "Bridge",
      destination: "Workspace Summary",
      safeUse: "Use as display-only bridge memory.",
      blockedUse: "Do not use summary export as database write behavior.",
    },
    ...buildSignalExports(state.signals),
    ...buildAdapterExports(state.adapters),
    {
      id: "export-future-save-record",
      label: "Future Save Record Export",
      format: "future",
      ready: false,
      detail:
        "Future bridge exports can produce save-ready records for analysis history, recommendations, sync maps, and relationship snapshots.",
      source: "Future Save System",
      destination: "Analysis History",
      safeUse: "Design the export shape before connecting persistence.",
      blockedUse: "Do not write bridge records until save ownership exists.",
    },
  ];
}

function getReadyExportCount(items: BridgeExportItem[]): number {
  return items.filter((item) => item.ready).length;
}

function getWaitingExportCount(items: BridgeExportItem[]): number {
  return items.filter((item) => !item.ready).length;
}

function getFormatCount(items: BridgeExportItem[], format: BridgeExportFormat): number {
  return items.filter((item) => item.format === format).length;
}

function getFormatLabel(format: BridgeExportFormat): string {
  if (format === "json") return "JSON";
  if (format === "record") return "Record";
  if (format === "summary") return "Summary";
  return "Future";
}

function BridgeExportSummary({ items }: { items: BridgeExportItem[] }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Export Items
        </p>
        <p className="mt-2 text-3xl font-black text-white">{items.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Ready
        </p>
        <p className="mt-2 text-3xl font-black text-white">{getReadyExportCount(items)}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Waiting
        </p>
        <p className="mt-2 text-3xl font-black text-white">{getWaitingExportCount(items)}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          JSON
        </p>
        <p className="mt-2 text-3xl font-black text-white">{getFormatCount(items, "json")}</p>
      </article>
    </div>
  );
}

function BridgeExportCard({ item }: { item: BridgeExportItem }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {item.source} → {item.destination}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{item.label}</h3>
        </div>

        <span className={pillClass}>{getFormatLabel(item.format)}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{item.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Ready</span>
          <span className="text-sm font-black text-white">{item.ready ? "Yes" : "No"}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Safe Use</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {item.safeUse}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Blocked Use</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {item.blockedUse}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackEngineBridgeExportPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const items = buildExportItems(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Exports
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Bridge Export Preparation
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Future export layer for bridge summaries, signal routes, adapter
            records, save-ready shapes, analysis history, and downstream
            workstation records.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <BridgeExportSummary items={items} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <BridgeExportCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}