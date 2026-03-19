"use client";

function getTone(state: "ready" | "partial" | "not-ready"): string {
  if (state === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (state === "partial") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getRepairState(params: {
  hasRepairQueue: boolean;
  hasSimulation: boolean;
}): "ready" | "partial" | "not-ready" {
  if (params.hasRepairQueue && params.hasSimulation) return "ready";
  if (params.hasRepairQueue || params.hasSimulation) return "partial";
  return "not-ready";
}

function getMessage(state: "ready" | "partial" | "not-ready"): string {
  if (state === "ready") {
    return "Repair queue and simulation are both active. The family is fully inside the repair loop.";
  }
  if (state === "partial") {
    return "Only part of the repair loop is active. More repair instrumentation is still needed.";
  }
  return "Repair-facing signals are not active yet. The family is still outside the full repair loop.";
}

export default function MomentInspectorFamilyRepairReadinessPanel(props: {
  hasRepairQueue: boolean;
  hasSimulation: boolean;
}) {
  const { hasRepairQueue, hasSimulation } = props;
  const state = getRepairState({ hasRepairQueue, hasSimulation });

  return (
    <div className={`rounded-lg border px-3 py-2 ${getTone(state)}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide">
            Repair Readiness
          </div>
          <div className="text-[10px] opacity-80">repair loop status</div>
        </div>

        <div className="rounded border border-current/20 bg-white/60 px-2 py-1 text-[10px] uppercase tracking-wide">
          {state}
        </div>
      </div>

      <div className="mt-2 text-[10px]">{getMessage(state)}</div>
    </div>
  );
}