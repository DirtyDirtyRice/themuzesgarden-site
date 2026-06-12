"use client";

import {
  buildRiffGroupingEnginePlanningSentence,
  getMultiTrackRiffGroupingEngineWorkspace,
  getRiffGroupingEngineAverageConfidence,
  getRiffGroupingEngineAverageSurvivorPotential,
  getRiffGroupingEngineBooleanLabel,
  getRiffGroupingEngineFindingAction,
  getRiffGroupingEngineGroupSummary,
  getRiffGroupingEngineKeeperGroupCount,
  getRiffGroupingEngineReadinessLabel,
  getRiffGroupingEngineRiskCount,
  getRiffGroupingEngineRiskLabel,
  getRiffGroupingEngineScoreWidth,
  getRiffGroupingEngineSegmentTimeLabel,
  getRiffGroupingEngineSourceSummary,
  getRiffGroupingEngineStatusLabel,
  getRiffGroupingEngineStrengthLabel,
} from "./MultiTrackRiffGroupingEngineHelpers";

export default function MultiTrackRiffGroupingEngineWorkspacePanel() {
  const workspace = getMultiTrackRiffGroupingEngineWorkspace();

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
            {getRiffGroupingEngineReadinessLabel(workspace.readiness)}
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

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Keeper Groups
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getRiffGroupingEngineKeeperGroupCount(workspace.groups)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Avg Survivor
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getRiffGroupingEngineAverageSurvivorPotential(workspace.groups)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Avg Confidence
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getRiffGroupingEngineAverageConfidence(workspace.groups)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Risk Flags
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getRiffGroupingEngineRiskCount(workspace.groups)}
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
                  Grouping
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {getRiffGroupingEngineReadinessLabel(source.readiness)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Similarity
                </p>
                <p className="mt-1 font-black text-white">
                  {getRiffGroupingEngineBooleanLabel(source.similarityReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Transients
                </p>
                <p className="mt-1 font-black text-white">
                  {getRiffGroupingEngineBooleanLabel(source.transientReady)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Grouping
                </p>
                <p className="mt-1 font-black text-white">
                  {getRiffGroupingEngineBooleanLabel(source.groupingReady)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
              <h4 className="text-lg font-black text-white">Riff segments</h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                {getRiffGroupingEngineSourceSummary(source)}
              </p>

              <div className="mt-3 grid gap-2">
                {source.segments.map((segment) => (
                  <div
                    key={segment.segmentId}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-black text-white">{segment.title}</p>
                        <p className="mt-1 text-xs font-semibold text-white/60">
                          {getRiffGroupingEngineSegmentTimeLabel(segment)} / {segment.role}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black px-2 py-1 text-[11px] font-black text-white/70">
                        {getRiffGroupingEngineStatusLabel(segment.status)}
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
                            style={{ width: getRiffGroupingEngineScoreWidth(segment.energyScore) }}
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
                            style={{ width: getRiffGroupingEngineScoreWidth(segment.transientScore) }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                          Similarity
                        </p>
                        <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                          <div
                            className="h-full rounded-full bg-white/50"
                            style={{ width: getRiffGroupingEngineScoreWidth(segment.similarityScore) }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                          Confidence
                        </p>
                        <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-black">
                          <div
                            className="h-full rounded-full bg-white/50"
                            style={{ width: getRiffGroupingEngineScoreWidth(segment.confidence) }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                      Drift {segment.timingDriftMs}ms / Risk{" "}
                      {getRiffGroupingEngineRiskLabel(segment.risk)}
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
        <h3 className="text-lg font-black text-white">Riff families</h3>
        <div className="mt-3 grid gap-2">
          {workspace.groups.map((group) => (
            <div
              key={group.groupId}
              className="rounded-2xl border border-white/10 bg-black p-3"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black text-white">{group.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                    {group.detail}
                  </p>
                </div>
                <p className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/70">
                  {getRiffGroupingEngineStrengthLabel(group.groupStrength)}
                </p>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-white/50"
                  style={{ width: getRiffGroupingEngineScoreWidth(group.survivorPotential) }}
                />
              </div>

              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getRiffGroupingEngineGroupSummary(group)} / Risk{" "}
                {getRiffGroupingEngineRiskLabel(group.risk)}
              </p>

              <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                {group.recommendation}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-6 text-white/70">
          {buildRiffGroupingEnginePlanningSentence(workspace)}
        </p>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Findings</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
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
                {getRiffGroupingEngineFindingAction(finding)}
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