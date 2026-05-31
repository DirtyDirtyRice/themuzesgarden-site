"use client";

import { MultiTrackControllerSummary } from "./MultiTrackControllerSummary";
import { useMultiTrackSession } from "./useMultiTrackSession";

export default function MultiTrackController() {
  const {
    activeTrackSlot,
    activeViewPanels,
    foundation,
    setActiveTrackSlot,
    setActiveView,
    snapshot,
  } = useMultiTrackSession();

  return (
    <section className="grid gap-5">
      <MultiTrackControllerSummary snapshot={snapshot} />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
              Multi-Track Controller Shell
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              {activeTrackSlot.label} / {snapshot.activeView}
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
              This shell proves the controller can own session state while the
              page stays thin. It still does not own playback, audio processing,
              or Track Matcher runtime behavior.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/65">
            {activeViewPanels.length} active panels
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/75"
            type="button"
            onClick={() => setActiveView("tracks")}
          >
            Show Tracks
          </button>
          <button
            className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/75"
            type="button"
            onClick={() => setActiveView("comparison")}
          >
            Show Comparison
          </button>
          <button
            className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/75"
            type="button"
            onClick={() => setActiveTrackSlot("track-b")}
          >
            Activate Track B
          </button>
        </div>

        <p className="mt-4 text-xs leading-5 text-white/55">
          Session foundation: {foundation.health.detail}
        </p>
      </section>
    </section>
  );
}