"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4";

export function MultiTrackReadinessPanel({
  engineState,
}: Props) {
  const laneReadiness =
    engineState.analysis.laneReadiness;

  return (
    <section className={panelClass}>
      <h2 className="text-2xl font-black">
        Readiness
      </h2>

      <p className="mt-3 text-sm text-white/70">
        Current readiness status for all engine lanes.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {laneReadiness.map((lane) => (
          <article
            key={lane.laneId}
            className={cardClass}
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
              {lane.label}
            </p>

            <p className="mt-3 text-xl font-black">
              {lane.readiness}
            </p>

            <p className="mt-2 text-sm text-white/70">
              Score: {lane.score}
            </p>

            <p className="mt-3 text-sm text-white/60">
              {lane.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}