"use client";

import type {
  MultiTrackEngineTrackSlotId,
  MultiTrackEngineTrackState,
} from "../../engine/multiTrackEngineTypes";

type Props = {
  trackPair: readonly [MultiTrackEngineTrackState, MultiTrackEngineTrackState];
  updateTrack: (
    trackSlotId: MultiTrackEngineTrackSlotId,
    patch: Partial<MultiTrackEngineTrackState>,
  ) => void;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

const buttonClass =
  "rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.1] active:scale-[0.98]";

const demoTrackA: Partial<MultiTrackEngineTrackState> = {
  sourceLabel: "Demo Library Source",
  sourceKind: "seed",
  sourceId: "demo-track-a",
  title: "Demo Track A",
  artist: "The Muzes Garden",
  album: "Engine Workstation Tests",
  durationSeconds: 184,
  bpm: 92,
  keyLabel: "C minor",
  sampleRate: 44100,
  channelCount: 2,
  loaded: true,
  waveformReady: true,
  analysisReady: true,
  syncReady: false,
  transientReady: true,
  metadataReady: true,
  readiness: "draft",
  notes: [
    "Demo Track A is a safe state-only loading test.",
    "This does not connect real audio playback yet.",
    "This prepares the dashboard for future Library/Finder/Upload adapters.",
  ],
};

const demoTrackB: Partial<MultiTrackEngineTrackState> = {
  sourceLabel: "Demo Finder Match",
  sourceKind: "finder",
  sourceId: "demo-track-b",
  title: "Demo Track B",
  artist: "The Muzes Garden",
  album: "Engine Workstation Tests",
  durationSeconds: 196,
  bpm: 94,
  keyLabel: "E-flat major",
  sampleRate: 44100,
  channelCount: 2,
  loaded: true,
  waveformReady: true,
  analysisReady: true,
  syncReady: false,
  transientReady: true,
  metadataReady: true,
  readiness: "draft",
  notes: [
    "Demo Track B is a safe comparison-lane loading test.",
    "This proves lane state updates without controller regrowth.",
    "Future adapters can replace this button with real source loading.",
  ],
};

function getResetPatch(track: MultiTrackEngineTrackState): Partial<MultiTrackEngineTrackState> {
  return {
    sourceLabel: `Waiting for ${track.label}`,
    sourceKind: "empty",
    sourceId: "",
    title: "No track loaded",
    artist: "Unknown artist",
    album: "Unknown album",
    durationSeconds: 0,
    bpm: null,
    keyLabel: "Unknown key",
    sampleRate: null,
    channelCount: null,
    loaded: false,
    waveformReady: false,
    analysisReady: false,
    syncReady: false,
    transientReady: false,
    metadataReady: false,
    readiness: "empty",
    muted: false,
    solo: false,
    locked: false,
  };
}

export function MultiTrackEngineLoadDemoPanel({ trackPair, updateTrack }: Props) {
  const [trackA, trackB] = trackPair;

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Demo Load Controls
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Safe track-state loading tests
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          These buttons call the real engine updateTrack action. They only update
          engine state, so they are safe placeholders before real Library, Finder,
          Upload, and Project adapters are connected.
        </p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Track A loader
          </p>
          <h4 className="mt-2 text-lg font-black text-white">{trackA.title}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Current source: {trackA.sourceLabel}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => updateTrack("track-a", demoTrackA)}
            >
              Load demo A
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={() => updateTrack("track-a", getResetPatch(trackA))}
            >
              Clear A
            </button>
          </div>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Track B loader
          </p>
          <h4 className="mt-2 text-lg font-black text-white">{trackB.title}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Current source: {trackB.sourceLabel}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => updateTrack("track-b", demoTrackB)}
            >
              Load demo B
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={() => updateTrack("track-b", getResetPatch(trackB))}
            >
              Clear B
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}