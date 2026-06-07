"use client";

import {
  getMultiTrackTrainingIntelligenceWorkspace,
  getTrainingBooleanLabel,
  getTrainingCategoryLabel,
  getTrainingFuturePercent,
  getTrainingLaneSummary,
  getTrainingOwnerLabel,
  getTrainingReadinessPercent,
  getTrainingStatusLabel,
} from "./MultiTrackTrainingIntelligenceHelpers";

export default function MultiTrackTrainingIntelligenceWorkspacePanel() {
  const workspace = getMultiTrackTrainingIntelligenceWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
            Training Intelligence Workspace
          </p>

          <h2 className="mt-2 text-2xl font-black">{workspace.title}</h2>

          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-white/70">
            {workspace.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Readiness
          </p>

          <p className="mt-1 text-sm font-black text-white">
            {workspace.readinessLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {workspace.lanes.map((lane) => (
          <article
            key={lane.laneId}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black">{lane.title}</h3>

                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                  {lane.sourceLabel}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-white/10 bg-black px-3 py-1 text-xs font-black text-white">
                  {getTrainingReadinessPercent(lane)}% ready
                </div>

                <div className="rounded-full border border-white/10 bg-black px-3 py-1 text-xs font-black text-white/70">
                  {getTrainingFuturePercent(lane)}% future
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Pattern
                </p>
                <p className="mt-1 font-black text-white">
                  {getTrainingBooleanLabel(lane.patternTrainingReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Phrase
                </p>
                <p className="mt-1 font-black text-white">
                  {getTrainingBooleanLabel(lane.phraseTrainingReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Hook
                </p>
                <p className="mt-1 font-black text-white">
                  {getTrainingBooleanLabel(lane.hookTrainingReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Arrangement
                </p>
                <p className="mt-1 font-black text-white">
                  {getTrainingBooleanLabel(lane.arrangementTrainingReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Energy
                </p>
                <p className="mt-1 font-black text-white">
                  {getTrainingBooleanLabel(lane.energyTrainingReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  AI
                </p>
                <p className="mt-1 font-black text-white">
                  {getTrainingBooleanLabel(lane.aiTrainingReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Hybrid
                </p>
                <p className="mt-1 font-black text-white">
                  {getTrainingBooleanLabel(lane.hybridTrainingReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Summary
                </p>
                <p className="mt-1 font-black text-white">
                  {getTrainingLaneSummary(lane)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {lane.trainingItems.map((item) => (
                <div
                  key={item.trainingId}
                  className="rounded-2xl border border-white/10 bg-black p-3"
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-black text-white">{item.label}</p>

                      <p className="mt-1 text-xs font-semibold text-white/60">
                        {getTrainingCategoryLabel(item.category)} ·{" "}
                        {getTrainingOwnerLabel(item.owner)} owner
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-black text-white/70">
                        {getTrainingStatusLabel(item.status)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-black text-white/70">
                        {item.readinessLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs font-semibold text-white/70">
                      <span className="font-black text-white">Input:</span>{" "}
                      {item.inputLabel}
                    </p>

                    <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs font-semibold text-white/70">
                      <span className="font-black text-white">Output:</span>{" "}
                      {item.outputLabel}
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black">Training Rules</h3>

          <div className="mt-3 grid gap-2">
            {workspace.trainingRules.map((rule) => (
              <p
                key={rule}
                className="rounded-xl border border-white/10 bg-black p-3 text-sm font-semibold text-white/70"
              >
                {rule}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black">Future Connections</h3>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {workspace.futureConnections.map((connection) => (
              <p
                key={connection}
                className="rounded-xl border border-white/10 bg-black p-3 text-sm font-black text-white/70"
              >
                {connection}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}