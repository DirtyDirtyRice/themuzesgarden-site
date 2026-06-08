"use client";

import {
  getBridgeAdapterCount,
  getBridgeCompletionPercent,
  getBridgeSignalCount,
} from "./MultiTrackEngineBridgeHelpers";
import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4";

export function MultiTrackEngineBridgeWorkspacePanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
          Engine Bridge
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Workspace Bridge Systems
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/70">
          Future routing layer connecting engine intelligence to
          dashboard, timeline, save, sync, relationship, and analysis
          workspaces.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <article className={cardClass}>
          <h3 className="font-black">Signals</h3>
          <p className="mt-2 text-3xl font-black">
            {getBridgeSignalCount(bridgeState)}
          </p>
        </article>

        <article className={cardClass}>
          <h3 className="font-black">Adapters</h3>
          <p className="mt-2 text-3xl font-black">
            {getBridgeAdapterCount(bridgeState)}
          </p>
        </article>

        <article className={cardClass}>
          <h3 className="font-black">Completion</h3>
          <p className="mt-2 text-3xl font-black">
            {getBridgeCompletionPercent(bridgeState)}%
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-3">
        {bridgeState.signals.map((signal) => (
          <article key={signal.id} className={cardClass}>
            <h3 className="font-black">{signal.label}</h3>

            <p className="mt-2 text-sm text-white/70">
              {signal.detail}
            </p>

            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/50">
              {signal.source} → {signal.destination}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}