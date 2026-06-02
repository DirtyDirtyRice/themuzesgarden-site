"use client";

import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
  snapshotCount: number;
  canSaveSnapshot: boolean;
  saveSnapshot: () => void;
  resetEngine: () => void;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

const buttonClass =
  "rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.1] active:scale-[0.98]";

export function MultiTrackSnapshotControlPanel({
  engineState,
  snapshotCount,
  canSaveSnapshot,
  saveSnapshot,
  resetEngine,
}: Props) {
  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Snapshot Controls
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Save and reset engine state
          </h3>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          {snapshotCount} saved
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-6 text-white/70">
        This panel exposes hook-level snapshot and reset actions. Save stays tied to
        the engine decision contract, while reset returns to the recovered foundation state.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Engine
          </p>
          <p className="mt-2 text-sm font-black text-white">{engineState.engineId}</p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Version
          </p>
          <p className="mt-2 text-sm font-black text-white">
            {engineState.versionLabel}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Edited
          </p>
          <p className="mt-2 text-sm font-black text-white">
            {engineState.editedAtLabel}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Save allowed
          </p>
          <p className="mt-2 text-sm font-black text-white">
            {canSaveSnapshot ? "Yes" : "No"}
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <article className={cardClass}>
          <h4 className="text-lg font-black text-white">Save comparison snapshot</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            This calls the recovered snapshot helper through the engine hook.
          </p>

          <button
            type="button"
            className={`${buttonClass} mt-4 ${canSaveSnapshot ? "" : "opacity-50"}`}
            onClick={saveSnapshot}
            disabled={!canSaveSnapshot}
          >
            Save snapshot
          </button>
        </article>

        <article className={cardClass}>
          <h4 className="text-lg font-black text-white">Reset engine foundation</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            This resets engine state only. It does not touch controller recovery,
            relationship files, sync files, or dashboard files.
          </p>

          <button type="button" className={`${buttonClass} mt-4`} onClick={resetEngine}>
            Reset engine
          </button>
        </article>
      </div>

      {engineState.snapshots.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {engineState.snapshots.map((snapshot) => (
            <article key={snapshot.snapshotId} className={cardClass}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                {snapshot.createdAtLabel}
              </p>
              <h4 className="mt-2 text-base font-black text-white">
                {snapshot.snapshotId}
              </h4>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {snapshot.summary}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/70">
          No snapshots saved yet. This is expected until engine decision readiness allows
          saving.
        </p>
      )}
    </section>
  );
}