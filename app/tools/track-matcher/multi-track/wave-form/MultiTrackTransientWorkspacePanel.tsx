"use client";

import {
  getMultiTrackTransientWorkspace,
  getTransientBooleanLabel,
  getTransientStatusLabel,
} from "./MultiTrackTransientHelpers";

export default function MultiTrackTransientWorkspacePanel() {
  const workspace = getMultiTrackTransientWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
          Transient Workspace
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

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Kick Detection
                </p>
                <p className="font-black">
                  {getTransientBooleanLabel(
                    lane.kickDetectionReady,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Snare Detection
                </p>
                <p className="font-black">
                  {getTransientBooleanLabel(
                    lane.snareDetectionReady,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Vocal Onset
                </p>
                <p className="font-black">
                  {getTransientBooleanLabel(
                    lane.vocalOnsetReady,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Cue Generation
                </p>
                <p className="font-black">
                  {getTransientBooleanLabel(
                    lane.cueGenerationReady,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">
                  Marker Generation
                </p>
                <p className="font-black">
                  {getTransientBooleanLabel(
                    lane.markerGenerationReady,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {lane.checkpoints.map((checkpoint) => (
                <div
                  key={`${lane.laneId}-${checkpoint.label}`}
                  className="rounded-xl border border-white/10 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">
                      {checkpoint.label}
                    </p>

                    <span className="text-xs font-black text-white/70">
                      {getTransientStatusLabel(
                        checkpoint.status,
                      )}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-white/70">
                    {checkpoint.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 p-4">
        <h3 className="text-lg font-black">
          Ownership Rules
        </h3>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {workspace.ownershipNotes.map((note) => (
            <div
              key={note}
              className="rounded-xl border border-white/10 p-3 text-sm font-semibold text-white/70"
            >
              {note}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}