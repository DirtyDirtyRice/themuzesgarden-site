"use client";

import {
  getTrackMatcherLaneCapabilityLabel,
  getTrackMatcherLaneRegistry,
  getTrackMatcherLaneStatusLabel,
} from "./trackMatcherLaneRegistry";

function CapabilityChip({
  label,
}: {
  label: string;
}) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
      {label}
    </div>
  );
}

function LaneStatusBadge({
  label,
}: {
  label: string;
}) {
  return (
    <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
      {label}
    </div>
  );
}

function LaneRegistryCard({
  lane,
}: {
  lane: ReturnType<typeof getTrackMatcherLaneRegistry>[number];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
            {lane.eyebrow}
          </p>

          <h3 className="mt-2 text-lg font-bold text-white">
            {lane.title}
          </h3>
        </div>

        <LaneStatusBadge
          label={getTrackMatcherLaneStatusLabel(lane.status)}
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-white/70">
        {lane.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {lane.capabilities.map((capability) => (
          <CapabilityChip
            key={capability}
            label={getTrackMatcherLaneCapabilityLabel(capability)}
          />
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
          Future Use
        </p>

        <p className="mt-2 text-sm leading-6 text-white/65">
          {lane.futureUse}
        </p>
      </div>
    </div>
  );
}

export default function TrackMatcherLaneRegistryPanel() {
  const lanes = getTrackMatcherLaneRegistry();

  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
            Lane Architecture
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Multi-Lane Intelligence Registry
          </h2>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Dynamic lane foundation
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
        Track Matcher is transitioning from a two-deck comparison system into a
        scalable lane-based audio intelligence architecture supporting
        multi-song analysis, stem routing, melody lineage tracking, hybrid song
        construction, and future AI-assisted music systems.
      </p>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {lanes.map((lane) => (
          <LaneRegistryCard
            key={lane.id}
            lane={lane}
          />
        ))}
      </div>
    </section>
  );
}