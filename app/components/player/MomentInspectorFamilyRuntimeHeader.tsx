"use client";

import type { PlayerMomentIntelligenceRuntimeState } from "./playerMomentIntelligenceRuntime";

function getTone(healthBand: PlayerMomentIntelligenceRuntimeState["healthBand"]): string {
  if (healthBand === "strong") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (healthBand === "good") return "border-sky-200 bg-sky-50 text-sky-800";
  if (healthBand === "watch") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

export default function MomentInspectorFamilyRuntimeHeader(props: {
  runtime: PlayerMomentIntelligenceRuntimeState;
}) {
  const { runtime } = props;

  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wide text-current">
          Intelligence Runtime
        </div>
        <div className="text-[10px] opacity-80">
          {runtime.familyId ? `family ${runtime.familyId}` : "no family selected"}
        </div>
      </div>

      <div className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${getTone(runtime.healthBand)}`}>
        {runtime.healthBand}
      </div>
    </div>
  );
}