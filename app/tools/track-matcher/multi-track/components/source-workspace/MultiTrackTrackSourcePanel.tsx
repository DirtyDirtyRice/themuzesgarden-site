"use client";

import type {
  MultiTrackEngineTrackSlotId,
  MultiTrackEngineTrackState,
} from "../../engine/multiTrackEngineTypes";
import {
  createMultiTrackSourceClearPatch,
  createMultiTrackSourcePatch,
  getMultiTrackSourceRecommendation,
  getMultiTrackSourceWorkspaceItems,
} from "./MultiTrackSourceHelpers";

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

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function SourceLaneCard({
  track,
  updateTrack,
}: {
  track: MultiTrackEngineTrackState;
  updateTrack: Props["updateTrack"];
}) {
  const sourceItems = getMultiTrackSourceWorkspaceItems();

  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            {track.label} source lane
          </p>
          <h4 className="mt-2 text-xl font-black text-white">{track.title}</h4>
          <p className="mt-1 text-sm font-bold text-white/70">
            {track.sourceLabel}
          </p>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          {track.sourceKind}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Loaded
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {track.loaded ? "Yes" : "No"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Duration
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {formatDuration(track.durationSeconds)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            BPM
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {track.bpm ?? "Pending"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Key
          </p>
          <p className="mt-1 text-sm font-black text-white">{track.keyLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {sourceItems.map((source) => (
          <div
            key={`${track.trackSlotId}-${source.id}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-white">{source.label}</p>

                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">
                    {source.status}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-white/70">
                  {source.description}
                </p>

                <p className="mt-2 text-xs leading-5 text-white/60">
                  {source.recommendedFor}
                </p>
              </div>

              <button
                type="button"
                className={buttonClass}
                onClick={() =>
                  updateTrack(
                    track.trackSlotId,
                    createMultiTrackSourcePatch(source, track.trackSlotId),
                  )
                }
              >
                Load {source.label}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${buttonClass} mt-4`}
        onClick={() => updateTrack(track.trackSlotId, createMultiTrackSourceClearPatch(track))}
      >
        Clear {track.shortLabel}
      </button>
    </article>
  );
}

export function MultiTrackTrackSourcePanel({ trackPair, updateTrack }: Props) {
  const [trackA, trackB] = trackPair;
  const recommendation = getMultiTrackSourceRecommendation(trackA, trackB);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Track Source Workspace
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            Library, Finder, Upload, Project, and Seed source lanes
          </h3>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          Source foundation
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-6 text-white/70">
        This workspace is the future loading hub for the Multi Track engine. It uses
        the real engine source kinds now, while staying state-only until Library,
        Finder, Upload, Project, and Supabase adapters are connected.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
          Source recommendation
        </p>
        <h4 className="mt-2 text-lg font-black text-white">{recommendation.title}</h4>
        <p className="mt-2 text-sm leading-6 text-white/70">
          {recommendation.detail}
        </p>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-white/70">
          {recommendation.actionLabel}
        </p>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <SourceLaneCard track={trackA} updateTrack={updateTrack} />
        <SourceLaneCard track={trackB} updateTrack={updateTrack} />
      </div>
    </section>
  );
}