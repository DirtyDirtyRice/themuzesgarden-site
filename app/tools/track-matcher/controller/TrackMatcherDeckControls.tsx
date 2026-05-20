"use client";

import {
  formatSignedNumber,
  formatSignedSeconds,
  getReadinessClasses,
  getReadinessLabel,
  getRuntimeStatusLabel,
  getSyncStatusClasses,
  getSyncStatusDetail,
  getSyncStatusLabel,
} from "./trackMatcherControllerLabels";
import type {
  ControllerDeckSnapshot,
  ControllerEngineHealth,
  SyncSnapshot,
} from "./trackMatcherControllerTypes";

type TrackMatcherDeckControlsProps = {
  activeDeckSnapshot: ControllerDeckSnapshot;
  deckSnapshotA: ControllerDeckSnapshot;
  deckSnapshotB: ControllerDeckSnapshot;
  engineHealth: ControllerEngineHealth;
  syncSnapshot: SyncSnapshot;
};

export default function TrackMatcherDeckControls({
  activeDeckSnapshot,
  deckSnapshotA,
  deckSnapshotB,
  engineHealth,
  syncSnapshot,
}: TrackMatcherDeckControlsProps) {
  const statusLabel = getSyncStatusLabel(syncSnapshot.status);
  const statusDetail = getSyncStatusDetail(syncSnapshot.status);
  const statusClasses = getSyncStatusClasses(syncSnapshot.status);

  return (
    <>
      <div className={`rounded-2xl border p-4 ${statusClasses}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
              Smart Sync Status
            </p>

            <p className="mt-2 text-2xl font-black">{statusLabel}</p>

            <p className="mt-2 max-w-2xl text-sm leading-6 opacity-75">
              {statusDetail}
            </p>
          </div>

          <div className="grid w-full gap-3 text-sm sm:w-auto sm:min-w-[360px] sm:grid-cols-2">
            <MetricCard label="Time Drift" value={formatSignedSeconds(syncSnapshot.driftSeconds)} />
            <MetricCard label="Phase Drift" value={formatSignedSeconds(syncSnapshot.phaseSeconds)} />
            <MetricCard label="BPM Gap" value={formatSignedNumber(syncSnapshot.bpmDifference)} />
            <MetricCard label="Rate Correction" value={formatSignedNumber(syncSnapshot.rateCorrection)} />
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${engineHealth.toneClasses}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
              Pro Pitch Controller
            </p>

            <p className="mt-2 text-2xl font-black">{engineHealth.label}</p>

            <p className="mt-2 max-w-2xl text-sm leading-6 opacity-75">
              {engineHealth.detail}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] opacity-55">
              Active Deck
            </p>

            <p className="mt-1 font-bold">{activeDeckSnapshot.title}</p>

            <p className="mt-1 text-xs leading-5 opacity-70">
              {getReadinessLabel(activeDeckSnapshot.readinessStatus)} · {getRuntimeStatusLabel(activeDeckSnapshot.runtimeStatus)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[deckSnapshotA, deckSnapshotB].map((deckSnapshot) => (
            <div
              key={deckSnapshot.deckId}
              className={`rounded-xl border p-3 ${getReadinessClasses(deckSnapshot.readinessStatus)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-65">
                    {deckSnapshot.title}
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    {deckSnapshot.trackName}
                  </p>
                </div>

                <p className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold">
                  {getReadinessLabel(deckSnapshot.readinessStatus)}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <MetricCard label="BPM" value={deckSnapshot.bpm.toFixed(2)} />
                <MetricCard label="Key" value={`${deckSnapshot.keyLabel} ${deckSnapshot.mode}`} />
                <MetricCard label="Browser Rate" value={`${deckSnapshot.browserRate.toFixed(3)}x`} />
                <MetricCard label="Effective Rate" value={`${deckSnapshot.effectiveRate.toFixed(3)}x`} />
              </div>

              <p className="mt-3 text-xs leading-5 opacity-70">
                {deckSnapshot.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-xs uppercase tracking-[0.14em] opacity-55">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}
