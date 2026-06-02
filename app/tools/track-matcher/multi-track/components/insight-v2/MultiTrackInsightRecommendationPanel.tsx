"use client";

import type { MultiTrackInsightV2Card } from "./MultiTrackInsightV2Types";

type Props = {
  insightCards: MultiTrackInsightV2Card[];
};

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

export function MultiTrackInsightRecommendationPanel({ insightCards }: Props) {
  const blockedCards = insightCards.filter((card) => card.severity === "blocked");
  const warningCards = insightCards.filter((card) => card.severity === "warning");
  const nextCards = blockedCards.length > 0 ? blockedCards : warningCards;

  const visibleCards = nextCards.length > 0 ? nextCards : insightCards.slice(0, 3);

  return (
    <section className={cardClass}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
        Recommendation Stack
      </p>

      <h4 className="mt-2 text-lg font-black text-white">
        {blockedCards.length > 0
          ? "Resolve blocked items first"
          : warningCards.length > 0
            ? "Review warnings next"
            : "Continue safe growth"}
      </h4>

      <p className="mt-3 text-sm leading-6 text-white/70">
        This stack chooses the most important read-only Insight V2 recommendations
        without mutating engine state.
      </p>

      <div className="mt-4 grid gap-2">
        {visibleCards.map((card) => (
          <article
            key={card.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-black text-white">{card.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  {card.recommendation}
                </p>
              </div>

              <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
                {card.actionLabel}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}