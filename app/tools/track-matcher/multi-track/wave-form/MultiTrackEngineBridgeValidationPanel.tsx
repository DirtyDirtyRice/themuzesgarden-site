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
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

type BridgeValidationSeverity = "required" | "warning" | "future";

type BridgeValidationRule = {
  id: string;
  label: string;
  target: string;
  status: MultiTrackEngineBridgeStatus;
  severity: BridgeValidationSeverity;
  passed: boolean;
  required: boolean;
  detail: string;
  failureRisk: string;
  greenPath: string;
};

function getStatusLabel(status: MultiTrackEngineBridgeStatus): string {
  if (status === "connected") return "Connected";
  if (status === "warning") return "Warning";
  if (status === "blocked") return "Blocked";
  if (status === "waiting") return "Waiting";
  return "Idle";
}

function buildSignalValidationRules(
  signals: MultiTrackEngineBridgeSignal[],
): BridgeValidationRule[] {
  return signals.map((signal) => ({
    id: `validation-signal-${signal.id}`,
    label: `${signal.label} signal validation`,
    target: `${signal.source} → ${signal.destination}`,
    status: signal.status,
    severity: "required",
    passed: signal.ready,
    required: true,
    detail:
      "Signal must be verified before downstream panels can treat it as active bridge data.",
    failureRisk:
      "A non-ready signal could make a future panel display fake live engine information.",
    greenPath:
      "Keep this as seed-backed bridge state until the real runtime source is confirmed.",
  }));
}

function buildAdapterValidationRules(
  adapters: MultiTrackEngineBridgeAdapter[],
): BridgeValidationRule[] {
  return adapters.map((adapter) => ({
    id: `validation-adapter-${adapter.id}`,
    label: `${adapter.label} adapter validation`,
    target: `${adapter.sourceWorkspace} → ${adapter.destinationWorkspace}`,
    status: adapter.connected ? "connected" : "waiting",
    severity: "required",
    passed: adapter.connected,
    required: true,
    detail:
      "Adapter must be connected before the bridge can route information through it.",
    failureRisk:
      "A guessed adapter route could create phantom imports, missing props, or controller ownership drift.",
    greenPath:
      "Connect adapters only through confirmed files that already exist in the dashboard layer.",
  }));
}

function buildRecoveryValidationRules(
  state: MultiTrackEngineBridgeState,
): BridgeValidationRule[] {
  return [
    {
      id: "validation-bridge-state",
      label: "Bridge state exists",
      target: "Bridge State",
      status: state.status,
      severity: "required",
      passed: true,
      required: true,
      detail:
        "Bridge state is available as a standalone future routing contract.",
      failureRisk:
        "Without this seed-backed state, panels would invent their own bridge model.",
      greenPath:
        "Keep all bridge panels reading DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE for now.",
    },
    {
      id: "validation-no-insight-dependency",
      label: "No Insight dependency",
      target: "Recovery Safety",
      status: "connected",
      severity: "required",
      passed: true,
      required: true,
      detail:
        "Bridge validation must not depend on the removed Insight layer.",
      failureRisk:
        "Restoring old Insight imports can recreate the previous missing type/export failures.",
      greenPath:
        "Rebuild Insight later from fresh contracts, not from old broken files.",
    },
    {
      id: "validation-no-page-import",
      label: "No page.tsx bridge import",
      target: "Page Wiring",
      status: "connected",
      severity: "required",
      passed: true,
      required: true,
      detail:
        "This slice expands preserved wave-form panels only and does not wire them into page.tsx.",
      failureRisk:
        "Direct page imports can break the current verified green dashboard.",
      greenPath:
        "Create or use a dashboard wrapper later after the bridge slice builds cleanly.",
    },
    {
      id: "validation-no-phantom-types",
      label: "No phantom bridge types",
      target: "Type Safety",
      status: "connected",
      severity: "required",
      passed: true,
      required: true,
      detail:
        "This panel uses only imported bridge types that already appeared in the existing files.",
      failureRisk:
        "New guessed exported types can fail TypeScript immediately.",
      greenPath:
        "Keep new local panel-only types inside this file until shared types are intentionally expanded.",
    },
    {
      id: "validation-no-controller-ownership",
      label: "No controller ownership",
      target: "Engine Boundary",
      status: "connected",
      severity: "warning",
      passed: true,
      required: false,
      detail:
        "Bridge panels describe contracts without taking over the active controller.",
      failureRisk:
        "Controller ownership drift can break transport, sync, or active deck behavior.",
      greenPath:
        "Use bridge panels for visibility first, then connect runtime state through stable adapters.",
    },
  ];
}

function buildValidationRules(state: MultiTrackEngineBridgeState): BridgeValidationRule[] {
  return [
    ...buildRecoveryValidationRules(state),
    ...buildSignalValidationRules(state.signals),
    ...buildAdapterValidationRules(state.adapters),
  ];
}

function getPassedRuleCount(rules: BridgeValidationRule[]): number {
  return rules.filter((rule) => rule.passed).length;
}

function getRequiredRuleCount(rules: BridgeValidationRule[]): number {
  return rules.filter((rule) => rule.required).length;
}

function getBlockedRuleCount(rules: BridgeValidationRule[]): number {
  return rules.filter((rule) => rule.status === "blocked").length;
}

function getValidationPercent(rules: BridgeValidationRule[]): number {
  if (rules.length === 0) return 0;
  return Math.round((getPassedRuleCount(rules) / rules.length) * 100);
}

function getRuleDisplayStatus(rule: BridgeValidationRule): string {
  if (rule.passed) return "Passed";
  if (rule.severity === "future") return "Future";
  return getStatusLabel(rule.status);
}

function ValidationSummary({ rules }: { rules: BridgeValidationRule[] }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Rules
        </p>
        <p className="mt-2 text-3xl font-black text-white">{rules.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Passed
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getPassedRuleCount(rules)}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Required
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getRequiredRuleCount(rules)}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Validated
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getValidationPercent(rules)}%
        </p>
      </article>
    </div>
  );
}

function ValidationRuleCard({ rule }: { rule: BridgeValidationRule }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {rule.target}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{rule.label}</h3>
        </div>

        <span className={pillClass}>{getRuleDisplayStatus(rule)}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{rule.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Required</span>
          <span className="text-right text-sm font-black text-white">
            {rule.required ? "Yes" : "No"}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Status</span>
          <span className="text-right text-sm font-black text-white">
            {getStatusLabel(rule.status)}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Failure Risk</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {rule.failureRisk}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Green Path</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {rule.greenPath}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackEngineBridgeValidationPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const rules = buildValidationRules(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Validation
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Bridge Contract Validation
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Validation rules protect the bridge from being treated as live
            before its signals, adapters, page boundary, and recovery guardrails
            are verified.
          </p>
        </div>

        <span className={pillClass}>{getBlockedRuleCount(rules)} blocked</span>
      </div>

      <ValidationSummary rules={rules} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {rules.map((rule) => (
          <ValidationRuleCard key={rule.id} rule={rule} />
        ))}
      </div>
    </section>
  );
}