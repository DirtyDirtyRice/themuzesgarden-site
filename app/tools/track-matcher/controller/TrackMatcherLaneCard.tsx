"use client";

import type { TrackMatcherLaneMetadata } from "./trackMatcherControllerTypes";
import {
  getTrackMatcherLaneRoleLabel,
  getTrackMatcherLaneSummary,
  getTrackMatcherLaneToneClasses,
} from "./trackMatcherLaneHelpers";

type TrackMatcherLaneCardProps = {
  lane: TrackMatcherLaneMetadata;
};

export default function TrackMatcherLaneCard({
  lane,
}: TrackMatcherLaneCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 ${getTrackMatcherLaneToneClasses(
        lane.role,
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] opacity-60">
            {getTrackMatcherLaneRoleLabel(lane.role)}
          </p>

          <h4 className="mt-1 text-lg font-black">
            {lane.title}
          </h4>
        </div>

        {lane.deckId && (
          <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold">
            Deck {lane.deckId}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-xs opacity-80">
        <div>
          SOURCE: {lane.sourceKind}
        </div>

        <div>
          TRACK: {lane.sourceTrackName}
        </div>

        <div>
          LANE ID: {lane.laneId}
        </div>
      </div>

      <p className="mt-4 text-sm opacity-75">
        {getTrackMatcherLaneSummary(lane)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {lane.isStemLane && (
          <Badge label="Stem Lane" />
        )}

        {lane.isHybridCandidate && (
          <Badge label="Hybrid Source" />
        )}

        {lane.isPrimaryComparisonLane && (
          <Badge label="Primary Comparison" />
        )}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/70">
      {label}
    </div>
  );
}