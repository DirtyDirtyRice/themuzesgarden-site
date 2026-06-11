"use client";

import {
  buildWaveformStatisticsEnginePlanningSentence,
  getMultiTrackWaveformStatisticsEngineWorkspace,
  getWaveformStatisticsEngineBooleanLabel,
  getWaveformStatisticsEngineComparisonSummary,
  getWaveformStatisticsEngineDurationLabel,
  getWaveformStatisticsEngineEnergyWidth,
  getWaveformStatisticsEngineFindingAction,
  getWaveformStatisticsEngineReadinessLabel,
  getWaveformStatisticsEngineRiskLabel,
  getWaveformStatisticsEngineRmsWidth,
  getWaveformStatisticsEngineSourceSummary,
  getWaveformStatisticsEngineStatusLabel,
  getWaveformStatisticsEngineWindowLabel,
} from "./MultiTrackWaveformStatisticsEngineHelpers";

export default function MultiTrackWaveformStatisticsEngineWorkspacePanel() {
  const workspace = getMultiTrackWaveformStatisticsEngineWorkspace();

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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Readiness
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {getWaveformStatisticsEngineReadinessLabel(workspace.readiness)}
          </p>
          <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-white/70">
            {workspace.readinessLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Engine goal</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
          {workspace.engineGoal}
        </p>
      </div>

      <div className="mt-5 grid gap-5">
        {workspace.sources.map((source) => (
          <article
            key={source.sourceId}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">
                  {source.sourceKind}
                </p>
                <h3 className="mt-2 text-xl font-black text-white">{source.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                  {source.fileLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-3 lg:text-right">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Engine State
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {getWaveformStatisticsEngineReadinessLabel(source.readiness)}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/70">
                  {getWaveformStatisticsEngineDurationLabel(source.durationMs)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Waveform
                </p>
                <p className="mt-1 font-black text-white">
                  {getWaveformStatisticsEngineBooleanLabel(source.waveformReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Statistics
                </p>
                <p className="mt-1 font-black text-white">
                  {getWaveformStatisticsEngineBooleanLabel(source.statisticsReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Transients
                </p>
                <p className="mt-1 font-black text-white">
                  {getWaveformStatisticsEngineBooleanLabel(source.transientReady)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
              <h4 className="text-lg font-black text-white">Measurements</h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                {getWaveformStatisticsEngineSourceSummary(source)}
              </p>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {source.measurements.map((measurement) => (
                  <div
                    key={measurement.measurementId}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{measurement.label}</p>
                        <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                          {measurement.detail}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black px-2 py-1 text-[11px] font-black text-white/70">
                        {measurement.valueLabel}
                      </span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                      <div
                        className="h-full rounded-full bg-white/50"
                        style={{ width: getWaveformStatisticsEngineRmsWidth(measurement) }}
                      />
                    </div>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                      {getWaveformStatisticsEngineStatusLabel(measurement.status)} /{" "}
                      {getWaveformStatisticsEngineRiskLabel(measurement.risk)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
              <h4 className="text-lg font-black text-white">Energy windows</h4>
              <div className="mt-3 grid gap-2">
                {source.windows.map((window) => (
                  <div
                    key={window.windowId}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-black text-white">{window.label}</p>
                        <p className="mt-1 text-xs font-semibold text-white/60">
                          {getWaveformStatisticsEngineWindowLabel(window)}
                        </p>
                      </div>
                      <p className="rounded-full border border-white/10 bg-black px-3 py-1 text-xs font-black text-white/70">
                        Risk {getWaveformStatisticsEngineRiskLabel(window.clipRisk)}
                      </p>
                    </div>

                    <div className="mt-3 h-4 overflow-hidden rounded-full border border-white/10 bg-black">
                      <div
                        className="h-full rounded-full bg-white/50"
                        style={{ width: getWaveformStatisticsEngineEnergyWidth(window) }}
                      />
                    </div>

                    <p className="mt-2 text-xs font-semibold text-white/70">
                      Peak {window.peak} / RMS {window.rms} / Energy {window.energy} /
                      Silence {Math.round(window.silencePercent * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
              <h4 className="text-lg font-black text-white">Findings</h4>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {source.findings.map((finding) => (
                  <div
                    key={finding.findingId}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <p className="font-black text-white">{finding.title}</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                      {finding.detail}
                    </p>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                      {getWaveformStatisticsEngineFindingAction(finding)}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold leading-6 text-white/70">
                {buildWaveformStatisticsEnginePlanningSentence(source)}
              </p>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {source.notes.map((note) => (
                <p
                  key={note}
                  className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-5 text-white/70"
                >
                  {note}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Version comparison</h3>
        <div className="mt-3 grid gap-2">
          {workspace.comparisons.map((comparison) => (
            <div
              key={comparison.comparisonId}
              className="rounded-2xl border border-white/10 bg-black p-3"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black text-white">{comparison.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                    {comparison.detail}
                  </p>
                </div>
                <p className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/70">
                  {getWaveformStatisticsEngineRiskLabel(comparison.risk)}
                </p>
              </div>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getWaveformStatisticsEngineComparisonSummary(comparison)}
              </p>
            </div>
          ))}
        </div>
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
          <h3 className="text-lg font-black text-white">Next steps</h3>
          <div className="mt-3 grid gap-2">
            {workspace.nextSteps.map((step) => (
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