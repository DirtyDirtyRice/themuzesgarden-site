"use client";

import type {
  MultiTrackEngineTimelineCue,
  MultiTrackEngineTimelineMarker,
} from "../../engine/multiTrackEngineTypes";

type Props = {
  visibleMarkers: MultiTrackEngineTimelineMarker[];
  visibleCues: MultiTrackEngineTimelineCue[];
  addMarker: (marker: MultiTrackEngineTimelineMarker) => void;
  removeMarker: (markerId: string) => void;
  addCue: (cue: MultiTrackEngineTimelineCue) => void;
  removeCue: (cueId: string) => void;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

const buttonClass =
  "rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.1] active:scale-[0.98]";

function createMarker(index: number): MultiTrackEngineTimelineMarker {
  const startSeconds = 16 + index * 8;

  return {
    id: `manual-marker-${Date.now()}`,
    trackSlotId: "both",
    kind: "custom",
    label: `Manual marker ${index + 1}`,
    startSeconds,
    endSeconds: startSeconds + 8,
    confidence: 0.5,
    locked: false,
  };
}

function createCue(index: number): MultiTrackEngineTimelineCue {
  return {
    id: `manual-cue-${Date.now()}`,
    trackSlotId: "both",
    kind: "custom",
    label: `Manual cue ${index + 1}`,
    seconds: 4 + index * 8,
    confidence: 0.5,
    note: "Manual cue added from the workstation control surface.",
  };
}

export function MultiTrackMarkerCueControlPanel({
  visibleMarkers,
  visibleCues,
  addMarker,
  removeMarker,
  addCue,
  removeCue,
}: Props) {
  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Marker / Cue Controls
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Timeline item management
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          These controls call the recovered marker and cue helpers through the engine hook.
          They are state-only controls for the workstation timeline layer.
        </p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <article className={cardClass}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                Markers
              </p>
              <h4 className="mt-2 text-lg font-black text-white">
                {visibleMarkers.length} visible marker(s)
              </h4>
            </div>

            <button
              type="button"
              className={buttonClass}
              onClick={() => addMarker(createMarker(visibleMarkers.length))}
            >
              Add marker
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {visibleMarkers.map((marker) => (
              <div
                key={marker.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-black text-white">{marker.label}</p>
                  <p className="mt-1 text-xs text-white/70">
                    {marker.kind} · {marker.trackSlotId}
                  </p>
                </div>

                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => removeMarker(marker.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className={cardClass}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                Cues
              </p>
              <h4 className="mt-2 text-lg font-black text-white">
                {visibleCues.length} visible cue(s)
              </h4>
            </div>

            <button
              type="button"
              className={buttonClass}
              onClick={() => addCue(createCue(visibleCues.length))}
            >
              Add cue
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {visibleCues.map((cue) => (
              <div
                key={cue.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-black text-white">{cue.label}</p>
                  <p className="mt-1 text-xs text-white/70">
                    {cue.kind} · {cue.trackSlotId}
                  </p>
                </div>

                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => removeCue(cue.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}