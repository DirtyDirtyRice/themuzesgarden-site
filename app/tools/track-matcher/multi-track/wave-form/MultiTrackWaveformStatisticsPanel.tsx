"use client";

import {
  getMultiTrackWaveformStatisticsWorkspace,
  getWaveformStatisticStatusLabel,
} from "./MultiTrackWaveformStatisticsHelpers";

export default function MultiTrackWaveformStatisticsPanel() {
  const workspace = getMultiTrackWaveformStatisticsWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
          Waveform Statistics
        </p>

        <h2 className="mt-2 text-2xl font-black">
          {workspace.title}
        </h2>

        <p className="mt-2 text-sm font-semibold text-white/70">
          {workspace.description}
        </p>

        <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-white/60">
          {workspace.readinessLabel}
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {workspace.lanes.map((lane) => (
          <article
            key={lane.laneId}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">
                {lane.title}
              </h3>

              <div className="rounded-full border border-white/10 px-3 py-1 text-xs font-black">
                {getWaveformStatisticStatusLabel(lane.status)}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">Peak</p>
                <p className="font-black">{lane.peakLevel}</p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">RMS</p>
                <p className="font-black">{lane.rmsLevel}</p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Dynamic Range
                </p>
                <p className="font-black">
                  {lane.dynamicRange}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">BPM</p>
                <p className="font-black">
                  {lane.estimatedBpm}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">Key</p>
                <p className="font-black">
                  {lane.estimatedKey}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Sample Rate
                </p>
                <p className="font-black">
                  {lane.sampleRate}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Bit Depth
                </p>
                <p className="font-black">
                  {lane.bitDepth}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Channel Mode
                </p>
                <p className="font-black">
                  {lane.channelMode}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 p-4">
        <h3 className="text-lg font-black">
          Future Capabilities
        </h3>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {workspace.futureCapabilities.map((capability) => (
            <div
              key={capability}
              className="rounded-xl border border-white/10 p-3 text-sm font-semibold text-white/70"
            >
              {capability}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}