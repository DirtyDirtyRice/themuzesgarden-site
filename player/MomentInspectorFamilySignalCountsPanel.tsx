"use client";

function formatCountLabel(label: string, count: number): string {
  return `${label} ${count}`;
}

export default function MomentInspectorFamilySignalCountsPanel(props: {
  familyOptionCount: number;
  actionCount: number;
  driftMemberCount: number;
  repairQueueCount: number;
}) {
  const { familyOptionCount, actionCount, driftMemberCount, repairQueueCount } = props;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
          Signal Counts
        </div>
        <div className="text-[10px] text-zinc-500">selected-family totals</div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-zinc-200 bg-white px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide text-zinc-500">Families</div>
          <div className="mt-1 text-[12px] font-medium text-zinc-700">
            {formatCountLabel("total", familyOptionCount)}
          </div>
        </div>

        <div className="rounded border border-zinc-200 bg-white px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide text-zinc-500">Actions</div>
          <div className="mt-1 text-[12px] font-medium text-zinc-700">
            {formatCountLabel("rows", actionCount)}
          </div>
        </div>

        <div className="rounded border border-zinc-200 bg-white px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide text-zinc-500">Drift</div>
          <div className="mt-1 text-[12px] font-medium text-zinc-700">
            {formatCountLabel("members", driftMemberCount)}
          </div>
        </div>

        <div className="rounded border border-zinc-200 bg-white px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide text-zinc-500">Repair Queue</div>
          <div className="mt-1 text-[12px] font-medium text-zinc-700">
            {formatCountLabel("rows", repairQueueCount)}
          </div>
        </div>
      </div>
    </div>
  );
}