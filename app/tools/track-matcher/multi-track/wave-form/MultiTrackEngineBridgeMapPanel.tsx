"use client";

import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4";

function getStatusLabel(ready: boolean) {
  return ready ? "Connected" : "Waiting";
}

export function MultiTrackEngineBridgeMapPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
          Bridge Map
        </p>

        <h2 className="mt-2 text-2xl font-black">
          Workspace Routing Topology
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          Visual representation of how future engine systems connect to
          analysis, dashboard, save, relationship, timeline, sync,
          metadata, waveform, and AI workspaces.
        </p>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {bridgeState.signals.map((signal) => (
          <article key={signal.id} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-black text-lg">
                {signal.label}
              </h3>

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black">
                {getStatusLabel(signal.ready)}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">
                  Source
                </p>

                <p className="mt-2 font-black">
                  {signal.source}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">
                  Destination
                </p>

                <p className="mt-2 font-black">
                  {signal.destination}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">
                  Direction
                </p>

                <p className="mt-2 font-black">
                  {signal.direction}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/70">
              {signal.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}