"use client";

import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4";

export function MultiTrackEngineBridgeActionPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;

  const actions = [
    {
      label: "Connect Analysis",
      detail:
        "Route analysis findings into dashboard and relationship systems.",
    },
    {
      label: "Connect Sync",
      detail:
        "Route sync recommendations into timeline and transition systems.",
    },
    {
      label: "Connect Save",
      detail:
        "Allow decisions to generate save-ready records.",
    },
    {
      label: "Connect Confidence",
      detail:
        "Expose confidence systems to workstation dashboards.",
    },
  ];

  return (
    <section className={panelClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
        Bridge Actions
      </p>

      <h2 className="mt-2 text-2xl font-black">
        Bridge Activation Queue
      </h2>

      <p className="mt-3 text-sm leading-6 text-white/70">
        Planned actions for turning bridge architecture into active
        workstation intelligence.
      </p>

      <div className="mt-6 grid gap-3">
        {actions.map((action) => (
          <article key={action.label} className={cardClass}>
            <h3 className="font-black text-lg">
              {action.label}
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/70">
              {action.detail}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 p-4">
        <p className="text-sm text-white/70">
          Current bridge status:
          {" "}
          {bridgeState.status}
        </p>
      </div>
    </section>
  );
}