"use client";

import type { TrackMatcherLaneRelationship } from "./trackMatcherControllerTypes";
import {
  formatTrackMatcherConfidence,
  getTrackMatcherLaneRelationshipLabel,
  getTrackMatcherRelationshipSummary,
} from "./trackMatcherLaneHelpers";

type TrackMatcherLaneRelationshipCardProps = {
  relationship: TrackMatcherLaneRelationship;
};

export default function TrackMatcherLaneRelationshipCard({
  relationship,
}: TrackMatcherLaneRelationshipCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">
            {relationship.label}
          </p>

          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
            {getTrackMatcherLaneRelationshipLabel(
              relationship.kind,
            )}
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/75">
          {formatTrackMatcherConfidence(
            relationship.confidence,
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-white/60 md:grid-cols-2">
        <div>
          FROM: {relationship.fromLaneId}
        </div>

        <div>
          TO: {relationship.toLaneId}
        </div>
      </div>

      <p className="mt-3 text-sm text-white/55">
        {getTrackMatcherRelationshipSummary(
          relationship,
        )}
      </p>
    </div>
  );
}