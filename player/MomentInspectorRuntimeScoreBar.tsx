"use client";

function clamp01(value: number | null): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(clamp01(value) * 100)}%`;
}

function getFillClass(label: "outcome" | "learning" | "optimization" | "repair"): string {
  if (label === "outcome") return "bg-sky-500";
  if (label === "learning") return "bg-emerald-500";
  if (label === "optimization") return "bg-violet-500";
  return "bg-amber-500";
}

function ScoreRow(props: {
  label: "outcome" | "learning" | "optimization" | "repair";
  value: number | null;
}) {
  const { label, value } = props;
  const width = `${Math.round(clamp01(value) * 100)}%`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <div className="uppercase tracking-wide text-zinc-600">{label}</div>
        <div className="font-medium text-zinc-700">{formatPercent(value)}</div>
      </div>

      <div className="h-2 rounded-full bg-zinc-200">
        <div
          className={`h-2 rounded-full ${getFillClass(label)}`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

export default function MomentInspectorRuntimeScoreBar(props: {
  outcomeScore: number | null;
  learningScore: number | null;
  optimizationScore: number | null;
  repairScore: number | null;
}) {
  const { outcomeScore, learningScore, optimizationScore, repairScore } = props;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
          Runtime Score Bars
        </div>
        <div className="text-[10px] text-zinc-500">quick visual comparison</div>
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        <ScoreRow label="outcome" value={outcomeScore} />
        <ScoreRow label="learning" value={learningScore} />
        <ScoreRow label="optimization" value={optimizationScore} />
        <ScoreRow label="repair" value={repairScore} />
      </div>
    </div>
  );
}