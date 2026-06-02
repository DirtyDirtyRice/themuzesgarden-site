"use client";

import type { MultiTrackEngineRelationshipItem } from "../../engine/multiTrackEngineRelationshipTypes";
import {
  getRelationshipPolarityLabel,
  getRelationshipStrengthLabel,
  relationshipCardClass,
  relationshipEyebrowClass,
  relationshipPillClass,
  relationshipSoftTextClass,
} from "./multiTrackRelationshipPanelStyles";

type Props = {
  relationships: MultiTrackEngineRelationshipItem[];
};

export function MultiTrackRelationshipCardGrid({ relationships }: Props) {
  return (
    <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {relationships.map((relationship) => (
        <article key={relationship.id} className={relationshipCardClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={relationshipEyebrowClass}>{relationship.kind}</p>
              <h3 className="mt-2 text-base font-black text-white">{relationship.label}</h3>
            </div>
            <span className={relationshipPillClass}>{relationship.score}%</span>
          </div>

          <div className="mt-4 grid gap-2 text-sm">
            <p className="text-white">{relationship.trackALabel}</p>
            <p className="text-white/70">{relationship.trackBLabel}</p>
          </div>

          <p className={`mt-4 ${relationshipSoftTextClass}`}>{relationship.detail}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={relationshipPillClass}>
              {getRelationshipStrengthLabel(relationship.strength)}
            </span>
            <span className={relationshipPillClass}>
              {getRelationshipPolarityLabel(relationship.polarity)}
            </span>
            <span className={relationshipPillClass}>
              {relationship.ready ? "Ready" : "Waiting"}
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}