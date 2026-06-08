"use client";

import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4";

export function MultiTrackEngineBridgeAdapterPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;

  return (
    <section className={panelClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
        Adapter Registry
      </p>

      <h2 className="mt-2 text-2xl font-black">
        Workspace Adapters
      </h2>

      <p className="mt-3 text-sm leading-6 text-white/70">
        Adapters are responsible for moving information between engine
        systems and workstation panels.
      </p>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {bridgeState.adapters.map((adapter) => (
          <article key={adapter.id} className={cardClass}>
            <h3 className="text-lg font-black">
              {adapter.label}
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/70">
              {adapter.detail}
            </p>

            <div className="mt-4 grid gap-2">
              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">
                  Source Workspace
                </p>

                <p className="mt-2 font-black">
                  {adapter.sourceWorkspace}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">
                  Destination Workspace
                </p>

                <p className="mt-2 font-black">
                  {adapter.destinationWorkspace}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">
                  Connected
                </p>

                <p className="mt-2 font-black">
                  {adapter.connected ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}