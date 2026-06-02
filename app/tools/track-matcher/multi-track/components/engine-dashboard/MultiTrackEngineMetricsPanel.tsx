"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

export function MultiTrackEngineMetricsPanel({ engineState }: Props) {
  const { comparison, analysis } = engineState;

  const readySignals = comparison.signals.filter((signal) => signal.ready).length;
  const totalSignals = comparison.signals.length;
  const readinessScore =
    analysis.laneReadiness.length > 0
      ? Math.round(
          analysis.laneReadiness.reduce((sum, lane) => sum + lane.score, 0) /
            analysis.laneReadiness.length,
        )
      : 0;

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Engine Metrics
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Comparison and readiness scoring
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          This panel reads the real comparison and analysis state from the recovered engine.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Average
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {formatScore(comparison.averageScore)}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Raw comparison score.
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Weighted
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {formatScore(comparison.weightedScore)}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Weighted signal score.
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Signals
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {readySignals}/{totalSignals}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Ready comparison signals.
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Lanes
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {formatScore(readinessScore)}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Average lane readiness.
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-3">
        {comparison.signals.map((signal) => (
          <article key={signal.id} className={cardClass}>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div>
                <h4 className="text-base font-black text-white">{signal.label}</h4>
                <p className="mt-2 text-sm leading-6 text-white/70">{signal.detail}</p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
                {signal.polarity}
              </span>

              <span className="text-sm font-black text-white">
                {formatScore(signal.score)}
              </span>

              <span className="text-xs font-bold text-white/70">
                Weight {signal.weight}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}