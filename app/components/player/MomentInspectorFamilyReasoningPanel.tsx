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

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildReasonLines(params: {
  runtime: PlayerMomentIntelligenceRuntimeState;
  hasDrift: boolean;
  hasStability: boolean;
  hasActions: boolean;
  hasRepairQueue: boolean;
  hasSimulation: boolean;
  familyOptionCount: number;
  actionCount: number;
  driftMemberCount: number;
  repairQueueCount: number;
}): string[] {
  const {
    runtime,
    hasDrift,
    hasStability,
    hasActions,
    hasRepairQueue,
    hasSimulation,
    familyOptionCount,
    actionCount,
    driftMemberCount,
    repairQueueCount,
  } = params;

  const lines: string[] = [];

  if (!runtime.familyId) {
    lines.push("No phrase family is selected yet, so the intelligence runtime is still waiting for a target.");
    return lines;
  }

  if (runtime.healthBand === "strong") {
    lines.push(
      "This family looks strong because the runtime has enough positive signals while repair pressure stays low."
    );
  } else if (runtime.healthBand === "good") {
    lines.push(
      "This family looks good because learning and optimization signals are active, even though it still needs monitoring."
    );
  } else if (runtime.healthBand === "watch") {
    lines.push(
      "This family is in watch mode because useful signals exist, but the structure still needs more proof before it feels stable."
    );
  } else {
    lines.push(
      "This family looks weak because too few signals are ready or the current repair pressure is still too high."
    );
  }

  lines.push(
    `The inspector currently sees ${pluralize(familyOptionCount, "family option", "family options")} in the active track runtime.`
  );

  if (hasActions) {
    lines.push(
      `Action coverage is active with ${pluralize(actionCount, "action row", "action rows")} attached to the selected family.`
    );
  } else {
    lines.push("Action coverage is still missing, so planning confidence for this family remains shallow.");
  }

  if (hasDrift) {
    lines.push(
      `Drift analysis is active with ${pluralize(driftMemberCount, "drift member", "drift members")} visible for the selected family.`
    );
  } else {
    lines.push("Drift analysis is missing, so the runtime cannot yet describe family movement in detail.");
  }

  if (hasStability) {
    lines.push(
      "Stability analysis is present, so the runtime can compare family movement against structural consistency."
    );
  } else {
    lines.push(
      "Stability analysis is still missing, so consistency is harder to judge than movement."
    );
  }

  if (hasRepairQueue) {
    lines.push(
      `Repair queue coverage is active with ${pluralize(repairQueueCount, "queue row", "queue rows")} currently visible in the repair view.`
    );
  } else {
    lines.push("Repair queue coverage is still missing, so the family is not yet strongly scheduled for repair work.");
  }

  if (hasRepairQueue && hasSimulation) {
    lines.push(
      "Repair queue and simulation are both active, so this family is fully inside the repair feedback loop."
    );
  } else if (hasRepairQueue || hasSimulation) {
    lines.push(
      "Repair-facing signals are only partly active, so the family is entering the repair loop but is not fully instrumented yet."
    );
  } else {
    lines.push(
      "Repair-facing signals are not active yet, so this family is not fully inside the repair loop."
    );
  }

  lines.push(
    `Runtime snapshot: outcome ${formatPercent(runtime.outcomeScore)}, learning ${formatPercent(
      runtime.learningScore
    )}, optimization ${formatPercent(runtime.optimizationScore)}, repair ${formatPercent(
      runtime.repairScore
    )}.`
  );

  return lines;
}

export default function MomentInspectorFamilyReasoningPanel(props: {
  runtime: PlayerMomentIntelligenceRuntimeState;
  hasDrift: boolean;
  hasStability: boolean;
  hasActions: boolean;
  hasRepairQueue: boolean;
  hasSimulation: boolean;
  familyOptionCount: number;
  actionCount: number;
  driftMemberCount: number;
  repairQueueCount: number;
}) {
  const {
    runtime,
    hasDrift,
    hasStability,
    hasActions,
    hasRepairQueue,
    hasSimulation,
    familyOptionCount,
    actionCount,
    driftMemberCount,
    repairQueueCount,
  } = props;

  const lines = buildReasonLines({
    runtime,
    hasDrift,
    hasStability,
    hasActions,
    hasRepairQueue,
    hasSimulation,
    familyOptionCount,
    actionCount,
    driftMemberCount,
    repairQueueCount,
  });

  return (
    <div className={`rounded-lg border px-3 py-2 ${getTone(runtime.healthBand)}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide">
          Family Reasoning
        </div>
        <div className="text-[10px]">
          {runtime.familyId ? `family ${runtime.familyId}` : "no family selected"}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {lines.map((line) => (
          <div
            key={line}
            className="rounded border border-current/15 bg-white/60 px-2 py-2 text-[10px]"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}