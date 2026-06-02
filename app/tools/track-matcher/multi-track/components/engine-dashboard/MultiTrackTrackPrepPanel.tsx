"use client";

import type {
  MultiTrackEngineTrackSlotId,
  MultiTrackEngineTrackState,
} from "../../engine/multiTrackEngineTypes";

type Props = {
  trackPair: readonly [MultiTrackEngineTrackState, MultiTrackEngineTrackState];
  muteTrack: (trackSlotId: MultiTrackEngineTrackSlotId) => void;
  soloTrack: (trackSlotId: MultiTrackEngineTrackSlotId) => void;
  lockTrack: (trackSlotId: MultiTrackEngineTrackSlotId) => void;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

const buttonClass =
  "rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.1] active:scale-[0.98]";

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatNullableNumber(value: number | null, suffix: string): string {
  return typeof value === "number" ? `${value}${suffix}` : "Pending";
}

export function MultiTrackTrackPrepPanel({
  trackPair,
  muteTrack,
  soloTrack,
  lockTrack,
}: Props) {
  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Track Prep
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Lane controls and source readiness
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          These controls use the recovered engine hook actions. They are safe UI-level
          state controls for muting, soloing, and locking each lane.
        </p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {trackPair.map((track) => (
          <article key={track.trackSlotId} className={cardClass}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  {track.label}
                </p>
                <h4 className="mt-2 text-xl font-black text-white">{track.title}</h4>
                <p className="mt-1 text-sm font-bold text-white/70">
                  {track.artist} · {track.album}
                </p>
              </div>

              <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
                {track.readiness}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Source
                </p>
                <p className="mt-1 text-sm font-bold text-white">{track.sourceLabel}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Tempo
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {formatNullableNumber(track.bpm, " BPM")}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Key
                </p>
                <p className="mt-1 text-sm font-bold text-white">{track.keyLabel}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Duration
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {formatDuration(track.durationSeconds)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Gain
                </p>
                <p className="mt-1 text-sm font-bold text-white">{track.gainDb} dB</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Pan
                </p>
                <p className="mt-1 text-sm font-bold text-white">{track.pan}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Loaded
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {track.loaded ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonClass}
                onClick={() => muteTrack(track.trackSlotId)}
              >
                {track.muted ? "Unmute" : "Mute"}
              </button>

              <button
                type="button"
                className={buttonClass}
                onClick={() => soloTrack(track.trackSlotId)}
              >
                {track.solo ? "Unsolo" : "Solo"}
              </button>

              <button
                type="button"
                className={buttonClass}
                onClick={() => lockTrack(track.trackSlotId)}
              >
                {track.locked ? "Unlock" : "Lock"}
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {track.notes.map((note) => (
                <p
                  key={note}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-white/70"
                >
                  {note}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}