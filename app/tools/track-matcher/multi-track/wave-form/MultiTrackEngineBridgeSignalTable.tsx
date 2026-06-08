"use client";

import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

function getSignalHealth(ready: boolean) {
  return ready ? "Ready" : "Waiting";
}

export function MultiTrackEngineBridgeSignalTable() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;

  return (
    <section className={panelClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
        Signal Registry
      </p>

      <h2 className="mt-2 text-2xl font-black">
        Bridge Signal Table
      </h2>

      <p className="mt-3 text-sm leading-6 text-white/70">
        Future engine-to-workspace communication registry.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-5 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase tracking-[0.16em]">
          <div>Signal</div>
          <div>Source</div>
          <div>Destination</div>
          <div>Status</div>
          <div>Direction</div>
        </div>

        {bridgeState.signals.map((signal) => (
          <div
            key={signal.id}
            className="grid grid-cols-5 border-b border-white/10 px-4 py-4 text-sm"
          >
            <div className="font-black">
              {signal.label}
            </div>

            <div>{signal.source}</div>

            <div>{signal.destination}</div>

            <div>{getSignalHealth(signal.ready)}</div>

            <div>{signal.direction}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 p-4">
        <p className="text-sm text-white/70">
          Future bridge intelligence will expand this registry into a
          complete routing and validation layer.
        </p>
      </div>
    </section>
  );
}