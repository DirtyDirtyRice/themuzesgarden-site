"use client";

function getTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
}

function getLabel(active: boolean): string {
  return active ? "ready" : "missing";
}

export default function MomentInspectorFamilyStatusMatrix(props: {
  hasDrift: boolean;
  hasStability: boolean;
  hasActions: boolean;
  hasRepairQueue: boolean;
  hasSimulation: boolean;
  hasTrust: boolean;
}) {
  const {
    hasDrift,
    hasStability,
    hasActions,
    hasRepairQueue,
    hasSimulation,
    hasTrust,
  } = props;

  const items = [
    { label: "Drift", active: hasDrift },
    { label: "Stability", active: hasStability },
    { label: "Actions", active: hasActions },
    { label: "Repair Queue", active: hasRepairQueue },
    { label: "Simulation", active: hasSimulation },
    { label: "Trust", active: hasTrust },
  ];

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
          Family Status Matrix
        </div>
        <div className="text-[10px] text-zinc-500">selected-family readiness</div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded border px-2 py-2 text-[10px] ${getTone(item.active)}`}
          >
            <div className="font-medium">{item.label}</div>
            <div className="mt-1 uppercase tracking-wide opacity-80">
              {getLabel(item.active)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}