"use client";

import type { MultiTrackEngineSyncCandidate } from "../../engine/multiTrackEngineSyncTypes";
import {
  formatSyncConfidence,
  formatSyncSeconds,
  syncCardClass,
  syncEyebrowClass,
  syncPillClass,
  syncSoftTextClass,
} from "./multiTrackSyncPanelStyles";

type Props = {
  candidates: MultiTrackEngineSyncCandidate[];
};

export function MultiTrackSyncCandidateList({ candidates }: Props) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className={syncEyebrowClass}>Candidates</p>
          <h3 className="mt-1 text-lg font-black text-white">Sync Alignment Candidates</h3>
        </div>
        <span className={syncPillClass}>{candidates.length} candidate(s)</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {candidates.map((candidate) => (
          <article key={candidate.id} className={syncCardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-white">{candidate.label}</h4>
                <p className={`mt-2 ${syncSoftTextClass}`}>{candidate.detail}</p>
              </div>
              <span className={syncPillClass}>
                {formatSyncConfidence(candidate.confidence)}
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-white/70 md:grid-cols-3">
              <p>Track A: {formatSyncSeconds(candidate.trackASeconds)}</p>
              <p>Track B: {formatSyncSeconds(candidate.trackBSeconds)}</p>
              <p>Offset: {formatSyncSeconds(candidate.offsetSeconds)}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={syncPillClass}>{candidate.confidenceLevel}</span>
              <span className={syncPillClass}>{candidate.ready ? "Ready" : "Waiting"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}