"use client";

import type { MultiTrackEngineRelationshipState } from "../../engine/multiTrackEngineRelationshipTypes";

type Props = {
  relationshipState: MultiTrackEngineRelationshipState;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4";

export function MultiTrackRelationshipSummaryPanel({
  relationshipState,
}: Props) {
  return (
    <section className={panelClass}>
      <h2 className="text-2xl font-black">
        Relationship Summary
      </h2>

      <p className="mt-3 text-sm text-white/70">
        High-level relationship intelligence between Track A and Track B.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Readiness
          </p>
          <p className="mt-3 text-xl font-black">
            {relationshipState.readiness}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Average Score
          </p>
          <p className="mt-3 text-xl font-black">
            {relationshipState.averageScore}%
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Strongest
          </p>
          <p className="mt-3 text-xl font-black">
            {relationshipState.strongestRelationshipLabel}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Weakest
          </p>
          <p className="mt-3 text-xl font-black">
            {relationshipState.weakestRelationshipLabel}
          </p>
        </article>
      </div>
    </section>
  );
}