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

type BridgeOwner = {
  id: string;
  label: string;
  owner: string;
  area: string;
  responsibility: string;
  active: boolean;
  boundary: string;
  risk: string;
};

function buildSignalOwners(signals: MultiTrackEngineBridgeSignal[]): BridgeOwner[] {
  return signals.map((signal) => ({
    id: `owner-signal-${signal.id}`,
    label: signal.label,
    owner: signal.source,
    area: signal.destination,
    responsibility:
      "Own the source data and expose a stable contract before workspace display.",
    active: signal.ready,
    boundary:
      "Bridge may display readiness, but the source system remains the owner.",
    risk: signal.ready ? "Low" : "Medium",
  }));
}

function buildAdapterOwners(adapters: MultiTrackEngineBridgeAdapter[]): BridgeOwner[] {
  return adapters.map((adapter) => ({
    id: `owner-adapter-${adapter.id}`,
    label: adapter.label,
    owner: adapter.sourceWorkspace,
    area: adapter.destinationWorkspace,
    responsibility:
      "Own the transfer path between source workspace and destination workspace.",
    active: adapter.connected,
    boundary:
      "Adapter route is visible here, but actual behavior belongs to the source workspace.",
    risk: adapter.connected ? "Low" : "Medium",
  }));
}

function buildOwners(state: MultiTrackEngineBridgeState): BridgeOwner[] {
  return [
    {
      id: "owner-engine-bridge",
      label: "Bridge State",
      owner: "Engine Bridge",
      area: "Multi Track Workspace",
      responsibility:
        "Own bridge contracts without moving bridge logic into the page or controller.",
      active: true,
      boundary:
        "Bridge owns contracts and visibility, not playback, sync, save, or final scoring.",
      risk: "Low",
    },
    {
      id: "owner-controller-boundary",
      label: "Controller Boundary",
      owner: "Multi Track Controller",
      area: "UI Session",
      responsibility:
        "Controller may display engine output but should not become the owner of bridge contracts.",
      active: false,
      boundary:
        "Controller remains protected from bridge expansion until wiring is intentionally planned.",
      risk: "High",
    },
    {
      id: "owner-page-boundary",
      label: "Page Boundary",
      owner: "Multi Track Page",
      area: "Route Shell",
      responsibility:
        "Page should stay thin and should not import scattered bridge panels directly.",
      active: false,
      boundary:
        "Future wiring should use a dashboard wrapper, not direct page-level panel imports.",
      risk: "High",
    },
    ...buildSignalOwners(state.signals),
    ...buildAdapterOwners(state.adapters),
  ];
}

function getActiveOwnerCount(owners: BridgeOwner[]): number {
  return owners.filter((owner) => owner.active).length;
}

function getInactiveOwnerCount(owners: BridgeOwner[]): number {
  return owners.filter((owner) => !owner.active).length;
}

function getOwnerCoveragePercent(owners: BridgeOwner[]): number {
  if (owners.length === 0) return 0;
  return Math.round((getActiveOwnerCount(owners) / owners.length) * 100);
}

function OwnershipSummary({ owners }: { owners: BridgeOwner[] }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Owners
        </p>
        <p className="mt-2 text-3xl font-black text-white">{owners.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Active
        </p>
        <p className="mt-2 text-3xl font-black text-white">{getActiveOwnerCount(owners)}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Waiting
        </p>
        <p className="mt-2 text-3xl font-black text-white">{getInactiveOwnerCount(owners)}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Coverage
        </p>
        <p className="mt-2 text-3xl font-black text-white">{getOwnerCoveragePercent(owners)}%</p>
      </article>
    </div>
  );
}

function OwnerCard({ owner }: { owner: BridgeOwner }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {owner.owner}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{owner.label}</h3>
        </div>

        <span className={pillClass}>{owner.active ? "Active" : "Waiting"}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{owner.responsibility}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Area</span>
          <span className="text-right text-sm font-black text-white">{owner.area}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Boundary</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {owner.boundary}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Risk</span>
          <span className="text-right text-sm font-black text-white">{owner.risk}</span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackEngineBridgeOwnershipPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const owners = buildOwners(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Ownership
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Engine Bridge Ownership Map
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Ownership boundaries keep bridge logic out of controller files and
            protect the recovered engine from becoming tangled with UI routing.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <OwnershipSummary owners={owners} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {owners.map((owner) => (
          <OwnerCard key={owner.id} owner={owner} />
        ))}
      </div>
    </section>
  );
}