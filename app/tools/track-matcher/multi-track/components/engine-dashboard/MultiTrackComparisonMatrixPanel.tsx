"use client";

type Props = {
  engineState: unknown;
};

type MatrixRow = {
  label: string;
  left: string;
  right: string;
  status: string;
  note: string;
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

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function buildRows(engineState: unknown): MatrixRow[] {
  const state = readRecord(engineState);
  const trackA = readRecord(state.trackA ?? state.trackOne ?? state.primaryTrack);
  const trackB = readRecord(state.trackB ?? state.trackTwo ?? state.secondaryTrack);
  const comparison = readRecord(state.comparison);
  const score = readRecord(state.score);

  return [
    {
      label: "Track identity",
      left: readText(trackA.title ?? trackA.name ?? trackA.label, "Track A waiting"),
      right: readText(trackB.title ?? trackB.name ?? trackB.label, "Track B waiting"),
      status: readText(comparison.identityStatus, "Ready for mapping"),
      note: "Compares the two active lanes before deeper engine scoring.",
    },
    {
      label: "Tempo / timing",
      left: `${readNumber(trackA.bpm, 0) || "Unknown"} BPM`,
      right: `${readNumber(trackB.bpm, 0) || "Unknown"} BPM`,
      status: readText(comparison.tempoStatus, "Sync prepared"),
      note: "Shows whether timing information is available for future alignment.",
    },
    {
      label: "Key / pitch",
      left: readText(trackA.key ?? trackA.musicalKey, "Key pending"),
      right: readText(trackB.key ?? trackB.musicalKey, "Key pending"),
      status: readText(comparison.pitchStatus, "Pitch check queued"),
      note: "Prepares the workstation for harmonic match decisions.",
    },
    {
      label: "Engine confidence",
      left: `${readNumber(score.trackAConfidence, 0)}%`,
      right: `${readNumber(score.trackBConfidence, 0)}%`,
      status: readText(score.status, "Confidence developing"),
      note: "Uses recovered score state when present and safe fallbacks when not.",
    },
  ];
}

export function MultiTrackComparisonMatrixPanel({ engineState }: Props) {
  const rows = buildRows(engineState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Comparison Matrix
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Track-to-track workstation map
          </h3>
        </div>

        <p className="max-w-xl text-sm leading-6 text-white/70">
          A real dashboard surface for comparing loaded lanes, timing, pitch,
          confidence, and future AI match decisions.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <article key={row.label} className={cardClass}>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.3fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Area
                </p>
                <p className="mt-1 text-sm font-black text-white">{row.label}</p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Lane A
                </p>
                <p className="mt-1 text-sm font-bold text-white">{row.left}</p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Lane B
                </p>
                <p className="mt-1 text-sm font-bold text-white">{row.right}</p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Engine read
                </p>
                <p className="mt-1 text-sm font-black text-white">{row.status}</p>
                <p className="mt-2 text-xs leading-5 text-white/70">{row.note}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}