"use client";

import { normalizeStart } from "./momentInspectorHelpers";
import { buildInspectorLineageTimelineView } from "./momentInspectorLineageTimelineView";
import { formatMomentTime } from "./playerUtils";
import type { TrackSection } from "./playerTypes";
import type { ConfidenceHistoryResult } from "./playerMomentConfidenceHistory";
import type { FamilyLineageResult } from "./playerMomentFamilyLineage";

function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(clamp100(value))}%`;
}

function formatDelta(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  if (n > 0) return `+${Math.round(n)}`;
  return `${Math.round(n)}`;
}

function getDirectionTone(direction: string): string {
  if (direction === "improving") return "text-emerald-700";
  if (direction === "declining") return "text-red-700";
  if (direction === "volatile") return "text-amber-700";
  if (direction === "flat") return "text-sky-700";
  return "text-zinc-600";
}

function getDirectionLabel(direction: string): string {
  return String(direction || "unknown").replace(/-/g, " ");
}

function readArrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function getConfidencePointCount(result: ConfidenceHistoryResult | null | undefined): number {
  const data = result as any;
  return readArrayLength(data?.points ?? data?.history ?? data?.rows);
}

function getConfidenceTrend(result: ConfidenceHistoryResult | null | undefined): string | null {
  const data = result as any;
  const trend = String(data?.trend ?? data?.summaryTrend ?? "").trim();
  return trend || null;
}

function MiniMetricCard(props: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  const { label, value, valueClassName = "text-zinc-700" } = props;

  return (
    <div className="rounded border border-white bg-white/80 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-[11px] font-medium ${valueClassName}`}>{value}</div>
    </div>
  );
}

function SectionTimelineRow(props: {
  section: TrackSection;
  index: number;
  sections: TrackSection[];
  maxStart: number;
}) {
  const { section, index, sections, maxStart } = props;

  const start = normalizeStart(section.start);
  const prevSection = sections[index - 1];
  const prevStart = prevSection ? normalizeStart(prevSection.start) : null;
  const isOutOfOrder = prevStart !== null && start !== null ? start < prevStart : false;

  const widthPct =
    start !== null && maxStart > 0 ? Math.max(3, Math.round((start / maxStart) * 100)) : 3;

  return (
    <div key={`timeline:${String(section.id)}:${index}`}>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-zinc-600">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate">{String(section.id)}</span>

          {isOutOfOrder ? (
            <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] text-red-700">
              Out of Order
            </span>
          ) : null}
        </div>

        <span>{start === null ? "(no start)" : formatMomentTime(start)}</span>
      </div>

      <div className="h-2 overflow-hidden rounded bg-zinc-100">
        <div className="h-full bg-zinc-700" style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  );
}

export default function MomentInspectorTimelinePanel(props: {
  trimmedFilter: string;
  filteredSections: TrackSection[];
  sections: TrackSection[];
  filteredStats: {
    filteredWithStart: number;
    filteredOutOfOrderCount: number;
    filteredMaxStart: number;
  };
  sectionStats: {
    sectionsWithStart: number;
    outOfOrderCount: number;
    maxStart: number;
  };
  selectedLineageResult?: FamilyLineageResult | null;
  selectedConfidenceHistoryResult?: ConfidenceHistoryResult | null;
}) {
  const {
    trimmedFilter,
    filteredSections,
    sections,
    filteredStats,
    sectionStats,
    selectedLineageResult = null,
    selectedConfidenceHistoryResult = null,
  } = props;

  const timelineSections = trimmedFilter ? filteredSections : sections;
  const timelineSectionCount = timelineSections.length;
  const timelineWithStart = trimmedFilter
    ? filteredStats.filteredWithStart
    : sectionStats.sectionsWithStart;
  const timelineOutOfOrderCount = trimmedFilter
    ? filteredStats.filteredOutOfOrderCount
    : sectionStats.outOfOrderCount;
  const maxStart = trimmedFilter ? filteredStats.filteredMaxStart : sectionStats.maxStart;

  const lineageView = buildInspectorLineageTimelineView(selectedLineageResult);
  const confidencePointCount = getConfidencePointCount(selectedConfidenceHistoryResult);
  const confidenceTrend = getConfidenceTrend(selectedConfidenceHistoryResult);

  return (
    <div className="rounded-lg border bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-zinc-700">Section Timeline</div>
        <div className="text-[10px] text-zinc-500">
          {trimmedFilter ? "Filtered start distribution" : "Visual start distribution"}
        </div>
      </div>

      <div className="mt-1 text-[10px] text-zinc-500">
        {trimmedFilter
          ? `${timelineSectionCount} filtered section${
              timelineSectionCount === 1 ? "" : "s"
            } • starts found: ${timelineWithStart} • ordering issues: ${timelineOutOfOrderCount}`
          : `${timelineSectionCount} total section${
              timelineSectionCount === 1 ? "" : "s"
            } • starts found: ${timelineWithStart} • ordering issues: ${timelineOutOfOrderCount}`}
      </div>

      <div className="mt-2 space-y-2">
        {timelineSections.length > 0 ? (
          timelineSections.map((section, index) => (
            <SectionTimelineRow
              key={`timeline:${String(section.id)}:${index}`}
              section={section}
              index={index}
              sections={timelineSections}
              maxStart={maxStart}
            />
          ))
        ) : (
          <div className="text-[10px] text-zinc-500">(none)</div>
        )}
      </div>

      {lineageView ? (
        <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium text-violet-800">Family Lineage Timeline</div>
            <div className={`text-[10px] font-medium ${getDirectionTone(lineageView.direction)}`}>
              {getDirectionLabel(lineageView.direction)}
            </div>
          </div>

          <div className="mt-1 text-[10px] text-violet-700">
            {lineageView.snapshotCount} snapshot{lineageView.snapshotCount === 1 ? "" : "s"} •
            trust delta {formatDelta(lineageView.totalTrustDelta)}
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <MiniMetricCard
              label="Latest Trust"
              value={formatPercent(lineageView.latestTrustScore)}
            />
            <MiniMetricCard
              label="Previous Trust"
              value={formatPercent(lineageView.previousTrustScore)}
            />
            <MiniMetricCard
              label="Direction"
              value={getDirectionLabel(lineageView.direction)}
              valueClassName={getDirectionTone(lineageView.direction)}
            />
          </div>

          <div className="mt-3 space-y-2">
            {lineageView.rows.length ? (
              lineageView.rows.map((row) => (
                <div
                  key={`${lineageView.familyId}:${row.revisionId}:${row.orderIndex}`}
                  className="rounded border border-white bg-white/80 px-2 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-medium text-zinc-700">{row.revisionId}</div>
                    <div className="text-[10px] text-zinc-500">rev #{row.orderIndex}</div>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    <MiniMetricCard label="Trust" value={formatPercent(row.trustScore)} />
                    <MiniMetricCard label="Level" value={row.trustLevel} />
                    <MiniMetricCard label="Recovery" value={formatPercent(row.recoveryScore)} />
                    <MiniMetricCard
                      label="Volatility"
                      value={formatPercent(row.volatilityScore)}
                    />
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <MiniMetricCard
                      label="Repair Opportunity"
                      value={formatPercent(row.repairOpportunityScore)}
                    />
                    <MiniMetricCard
                      label="Strongest Reason"
                      value={row.strongestReason ? row.strongestReason.replace(/-/g, " ") : "—"}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[10px] text-violet-700">No lineage snapshots available yet.</div>
            )}
          </div>
        </div>
      ) : null}

      {confidencePointCount > 0 || confidenceTrend ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium text-emerald-800">Confidence History</div>
            <div className="text-[10px] text-emerald-700">
              {confidencePointCount} point{confidencePointCount === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-1 text-[10px] text-emerald-700">
            {confidenceTrend ? `trend: ${confidenceTrend}` : "trend unavailable"}
          </div>
        </div>
      ) : null}
    </div>
  );
}