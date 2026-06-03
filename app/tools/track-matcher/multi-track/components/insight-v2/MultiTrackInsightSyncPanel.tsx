"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

function getTempoDifference(engineState: MultiTrackEngineState): string {
  const bpmA = engineState.trackA.bpm;
  const bpmB = engineState.trackB.bpm;

  if (typeof bpmA !== "number" || typeof bpmB !== "number") {
    return "Tempo data pending";
  }

  return `${Math.abs(bpmA - bpmB)} BPM difference`;
}

function getSyncRecommendation(engineState: MultiTrackEngineState): string {
  if (!engineState.trackA.loaded || !engineState.trackB.loaded) {
    return "Load both tracks before sync recommendations matter.";
  }

  if (engineState.timeline.markers.length === 0) {
    return "Add markers before attempting sync alignment.";
  }

  if (engineState.timeline.cues.length === 0) {
    return "Add cues for downbeats, transitions, impacts, or vocals.";
  }

  if (!engineState.trackA.syncReady || !engineState.trackB.syncReady) {
    return "Sync readiness is still pending on one or both lanes.";
  }

  return "Both lanes are sync-ready for deeper alignment work.";
}

export function MultiTrackInsightSyncPanel({ engineState }: Props) {
  const { trackA, trackB, timeline } = engineState;

  return (
    <section className={cardClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
        Sync Insight
      </p>

      <h4 className="mt-2 text-lg font-black text-white">
        {getTempoDifference(engineState)}
      </h4>

      <p className="mt-3 text-sm leading-6 text-white/70">
        {getSyncRecommendation(engineState)}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Track A sync
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {trackA.syncReady ? "Ready" : "Pending"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Track B sync
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {trackB.syncReady ? "Ready" : "Pending"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Markers
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {timeline.markers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Cues
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {timeline.cues.length}
          </p>
        </div>
      </div>
    </section>
  );
}