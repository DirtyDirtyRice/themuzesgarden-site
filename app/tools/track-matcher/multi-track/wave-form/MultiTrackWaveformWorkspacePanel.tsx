"use client";

import {
  getMultiTrackWaveformWorkspace,
  getWaveformBooleanLabel,
  getWaveformDurationWidth,
  getWaveformLaneReadyCount,
  getWaveformLaneReadinessPercent,
  getWaveformLaneTotalCount,
  getWaveformReadinessLabel,
  getWaveformStatusLabel,
} from "./MultiTrackWaveformHelpers";

export default function MultiTrackWaveformWorkspacePanel() {
  const workspace = getMultiTrackWaveformWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
            Multi Track Workstation
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">{workspace.title}</h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-white/70">
            {workspace.summary}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left lg:text-right">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
            Readiness
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {getWaveformReadinessLabel(workspace.readiness)}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/70">
            {workspace.readinessLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {workspace.lanes.map((lane) => {
          const readyCount = getWaveformLaneReadyCount(lane);
          const totalCount = getWaveformLaneTotalCount(lane);
          const readinessPercent = getWaveformLaneReadinessPercent(lane);

          return (
            <article
              key={lane.laneId}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">{lane.title}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                    {lane.sourceLabel}
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-black px-3 py-1 text-xs font-black text-white">
                  {readinessPercent}%
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black p-3">
                <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  <span>Duration</span>
                  <span>{lane.durationLabel}</span>
                </div>

                <div className="mt-3 h-4 overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-white/40"
                    style={{ width: getWaveformDurationWidth(lane) }}
                  />
                </div>

                <p className="mt-2 text-xs font-semibold text-white/60">
                  Placeholder duration bar is ready. Real width will attach after loaded audio
                  duration exists.
                </p>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Waveform
                  </p>
                  <p className="mt-1 font-black text-white">
                    {getWaveformBooleanLabel(lane.waveformReady)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Transients
                  </p>
                  <p className="mt-1 font-black text-white">
                    {getWaveformBooleanLabel(lane.transientReady)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Analysis
                  </p>
                  <p className="mt-1 font-black text-white">
                    {getWaveformBooleanLabel(lane.analysisReady)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
                  Checkpoints
                </p>

                <div className="mt-3 space-y-2">
                  {lane.checkpoints.map((checkpoint) => (
                    <div
                      key={`${lane.laneId}-${checkpoint.label}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-white">{checkpoint.label}</p>
                        <span className="rounded-full border border-white/10 bg-black px-2 py-1 text-[11px] font-black text-white/70">
                          {getWaveformStatusLabel(checkpoint.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                        {checkpoint.detail}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  {readyCount} of {totalCount} checkpoints ready
                </p>
              </div>

              <div className="mt-4 grid gap-2">
                <p className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold text-white/70">
                  <span className="font-black text-white">DSP owner:</span> {lane.dspOwner}
                </p>
                <p className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold text-white/70">
                  <span className="font-black text-white">Waveform owner:</span>{" "}
                  {lane.waveformOwner}
                </p>
                <p className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold text-white/70">
                  <span className="font-black text-white">Stem owner:</span> {lane.stemOwner}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Future ownership rules</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {workspace.futureOwnershipNotes.map((note) => (
            <p
              key={note}
              className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-5 text-white/70"
            >
              {note}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}