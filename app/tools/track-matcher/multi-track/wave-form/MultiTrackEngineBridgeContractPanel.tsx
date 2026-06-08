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

type BridgeContractKind = "signal" | "adapter" | "summary" | "guardrail";

type BridgeContractStrength = "locked" | "stable" | "draft" | "blocked";

type BridgeContract = {
  id: string;
  label: string;
  owner: string;
  consumer: string;
  contractKind: BridgeContractKind;
  strength: BridgeContractStrength;
  required: boolean;
  fulfilled: boolean;
  detail: string;
  protection: string;
  futureUse: string;
};

function getSignalContractStrength(
  signal: MultiTrackEngineBridgeSignal,
): BridgeContractStrength {
  if (signal.ready && signal.status === "connected") return "locked";
  if (signal.ready) return "stable";
  if (signal.status === "blocked") return "blocked";
  return "draft";
}

function getAdapterContractStrength(
  adapter: MultiTrackEngineBridgeAdapter,
): BridgeContractStrength {
  return adapter.connected ? "locked" : "draft";
}

function buildSignalContracts(signals: MultiTrackEngineBridgeSignal[]): BridgeContract[] {
  return signals.map((signal) => ({
    id: `contract-signal-${signal.id}`,
    label: `${signal.label} Contract`,
    owner: signal.source,
    consumer: signal.destination,
    contractKind: "signal",
    strength: getSignalContractStrength(signal),
    required: true,
    fulfilled: signal.ready,
    detail: signal.detail,
    protection:
      "Prevents downstream panels from treating signal data as live until the bridge marks it ready.",
    futureUse:
      "Can become a real engine-to-dashboard signal once runtime state is exposed safely.",
  }));
}

function buildAdapterContracts(adapters: MultiTrackEngineBridgeAdapter[]): BridgeContract[] {
  return adapters.map((adapter) => ({
    id: `contract-adapter-${adapter.id}`,
    label: `${adapter.label} Contract`,
    owner: adapter.sourceWorkspace,
    consumer: adapter.destinationWorkspace,
    contractKind: "adapter",
    strength: getAdapterContractStrength(adapter),
    required: true,
    fulfilled: adapter.connected,
    detail: adapter.detail,
    protection:
      "Prevents hidden coupling between workspaces by naming the source and destination before wiring.",
    futureUse:
      "Can become a real adapter route after the dashboard wrapper owns the integration point.",
  }));
}

function buildGuardrailContracts(state: MultiTrackEngineBridgeState): BridgeContract[] {
  return [
    {
      id: "contract-no-page-wiring",
      label: "No Direct Page Wiring",
      owner: "Bridge Workspace",
      consumer: "Multi Track Page",
      contractKind: "guardrail",
      strength: "locked",
      required: true,
      fulfilled: true,
      detail:
        "Bridge panels stay preserved inside wave-form until a safe dashboard wrapper is ready.",
      protection:
        "Avoids breaking the green page by importing preserved bridge code directly into page.tsx.",
      futureUse:
        "Allows page wiring later through a single dashboard export instead of many scattered imports.",
    },
    {
      id: "contract-no-insight-dependency",
      label: "No Removed Insight Dependency",
      owner: "Recovery Boundary",
      consumer: "Engine Bridge",
      contractKind: "guardrail",
      strength: "locked",
      required: true,
      fulfilled: true,
      detail:
        "The bridge must not depend on the intentionally excluded Insight layer.",
      protection:
        "Prevents old missing type and missing import errors from returning.",
      futureUse:
        "A new Insight layer can be rebuilt later from verified contracts instead of restored guesses.",
    },
    {
      id: "contract-state-preservation",
      label: "Preserved State Contract",
      owner: "Engine Bridge",
      consumer: "Future Engine Wiring",
      contractKind: "guardrail",
      strength: state.status === "connected" ? "stable" : "draft",
      required: true,
      fulfilled: state.signals.length > 0 && state.adapters.length > 0,
      detail:
        "Bridge state must remain useful as preserved planning data even before active runtime wiring.",
      protection:
        "Keeps the bridge useful without forcing controller ownership or live engine dependencies.",
      futureUse:
        "Can become the seed model for bridge diagnostics, save records, and route memory.",
    },
  ];
}

function buildContracts(state: MultiTrackEngineBridgeState): BridgeContract[] {
  return [
    {
      id: "contract-bridge-state",
      label: "Bridge State Contract",
      owner: "Engine Bridge",
      consumer: "Workspace Dashboard",
      contractKind: "summary",
      strength: state.status === "connected" ? "stable" : "draft",
      required: true,
      fulfilled: state.status === "connected",
      detail: state.summary,
      protection:
        "Names the bridge as a standalone contract instead of letting future panels invent their own state.",
      futureUse:
        "Can drive one dashboard-level readiness summary after bridge panels are safely grouped.",
    },
    ...buildSignalContracts(state.signals),
    ...buildAdapterContracts(state.adapters),
    ...buildGuardrailContracts(state),
  ];
}

function getFulfilledContractCount(contracts: BridgeContract[]): number {
  return contracts.filter((contract) => contract.fulfilled).length;
}

function getRequiredContractCount(contracts: BridgeContract[]): number {
  return contracts.filter((contract) => contract.required).length;
}

function getLockedContractCount(contracts: BridgeContract[]): number {
  return contracts.filter((contract) => contract.strength === "locked").length;
}

function getContractCompletionPercent(contracts: BridgeContract[]): number {
  if (contracts.length === 0) return 0;
  return Math.round((getFulfilledContractCount(contracts) / contracts.length) * 100);
}

function getContractStatusLabel(contract: BridgeContract): string {
  if (contract.fulfilled && contract.strength === "locked") return "Locked";
  if (contract.fulfilled) return "Fulfilled";
  if (contract.strength === "blocked") return "Blocked";
  if (contract.required) return "Required";
  return "Optional";
}

function BridgeContractSummary({ contracts }: { contracts: BridgeContract[] }) {
  const fulfilled = getFulfilledContractCount(contracts);
  const required = getRequiredContractCount(contracts);
  const locked = getLockedContractCount(contracts);
  const completion = getContractCompletionPercent(contracts);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Contracts
        </p>
        <p className="mt-2 text-3xl font-black text-white">{contracts.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Required
        </p>
        <p className="mt-2 text-3xl font-black text-white">{required}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Fulfilled
        </p>
        <p className="mt-2 text-3xl font-black text-white">{fulfilled}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Locked
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {locked} / {completion}%
        </p>
      </article>
    </div>
  );
}

function BridgeContractCard({ contract }: { contract: BridgeContract }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {contract.contractKind} / {contract.strength}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{contract.label}</h3>
        </div>

        <span className={pillClass}>{getContractStatusLabel(contract)}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{contract.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Owner</span>
          <span className="text-right text-sm font-black text-white">{contract.owner}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Consumer</span>
          <span className="text-right text-sm font-black text-white">
            {contract.consumer}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Protection</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {contract.protection}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Future Use</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {contract.futureUse}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackEngineBridgeContractPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const contracts = buildContracts(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Contracts
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Workspace Bridge Contract Registry
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Contracts define what the bridge expects each system to provide.
            This prevents future wiring from relying on mystery props, guessed
            exports, removed layers, or controller-only state.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <BridgeContractSummary contracts={contracts} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {contracts.map((contract) => (
          <BridgeContractCard key={contract.id} contract={contract} />
        ))}
      </div>
    </section>
  );
}