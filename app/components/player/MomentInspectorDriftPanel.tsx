"use client";

import {
  getPhraseDriftLabelUi,
  getPhraseDriftSeverityUi,
  type InspectorPhraseDriftFamilyRow,
  type InspectorPhraseDriftMemberRow,
} from "./momentInspectorPhraseDriftView";
import { formatMomentTime } from "./playerUtils";

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
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

function formatWholePercent(value: number): string {
  return `${Math.round(clamp100(value))}%`;
}

function formatScorePercent(value: number): string {
  const pct = Math.round(clamp01(value) * 100);
  return `${pct}%`;
}

function getDriftTone(label: string | null | undefined): string {
  if (label === "stable") return "text-emerald-700";
  if (label === "early" || label === "late") return "text-amber-700";
  if (label === "stretched" || label === "compressed") return "text-yellow-700";
  if (label === "mixed") return "text-red-700";
  return "text-zinc-600";
}

function getSeverityTone(severity: string | null | undefined): string {
  if (severity === "none") return "text-emerald-700";
  if (severity === "low") return "text-sky-700";
  if (severity === "medium") return "text-amber-700";
  if (severity === "high") return "text-red-700";
  return "text-zinc-600";
}

function getMemberCardTone(label: string | null | undefined): string {
  if (label === "mixed") return "border-red-100 bg-red-50";
  if (label === "early" || label === "late") return "border-amber-100 bg-amber-50";
  if (label === "stretched" || label === "compressed") {
    return "border-yellow-100 bg-yellow-50";
  }
  return "border-emerald-100 bg-emerald-50";
}

export default function MomentInspectorDriftPanel(props: {
  family: InspectorPhraseDriftFamilyRow | null;
  members: InspectorPhraseDriftMemberRow[];
}) {
  const { family, members } = props;

  if (!family) return null;

  const visibleMembers = members.slice(0, 8);

  return (
    <div className="mt-2 rounded border border-rose-200 bg-white px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-rose-700">
          Phrase Drift
        </div>

        <div className={`text-[10px] ${getSeverityTone(family.highestSeverity)}`}>
          {getPhraseDriftSeverityUi(family.highestSeverity)}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded border border-rose-100 bg-rose-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-rose-700">
            Dominant Drift
          </div>
          <div className={`text-[12px] font-medium ${getDriftTone(family.dominantDriftLabel)}`}>
            {getPhraseDriftLabelUi(family.dominantDriftLabel)}
          </div>
        </div>

        <div className="rounded border border-rose-100 bg-rose-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-rose-700">
            Stable / Unstable
          </div>
          <div className="text-[12px] font-medium text-zinc-800">
            {family.stableCount} / {family.unstableCount}
          </div>
        </div>

        <div className="rounded border border-rose-100 bg-rose-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-rose-700">
            Avg Timing Offset
          </div>
          <div className="text-[12px] font-medium text-zinc-800">
            {formatDelta(family.averageAbsoluteTimingOffset)}
          </div>
        </div>

        <div className="rounded border border-rose-100 bg-rose-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-rose-700">
            Avg Duration Drift
          </div>
          <div className="text-[12px] font-medium text-zinc-800">
            {formatDelta(family.averageAbsoluteDurationDrift)}
          </div>
        </div>

        <div className="rounded border border-rose-100 bg-rose-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-rose-700">
            Drift Health
          </div>
          <div className="text-[12px] font-medium text-zinc-800">
            {formatWholePercent(family.driftHealthScore)}
          </div>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-zinc-600">
        family {family.familyId} • repeat hint {formatRepeatHint(family.repeatIntervalHint)}
      </div>

      {visibleMembers.length > 0 ? (
        <div className="mt-2 space-y-1">
          {visibleMembers.map((row) => (
            <div
              key={`${row.familyId}:${row.momentId}:${row.memberIndex}`}
              className={`rounded border px-2 py-1 ${getMemberCardTone(row.driftLabel)}`}
            >
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <div className="min-w-0 truncate font-medium text-zinc-800">
                  {row.momentId}
                </div>

                <div className="flex items-center gap-2">
                  <span className={getDriftTone(row.driftLabel)}>
                    {getPhraseDriftLabelUi(row.driftLabel)}
                  </span>
                  <span className={getSeverityTone(row.driftSeverity)}>
                    {getPhraseDriftSeverityUi(row.driftSeverity)}
                  </span>
                </div>
              </div>

              <div className="mt-1 text-[10px] text-zinc-600">
                expected{" "}
                {row.expectedStartTime !== null
                  ? formatMomentTime(row.expectedStartTime)
                  : "n/a"}
                {" • "}actual{" "}
                {row.actualStartTime !== null
                  ? formatMomentTime(row.actualStartTime)
                  : "n/a"}
              </div>

              <div className="mt-1 text-[10px] text-zinc-500">
                timing Δ {formatDelta(row.timingOffset)}
                {" • "}duration Δ {formatDelta(row.durationDrift)}
                {" • "}conf {formatScorePercent(row.confidenceScore)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}