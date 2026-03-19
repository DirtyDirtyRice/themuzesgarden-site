"use client";

import type { PlayerMomentIntelligenceRuntimeState } from "./playerMomentIntelligenceRuntime";

function formatRuntimeScore(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

export default function MomentInspectorRuntimeMetricsGrid(props: {
  runtime: PlayerMomentIntelligenceRuntimeState;
}) {
  const { runtime } = props;

  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-4">
      <div className="rounded border border-current/15 bg-white/70 px-2 py-2">
        <div className="text-[9px] uppercase tracking-wide opacity-70">Outcome</div>
        <div className="mt-1 text-[12px] font-medium">
          {formatRuntimeScore(runtime.outcomeScore)}
        </div>
      </div>

      <div className="rounded border border-current/15 bg-white/70 px-2 py-2">
        <div className="text-[9px] uppercase tracking-wide opacity-70">Learning</div>
        <div className="mt-1 text-[12px] font-medium">
          {formatRuntimeScore(runtime.learningScore)}
        </div>
      </div>

      <div className="rounded border border-current/15 bg-white/70 px-2 py-2">
        <div className="text-[9px] uppercase tracking-wide opacity-70">Optimization</div>
        <div className="mt-1 text-[12px] font-medium">
          {formatRuntimeScore(runtime.optimizationScore)}
        </div>
      </div>

      <div className="rounded border border-current/15 bg-white/70 px-2 py-2">
        <div className="text-[9px] uppercase tracking-wide opacity-70">Repair</div>
        <div className="mt-1 text-[12px] font-medium">
          {formatRuntimeScore(runtime.repairScore)}
        </div>
      </div>
    </div>
  );
}