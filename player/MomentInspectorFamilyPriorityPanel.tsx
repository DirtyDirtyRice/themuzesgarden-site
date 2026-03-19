"use client";

import type { PlayerMomentIntelligenceRuntimeState } from "./playerMomentIntelligenceRuntime";

function getPriority(params: {
  healthBand: PlayerMomentIntelligenceRuntimeState["healthBand"];
  repairScore: number | null;
}): {
  label: string;
  tone: string;
  message: string;
} {
  const repair = Number(params.repairScore ?? 0);

  if (params.healthBand === "strong" && repair < 0.3) {
    return {
      label: "reinforce",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      message: "This family looks strong enough to reinforce and reuse with confidence.",
    };
  }

  if (params.healthBand === "good") {
    return {
      label: "monitor",
      tone: "border-sky-200 bg-sky-50 text-sky-800",
      message: "This family looks useful, but it still deserves normal monitoring before stronger reinforcement.",
    };
  }

  if (params.healthBand === "watch" || repair >= 0.45) {
    return {
      label: "repair",
      tone: "border-amber-200 bg-amber-50 text-amber-800",
      message: "This family should stay under watch and likely needs repair-oriented attention.",
    };
  }

  return {
    label: "wait",
    tone: "border-zinc-200 bg-zinc-50 text-zinc-700",
    message: "This family does not yet have enough reliable signal strength to prioritize aggressively.",
  };
}

export default function MomentInspectorFamilyPriorityPanel(props: {
  runtime: PlayerMomentIntelligenceRuntimeState;
}) {
  const { runtime } = props;
  const priority = getPriority({
    healthBand: runtime.healthBand,
    repairScore: runtime.repairScore,
  });

  return (
    <div className={`rounded-lg border px-3 py-2 ${priority.tone}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide">
            Family Priority
          </div>
          <div className="text-[10px] opacity-80">
            {runtime.familyId ? `family ${runtime.familyId}` : "no family selected"}
          </div>
        </div>

        <div className="rounded border border-current/20 bg-white/60 px-2 py-1 text-[10px] uppercase tracking-wide">
          {priority.label}
        </div>
      </div>

      <div className="mt-2 text-[10px]">{priority.message}</div>
    </div>
  );
}