"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

export function MultiTrackEngineHealthPanel({
  engineState,
}: Props) {
  return (
    <section className={panelClass}>
      <h2 className="text-2xl font-black">
        Engine Health
      </h2>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div>
          <p className="text-sm text-white/70">
            Findings
          </p>

          <p className="mt-2 text-3xl font-black">
            {engineState.analysis.findingCount}
          </p>
        </div>

        <div>
          <p className="text-sm text-white/70">
            Warnings
          </p>

          <p className="mt-2 text-3xl font-black">
            {engineState.analysis.warningCount}
          </p>
        </div>

        <div>
          <p className="text-sm text-white/70">
            Blocked
          </p>

          <p className="mt-2 text-3xl font-black">
            {engineState.analysis.blockedCount}
          </p>
        </div>
      </div>
    </section>
  );
}