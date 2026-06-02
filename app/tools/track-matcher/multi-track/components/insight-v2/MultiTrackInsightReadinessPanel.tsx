"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

export function MultiTrackInsightReadinessPanel({ engineState }: Props) {
  const { analysis, trackA, trackB } = engineState;

  return (
    <section className={cardClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
        Readiness Insight
      </p>

      <h4 className="mt-2 text-lg font-black text-white">
        Next step: {analysis.nextStepLabel}
      </h4>

      <p className="mt-3 text-sm leading-6 text-white/70">
        Track A is {trackA.readiness}. Track B is {trackB.readiness}. Analysis is{" "}
        {analysis.readiness}.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Findings
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {analysis.findingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Warnings
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {analysis.warningCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Blocked
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {analysis.blockedCount}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {analysis.laneReadiness.map((lane) => (
          <div
            key={lane.laneId}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{lane.label}</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  {lane.detail}
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
                {lane.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}