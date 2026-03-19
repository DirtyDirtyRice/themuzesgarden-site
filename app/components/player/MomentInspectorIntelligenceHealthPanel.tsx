"use client";

import type { PlayerMomentIntelligenceRuntimeState } from "./playerMomentIntelligenceRuntime";

function getHealthTone(
  healthBand: PlayerMomentIntelligenceRuntimeState["healthBand"]
): string {
  if (healthBand === "strong") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (healthBand === "good") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }
  if (healthBand === "watch") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-red-200 bg-red-50 text-red-800";
}

function getMiniTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function getRepairRiskLabel(score: number | null): string {
  if (score === null || !Number.isFinite(score)) return "unknown";
  if (score >= 0.7) return "high";
  if (score >= 0.45) return "watch";
  if (score >= 0.25) return "low";
  return "stable";
}

export default function MomentInspectorIntelligenceHealthPanel(props: {
  runtime: PlayerMomentIntelligenceRuntimeState;
}) {
  const { runtime } = props;
  const summary = Array.isArray(runtime.summary) ? runtime.summary : [];

  return (
    <div className={`rounded-lg border px-3 py-2 ${getHealthTone(runtime.healthBand)}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide">
            Intelligence Health
          </div>
          <div className="text-[10px] opacity-80">
            {runtime.familyId ? `family ${runtime.familyId}` : "no family selected"}
          </div>
        </div>

        <div className="rounded border border-current/20 bg-white/60 px-2 py-1 text-[10px] uppercase tracking-wide">
          {runtime.healthBand}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded border border-current/15 bg-white/70 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide opacity-70">Outcome</div>
          <div className="mt-1 text-[12px] font-medium">
            {formatPercent(runtime.outcomeScore)}
          </div>
          <div className="mt-1 text-[10px] opacity-75">
            {runtime.outcomeLabel ?? "not available"}
          </div>
        </div>

        <div className="rounded border border-current/15 bg-white/70 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide opacity-70">Learning</div>
          <div className="mt-1 text-[12px] font-medium">
            {formatPercent(runtime.learningScore)}
          </div>
          <div className="mt-1 text-[10px] opacity-75">
            {runtime.learningLabel ?? "not available"}
          </div>
        </div>

        <div className="rounded border border-current/15 bg-white/70 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide opacity-70">Optimization</div>
          <div className="mt-1 text-[12px] font-medium">
            {formatPercent(runtime.optimizationScore)}
          </div>
          <div className="mt-1 text-[10px] opacity-75">
            {runtime.optimizationLabel ?? "not available"}
          </div>
        </div>

        <div className="rounded border border-current/15 bg-white/70 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide opacity-70">Repair Risk</div>
          <div className="mt-1 text-[12px] font-medium">
            {getRepairRiskLabel(runtime.repairScore)}
          </div>
          <div className="mt-1 text-[10px] opacity-75">
            {formatPercent(runtime.repairScore)}
          </div>
        </div>

        <div className="rounded border border-current/15 bg-white/70 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide opacity-70">Summary</div>
          <div className="mt-1 text-[12px] font-medium">{summary.length} signals</div>
          <div className="mt-1 text-[10px] opacity-75">runtime snapshot ready</div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <div className={`rounded border px-2 py-1 text-[10px] ${getMiniTone(runtime.hasOutcome)}`}>
          Outcome {runtime.hasOutcome ? "ready" : "missing"}
        </div>
        <div className={`rounded border px-2 py-1 text-[10px] ${getMiniTone(runtime.hasLearning)}`}>
          Learning {runtime.hasLearning ? "ready" : "missing"}
        </div>
        <div
          className={`rounded border px-2 py-1 text-[10px] ${getMiniTone(runtime.hasOptimization)}`}
        >
          Optimization {runtime.hasOptimization ? "ready" : "missing"}
        </div>
        <div className={`rounded border px-2 py-1 text-[10px] ${getMiniTone(runtime.hasRepair)}`}>
          Repair {runtime.hasRepair ? "ready" : "missing"}
        </div>
      </div>
    </div>
  );
}