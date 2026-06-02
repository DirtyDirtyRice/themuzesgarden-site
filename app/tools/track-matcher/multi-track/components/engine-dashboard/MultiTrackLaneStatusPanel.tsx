"use client";

type Props = {
  engineState: unknown;
};

type LaneCard = {
  title: string;
  status: string;
  source: string;
  readiness: string;
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

function buildLaneCards(engineState: unknown): LaneCard[] {
  const state = readRecord(engineState);
  const trackA = readRecord(state.trackA ?? state.trackOne ?? state.primaryTrack);
  const trackB = readRecord(state.trackB ?? state.trackTwo ?? state.secondaryTrack);
  const sync = readRecord(state.sync);
  const relationship = readRecord(state.relationship);

  return [
    {
      title: "Lane A",
      status: readText(trackA.status, "Standing by"),
      source: readText(trackA.source ?? trackA.sourceLabel, "Source not loaded"),
      readiness: readText(trackA.readiness ?? sync.trackAReadiness, "Ready shell"),
      detail: "Primary comparison lane for song, stem, upload, finder result, or library track.",
    },
    {
      title: "Lane B",
      status: readText(trackB.status, "Standing by"),
      source: readText(trackB.source ?? trackB.sourceLabel, "Source not loaded"),
      readiness: readText(trackB.readiness ?? sync.trackBReadiness, "Ready shell"),
      detail: "Secondary comparison lane for match testing, sync prep, and relationship review.",
    },
    {
      title: "Relationship Lane",
      status: readText(relationship.status, "Recovered and compiling"),
      source: "Relationship layer",
      readiness: readText(relationship.readiness, "Green foundation"),
      detail: "Keeps track relationships visible without restoring the broken insight layer.",
    },
    {
      title: "Sync Lane",
      status: readText(sync.status, "Recovered and compiling"),
      source: "Sync layer",
      readiness: readText(sync.readiness, "Green foundation"),
      detail: "Prepares future timing alignment, beat grids, and workstation sync actions.",
    },
  ];
}

export function MultiTrackLaneStatusPanel({ engineState }: Props) {
  const laneCards = buildLaneCards(engineState);

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Lane Status
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Active multi-track lanes
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          This panel turns the recovered engine state into a workstation lane
          view so future loaded tracks, stems, relationships, and sync systems
          have a stable visible home.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {laneCards.map((lane) => (
          <article key={lane.title} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  {lane.title}
                </p>
                <h4 className="mt-2 text-lg font-black text-white">{lane.status}</h4>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
                {lane.readiness}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                Source
              </p>
              <p className="mt-1 text-sm font-bold text-white">{lane.source}</p>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/70">{lane.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}