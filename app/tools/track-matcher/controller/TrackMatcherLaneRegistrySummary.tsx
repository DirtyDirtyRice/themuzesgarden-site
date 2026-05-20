"use client";

import {
  getTrackMatcherActiveLaneCount,
  getTrackMatcherFutureLaneTitles,
  getTrackMatcherPlannedLaneCount,
} from "./trackMatcherLaneRegistryHelpers";

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-white/65">
        {description}
      </p>
    </div>
  );
}

export default function TrackMatcherLaneRegistrySummary() {
  const activeLaneCount = getTrackMatcherActiveLaneCount();

  const plannedLaneCount = getTrackMatcherPlannedLaneCount();

  const futureLaneTitles = getTrackMatcherFutureLaneTitles();

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <SummaryCard
        label="Ready Lanes"
        value={activeLaneCount}
        description="Production-safe lanes currently participating in the Track Matcher workflow."
      />

      <SummaryCard
        label="Planned Lanes"
        value={plannedLaneCount}
        description="Future architecture lanes reserved for AI analysis, stems, lineage, and generation workflows."
      />

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
          Future Expansion
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {futureLaneTitles.map((title) => (
            <div
              key={title}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70"
            >
              {title}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}