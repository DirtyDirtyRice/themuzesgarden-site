"use client";

import {
  buildTransientEnginePlanningSentence,
  getMultiTrackTransientEngineWorkspace,
  getTransientEngineBooleanLabel,
  getTransientEngineClusterTimeLabel,
  getTransientEngineClusterWidth,
  getTransientEngineComparisonSummary,
  getTransientEngineConfidenceWidth,
  getTransientEngineDurationLabel,
  getTransientEngineFindingAction,
  getTransientEngineReadinessLabel,
  getTransientEngineRiskLabel,
  getTransientEngineRmsJumpWidth,
  getTransientEngineSourceSummary,
  getTransientEngineStatusLabel,
  getTransientEngineStrengthLabel,
  getTransientEngineTimeLabel,
} from "./MultiTrackTransientEngineHelpers";

export default function MultiTrackTransientEngineWorkspacePanel() {
  const workspace = getMultiTrackTransientEngineWorkspace();

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
            {getTransientEngineReadinessLabel(workspace.readiness)}
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
                  Transient State
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {getTransientEngineReadinessLabel(source.readiness)}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/70">
                  {getTransientEngineDurationLabel(source.durationMs)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-5">
              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Waveform
                </p>
                <p className="mt-1 font-black text-white">
                  {getTransientEngineBooleanLabel(source.waveformReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Statistics
                </p>
                <p className="mt-1 font-black text-white">
                  {getTransientEngineBooleanLabel(source.statisticsReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Transients
                </p>
                <p className="mt-1 font-black text-white">
                  {getTransientEngineBooleanLabel(source.transientsReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Hits
                </p>
                <p className="mt-1 font-black text-white">{source.transientCount}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Anchors
                </p>
                <p className="mt-1 font-black text-white">{source.anchorCount}</p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
              <h4 className="text-lg font-black text-white">Transient hits</h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                {getTransientEngineSourceSummary(source)}
              </p>

              <div className="mt-3 grid gap-2">
                {source.hits.map((hit) => (
                  <div
                    key={hit.transientId}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-black text-white">{hit.label}</p>
                        <p className="mt-1 text-xs font-semibold text-white/60">
                          {getTransientEngineTimeLabel(hit.timeMs)} / {hit.role}
                        </p>
                      </div>

                      <span className="rounded-full border border-white/10 bg-black px-2 py-1 text-[11px] font-black text-white/70">
                        {getTransientEngineStrengthLabel(hit.strength)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                          Confidence
                        </p>
                        <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                          <div
                            className="h-full rounded-full bg-white/50"
                            style={{ width: getTransientEngineConfidenceWidth(hit) }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                          RMS Jump
                        </p>
                        <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                          <div
                            className="h-full rounded-full bg-white/50"
                            style={{ width: getTransientEngineRmsJumpWidth(hit) }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                      Peak {hit.peak} / {getTransientEngineStatusLabel(hit.status)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
              <h4 className="text-lg font-black text-white">Transient clusters</h4>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {source.clusters.map((cluster) => (
                  <div
                    key={cluster.clusterId}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{cluster.title}</p>
                        <p className="mt-1 text-xs font-semibold text-white/60">
                          {getTransientEngineClusterTimeLabel(cluster)}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black px-2 py-1 text-[11px] font-black text-white/70">
                        {getTransientEngineRiskLabel(cluster.risk)}
                      </span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                      <div
                        className="h-full rounded-full bg-white/50"
                        style={{ width: getTransientEngineClusterWidth(cluster) }}
                      />
                    </div>

                    <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                      {cluster.densityLabel}
                    </p>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                      {cluster.transientIds.length} hits / dominant {cluster.dominantRole}
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
                      {getTransientEngineFindingAction(finding)}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold leading-6 text-white/70">
                {buildTransientEnginePlanningSentence(source)}
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
        <h3 className="text-lg font-black text-white">Transient comparison</h3>
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
                  {getTransientEngineRiskLabel(comparison.risk)}
                </p>
              </div>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getTransientEngineComparisonSummary(comparison)}
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