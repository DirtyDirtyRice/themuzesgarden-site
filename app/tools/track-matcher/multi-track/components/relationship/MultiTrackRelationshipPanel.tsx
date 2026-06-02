"use client";

import type { MultiTrackEngineRelationshipState } from "../../engine/multiTrackEngineRelationshipTypes";
import { MultiTrackRelationshipCardGrid } from "./MultiTrackRelationshipCardGrid";
import { MultiTrackRelationshipFocusList } from "./MultiTrackRelationshipFocusList";
import { MultiTrackRelationshipStatCard } from "./MultiTrackRelationshipStatCard";
import {
  relationshipEyebrowClass,
  relationshipPanelClass,
  relationshipPillClass,
  relationshipSoftTextClass,
} from "./multiTrackRelationshipPanelStyles";

type Props = {
  relationshipState: MultiTrackEngineRelationshipState;
};

export function MultiTrackRelationshipPanel({ relationshipState }: Props) {
  return (
    <section className={relationshipPanelClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className={relationshipEyebrowClass}>Relationship Intelligence</p>
          <h2 className="mt-2 text-2xl font-black text-white">Track Relationship Layer</h2>
          <p className={`mt-3 max-w-3xl ${relationshipSoftTextClass}`}>
            {relationshipState.summary}
          </p>
        </div>

        <span className={relationshipPillClass}>{relationshipState.readiness}</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MultiTrackRelationshipStatCard
          label="Average Score"
          value={`${relationshipState.averageScore}%`}
          detail="Combined relationship score across tempo, key, structure, readiness, and future metadata lanes."
        />
        <MultiTrackRelationshipStatCard
          label="Average Confidence"
          value={`${relationshipState.averageConfidence}%`}
          detail="How much usable relationship evidence the current engine state has produced."
        />
        <MultiTrackRelationshipStatCard
          label="Strongest"
          value={relationshipState.strongestRelationshipLabel}
          detail="The relationship lane currently producing the strongest match signal."
        />
        <MultiTrackRelationshipStatCard
          label="Weakest"
          value={relationshipState.weakestRelationshipLabel}
          detail="The relationship lane currently needing the most additional data."
        />
      </div>

      <MultiTrackRelationshipCardGrid relationships={relationshipState.relationships} />

      <MultiTrackRelationshipFocusList focusItems={relationshipState.focusItems} />
    </section>
  );
}