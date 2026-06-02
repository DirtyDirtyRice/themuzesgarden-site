"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

function scoreLabel(score: number): string {
  return `${Math.round(score)}%`;
}

export function MultiTrackInsightComparisonPanel({ engineState }: Props) {
  const { comparison } = engineState;
  const readySignals = comparison.signals.filter((signal) => signal.ready);

  return (
    <section className={cardClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
        Comparison Insight
      </p>

      <h4 className="mt-2 text-lg font-black text-white">
        {comparison.summary}
      </h4>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Weighted
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {scoreLabel(comparison.weightedScore)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Average
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {scoreLabel(comparison.averageScore)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Ready
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {readySignals.length}/{comparison.signals.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Status
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {comparison.status}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {comparison.signals.map((signal) => (
          <div
            key={signal.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-black text-white">{signal.label}</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  {signal.detail}
                </p>
              </div>

              <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
                {scoreLabel(signal.score)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}