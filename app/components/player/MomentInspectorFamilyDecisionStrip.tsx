"use client";

function getTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
}

function getLabel(active: boolean, onLabel: string, offLabel: string): string {
  return active ? onLabel : offLabel;
}

export default function MomentInspectorFamilyDecisionStrip(props: {
  hasDrift: boolean;
  hasStability: boolean;
  hasActions: boolean;
  hasRepairQueue: boolean;
  hasSimulation: boolean;
}) {
  const { hasDrift, hasStability, hasActions, hasRepairQueue, hasSimulation } =
    props;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
          Family Decision Signals
        </div>
        <div className="text-[10px] text-zinc-500">selected-family readiness</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <div className={`rounded border px-2 py-1 text-[10px] ${getTone(hasDrift)}`}>
          Drift {getLabel(hasDrift, "present", "none")}
        </div>

        <div className={`rounded border px-2 py-1 text-[10px] ${getTone(hasStability)}`}>
          Stability {getLabel(hasStability, "present", "none")}
        </div>

        <div className={`rounded border px-2 py-1 text-[10px] ${getTone(hasActions)}`}>
          Actions {getLabel(hasActions, "ready", "missing")}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getTone(hasRepairQueue)}`}
        >
          Repair Queue {getLabel(hasRepairQueue, "ready", "empty")}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getTone(hasSimulation)}`}
        >
          Simulation {getLabel(hasSimulation, "ready", "missing")}
        </div>
      </div>
    </div>
  );
}
