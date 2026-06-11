"use client";

import {
  buildWaveformEnginePlanningSentence,
  getMultiTrackWaveformEngineWorkspace,
  getWaveformEngineBooleanLabel,
  getWaveformEngineCheckpointStatusLabel,
  getWaveformEngineDecodeReadinessPercent,
  getWaveformEngineDurationLabel,
  getWaveformEngineFrameOpacity,
  getWaveformEngineFrameSummary,
  getWaveformEngineFrameWidth,
  getWaveformEngineMetricStatusLabel,
  getWaveformEngineReadinessLabel,
  getWaveformEngineSourceFormatLabel,
  getWaveformEngineSourceKindLabel,
  getWaveformEngineSourceReadinessDetail,
} from "./MultiTrackWaveformEngineHelpers";

export default function MultiTrackWaveformEngineWorkspacePanel() {
  const workspace = getMultiTrackWaveformEngineWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
            Real Engine Work
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">{workspace.title}</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-white/70">
            {workspace.summary}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 xl:text-right">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
            Readiness
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {getWaveformEngineReadinessLabel(workspace.readiness)}
          </p>
          <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-white/70">
            {workspace.readinessLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Engine goal</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
            {workspace.engineGoal}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Engine boundary</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
            {workspace.engineBoundary}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        {workspace.sources.map((source) => {
          const readinessPercent = getWaveformEngineDecodeReadinessPercent(source);

          return (
            <article
              key={source.sourceId}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">
                    {getWaveformEngineSourceKindLabel(source)}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">{source.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                    {source.fileLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black px-4 py-3 lg:text-right">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Decode Ready
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">{readinessPercent}%</p>
                  <p className="mt-1 text-xs font-semibold text-white/70">
                    {getWaveformEngineReadinessLabel(source.readiness)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Duration
                  </p>
                  <p className="mt-1 font-black text-white">
                    {getWaveformEngineDurationLabel(source.durationMs)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Format
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    {getWaveformEngineSourceFormatLabel(source)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Frames
                  </p>
                  <p className="mt-1 font-black text-white">{source.frames.length}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Frame Size
                  </p>
                  <p className="mt-1 font-black text-white">{source.frameSizeMs}ms</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Waveform
                  </p>
                  <p className="mt-1 font-black text-white">
                    {getWaveformEngineBooleanLabel(source.waveformReady)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Statistics
                  </p>
                  <p className="mt-1 font-black text-white">
                    {getWaveformEngineBooleanLabel(source.statisticsReady)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Transients
                  </p>
                  <p className="mt-1 font-black text-white">
                    {getWaveformEngineBooleanLabel(source.transientReady)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-black text-white">Seed waveform frames</h4>
                    <p className="mt-1 text-sm font-semibold text-white/70">
                      {getWaveformEngineFrameSummary(source)}
                    </p>
                  </div>
                  <p className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/70">
                    {source.frames.length} frames
                  </p>
                </div>

                <div className="mt-4 grid gap-2">
                  {source.frames.map((frame) => (
                    <div
                      key={frame.frameId}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-24 text-[11px] font-black text-white/60">
                          {frame.startMs}-{frame.endMs}
                        </div>
                        <div className="h-4 flex-1 overflow-hidden rounded-full border border-white/10 bg-black">
                          <div
                            className="h-full rounded-full bg-white"
                            style={{
                              width: getWaveformEngineFrameWidth(frame),
                              opacity: getWaveformEngineFrameOpacity(frame),
                            }}
                          />
                        </div>
                        <div className="w-28 text-right text-[11px] font-black text-white/70">
                          P {frame.peak} / R {frame.rms}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black p-4">
                  <h4 className="text-lg font-black text-white">Decode pipeline</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                    {getWaveformEngineSourceReadinessDetail(source)}
                  </p>

                  <div className="mt-3 grid gap-2">
                    {source.decodeSteps.map((step) => (
                      <div
                        key={step.stepId}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-white">{step.label}</p>
                            <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                              {step.detail}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-black px-2 py-1 text-[11px] font-black text-white/70">
                            {getWaveformEngineCheckpointStatusLabel(step.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
                          Owner: {step.owner}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black p-4">
                  <h4 className="text-lg font-black text-white">Engine metrics</h4>
                  <div className="mt-3 grid gap-2">
                    {source.metrics.map((metric) => (
                      <div
                        key={metric.metricId}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-white">{metric.label}</p>
                            <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                              {metric.detail}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-black px-2 py-1 text-[11px] font-black text-white/70">
                            {metric.valueLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
                          {getWaveformEngineMetricStatusLabel(metric)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
                <h4 className="text-lg font-black text-white">Engine planning note</h4>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                  {buildWaveformEnginePlanningSentence(source)}
                </p>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {source.notes.map((note) => (
                    <p
                      key={note}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold leading-5 text-white/70"
                    >
                      {note}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Engine rules</h3>
          <div className="mt-3 grid gap-2">
            {workspace.engineRules.map((rule) => (
              <p
                key={rule}
                className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-5 text-white/70"
              >
                {rule}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Next engine steps</h3>
          <div className="mt-3 grid gap-2">
            {workspace.nextEngineSteps.map((step) => (
              <p
                key={step}
                className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-5 text-white/70"
              >
                {step}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}