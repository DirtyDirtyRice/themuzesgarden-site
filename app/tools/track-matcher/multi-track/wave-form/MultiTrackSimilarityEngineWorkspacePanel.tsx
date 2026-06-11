
"use client";

import {
  buildSimilarityEnginePlanningSentence,
  getMultiTrackSimilarityEngineWorkspace,
  getSimilarityEngineAverageMatchScore,
  getSimilarityEngineBooleanLabel,
  getSimilarityEngineFindingAction,
  getSimilarityEngineMatchSummary,
  getSimilarityEngineReadinessLabel,
  getSimilarityEngineRegionTimeLabel,
  getSimilarityEngineRiskCount,
  getSimilarityEngineRiskLabel,
  getSimilarityEngineScoreWidth,
  getSimilarityEngineSourceSummary,
  getSimilarityEngineStatusLabel,
  getSimilarityEngineStrengthLabel,
  getSimilarityEngineStrongMatchCount,
} from "./MultiTrackSimilarityEngineHelpers";

export default function MultiTrackSimilarityEngineWorkspacePanel() {
  const workspace = getMultiTrackSimilarityEngineWorkspace();

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
            {getSimilarityEngineReadinessLabel(workspace.readiness)}
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

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Strong Matches
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getSimilarityEngineStrongMatchCount(workspace.matches)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Average Score
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getSimilarityEngineAverageMatchScore(workspace.matches)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Risk Flags
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getSimilarityEngineRiskCount(workspace.matches)}
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
                  Similarity
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {getSimilarityEngineReadinessLabel(source.readiness)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Waveform
                </p>
                <p className="mt-1 font-black text-white">
                  {getSimilarityEngineBooleanLabel(source.waveformReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Statistics
                </p>
                <p className="mt-1 font-black text-white">
                  {getSimilarityEngineBooleanLabel(source.statisticsReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Transients
                </p>
                <p className="mt-1 font-black text-white">
                  {getSimilarityEngineBooleanLabel(source.transientsReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Similarity
                </p>
                <p className="mt-1 font-black text-white">
                  {getSimilarityEngineBooleanLabel(source.similarityReady)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
              <h4 className="text-lg font-black text-white">Regions</h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                {getSimilarityEngineSourceSummary(source)}
              </p>

              <div className="mt-3 grid gap-2">
                {source.regions.map((region) => (
                  <div
                    key={region.regionId}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-black text-white">{region.title}</p>
                        <p className="mt-1 text-xs font-semibold text-white/60">
                          {getSimilarityEngineRegionTimeLabel(region)}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black px-2 py-1 text-[11px] font-black text-white/70">
                        {getSimilarityEngineStatusLabel(region.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                          Energy
                        </p>
                        <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                          <div
                            className="h-full rounded-full bg-white/50"
                            style={{ width: getSimilarityEngineScoreWidth(region.energyScore) }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                          Transient
                        </p>
                        <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                          <div
                            className="h-full rounded-full bg-white/50"
                            style={{ width: getSimilarityEngineScoreWidth(region.transientScore) }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                          Timing
                        </p>
                        <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                          <div
                            className="h-full rounded-full bg-white/50"
                            style={{ width: getSimilarityEngineScoreWidth(region.timingScore) }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                          Structure
                        </p>
                        <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                          <div
                            className="h-full rounded-full bg-white/50"
                            style={{ width: getSimilarityEngineScoreWidth(region.structureScore) }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
              <h4 className="text-lg font-black text-white">Features</h4>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {source.features.map((feature) => (
                  <div
                    key={feature.featureId}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <p className="font-black text-white">{feature.label}</p>
                    <p className="mt-1 text-xs font-semibold text-white/60">
                      {feature.kind} / {feature.sourceLabel}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                      {feature.detail}
                    </p>

                    <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                      <div
                        className="h-full rounded-full bg-white/50"
                        style={{ width: getSimilarityEngineScoreWidth(feature.score) }}
                      />
                    </div>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                      {getSimilarityEngineStatusLabel(feature.status)} /{" "}
                      {getSimilarityEngineRiskLabel(feature.risk)}
                    </p>
                  </div>
                ))}
              </div>
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
        <h3 className="text-lg font-black text-white">Similarity matches</h3>
        <div className="mt-3 grid gap-2">
          {workspace.matches.map((match) => (
            <div
              key={match.matchId}
              className="rounded-2xl border border-white/10 bg-black p-3"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black text-white">{match.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                    {match.detail}
                  </p>
                </div>
                <p className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/70">
                  {getSimilarityEngineStrengthLabel(match.matchStrength)}
                </p>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-white/50"
                  style={{ width: getSimilarityEngineScoreWidth(match.overallScore) }}
                />
              </div>

              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getSimilarityEngineMatchSummary(match)} / Risk{" "}
                {getSimilarityEngineRiskLabel(match.risk)}
              </p>
              <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                {match.recommendation}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-6 text-white/70">
          {buildSimilarityEnginePlanningSentence(workspace)}
        </p>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Findings</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {workspace.findings.map((finding) => (
            <div
              key={finding.findingId}
              className="rounded-2xl border border-white/10 bg-black p-3"
            >
              <p className="font-black text-white">{finding.title}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                {finding.detail}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getSimilarityEngineFindingAction(finding)}
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