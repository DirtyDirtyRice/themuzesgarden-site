"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
};

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function MultiTrackInsightTimelinePanel({ engineState }: Props) {
  const { timeline } = engineState;

  return (
    <section className={cardClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
        Timeline Insight
      </p>

      <h4 className="mt-2 text-lg font-black text-white">
        {timeline.markers.length} marker(s), {timeline.cues.length} cue(s)
      </h4>

      <p className="mt-3 text-sm leading-6 text-white/70">
        Transport is {timeline.transportStatus}. Playhead is currently at{" "}
        {formatSeconds(timeline.playheadSeconds)}. Snap to markers is{" "}
        {timeline.snapToMarkers ? "enabled" : "disabled"}.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Loop
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {timeline.loopEnabled ? "Enabled" : "Disabled"}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {formatSeconds(timeline.loopStartSeconds)} →{" "}
            {formatSeconds(timeline.loopEndSeconds)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Zoom
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {timeline.zoomLevel}x
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Timeline status
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {timeline.status}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {timeline.markers.slice(0, 4).map((marker) => (
          <div
            key={marker.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <p className="text-sm font-black text-white">{marker.label}</p>
            <p className="mt-1 text-xs text-white/70">
              {marker.kind} · {marker.trackSlotId} ·{" "}
              {formatSeconds(marker.startSeconds)} to{" "}
              {formatSeconds(marker.endSeconds)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}