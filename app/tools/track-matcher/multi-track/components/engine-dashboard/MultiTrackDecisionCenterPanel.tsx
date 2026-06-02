"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
  canSaveSnapshot: boolean;
  canExportComparison: boolean;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

export function MultiTrackDecisionCenterPanel({
  engineState,
  canSaveSnapshot,
  canExportComparison,
}: Props) {
  const { decision, analysis, comparison } = engineState;

  const decisionCards = [
    {
      label: "Primary action",
      value: decision.primaryActionLabel,
      detail: "The next main workstation action recommended by the engine.",
    },
    {
      label: "Secondary action",
      value: decision.secondaryActionLabel,
      detail: "The safer inspection route before larger runtime work.",
    },
    {
      label: "Save readiness",
      value: canSaveSnapshot ? "Snapshot allowed" : "Snapshot blocked",
      detail: "Uses the hook-level save permission from decision state.",
    },
    {
      label: "Export readiness",
      value: canExportComparison ? "Export allowed" : "Export blocked",
      detail: "Uses the hook-level export permission from decision state.",
    },
  ];

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Decision Center
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Current engine route: {decision.route}
          </h3>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          {decision.readiness}
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-6 text-white/70">
        {decision.reason}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {decisionCards.map((card) => (
          <article key={card.label} className={cardClass}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
              {card.label}
            </p>
            <h4 className="mt-2 text-lg font-black text-white">{card.value}</h4>
            <p className="mt-2 text-xs leading-5 text-white/70">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Analysis next step
          </p>
          <p className="mt-2 text-sm font-black text-white">
            {analysis.nextStepLabel}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Comparison status
          </p>
          <p className="mt-2 text-sm font-black text-white">
            {comparison.status}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Finding count
          </p>
          <p className="mt-2 text-sm font-black text-white">
            {analysis.findingCount} finding(s)
          </p>
        </article>
      </div>
    </section>
  );
}