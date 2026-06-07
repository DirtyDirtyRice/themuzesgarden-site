"use client";

import {
  getMultiTrackWaveformIntelligenceWorkspace,
  getWaveformIntelligenceBooleanLabel,
} from "./MultiTrackWaveformIntelligenceHelpers";

export default function MultiTrackWaveformIntelligenceWorkspacePanel() {
  const workspace =
    getMultiTrackWaveformIntelligenceWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
          Waveform Intelligence Workspace
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
            <h3 className="text-lg font-black">
              {lane.title}
            </h3>

            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
              {lane.sourceLabel}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Pattern
                </p>
                <p className="font-black">
                  {getWaveformIntelligenceBooleanLabel(
                    lane.patternReady,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Phrase
                </p>
                <p className="font-black">
                  {getWaveformIntelligenceBooleanLabel(
                    lane.phraseReady,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Hook
                </p>
                <p className="font-black">
                  {getWaveformIntelligenceBooleanLabel(
                    lane.hookReady,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Arrangement
                </p>
                <p className="font-black">
                  {getWaveformIntelligenceBooleanLabel(
                    lane.arrangementReady,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Energy
                </p>
                <p className="font-black">
                  {getWaveformIntelligenceBooleanLabel(
                    lane.energyReady,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {lane.items.map((item) => (
                <div
                  key={item.intelligenceId}
                  className="rounded-xl border border-white/10 p-3"
                >
                  <p className="font-black">
                    {item.label}
                  </p>

                  <p className="mt-1 text-sm text-white/70">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 p-4">
          <h3 className="text-lg font-black">
            Future Capabilities
          </h3>

          <div className="mt-3 grid gap-2">
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

        <div className="rounded-3xl border border-white/10 p-4">
          <h3 className="text-lg font-black">
            Ownership Rules
          </h3>

          <div className="mt-3 grid gap-2">
            {workspace.ownershipRules.map((rule) => (
              <div
                key={rule}
                className="rounded-xl border border-white/10 p-3 text-sm font-semibold text-white/70"
              >
                {rule}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}