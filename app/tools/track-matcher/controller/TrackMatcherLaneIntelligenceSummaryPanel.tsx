"use client";

import {
  createTrackMatcherLaneIntelligenceSummary,
  groupTrackMatcherLaneIntelligenceByReadiness,
} from "./trackMatcherLaneIntelligenceHelpers";
import {
  describeTrackMatcherLaneIntelligenceSummary,
  getTrackMatcherLaneIntelligenceNextFocus,
} from "./trackMatcherLaneIntelligenceNarratives";
import {
  getTrackMatcherLaneIntelligenceReadinessLabel,
  type TrackMatcherLaneIntelligenceReadiness,
} from "./trackMatcherLaneIntelligenceTypes";

function IntelligenceStatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
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

function IntelligenceReadinessColumn({
  readiness,
}: {
  readiness: TrackMatcherLaneIntelligenceReadiness;
}) {
  const grouped = groupTrackMatcherLaneIntelligenceByReadiness();
  const signals = grouped[readiness];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
        {getTrackMatcherLaneIntelligenceReadinessLabel(readiness)}
      </p>

      <div className="mt-4 space-y-3">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className="rounded-xl border border-white/10 bg-black/25 p-3"
          >
            <p className="text-sm font-bold text-white">
              {signal.title}
            </p>

            <p className="mt-2 text-xs leading-5 text-white/60">
              {signal.futureUse}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrackMatcherLaneIntelligenceSummaryPanel() {
  const summary = createTrackMatcherLaneIntelligenceSummary();

  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          Lane Intelligence
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Audio Intelligence Signal Map
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
          {describeTrackMatcherLaneIntelligenceSummary()}
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-100/75">
          {getTrackMatcherLaneIntelligenceNextFocus()}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <IntelligenceStatCard
          label="Total Signals"
          value={summary.totalSignals}
          description="All mapped intelligence signals across active and future lanes."
        />

        <IntelligenceStatCard
          label="Active Signals"
          value={summary.activeSignals}
          description="Signals safe to connect to today's Deck A and Deck B workflow."
        />

        <IntelligenceStatCard
          label="Planned Signals"
          value={summary.plannedSignals}
          description="Signals reserved for stems, references, generation, and lineage."
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <IntelligenceReadinessColumn readiness="active" />
        <IntelligenceReadinessColumn readiness="planned" />
        <IntelligenceReadinessColumn readiness="blocked" />
      </div>
    </section>
  );
}