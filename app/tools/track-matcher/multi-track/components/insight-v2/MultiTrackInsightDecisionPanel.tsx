"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

export function MultiTrackInsightDecisionPanel({ engineState }: Props) {
  const { decision, comparison, analysis } = engineState;

  return (
    <section className={cardClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
        Decision Insight
      </p>

      <h4 className="mt-2 text-lg font-black text-white">
        Route: {decision.route}
      </h4>

      <p className="mt-3 text-sm leading-6 text-white/70">{decision.reason}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Primary
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {decision.primaryActionLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Save
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {decision.canSave ? "Allowed" : "Blocked"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Export
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {decision.canExport ? "Allowed" : "Blocked"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-white/70">
        Weighted score {Math.round(comparison.weightedScore)}% · next step{" "}
        {analysis.nextStepLabel}
      </p>
    </section>
  );
}