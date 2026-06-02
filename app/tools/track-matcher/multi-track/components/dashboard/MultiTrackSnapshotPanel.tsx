"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

export function MultiTrackSnapshotPanel({
  engineState,
}: Props) {
  return (
    <section className={panelClass}>
      <h2 className="text-2xl font-black">
        Snapshots
      </h2>

      <div className="mt-5 space-y-3">
        {engineState.snapshots.map((snapshot) => (
          <div
            key={snapshot.snapshotId}
            className="rounded-2xl border border-white/10 p-4"
          >
            <p className="font-black">
              {snapshot.summary}
            </p>

            <p className="mt-2 text-sm text-white/60">
              {snapshot.createdAtLabel}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}