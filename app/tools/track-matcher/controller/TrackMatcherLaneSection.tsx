"use client";

import type { TrackMatcherLaneMetadata } from "./trackMatcherControllerTypes";
import TrackMatcherLaneCard from "./TrackMatcherLaneCard";

type TrackMatcherLaneSectionProps = {
  columns: string;
  lanes: TrackMatcherLaneMetadata[];
  subtitle: string;
  title: string;
};

export default function TrackMatcherLaneSection({
  columns,
  lanes,
  subtitle,
  title,
}: TrackMatcherLaneSectionProps) {
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

      <div className={`mt-4 grid gap-4 ${columns}`}>
        {lanes.map((lane) => (
          <TrackMatcherLaneCard
            key={lane.laneId}
            lane={lane}
          />
        ))}
      </div>
    </div>
  );
}