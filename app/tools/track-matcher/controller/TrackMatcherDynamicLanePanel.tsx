"use client";

import {
  createTrackMatcherDynamicLaneSummary,
  getTrackMatcherVisibleDynamicLanes,
} from "./trackMatcherDynamicLaneHelpers";
import {
  describeTrackMatcherDynamicLaneSystem,
  getTrackMatcherDynamicLaneNextFocus,
} from "./trackMatcherDynamicLaneNarratives";
import {
  getTrackMatcherDynamicLaneCategoryLabel,
  getTrackMatcherDynamicLaneHealthLabel,
  getTrackMatcherDynamicLaneRenderModeLabel,
} from "./trackMatcherDynamicLaneTypes";

function DynamicLaneCard({
  lane,
}: {
  lane: ReturnType<typeof getTrackMatcherVisibleDynamicLanes>[number];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            {getTrackMatcherDynamicLaneCategoryLabel(lane.category)}
          </p>

          <h3 className="mt-2 text-lg font-bold text-white">
            {lane.title}
          </h3>
        </div>

        <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100">
          {getTrackMatcherDynamicLaneHealthLabel(lane.health)}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/65">
        {lane.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
          {getTrackMatcherDynamicLaneRenderModeLabel(lane.renderMode)}
        </div>

        {lane.supportsPlayback && (
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
            Playback
          </div>
        )}

        {lane.supportsAnalysis && (
          <div className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-100">
            Analysis
          </div>
        )}

        {lane.supportsGeneration && (
          <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100">
            Generation
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
          Future Use
        </p>

        <p className="mt-2 text-sm leading-6 text-white/65">
          {lane.futureUse}
        </p>
      </div>
    </div>
  );
}

export default function TrackMatcherDynamicLanePanel() {
  const lanes = getTrackMatcherVisibleDynamicLanes();

  const summary = createTrackMatcherDynamicLaneSummary();

  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          Dynamic Lane Rendering
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Registry-Driven Lane System
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
          {describeTrackMatcherDynamicLaneSystem()}
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-100/75">
          {getTrackMatcherDynamicLaneNextFocus()}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Total Lanes
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {summary.total}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Visible
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {summary.visibleCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Generation Ready
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {summary.generationCount}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {lanes.map((lane) => (
          <DynamicLaneCard
            key={lane.id}
            lane={lane}
          />
        ))}
      </div>
    </section>
  );
}