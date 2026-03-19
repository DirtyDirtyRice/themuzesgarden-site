"use client";

import MomentInspectorActionSummaryPanel from "./MomentInspectorActionSummaryPanel";
import MomentInspectorDriftSummaryPanel from "./MomentInspectorDriftSummaryPanel";
import MomentInspectorRepairFocusPanel from "./MomentInspectorRepairFocusPanel";
import MomentInspectorRepairQueuePanel from "./MomentInspectorRepairQueuePanel";
import MomentInspectorStabilitySummaryPanel from "./MomentInspectorStabilitySummaryPanel";

import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { ConfidenceHistoryResult } from "./playerMomentConfidenceHistory";
import type { FamilyLineageResult } from "./playerMomentFamilyLineage";
import type { FamilyTrustSummaryRow } from "./playerMomentFamilyTrustState";

function getCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
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

function getLineageSnapshotCount(result: FamilyLineageResult | null | undefined): number {
  const data = result as any;
  return readArrayLength(data?.snapshots ?? data?.rows ?? data?.timeline);
}

function getLineageDirection(result: FamilyLineageResult | null | undefined): string | null {
  const data = result as any;
  const direction = String(data?.direction ?? data?.summaryDirection ?? "").trim();
  return direction || null;
}

function getTopTrustFamilyLabel(rows: FamilyTrustSummaryRow[] | null | undefined): string {
  if (!rows?.length) return "none";
  return rows[0]?.familyId || "none";
}

export default function MomentInspectorFamilySummaryColumns(props: {
  selectedRepairQueueRow: InspectorRepairQueueRow | null;
  repairQueueRows: InspectorRepairQueueRow[];
  actionSummaryRows: InspectorIntendedActionSummaryRow[];
  driftFamilyRows: InspectorPhraseDriftFamilyRow[];
  stabilityFamilyRows: InspectorPhraseStabilityFamilyRow[];
  trustSummaryRows?: FamilyTrustSummaryRow[];
  selectedConfidenceHistoryResult?: ConfidenceHistoryResult | null;
  selectedLineageResult?: FamilyLineageResult | null;
}) {
  const {
    selectedRepairQueueRow,
    repairQueueRows,
    actionSummaryRows,
    driftFamilyRows,
    stabilityFamilyRows,
    trustSummaryRows = [],
    selectedConfidenceHistoryResult = null,
    selectedLineageResult = null,
  } = props;

  const confidencePointCount = getConfidencePointCount(selectedConfidenceHistoryResult);
  const confidenceTrend = getConfidenceTrend(selectedConfidenceHistoryResult);
  const lineageSnapshotCount = getLineageSnapshotCount(selectedLineageResult);
  const lineageDirection = getLineageDirection(selectedLineageResult);

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <div className="space-y-2">
        <div className="rounded border border-sky-100 bg-sky-50 px-2 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
            Repair + Action Coverage
          </div>

          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-sky-700">
            <div className="rounded border border-sky-200 bg-white px-2 py-1">
              Focus {selectedRepairQueueRow ? "selected" : "empty"}
            </div>
            <div className="rounded border border-sky-200 bg-white px-2 py-1">
              {getCountLabel(repairQueueRows.length, "repair row", "repair rows")}
            </div>
            <div className="rounded border border-sky-200 bg-white px-2 py-1">
              {getCountLabel(actionSummaryRows.length, "action family", "action families")}
            </div>
          </div>
        </div>

        <MomentInspectorRepairFocusPanel row={selectedRepairQueueRow} />
        <MomentInspectorRepairQueuePanel rows={repairQueueRows} />
        <MomentInspectorActionSummaryPanel rows={actionSummaryRows} />
      </div>

      <div className="space-y-2">
        <div className="rounded border border-sky-100 bg-sky-50 px-2 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
            Drift + Stability Coverage
          </div>

          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-sky-700">
            <div className="rounded border border-sky-200 bg-white px-2 py-1">
              {getCountLabel(driftFamilyRows.length, "drift family", "drift families")}
            </div>
            <div className="rounded border border-sky-200 bg-white px-2 py-1">
              {getCountLabel(
                stabilityFamilyRows.length,
                "stability family",
                "stability families"
              )}
            </div>
            <div className="rounded border border-sky-200 bg-white px-2 py-1">
              {getCountLabel(trustSummaryRows.length, "trust row", "trust rows")}
            </div>
          </div>
        </div>

        <div className="rounded border border-violet-100 bg-violet-50 px-2 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-violet-700">
            Engine Summary
          </div>

          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <div className="rounded border border-white bg-white px-2 py-2">
              <div className="text-[10px] text-zinc-500">Top Trust Family</div>
              <div className="mt-1 text-[11px] text-zinc-700">
                {getTopTrustFamilyLabel(trustSummaryRows)}
              </div>
            </div>

            <div className="rounded border border-white bg-white px-2 py-2">
              <div className="text-[10px] text-zinc-500">Confidence History</div>
              <div className="mt-1 text-[11px] text-zinc-700">
                {confidencePointCount
                  ? `${confidencePointCount} point${confidencePointCount === 1 ? "" : "s"}${
                      confidenceTrend ? ` • ${confidenceTrend}` : ""
                    }`
                  : "none"}
              </div>
            </div>

            <div className="rounded border border-white bg-white px-2 py-2">
              <div className="text-[10px] text-zinc-500">Lineage</div>
              <div className="mt-1 text-[11px] text-zinc-700">
                {lineageSnapshotCount
                  ? `${lineageSnapshotCount} snapshot${
                      lineageSnapshotCount === 1 ? "" : "s"
                    }${lineageDirection ? ` • ${lineageDirection}` : ""}`
                  : "none"}
              </div>
            </div>
          </div>
        </div>

        <MomentInspectorDriftSummaryPanel rows={driftFamilyRows} />
        <MomentInspectorStabilitySummaryPanel rows={stabilityFamilyRows} />
      </div>
    </div>
  );
}