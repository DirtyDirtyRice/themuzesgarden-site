"use client";

import type { MultiTrackEngineSyncTransitionSuggestion } from "../../engine/multiTrackEngineSyncTypes";

type Props = {
  transitions: MultiTrackEngineSyncTransitionSuggestion[];
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

export function MultiTrackTransitionPanel({
  transitions,
}: Props) {
  return (
    <section className={panelClass}>
      <h2 className="text-2xl font-black">
        Transition Suggestions
      </h2>

      <div className="mt-5 space-y-3">
        {transitions.map((transition) => (
          <article
            key={transition.id}
            className="rounded-2xl border border-white/10 p-4"
          >
            <h3 className="font-black">
              {transition.label}
            </h3>

            <p className="mt-2 text-sm text-white/70">
              {transition.detail}
            </p>

            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/50">
              {transition.fromTrackSlotId} → {transition.toTrackSlotId}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}