"use client";

import type { MultiTrackEngineBridgeState } from "./MultiTrackEngineBridgeTypes";
import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

type BridgeNextStepPhase = "now" | "next" | "later" | "blocked";

type BridgeNextStepRisk = "low" | "medium" | "high";

type BridgeNextStep = {
  id: string;
  label: string;
  phase: BridgeNextStepPhase;
  risk: BridgeNextStepRisk;
  detail: string;
  owner: string;
  ready: boolean;
  safeAction: string;
  doNotDo: string;
  doneWhen: string;
};

function hasReadySignal(state: MultiTrackEngineBridgeState, signalId: string): boolean {
  return state.signals.some((signal) => signal.id === signalId && signal.ready);
}

function buildNextSteps(state: MultiTrackEngineBridgeState): BridgeNextStep[] {
  return [
    {
      id: "next-expand-preserved-panels",
      label: "Expand Preserved Bridge Panels",
      phase: "now",
      risk: "low",
      detail:
        "Continue expanding bridge panels inside wave-form using only local panel types and existing bridge seed/types imports.",
      owner: "Wave-form Bridge",
      ready: true,
      safeAction:
        "Use full file replacements for panels that already exist in the folder.",
      doNotDo:
        "Do not create imports to files that have not been pasted or verified.",
      doneWhen:
        "Each expanded panel builds without adding page wiring or dashboard imports.",
    },
    {
      id: "next-render-bridge-panels",
      label: "Prepare Bridge Panel Group",
      phase: "now",
      risk: "low",
      detail:
        "Group contracts, readiness, validation, next steps, routes, diagnostics, ownership, recovery, and export memory as a visible bridge workspace.",
      owner: "Bridge Workspace",
      ready: true,
      safeAction:
        "Prepare the panel set as preserved UI first, still inside wave-form.",
      doNotDo:
        "Do not import the group into page.tsx until the group itself is green.",
      doneWhen:
        "The bridge workspace has a clean panel order and no phantom dependencies.",
    },
    {
      id: "next-connect-dashboard",
      label: "Connect Bridge to Dashboard Wrapper",
      phase: "next",
      risk: "medium",
      detail:
        "Import bridge panels through a dashboard wrapper instead of adding them directly to the page.",
      owner: "Engine Dashboard",
      ready: false,
      safeAction:
        "Verify the dashboard wrapper file exists, then add one grouped import.",
      doNotDo:
        "Do not scatter individual bridge panel imports across active page files.",
      doneWhen:
        "Dashboard renders the bridge group and the build remains green.",
    },
    {
      id: "next-sync-contract",
      label: "Connect Sync Contract",
      phase: "next",
      risk: "medium",
      detail:
        "Only connect sync to the bridge after state contracts remain green.",
      owner: "Sync Layer",
      ready: hasReadySignal(state, "bridge-sync-routing"),
      safeAction:
        "Expose sync as a read-only bridge signal before allowing active sync actions.",
      doNotDo:
        "Do not move sync ownership into bridge panels.",
      doneWhen:
        "Sync readiness appears as bridge-visible data while sync still owns sync behavior.",
    },
    {
      id: "next-relationship-contract",
      label: "Connect Relationship Contract",
      phase: "next",
      risk: "medium",
      detail:
        "Use relationship scoring as a bridge-visible confidence signal without creating controller ownership.",
      owner: "Relationship Layer",
      ready: hasReadySignal(state, "bridge-relationship-routing"),
      safeAction:
        "Treat relationship output as summary data first.",
      doNotDo:
        "Do not make bridge panels calculate final relationship scores.",
      doneWhen:
        "Relationship confidence can be displayed without changing relationship engine logic.",
    },
    {
      id: "next-render-prep-contract",
      label: "Connect Render Prep Contract",
      phase: "later",
      risk: "medium",
      detail:
        "Render prep intelligence can later receive bridge-safe export and readiness summaries.",
      owner: "Render Prep Intelligence",
      ready: false,
      safeAction:
        "Keep render prep as a future consumer until bridge exports are validated.",
      doNotDo:
        "Do not make render prep depend on live bridge actions yet.",
      doneWhen:
        "Render prep can read export-safe bridge records without controlling the bridge.",
    },
    {
      id: "next-hybrid-builder-contract",
      label: "Connect Future Hybrid Builder Contract",
      phase: "later",
      risk: "medium",
      detail:
        "Future hybrid builder can later consume bridge confidence, route, and export summaries.",
      owner: "Future Hybrid Builder",
      ready: false,
      safeAction:
        "Keep hybrid builder as planning intelligence until engine routes are verified.",
      doNotDo:
        "Do not connect hybrid generation to unverified audio routing.",
      doneWhen:
        "Hybrid builder receives verified bridge summaries only.",
    },
    {
      id: "next-save-records",
      label: "Prepare Save Records",
      phase: "later",
      risk: "high",
      detail:
        "Bridge outputs can eventually become save-ready analysis records.",
      owner: "Save System",
      ready: false,
      safeAction:
        "Create save contracts only after export and validation panels are green.",
      doNotDo:
        "Do not write database/save behavior from preserved bridge panels.",
      doneWhen:
        "Save-ready bridge records are typed, validated, and owned by the save layer.",
    },
    {
      id: "next-insight-layer",
      label: "Rebuild Insight Layer",
      phase: "blocked",
      risk: "high",
      detail:
        "Do not restore the old Insight files. Rebuild contracts from scratch when ready.",
      owner: "Insight Layer",
      ready: false,
      safeAction:
        "Wait until bridge contracts, readiness, validation, and dashboard wrapper are all green.",
      doNotDo:
        "Do not paste old Insight imports or old guessed types back into the engine.",
      doneWhen:
        "A new insight contract is created from current green bridge data.",
    },
  ];
}

function getPhaseLabel(phase: BridgeNextStepPhase): string {
  if (phase === "now") return "Now";
  if (phase === "next") return "Next";
  if (phase === "later") return "Later";
  return "Blocked";
}

function getStepCountByPhase(steps: BridgeNextStep[], phase: BridgeNextStepPhase) {
  return steps.filter((step) => step.phase === phase).length;
}

function getReadyStepCount(steps: BridgeNextStep[]) {
  return steps.filter((step) => step.ready).length;
}

function getHighRiskStepCount(steps: BridgeNextStep[]) {
  return steps.filter((step) => step.risk === "high").length;
}

function NextStepSummary({ steps }: { steps: BridgeNextStep[] }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-5">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Steps
        </p>
        <p className="mt-2 text-3xl font-black text-white">{steps.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Now
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getStepCountByPhase(steps, "now")}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Next
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getStepCountByPhase(steps, "next")}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Ready
        </p>
        <p className="mt-2 text-3xl font-black text-white">{getReadyStepCount(steps)}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          High Risk
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getHighRiskStepCount(steps)}
        </p>
      </article>
    </div>
  );
}

function NextStepCard({ step }: { step: BridgeNextStep }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {step.owner} / {step.risk} risk
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{step.label}</h3>
        </div>

        <span className={pillClass}>{getPhaseLabel(step.phase)}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{step.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Owner</span>
          <span className="text-right text-sm font-black text-white">{step.owner}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Ready</span>
          <span className="text-right text-sm font-black text-white">
            {step.ready ? "Yes" : "No"}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Safe Action</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {step.safeAction}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Do Not Do</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {step.doNotDo}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Done When</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {step.doneWhen}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackEngineBridgeNextStepPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const steps = buildNextSteps(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Next Steps
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Next Safe Bridge Work
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            This panel keeps bridge work pointed at safe future expansion:
            preserved panels first, dashboard wrapper next, real wiring only
            after green validation.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <NextStepSummary steps={steps} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {steps.map((step) => (
          <NextStepCard key={step.id} step={step} />
        ))}
      </div>
    </section>
  );
}