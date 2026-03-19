"use client";

import type { PlayerMomentIntelligenceRuntimeState } from "./playerMomentIntelligenceRuntime";

export default function MomentInspectorRuntimeSummaryChips(props: {
  runtime: PlayerMomentIntelligenceRuntimeState;
}) {
  const { runtime } = props;

  if (!runtime.summary.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {runtime.summary.map((item) => (
        <div
          key={item}
          className="rounded border border-current/20 bg-white/60 px-2 py-1 text-[10px]"
        >
          {item}
        </div>
      ))}
    </div>
  );
}