"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

function getWorkflowStage(engineState: MultiTrackEngineState): string {
  if (!engineState.trackA.loaded && !engineState.trackB.loaded) {
    return "Load source material";
  }

  if (!engineState.trackA.loaded || !engineState.trackB.loaded) {
    return "Complete lane loading";
  }

  if (engineState.comparison.weightedScore < 60) {
    return "Improve comparison readiness";
  }

  if (!engineState.decision.canSave) {
    return "Review findings before snapshot";
  }

  if (!engineState.decision.canExport) {
    return "Snapshot-ready, not export-ready";
  }

  return "Export-ready";
}

export function MultiTrackInsightWorkflowPanel({ engineState }: Props) {
  const stage = getWorkflowStage(engineState);

  const workflowItems = [
    {
      label: "Load",
      done: engineState.trackA.loaded && engineState.trackB.loaded,
      detail: "Both lanes should contain source material.",
    },
    {
      label: "Prepare",
      done: engineState.timeline.markers.length > 0,
      detail: "Timeline markers should exist before sync work.",
    },
    {
      label: "Compare",
      done: engineState.comparison.weightedScore >= 60,
      detail: "Comparison should reach snapshot confidence.",
    },
    {
      label: "Save",
      done: engineState.decision.canSave,
      detail: "Decision state should allow snapshots.",
    },
    {
      label: "Export",
      done: engineState.decision.canExport,
      detail: "Decision state should allow export.",
    },
  ];

  return (
    <section className={cardClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
        Workflow Insight
      </p>

      <h4 className="mt-2 text-lg font-black text-white">{stage}</h4>

      <p className="mt-3 text-sm leading-6 text-white/70">
        This read-only workflow reads current engine state and turns it into a simple
        production path from loading to export.
      </p>

      <div className="mt-4 grid gap-2">
        {workflowItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-white/70">{item.detail}</p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
                {item.done ? "Ready" : "Waiting"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}