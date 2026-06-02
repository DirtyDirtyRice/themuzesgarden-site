"use client";

import type {
  MultiTrackEngineState,
  MultiTrackEngineTransportStatus,
} from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
  setTransportStatus: (transportStatus: MultiTrackEngineTransportStatus) => void;
  setPlayhead: (playheadSeconds: number) => void;
  setLoop: (loopStartSeconds: number, loopEndSeconds: number) => void;
  toggleSnapToMarkers: () => void;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

const buttonClass =
  "rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.1] active:scale-[0.98]";

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function MultiTrackTransportControlPanel({
  engineState,
  setTransportStatus,
  setPlayhead,
  setLoop,
  toggleSnapToMarkers,
}: Props) {
  const { timeline } = engineState;

  const transportButtons: MultiTrackEngineTransportStatus[] = [
    "stopped",
    "playing",
    "paused",
    "scrubbing",
    "looping",
  ];

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Transport Controls
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Timeline control surface
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          These buttons call the recovered engine timeline actions. They control engine
          state only, not real audio playback yet.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
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
            Loop
          </p>
          <p className="mt-2 text-lg font-black text-white">
            {timeline.loopEnabled ? "On" : "Off"}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Snap
          </p>
          <p className="mt-2 text-lg font-black text-white">
            {timeline.snapToMarkers ? "On" : "Off"}
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-3">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Set transport status
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {transportButtons.map((status) => (
              <button
                key={status}
                type="button"
                className={buttonClass}
                onClick={() => setTransportStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Playhead jump
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => setPlayhead(0)}>
              Start
            </button>

            <button type="button" className={buttonClass} onClick={() => setPlayhead(8)}>
              0:08
            </button>

            <button type="button" className={buttonClass} onClick={() => setPlayhead(16)}>
              0:16
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={() => setPlayhead(timeline.loopStartSeconds)}
            >
              Loop start
            </button>
          </div>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Loop and snap controls
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => setLoop(0, 8)}>
              Loop 0:00–0:08
            </button>

            <button type="button" className={buttonClass} onClick={() => setLoop(8, 16)}>
              Loop 0:08–0:16
            </button>

            <button type="button" className={buttonClass} onClick={toggleSnapToMarkers}>
              Toggle snap
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}