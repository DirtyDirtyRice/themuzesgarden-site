"use client";

import type { MultiTrackEngineReadinessLevel } from "../../engine/multiTrackEngineTypes";

type Props = {
  readiness: MultiTrackEngineReadinessLevel;
  readinessLabel: string;
  readinessDetail: string;
  snapshotCount: number;
  markerCount: number;
  cueCount: number;
  findingCount: number;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

export function MultiTrackEngineReadinessRail({
  readiness,
  readinessLabel,
  readinessDetail,
  snapshotCount,
  markerCount,
  cueCount,
  findingCount,
}: Props) {
  const cards = [
    {
      label: "Readiness",
      value: readinessLabel,
      detail: readinessDetail,
    },
    {
      label: "Snapshots",
      value: String(snapshotCount),
      detail: "Saved engine snapshots currently stored in hook state.",
    },
    {
      label: "Markers",
      value: String(markerCount),
      detail: "Timeline markers available to the recovered engine.",
    },
    {
      label: "Cues",
      value: String(cueCount),
      detail: "Timeline cues available to the recovered engine.",
    },
    {
      label: "Findings",
      value: String(findingCount),
      detail: "Analysis findings currently visible to the engine dashboard.",
    },
  ];

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Readiness Rail
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Hook-level engine summary
          </h3>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          {readiness}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className={cardClass}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-black text-white">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-white/70">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}