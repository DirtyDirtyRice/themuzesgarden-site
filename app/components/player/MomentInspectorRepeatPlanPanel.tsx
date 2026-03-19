"use client";

import { formatMomentTime } from "./playerUtils";

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function formatRepeatHint(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) return "n/a";
  return `${value.toFixed(2)} sec`;
}

function formatDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return `${value.toFixed(2)} sec`;
}

function formatScorePercent(value: number): string {
  const pct = Math.round(clamp01(Number(value) || 0) * 100);
  return `${pct}%`;
}

function getStatusTone(status: "present" | "near" | "missing"): string {
  if (status === "present") return "text-emerald-700";
  if (status === "near") return "text-amber-700";
  return "text-red-700";
}

function getPlacementCardTone(status: "present" | "near" | "missing"): string {
  if (status === "present") return "border-emerald-100 bg-emerald-50";
  if (status === "near") return "border-amber-100 bg-amber-50";
  return "border-red-100 bg-red-50";
}

function getStatusRank(status: "present" | "near" | "missing"): number {
  if (status === "missing") return 0;
  if (status === "near") return 1;
  return 2;
}

function getCoverageScore(params: {
  presentCount: number;
  nearCount: number;
  missingCount: number;
}): number {
  const total = params.presentCount + params.nearCount + params.missingCount;
  if (total <= 0) return 0;

  const weighted = params.presentCount * 1 + params.nearCount * 0.6;
  return weighted / total;
}

export type MomentInspectorRepeatPlacementRow = {
  familyId: string;
  expectedAt: number;
  status: "present" | "near" | "missing";
  nearestMomentId: string | null;
  nearestActualStart: number | null;
  deltaFromExpected: number | null;
  confidence: number;
};

export type MomentInspectorRepeatPlanPanelRow = {
  familyId: string;
  repeatInterval: number | null;
  presentCount: number;
  nearCount: number;
  missingCount: number;
  intendedStart: number | null;
  intendedEnd: number | null;
};

export default function MomentInspectorRepeatPlanPanel(props: {
  row: MomentInspectorRepeatPlanPanelRow | null;
  placements: MomentInspectorRepeatPlacementRow[];
}) {
  const { row, placements } = props;

  if (!row) return null;

  const coverageScore = getCoverageScore({
    presentCount: row.presentCount,
    nearCount: row.nearCount,
    missingCount: row.missingCount,
  });

  const orderedPlacements = placements.slice().sort((a, b) => {
    const statusCompare = getStatusRank(a.status) - getStatusRank(b.status);
    if (statusCompare !== 0) return statusCompare;

    const deltaA = Math.abs(a.deltaFromExpected ?? 0);
    const deltaB = Math.abs(b.deltaFromExpected ?? 0);
    if (deltaB !== deltaA) return deltaB - deltaA;

    if (b.confidence !== a.confidence) return b.confidence - a.confidence;

    return a.expectedAt - b.expectedAt;
  });

  return (
    <div className="mt-2 rounded border border-sky-200 bg-white px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
          Intended Repeat Plan
        </div>
        <div className="text-[10px] text-sky-700">
          every {formatRepeatHint(row.repeatInterval)}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded border border-sky-100 bg-sky-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-sky-700">Present</div>
          <div className="text-[12px] font-medium text-zinc-800">{row.presentCount}</div>
        </div>

        <div className="rounded border border-sky-100 bg-sky-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-sky-700">Near</div>
          <div className="text-[12px] font-medium text-zinc-800">{row.nearCount}</div>
        </div>

        <div className="rounded border border-sky-100 bg-sky-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-sky-700">Missing</div>
          <div className="text-[12px] font-medium text-zinc-800">{row.missingCount}</div>
        </div>

        <div className="rounded border border-sky-100 bg-sky-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-sky-700">Coverage</div>
          <div className="text-[12px] font-medium text-zinc-800">
            {formatScorePercent(coverageScore)}
          </div>
        </div>

        <div className="rounded border border-sky-100 bg-sky-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-sky-700">Family</div>
          <div className="truncate text-[12px] font-medium text-zinc-800">{row.familyId}</div>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-zinc-600">
        intended range{" "}
        {row.intendedStart !== null ? formatMomentTime(row.intendedStart) : "n/a"} →{" "}
        {row.intendedEnd !== null ? formatMomentTime(row.intendedEnd) : "n/a"}
      </div>

      {orderedPlacements.length > 0 ? (
        <div className="mt-2 space-y-1">
          {orderedPlacements.slice(0, 10).map((placement, index) => (
            <div
              key={`${placement.familyId}:${placement.expectedAt}:${index}`}
              className={`rounded border px-2 py-1 ${getPlacementCardTone(placement.status)}`}
            >
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <div className="min-w-0 truncate text-zinc-700">
                  expected {formatMomentTime(placement.expectedAt)}
                </div>
                <div className={getStatusTone(placement.status)}>
                  {placement.status} • conf {formatScorePercent(placement.confidence)}
                </div>
              </div>

              <div className="mt-1 text-[10px] text-zinc-600">
                {placement.nearestMomentId ? `nearest ${placement.nearestMomentId}` : "no nearest moment"}
                {placement.nearestActualStart !== null
                  ? ` • actual ${formatMomentTime(placement.nearestActualStart)}`
                  : ""}
                {placement.deltaFromExpected !== null
                  ? ` • Δ ${formatDelta(placement.deltaFromExpected)}`
                  : ""}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}