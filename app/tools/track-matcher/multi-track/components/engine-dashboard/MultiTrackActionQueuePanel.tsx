"use client";

type Props = {
  engineState: unknown;
};

type QueueItem = {
  label: string;
  status: string;
  priority: string;
  detail: string;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black p-4";

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function buildQueue(engineState: unknown): QueueItem[] {
  const state = readRecord(engineState);
  const sync = readRecord(state.sync);
  const relationship = readRecord(state.relationship);
  const snapshot = readRecord(state.snapshot);
  const decision = readRecord(state.decision);

  return [
    {
      label: "Load lane material",
      status: readText(state.loadStatus, "Waiting for connected track sources"),
      priority: "High",
      detail: "Next real growth step is connecting active lane cards to selected songs, uploads, or finder results.",
    },
    {
      label: "Prepare sync read",
      status: readText(sync.status, "Sync layer green"),
      priority: "High",
      detail: "Beat, tempo, and alignment data can now be surfaced without rebuilding the broken insight layer.",
    },
    {
      label: "Review relationship match",
      status: readText(relationship.status, "Relationship layer green"),
      priority: "Medium",
      detail: "Relationship data can guide whether two lanes belong together, contrast, or need manual review.",
    },
    {
      label: "Capture engine snapshot",
      status: readText(snapshot.status, "Snapshot panel active"),
      priority: "Medium",
      detail: "Snapshot state gives the workstation a stable readout for debugging and future save flows.",
    },
    {
      label: "Queue match decision",
      status: readText(decision.status, "Decision helpers recovered"),
      priority: "Next",
      detail: "Decision helpers are compiling and can become visible controls after the dashboard grows safely.",
    },
  ];
}

export function MultiTrackActionQueuePanel({ engineState }: Props) {
  const queue = buildQueue(engineState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Action Queue
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Workstation next actions
          </h3>
        </div>

        <p className="max-w-xl text-sm leading-6 text-white/70">
          A visible queue for what the engine is ready to do next. These are
          display actions for now, not risky runtime mutations.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {queue.map((item, index) => (
          <article key={item.label} className={cardClass}>
            <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-black text-white">
                {index + 1}
              </div>

              <div>
                <h4 className="text-base font-black text-white">{item.label}</h4>
                <p className="mt-2 text-sm font-bold text-white/80">{item.status}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{item.detail}</p>
              </div>

              <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
                {item.priority}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}