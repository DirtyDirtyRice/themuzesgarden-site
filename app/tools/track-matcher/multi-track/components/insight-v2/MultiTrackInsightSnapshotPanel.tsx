"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

export function MultiTrackInsightSnapshotPanel({ engineState }: Props) {
  const { snapshots, decision, comparison } = engineState;

  const snapshotRecommendation =
    snapshots.length > 0
      ? "Review existing snapshots before saving another checkpoint."
      : decision.canSave
        ? "Current state is snapshot-ready."
        : "Wait until comparison confidence improves before saving.";

  return (
    <section className={cardClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
        Snapshot Insight
      </p>

      <h4 className="mt-2 text-lg font-black text-white">
        {snapshots.length} snapshot(s) available
      </h4>

      <p className="mt-3 text-sm leading-6 text-white/70">
        {snapshotRecommendation}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Can save
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {decision.canSave ? "Yes" : "No"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Score
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {Math.round(comparison.weightedScore)}%
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Readiness
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {decision.readiness}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {snapshots.slice(0, 3).map((snapshot) => (
          <div
            key={snapshot.snapshotId}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <p className="text-sm font-black text-white">{snapshot.snapshotId}</p>
            <p className="mt-1 text-xs leading-5 text-white/70">
              {snapshot.createdAtLabel} · {snapshot.summary}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}