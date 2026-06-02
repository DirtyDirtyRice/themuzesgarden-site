"use client";

import type { MultiTrackEngineRelationshipFocus } from "../../engine/multiTrackEngineRelationshipTypes";

type Props = {
  focusItems: MultiTrackEngineRelationshipFocus[];
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

export function MultiTrackRelationshipFocusPanel({
  focusItems,
}: Props) {
  return (
    <section className={panelClass}>
      <h2 className="text-2xl font-black">
        Relationship Focus
      </h2>

      <div className="mt-5 grid gap-3">
        {focusItems.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-black">{item.label}</h3>

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black">
                P{item.priority}
              </span>
            </div>

            <p className="mt-3 text-sm text-white/70">
              {item.detail}
            </p>

            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/50">
              {item.trackSlotId}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}