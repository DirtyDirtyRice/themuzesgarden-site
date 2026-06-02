"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4";

export function MultiTrackOverviewPanel({ engineState }: Props) {
  const trackALoaded = engineState.trackA.loaded;
  const trackBLoaded = engineState.trackB.loaded;

  const weightedScore = Math.round(
    engineState.comparison.weightedScore,
  );

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Multi Track
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Engine Overview
          </h2>

          <p className="mt-3 max-w-3xl text-sm text-white/70">
            High-level view of the current multi-track engine
            state, readiness, comparison health, and track
            status.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-black text-white">
          {engineState.analysis.readiness}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Track A
          </p>

          <p className="mt-3 text-xl font-black">
            {trackALoaded ? "Loaded" : "Waiting"}
          </p>

          <p className="mt-2 text-sm text-white/70">
            {engineState.trackA.title}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Track B
          </p>

          <p className="mt-3 text-xl font-black">
            {trackBLoaded ? "Loaded" : "Waiting"}
          </p>

          <p className="mt-2 text-sm text-white/70">
            {engineState.trackB.title}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Match Score
          </p>

          <p className="mt-3 text-xl font-black">
            {weightedScore}%
          </p>

          <p className="mt-2 text-sm text-white/70">
            Weighted comparison score.
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Decision Route
          </p>

          <p className="mt-3 text-xl font-black">
            {engineState.decision.route}
          </p>

          <p className="mt-2 text-sm text-white/70">
            Current engine recommendation.
          </p>
        </article>
      </div>
    </section>
  );
}