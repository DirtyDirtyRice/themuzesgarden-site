"use client";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const buttonClass =
  "rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-black text-white transition-transform hover:scale-[0.99]";

export function MultiTrackQuickActionsPanel() {
  return (
    <section className={panelClass}>
      <h2 className="text-2xl font-black">
        Quick Actions
      </h2>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <button className={buttonClass}>
          Load Tracks
        </button>

        <button className={buttonClass}>
          Compare
        </button>

        <button className={buttonClass}>
          Analyze
        </button>

        <button className={buttonClass}>
          Save Snapshot
        </button>

        <button className={buttonClass}>
          Export
        </button>
      </div>
    </section>
  );
}