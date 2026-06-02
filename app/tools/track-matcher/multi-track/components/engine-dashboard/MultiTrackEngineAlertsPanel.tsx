"use client";

import type {
  MultiTrackEngineAnalysisFinding,
  MultiTrackEngineFindingSeverity,
  MultiTrackEngineState,
} from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
  findingCount: number;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

function getSeverityCount(
  findings: MultiTrackEngineAnalysisFinding[],
  severity: MultiTrackEngineFindingSeverity,
): number {
  return findings.filter((finding) => finding.severity === severity).length;
}

export function MultiTrackEngineAlertsPanel({ engineState, findingCount }: Props) {
  const { analysis } = engineState;

  const severityCards = [
    {
      label: "Good",
      value: getSeverityCount(analysis.findings, "good"),
      detail: "Green engine foundations.",
    },
    {
      label: "Info",
      value: getSeverityCount(analysis.findings, "info"),
      detail: "Safe notes and future reminders.",
    },
    {
      label: "Warnings",
      value: analysis.warningCount,
      detail: "Items needing attention before full readiness.",
    },
    {
      label: "Blocked",
      value: analysis.blockedCount,
      detail: "Items that should stop risky expansion.",
    },
  ];

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Engine Alerts
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Findings, warnings, and lane readiness
          </h3>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          {findingCount} finding(s)
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-6 text-white/70">
        {analysis.summary}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {severityCards.map((card) => (
          <article key={card.label} className={cardClass}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-black text-white">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-white/70">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {analysis.findings.map((finding) => (
          <article key={finding.id} className={cardClass}>
            <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-start">
              <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
                {finding.severity}
              </span>

              <div>
                <h4 className="text-base font-black text-white">{finding.label}</h4>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {finding.detail}
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
                {finding.actionLabel}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {analysis.laneReadiness.map((lane) => (
          <article key={lane.laneId} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  {lane.laneId}
                </p>
                <h4 className="mt-2 text-base font-black text-white">{lane.label}</h4>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
                {lane.score}%
              </span>
            </div>

            <p className="mt-3 text-sm font-bold text-white/80">
              {lane.readiness}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/70">{lane.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}