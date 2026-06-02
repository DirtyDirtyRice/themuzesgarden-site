"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";
import { MultiTrackInsightComparisonPanel } from "./MultiTrackInsightComparisonPanel";
import { buildMultiTrackInsightV2Cards } from "./MultiTrackInsightV2Helpers";
import { MultiTrackInsightReadinessPanel } from "./MultiTrackInsightReadinessPanel";
import { MultiTrackInsightRecommendationPanel } from "./MultiTrackInsightRecommendationPanel";
import { MultiTrackInsightTimelinePanel } from "./MultiTrackInsightTimelinePanel";

type Props = {
  engineState: MultiTrackEngineState;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

export function MultiTrackInsightV2Panel({ engineState }: Props) {
  const insightCards = buildMultiTrackInsightV2Cards(engineState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Insight V2
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Read-only engine observations
          </h3>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          Display only
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-6 text-white/70">
        Insight V2 reads the current green engine state and produces recommendations
        without owning duplicate state, restoring old insight contracts, or mutating
        the engine.
      </p>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <MultiTrackInsightRecommendationPanel insightCards={insightCards} />
        <MultiTrackInsightComparisonPanel engineState={engineState} />
        <MultiTrackInsightTimelinePanel engineState={engineState} />
        <MultiTrackInsightReadinessPanel engineState={engineState} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {insightCards.map((card) => (
          <article key={card.id} className={cardClass}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  {card.category}
                </p>
                <h4 className="mt-2 text-lg font-black text-white">{card.title}</h4>
              </div>

              <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
                {card.severity}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/70">{card.detail}</p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                Recommendation
              </p>
              <p className="mt-2 text-sm leading-6 text-white">
                {card.recommendation}
              </p>
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-white/70">
              {card.actionLabel}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}