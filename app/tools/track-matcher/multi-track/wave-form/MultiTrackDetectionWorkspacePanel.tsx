"use client";

import {
  getDetectionBooleanLabel,
  getDetectionConfidenceLabel,
  getDetectionKindLabel,
  getDetectionLaneFuturePercent,
  getDetectionLaneReadinessPercent,
  getDetectionLaneSummary,
  getDetectionOwnerLabel,
  getDetectionPrimaryValue,
  getDetectionStatusLabel,
  getDetectionTimingLabel,
  getMultiTrackDetectionWorkspace,
} from "./MultiTrackDetectionHelpers";

export default function MultiTrackDetectionWorkspacePanel() {
  const workspace = getMultiTrackDetectionWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
            Detection Workspace
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

                <p className="mt-2 text-sm font-semibold text-white/70">
                  {lane.readinessLabel}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-white/10 bg-black px-3 py-1 text-xs font-black text-white">
                  {getDetectionLaneReadinessPercent(lane)}% ready
                </div>

                <div className="rounded-full border border-white/10 bg-black px-3 py-1 text-xs font-black text-white/70">
                  {getDetectionLaneFuturePercent(lane)}% future
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Tempo
                </p>
                <p className="mt-1 font-black text-white">
                  {getDetectionBooleanLabel(lane.tempoDetectionReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Key
                </p>
                <p className="mt-1 font-black text-white">
                  {getDetectionBooleanLabel(lane.keyDetectionReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Transient
                </p>
                <p className="mt-1 font-black text-white">
                  {getDetectionBooleanLabel(lane.transientDetectionReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Downbeat
                </p>
                <p className="mt-1 font-black text-white">
                  {getDetectionBooleanLabel(lane.downbeatDetectionReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Section
                </p>
                <p className="mt-1 font-black text-white">
                  {getDetectionBooleanLabel(lane.sectionDetectionReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Loop
                </p>
                <p className="mt-1 font-black text-white">
                  {getDetectionBooleanLabel(lane.loopDetectionReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Stem
                </p>
                <p className="mt-1 font-black text-white">
                  {getDetectionBooleanLabel(lane.stemDetectionReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                  Sync
                </p>
                <p className="mt-1 font-black text-white">
                  {getDetectionBooleanLabel(lane.syncDetectionReady)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                Lane Summary
              </p>

              <p className="mt-1 text-sm font-black text-white">
                {getDetectionLaneSummary(lane)}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {lane.detections.map((detection) => (
                <div
                  key={detection.detectionId}
                  className="rounded-2xl border border-white/10 bg-black p-3"
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-black text-white">{detection.label}</p>

                      <p className="mt-1 text-xs font-semibold text-white/60">
                        {getDetectionKindLabel(detection.kind)} ·{" "}
                        {getDetectionOwnerLabel(detection.owner)} owner ·{" "}
                        {getDetectionTimingLabel(detection)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-black text-white/70">
                        {getDetectionStatusLabel(detection.status)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-black text-white/70">
                        {getDetectionConfidenceLabel(detection.confidence)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-black text-white/70">
                        {getDetectionPrimaryValue(detection)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                    {detection.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black">Safety Rules</h3>

          <div className="mt-3 grid gap-2">
            {workspace.safetyRules.map((rule) => (
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