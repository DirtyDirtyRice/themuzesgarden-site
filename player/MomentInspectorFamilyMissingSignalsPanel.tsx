"use client";

export default function MomentInspectorFamilyMissingSignalsPanel(props: {
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

  const missing = [
    !hasDrift ? "drift" : null,
    !hasStability ? "stability" : null,
    !hasActions ? "actions" : null,
    !hasRepairQueue ? "repair queue" : null,
    !hasSimulation ? "simulation" : null,
    !hasTrust ? "trust" : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
          Missing Signals
        </div>
        <div className="text-[10px] text-zinc-500">debugging gaps</div>
      </div>

      {missing.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {missing.map((item) => (
            <div
              key={item}
              className="rounded border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-700"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] text-emerald-700">
          No major selected-family signal gaps are visible right now.
        </div>
      )}
    </div>
  );
}