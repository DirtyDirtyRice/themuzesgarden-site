"use client";

import {
  DEFAULT_TRACK_MATCHER_LANES,
  DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS,
} from "./trackMatcherControllerConstants";

export default function TrackMatcherLanePanelHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
          Lane Architecture
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Audio Intelligence Lanes
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
          Track Matcher is transitioning from a 2-deck comparison tool into a
          multi-lane audio intelligence system capable of Suno comparison,
          riff tracing, stem routing, and hybrid song construction.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
        {DEFAULT_TRACK_MATCHER_LANES.length} lanes ·{" "}
        {DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS.length} relationships
      </div>
    </div>
  );
}