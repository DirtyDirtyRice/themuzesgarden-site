"use client";

import type {
  MultiTrackEngineTrackSlotId,
  MultiTrackEngineTrackState,
} from "../../engine/multiTrackEngineTypes";

type Props = {
  trackA: MultiTrackEngineTrackState;
  trackB: MultiTrackEngineTrackState;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function formatNullableNumber(value: number | null, suffix: string): string {
  if (value === null) return "Unknown";
  return `${value}${suffix}`;
}

function getLoadedLabel(track: MultiTrackEngineTrackState): string {
  if (!track.loaded) return "Waiting";
  return "Loaded";
}

function getTrackDeckAccent(trackSlotId: MultiTrackEngineTrackSlotId): string {
  return trackSlotId === "track-a" ? "Track A Deck" : "Track B Deck";
}

function TrackReadinessRows({ track }: { track: MultiTrackEngineTrackState }) {
  const rows = [
    ["Waveform", track.waveformReady],
    ["Metadata", track.metadataReady],
    ["Analysis", track.analysisReady],
    ["Transient", track.transientReady],
    ["Sync", track.syncReady],
  ];

  return (
    <div className="mt-4 grid gap-2">
      {rows.map(([label, ready]) => (
        <div
          key={String(label)}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
        >
          <span className="text-sm font-black text-white">{label}</span>
          <span className={pillClass}>{ready ? "Ready" : "Waiting"}</span>
        </div>
      ))}
    </div>
  );
}

function TrackCard({ track }: { track: MultiTrackEngineTrackState }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            {getTrackDeckAccent(track.trackSlotId)}
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">{track.label}</h3>

          <p className="mt-2 text-sm leading-6 text-white/70">{track.sourceLabel}</p>
        </div>

        <span className={pillClass}>{getLoadedLabel(track)}</span>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Current Source
        </p>

        <h4 className="mt-2 text-xl font-black text-white">{track.title}</h4>

        <p className="mt-2 text-sm text-white/70">{track.artist}</p>
        <p className="mt-1 text-sm text-white/50">{track.album}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">BPM</p>
          <p className="mt-2 text-lg font-black text-white">
            {formatNullableNumber(track.bpm, "")}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">Key</p>
          <p className="mt-2 text-lg font-black text-white">{track.keyLabel}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">
            Duration
          </p>
          <p className="mt-2 text-lg font-black text-white">
            {formatDuration(track.durationSeconds)}
          </p>
        </div>
      </div>

      <TrackReadinessRows track={track} />

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={pillClass}>Readiness: {track.readiness}</span>
        <span className={pillClass}>Gain: {track.gainDb} dB</span>
        <span className={pillClass}>Pan: {track.pan}</span>
        <span className={pillClass}>{track.muted ? "Muted" : "Unmuted"}</span>
        <span className={pillClass}>{track.solo ? "Solo" : "No Solo"}</span>
        <span className={pillClass}>{track.locked ? "Locked" : "Unlocked"}</span>
      </div>
    </article>
  );
}

export function MultiTrackTrackDeckPanel({ trackA, trackB }: Props) {
  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Track Decks
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Deck A / Deck B Status</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
            This panel shows the practical working status of both multi-track decks: source,
            duration, musical identity, readiness flags, gain, pan, mute, solo, and lock state.
          </p>
        </div>

        <span className={pillClass}>2 Decks</span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <TrackCard track={trackA} />
        <TrackCard track={trackB} />
      </div>
    </section>
  );
}