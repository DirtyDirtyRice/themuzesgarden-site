"use client";

import type { PlayerMomentIntelligenceRuntimeState } from "./playerMomentIntelligenceRuntime";

function getTone(healthBand: PlayerMomentIntelligenceRuntimeState["healthBand"]): string {
  if (healthBand === "strong") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (healthBand === "good") return "border-sky-200 bg-sky-50 text-sky-800";
  if (healthBand === "watch") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function getInterpretation(runtime: PlayerMomentIntelligenceRuntimeState): string {
  if (!runtime.familyId) {
    return "The runtime is waiting for a selected family before it can form a focused interpretation.";
  }

  if (runtime.healthBand === "strong") {
    return "The selected family currently looks reliable enough to reinforce and reuse.";
  }

  if (runtime.healthBand === "good") {
    return "The selected family looks promising, but it still benefits from continued monitoring.";
  }

  if (runtime.healthBand === "watch") {
    return "The selected family has useful signals, but it still needs caution and comparison work.";
  }

  return "The selected family is still weak and should not be trusted heavily yet.";
}

export default function MomentInspectorRuntimeSnapshotPanel(props: {
  runtime: PlayerMomentIntelligenceRuntimeState;
}) {
  const { runtime } = props;

  return (
    <div className={`rounded-lg border px-3 py-2 ${getTone(runtime.healthBand)}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide">
          Runtime Snapshot
        </div>
        <div className="text-[10px]">
          {runtime.familyId ? `family ${runtime.familyId}` : "no family selected"}
        </div>
      </div>

      <div className="mt-2 text-[10px]">
        Health is <span className="font-medium">{runtime.healthBand}</span>. Outcome is{" "}
        <span className="font-medium">{formatPercent(runtime.outcomeScore)}</span>, learning is{" "}
        <span className="font-medium">{formatPercent(runtime.learningScore)}</span>, optimization is{" "}
        <span className="font-medium">{formatPercent(runtime.optimizationScore)}</span>, and repair is{" "}
        <span className="font-medium">{formatPercent(runtime.repairScore)}</span>.
      </div>

      <div className="mt-2 rounded border border-current/15 bg-white/60 px-2 py-2 text-[10px]">
        {getInterpretation(runtime)}
      </div>
    </div>
  );
}