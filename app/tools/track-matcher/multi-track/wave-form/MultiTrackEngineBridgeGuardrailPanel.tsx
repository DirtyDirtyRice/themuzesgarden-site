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

type BridgeGuardrailRisk = "low" | "medium" | "high";

type BridgeGuardrail = {
  id: string;
  label: string;
  risk: BridgeGuardrailRisk;
  enforced: boolean;
  detail: string;
  source: string;
  protect: string;
  failurePattern: string;
};

function getRiskLabel(risk: BridgeGuardrailRisk): string {
  if (risk === "high") return "High Risk";
  if (risk === "medium") return "Medium Risk";
  return "Low Risk";
}

function getRiskScore(risk: BridgeGuardrailRisk): number {
  if (risk === "high") return 90;
  if (risk === "medium") return 55;
  return 20;
}

function buildSignalGuardrails(signals: MultiTrackEngineBridgeSignal[]): BridgeGuardrail[] {
  return signals.map((signal) => ({
    id: `guardrail-signal-${signal.id}`,
    label: `Verify ${signal.label}`,
    risk: signal.ready ? "low" : "medium",
    enforced: signal.ready,
    detail:
      "Signal should not be used by visible workstation panels until its route and destination contract are verified.",
    source: `${signal.source} → ${signal.destination}`,
    protect: "Protects future panels from displaying unverified live signal data.",
    failurePattern: "Fake live readiness or guessed route behavior.",
  }));
}

function buildAdapterGuardrails(adapters: MultiTrackEngineBridgeAdapter[]): BridgeGuardrail[] {
  return adapters.map((adapter) => ({
    id: `guardrail-adapter-${adapter.id}`,
    label: `Protect ${adapter.label}`,
    risk: adapter.connected ? "low" : "high",
    enforced: adapter.connected,
    detail:
      "Adapter should not be treated as live until the source workspace and destination workspace are connected.",
    source: `${adapter.sourceWorkspace} → ${adapter.destinationWorkspace}`,
    protect: "Protects workspace boundaries from hidden adapter ownership.",
    failurePattern: "Phantom adapter wiring or missing import chains.",
  }));
}

function buildGuardrails(state: MultiTrackEngineBridgeState): BridgeGuardrail[] {
  return [
    {
      id: "guardrail-no-controller-regrowth",
      label: "Prevent Controller Regrowth",
      risk: "high",
      enforced: false,
      detail:
        "Bridge logic must stay in bridge and engine files. Do not move bridge routing into controller files.",
      source: "Architecture",
      protect: "Protects active controller stability.",
      failurePattern: "Controller becomes a dumping ground again.",
    },
    {
      id: "guardrail-no-insight-restore",
      label: "Do Not Restore Insight Yet",
      risk: "high",
      enforced: true,
      detail:
        "Insight files were confirmed corrupted or misnamed. They must not be reintroduced until contracts are rebuilt.",
      source: "Recovery Rule",
      protect: "Protects the green build from known bad files.",
      failurePattern: "Old missing type and missing export errors return.",
    },
    {
      id: "guardrail-no-page-wiring",
      label: "No Direct Page Wiring",
      risk: "high",
      enforced: true,
      detail:
        "Bridge panels should stay preserved until a dashboard wrapper is verified.",
      source: "Page Boundary",
      protect: "Protects page.tsx and active dashboard rendering.",
      failurePattern: "Many scattered imports break route shell stability.",
    },
    ...buildSignalGuardrails(state.signals),
    ...buildAdapterGuardrails(state.adapters),
  ];
}

function getGuardrailCountByRisk(guardrails: BridgeGuardrail[], risk: BridgeGuardrailRisk) {
  return guardrails.filter((guardrail) => guardrail.risk === risk).length;
}

function getEnforcedGuardrailCount(guardrails: BridgeGuardrail[]): number {
  return guardrails.filter((guardrail) => guardrail.enforced).length;
}

function GuardrailSummary({ guardrails }: { guardrails: BridgeGuardrail[] }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Guardrails
        </p>
        <p className="mt-2 text-3xl font-black text-white">{guardrails.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          High Risk
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getGuardrailCountByRisk(guardrails, "high")}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Medium Risk
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getGuardrailCountByRisk(guardrails, "medium")}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Enforced
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getEnforcedGuardrailCount(guardrails)}
        </p>
      </article>
    </div>
  );
}

function GuardrailCard({ guardrail }: { guardrail: BridgeGuardrail }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {guardrail.source}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{guardrail.label}</h3>
        </div>

        <span className={pillClass}>{getRiskLabel(guardrail.risk)}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{guardrail.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Risk Score</span>
          <span className="text-sm font-black text-white">{getRiskScore(guardrail.risk)}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Protects</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {guardrail.protect}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Failure Pattern</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {guardrail.failurePattern}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackEngineBridgeGuardrailPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const guardrails = buildGuardrails(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Guardrails
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Recovery Guardrails & Wiring Safety
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Guardrails protect the recovered engine from repeating the same
            failure pattern: misnamed files, fake imports, controller regrowth,
            and restoring unverified Insight code too early.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <GuardrailSummary guardrails={guardrails} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {guardrails.map((guardrail) => (
          <GuardrailCard key={guardrail.id} guardrail={guardrail} />
        ))}
      </div>
    </section>
  );
}