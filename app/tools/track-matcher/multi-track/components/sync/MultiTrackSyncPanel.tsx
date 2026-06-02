"use client";

import type { MultiTrackEngineSyncState } from "../../engine/multiTrackEngineSyncTypes";
import { MultiTrackSyncAnchorList } from "./MultiTrackSyncAnchorList";
import { MultiTrackSyncCandidateList } from "./MultiTrackSyncCandidateList";
import { MultiTrackSyncStatCard } from "./MultiTrackSyncStatCard";
import {
  formatSyncConfidence,
  formatSyncSeconds,
  syncEyebrowClass,
  syncPanelClass,
  syncPillClass,
  syncSoftTextClass,
} from "./multiTrackSyncPanelStyles";

type Props = {
  syncState: MultiTrackEngineSyncState;
};

export function MultiTrackSyncPanel({ syncState }: Props) {
  return (
    <section className={syncPanelClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className={syncEyebrowClass}>Sync Intelligence</p>
          <h2 className="mt-2 text-2xl font-black text-white">Track Sync Layer</h2>
          <p className={`mt-3 max-w-3xl ${syncSoftTextClass}`}>{syncState.summary}</p>
        </div>

        <span className={syncPillClass}>{syncState.status}</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MultiTrackSyncStatCard
          label="Readiness"
          value={syncState.readiness}
          detail="Current readiness level for sync intelligence."
        />
        <MultiTrackSyncStatCard
          label="Best Candidate"
          value={syncState.bestCandidateLabel}
          detail="The highest-confidence alignment candidate currently available."
        />
        <MultiTrackSyncStatCard
          label="Average Confidence"
          value={formatSyncConfidence(syncState.averageConfidence)}
          detail="Average confidence across sync candidates."
        />
        <MultiTrackSyncStatCard
          label="Suggested Offset"
          value={formatSyncSeconds(syncState.suggestedOffsetSeconds)}
          detail="Current best offset suggestion between Track A and Track B."
        />
      </div>

      <MultiTrackSyncAnchorList anchors={syncState.anchors} />
      <MultiTrackSyncCandidateList candidates={syncState.candidates} />
    </section>
  );
}