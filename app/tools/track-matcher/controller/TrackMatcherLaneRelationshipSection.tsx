"use client";

import type { TrackMatcherLaneRelationship } from "./trackMatcherControllerTypes";
import TrackMatcherLaneRelationshipCard from "./TrackMatcherLaneRelationshipCard";

type TrackMatcherLaneRelationshipSectionProps = {
  relationships: TrackMatcherLaneRelationship[];
  subtitle: string;
  title: string;
};

export default function TrackMatcherLaneRelationshipSection({
  relationships,
  subtitle,
  title,
}: TrackMatcherLaneRelationshipSectionProps) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-white">
          {title}
        </h3>

        <div className="text-xs uppercase tracking-[0.16em] text-white/40">
          {subtitle}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {relationships.map((relationship) => (
          <TrackMatcherLaneRelationshipCard
            key={`${relationship.fromLaneId}-${relationship.toLaneId}-${relationship.kind}`}
            relationship={relationship}
          />
        ))}
      </div>
    </div>
  );
}