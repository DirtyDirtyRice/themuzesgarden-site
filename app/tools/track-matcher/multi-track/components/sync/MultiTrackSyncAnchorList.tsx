"use client";

import type { MultiTrackEngineSyncAnchor } from "../../engine/multiTrackEngineSyncTypes";
import {
  formatSyncConfidence,
  formatSyncSeconds,
  syncCardClass,
  syncEyebrowClass,
  syncPillClass,
  syncSoftTextClass,
} from "./multiTrackSyncPanelStyles";

type Props = {
  anchors: MultiTrackEngineSyncAnchor[];
};

export function MultiTrackSyncAnchorList({ anchors }: Props) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className={syncEyebrowClass}>Anchors</p>
          <h3 className="mt-1 text-lg font-black text-white">Timing Anchor Points</h3>
        </div>
        <span className={syncPillClass}>{anchors.length} anchor(s)</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {anchors.map((anchor) => (
          <article key={anchor.id} className={syncCardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={syncEyebrowClass}>{anchor.kind}</p>
                <h4 className="mt-2 text-base font-black text-white">{anchor.label}</h4>
              </div>
              <span className={syncPillClass}>{formatSyncSeconds(anchor.seconds)}</span>
            </div>

            <p className={`mt-3 ${syncSoftTextClass}`}>{anchor.note}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={syncPillClass}>{anchor.trackSlotId}</span>
              <span className={syncPillClass}>{formatSyncConfidence(anchor.confidence)}</span>
              <span className={syncPillClass}>{anchor.confidenceLevel}</span>
              <span className={syncPillClass}>{anchor.locked ? "Locked" : "Editable"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}