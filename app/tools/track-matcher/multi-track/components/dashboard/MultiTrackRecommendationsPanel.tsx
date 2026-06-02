"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

export function MultiTrackRecommendationsPanel({
  engineState,
}: Props) {
  return (
    <section className={panelClass}>
      <h2 className="text-2xl font-black">
        Recommendations
      </h2>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-white/10 p-4">
          <h3 className="font-black">
            Current Route
          </h3>

          <p className="mt-2 text-sm text-white/70">
            {engineState.decision.route}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 p-4">
          <h3 className="font-black">
            Next Step
          </h3>

          <p className="mt-2 text-sm text-white/70">
            {engineState.analysis.nextStepLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 p-4">
          <h3 className="font-black">
            Reason
          </h3>

          <p className="mt-2 text-sm text-white/70">
            {engineState.decision.reason}
          </p>
        </div>
      </div>
    </section>
  );
}