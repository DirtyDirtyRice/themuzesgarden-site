"use client";

import {
  getCueBooleanLabel,
  getCueStatusLabel,
  getMultiTrackCueWorkspace,
} from "./MultiTrackCueHelpers";

export default function MultiTrackCueWorkspacePanel() {
  const workspace = getMultiTrackCueWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
          Cue Workspace
        </p>

        <h2 className="mt-2 text-2xl font-black">{workspace.title}</h2>

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
            <h3 className="text-lg font-black">{lane.title}</h3>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">Intro Cue</p>
                <p className="font-black">
                  {getCueBooleanLabel(lane.introCueReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">Verse Cue</p>
                <p className="font-black">
                  {getCueBooleanLabel(lane.verseCueReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">Chorus Cue</p>
                <p className="font-black">
                  {getCueBooleanLabel(lane.chorusCueReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">Bridge Cue</p>
                <p className="font-black">
                  {getCueBooleanLabel(lane.bridgeCueReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">Outro Cue</p>
                <p className="font-black">
                  {getCueBooleanLabel(lane.outroCueReady)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/60">Loop Cue</p>
                <p className="font-black">
                  {getCueBooleanLabel(lane.loopCueReady)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {lane.cuePoints.map((cuePoint) => (
                <div
                  key={`${lane.laneId}-${cuePoint.label}`}
                  className="rounded-xl border border-white/10 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{cuePoint.label}</p>

                    <span className="text-xs font-black text-white/70">
                      {getCueStatusLabel(cuePoint.status)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-white/70">
                    {cuePoint.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 p-4">
        <h3 className="text-lg font-black">Ownership Rules</h3>

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