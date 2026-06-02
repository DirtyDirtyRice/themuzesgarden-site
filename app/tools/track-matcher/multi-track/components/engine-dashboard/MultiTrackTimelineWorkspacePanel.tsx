"use client";

import type {
  MultiTrackEngineTimelineCue,
  MultiTrackEngineTimelineMarker,
  MultiTrackEngineState,
} from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
  markerCount: number;
  cueCount: number;
  visibleMarkers: MultiTrackEngineTimelineMarker[];
  visibleCues: MultiTrackEngineTimelineCue[];
  longestTrackDurationSeconds: number;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function MultiTrackTimelineWorkspacePanel({
  engineState,
  markerCount,
  cueCount,
  visibleMarkers,
  visibleCues,
  longestTrackDurationSeconds,
}: Props) {
  const { timeline } = engineState;

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Timeline Workspace
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Markers, cues, loop, and transport state
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          This panel reads the recovered timeline contract directly and gives future waveform,
          sync, marker, and cue systems a stable visible home.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Transport
          </p>
          <p className="mt-2 text-lg font-black text-white">
            {timeline.transportStatus}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Playhead
          </p>
          <p className="mt-2 text-lg font-black text-white">
            {formatSeconds(timeline.playheadSeconds)}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Markers
          </p>
          <p className="mt-2 text-lg font-black text-white">{markerCount}</p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Cues
          </p>
          <p className="mt-2 text-lg font-black text-white">{cueCount}</p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Duration
          </p>
          <p className="mt-2 text-lg font-black text-white">
            {formatSeconds(longestTrackDurationSeconds)}
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Timeline status
          </p>
          <p className="mt-2 text-sm font-black text-white">{timeline.status}</p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Zoom {timeline.zoomLevel}x · Snap {timeline.snapToMarkers ? "on" : "off"}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Loop
          </p>
          <p className="mt-2 text-sm font-black text-white">
            {timeline.loopEnabled ? "Enabled" : "Disabled"}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            {formatSeconds(timeline.loopStartSeconds)} →{" "}
            {formatSeconds(timeline.loopEndSeconds)}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Visible timeline items
          </p>
          <p className="mt-2 text-sm font-black text-white">
            {visibleMarkers.length} marker(s), {visibleCues.length} cue(s)
          </p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            These are hook-filtered visible items, not raw guesses.
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="grid gap-3">
          <h4 className="text-sm font-black uppercase tracking-[0.18em] text-white/70">
            Markers
          </h4>

          {visibleMarkers.map((marker) => (
            <article key={marker.id} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{marker.label}</p>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    {marker.kind} · {marker.trackSlotId} ·{" "}
                    {formatSeconds(marker.startSeconds)} to{" "}
                    {formatSeconds(marker.endSeconds)}
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
                  {Math.round(marker.confidence * 100)}%
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-3">
          <h4 className="text-sm font-black uppercase tracking-[0.18em] text-white/70">
            Cues
          </h4>

          {visibleCues.map((cue) => (
            <article key={cue.id} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{cue.label}</p>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    {cue.kind} · {cue.trackSlotId} · {formatSeconds(cue.seconds)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/70">{cue.note}</p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
                  {Math.round(cue.confidence * 100)}%
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}