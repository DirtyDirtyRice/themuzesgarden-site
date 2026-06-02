"use client";

import { useMultiTrackEngine } from "../../engine/useMultiTrackEngine";
import { MultiTrackOverviewPanel } from "../dashboard/MultiTrackOverviewPanel";
import { MultiTrackReadinessPanel } from "../dashboard/MultiTrackReadinessPanel";
import { MultiTrackEngineHealthPanel } from "../dashboard/MultiTrackEngineHealthPanel";
import { MultiTrackSnapshotPanel } from "../dashboard/MultiTrackSnapshotPanel";
import { MultiTrackQuickActionsPanel } from "../dashboard/MultiTrackQuickActionsPanel";
import { MultiTrackRelationshipPanel } from "../relationship/MultiTrackRelationshipPanel";

const panelClass =
  "rounded-3xl border border-white/10 bg-black p-5 text-white shadow-2xl";

export function MultiTrackEngineDashboard() {
  const engine = useMultiTrackEngine();
  const { engineState } = engine;

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Recovered Engine Dashboard
        </p>

        <h2 className="mt-2 text-3xl font-black text-white">
          Multi Track Engine Status
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          This dashboard connects the recovered engine hook to visible Multi Track workspace panels.
          It keeps the large page clean while giving the engine a real display area.
        </p>
      </div>

      <div className="mt-5 grid gap-5">
        <MultiTrackOverviewPanel engineState={engineState} />

        <MultiTrackReadinessPanel engineState={engineState} />

        <MultiTrackRelationshipPanel relationshipState={engineState.relationship} />

        <MultiTrackEngineHealthPanel engineState={engineState} />

        <MultiTrackSnapshotPanel engineState={engineState} />

        <MultiTrackQuickActionsPanel />
      </div>
    </section>
  );
}