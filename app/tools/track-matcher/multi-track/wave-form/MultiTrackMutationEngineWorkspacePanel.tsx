// app/tools/track-matcher/multi-track/wave-form/MultiTrackMutationEngineWorkspacePanel.tsx

"use client";

const panelClass =
  "rounded-2xl border border-white/15 bg-black p-5 text-white shadow-2xl";

const cardClass =
  "rounded-xl border border-white/15 bg-black p-4 text-white";

const pillClass =
  "rounded-full border border-white/20 bg-black px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/70";

const mutationStages = [
  {
    label: "Source idea",
    detail: "Original musical idea before version drift.",
    status: "locked",
  },
  {
    label: "Mutation pass",
    detail: "Compare melodic, rhythmic, lyric, and arrangement changes.",
    status: "review",
  },
  {
    label: "Survivor check",
    detail: "Mark ideas that still feel strong after mutation.",
    status: "ready",
  },
  {
    label: "Promotion route",
    detail: "Send strongest mutations toward keeper, extraction, or render prep.",
    status: "future",
  },
];

const mutationSignals = [
  "Melody changed but hook survived",
  "Rhythm mutated into stronger groove",
  "Lyric phrase carried across versions",
  "Arrangement section became more useful",
  "Energy improved without losing identity",
  "Version drift weakened the core idea",
];

export default function MultiTrackMutationEngineWorkspacePanel() {
  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">
            Multi-Track Engine
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Mutation Engine
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-white/70">
            Tracks how an idea changes across versions, then separates useful
            mutation from drift, damage, or weak variation.
          </p>
        </div>

        <div className="rounded-xl border border-white/20 bg-black px-4 py-3 text-right">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">
            Status
          </p>
          <p className="mt-1 text-sm font-black text-white">Workspace Ready</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {mutationStages.map((stage) => (
          <article key={stage.label} className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-white">{stage.label}</h3>
              <span className={pillClass}>{stage.status}</span>
            </div>

            <p className="mt-3 text-xs font-bold leading-5 text-white/70">
              {stage.detail}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className={cardClass}>
          <h3 className="text-base font-black text-white">
            Mutation Signal Checklist
          </h3>

          <div className="mt-4 grid gap-2">
            {mutationSignals.map((signal) => (
              <div
                key={signal}
                className="rounded-xl border border-white/10 bg-black px-3 py-2 text-sm font-bold text-white/75"
              >
                {signal}
              </div>
            ))}
          </div>
        </article>

        <article className={cardClass}>
          <h3 className="text-base font-black text-white">Next Wiring</h3>

          <p className="mt-3 text-sm font-bold leading-6 text-white/70">
            This panel is now no longer empty. The next safe upgrade is wiring
            it to the existing Mutation Engine types, seed, and helpers already
            sitting beside it.
          </p>

          <div className="mt-4 rounded-xl border border-white/10 bg-black p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
              Current Layer
            </p>
            <p className="mt-1 text-sm font-black text-white">
              Workspace shell filled
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}