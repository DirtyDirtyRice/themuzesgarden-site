"use client";

import type { PlayerMomentIntelligenceRuntimeState } from "./playerMomentIntelligenceRuntime";

function buildActions(runtime: PlayerMomentIntelligenceRuntimeState): string[] {
  const actions: string[] = [];

  if (!runtime.familyId) {
    actions.push("Select a phrase family so the runtime can focus on one target.");
    return actions;
  }

  if (!runtime.hasOutcome) {
    actions.push("Strengthen outcome coverage so the family can be evaluated after execution.");
  }

  if (!runtime.hasLearning) {
    actions.push("Increase learning coverage so the runtime can decide what should be reinforced.");
  }

  if (!runtime.hasOptimization) {
    actions.push("Increase optimization coverage so the runtime can choose reuse, reinforce, or avoid behavior.");
  }

  if (!runtime.hasRepair) {
    actions.push("Increase repair coverage so the family can enter the repair loop.");
  }

  if (runtime.repairScore !== null && runtime.repairScore >= 0.45) {
    actions.push("Prioritize repair-oriented inspection because repair pressure is elevated.");
  }

  if (runtime.healthBand === "strong") {
    actions.push("This family is a good candidate for reinforcement and future reuse.");
  } else if (runtime.healthBand === "good") {
    actions.push("Keep monitoring this family while building more evidence for reinforcement.");
  } else if (runtime.healthBand === "watch") {
    actions.push("Watch this family closely and compare drift against stability before trusting it more.");
  } else {
    actions.push("Do not trust this family yet; build more signal coverage before making stronger decisions.");
  }

  return Array.from(new Set(actions));
}

export default function MomentInspectorRuntimeNextActionsPanel(props: {
  runtime: PlayerMomentIntelligenceRuntimeState;
}) {
  const { runtime } = props;
  const actions = buildActions(runtime);

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
          Suggested Next Actions
        </div>
        <div className="text-[10px] text-zinc-500">runtime guidance</div>
      </div>

      <div className="mt-2 space-y-2">
        {actions.map((action) => (
          <div
            key={action}
            className="rounded border border-zinc-200 bg-white px-2 py-2 text-[10px] text-zinc-700"
          >
            {action}
          </div>
        ))}
      </div>
    </div>
  );
}