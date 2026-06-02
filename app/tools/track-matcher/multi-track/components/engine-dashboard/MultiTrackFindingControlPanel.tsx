"use client";

import type {
  MultiTrackEngineAnalysisFinding,
  MultiTrackEngineState,
} from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
  addFinding: (finding: MultiTrackEngineAnalysisFinding) => void;
  clearFindings: () => void;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

const buttonClass =
  "rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.1] active:scale-[0.98]";

function createFinding(kind: "info" | "warning"): MultiTrackEngineAnalysisFinding {
  return {
    id: `manual-${kind}-finding-${Date.now()}`,
    trackSlotId: "both",
    label: kind === "info" ? "Manual workstation note" : "Manual workstation warning",
    detail:
      kind === "info"
        ? "This note was added through the engine dashboard finding controls."
        : "This warning was added through the engine dashboard finding controls.",
    severity: kind,
    actionLabel: kind === "info" ? "Review later" : "Check before export",
  };
}

export function MultiTrackFindingControlPanel({
  engineState,
  addFinding,
  clearFindings,
}: Props) {
  const { analysis } = engineState;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Finding Controls
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Add and clear engine findings
          </h3>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          {analysis.findings.length} active
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-6 text-white/70">
        These controls call the recovered finding helpers. They give the workstation
        a safe way to test analysis notes without adding any new insight system.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className={cardClass}>
          <h4 className="text-lg font-black text-white">Add info finding</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Adds a safe informational analysis note.
          </p>
          <button
            type="button"
            className={`${buttonClass} mt-4`}
            onClick={() => addFinding(createFinding("info"))}
          >
            Add info
          </button>
        </article>

        <article className={cardClass}>
          <h4 className="text-lg font-black text-white">Add warning finding</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Adds a safe warning analysis note.
          </p>
          <button
            type="button"
            className={`${buttonClass} mt-4`}
            onClick={() => addFinding(createFinding("warning"))}
          >
            Add warning
          </button>
        </article>

        <article className={cardClass}>
          <h4 className="text-lg font-black text-white">Clear findings</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Clears active findings through the engine helper.
          </p>
          <button
            type="button"
            className={`${buttonClass} mt-4`}
            onClick={clearFindings}
          >
            Clear all
          </button>
        </article>
      </div>
    </section>
  );
}