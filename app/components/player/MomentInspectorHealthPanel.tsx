"use client";

import type { MomentInspectorHealthResult } from "./momentInspectorHealth";

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function formatScorePercent(value: number): string {
  return `${Math.round(clamp01(value) * 100)}%`;
}

function getToneClass(value: number): string {
  const score = clamp01(value);

  if (score < 0.4) return "text-red-600";
  if (score < 0.75) return "text-amber-600";
  return "text-emerald-600";
}

export default function MomentInspectorHealthPanel(props: {
  health: MomentInspectorHealthResult | null | undefined;
}) {
  const { health } = props;

  if (!health) return null;

  const overallTone = getToneClass(health.overallHealth);
  const structureTone = getToneClass(health.structureConfidence);
  const repeatTone = getToneClass(health.repeatIntegrity);

  return (
    <div className="mt-2 rounded border border-sky-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
          Moment Health
        </div>

        <div className="text-[10px] text-sky-700">
          {health.totalFamilies} famil{health.totalFamilies === 1 ? "y" : "ies"}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded border border-zinc-200 bg-zinc-50 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Overall Health
          </div>
          <div className={`mt-1 text-sm font-semibold ${overallTone}`}>
            {formatScorePercent(health.overallHealth)}
          </div>
        </div>

        <div className="rounded border border-zinc-200 bg-zinc-50 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Structure Confidence
          </div>
          <div className={`mt-1 text-sm font-semibold ${structureTone}`}>
            {formatScorePercent(health.structureConfidence)}
          </div>
        </div>

        <div className="rounded border border-zinc-200 bg-zinc-50 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Repeat Integrity
          </div>
          <div className={`mt-1 text-sm font-semibold ${repeatTone}`}>
            {formatScorePercent(health.repeatIntegrity)}
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded border border-zinc-200 px-2 py-1">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Total Actions
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {health.totalActions}
          </div>
        </div>

        <div className="rounded border border-zinc-200 px-2 py-1">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Missing
          </div>
          <div className="mt-1 text-[11px] font-medium text-red-600">
            {health.missingActions}
          </div>
        </div>

        <div className="rounded border border-zinc-200 px-2 py-1">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Near
          </div>
          <div className="mt-1 text-[11px] font-medium text-amber-600">
            {health.nearActions}
          </div>
        </div>

        <div className="rounded border border-zinc-200 px-2 py-1">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Present
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-600">
            {health.presentActions}
          </div>
        </div>
      </div>
    </div>
  );
}