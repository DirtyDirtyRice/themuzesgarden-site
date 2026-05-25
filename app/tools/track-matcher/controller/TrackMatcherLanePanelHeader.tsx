"use client";

import TrackMatcherDetailsLink from "../TrackMatcherDetailsLink";
import {
  DEFAULT_TRACK_MATCHER_LANES,
  DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS,
} from "./trackMatcherControllerConstants";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm font-black text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

export default function TrackMatcherLanePanelHeader() {
  return (
    <section className="grid gap-6 border-b border-white/10 pb-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
          Track Matcher
        </p>

        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
          Compare tracks. Match the music.
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-7 text-white/70">
          Load Track A and Track B, compare timing, BPM, key, lanes, and future
          intelligence without turning the page into a giant technical wall.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a href="#track-matcher-decks" className={buttonClass}>
            Start Comparing
          </a>

          <a href="#track-matcher-library" className={buttonClass}>
            Open Lane Library
          </a>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/15 bg-black p-6 shadow-2xl shadow-black/25 lg:mx-auto lg:w-full lg:max-w-[520px]">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
          How to use this page
        </p>

        <h2 className="mt-3 text-2xl font-black leading-tight text-white">
          Use the decks first. Open deeper lanes only when needed.
        </h2>

        <p className="mt-4 text-base leading-7 text-white/70">
          The top of Track Matcher stays simple. The architecture, registry,
          route maps, and future panels live inside the Lane Library below.
        </p>

        <div className="mt-5">
          <TrackMatcherDetailsLink />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-100">
            {DEFAULT_TRACK_MATCHER_LANES.length} Lanes
          </span>

          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
            {DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS.length} Relationships
          </span>
        </div>
      </div>
    </section>
  );
}
