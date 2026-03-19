"use client";

import MomentInspectorPhraseFamilyHealthBar from "./MomentInspectorPhraseFamilyHealthBar";

import MomentInspectorSelectedFamilyDecisionStrip from "./MomentInspectorSelectedFamilyDecisionStrip";
import MomentInspectorSelectedFamilySignalSummaryPanel from "./MomentInspectorSelectedFamilySignalSummaryPanel";

import MomentInspectorSelectedFamilyDiagnostics from "./MomentInspectorSelectedFamilyDiagnostics";
import MomentInspectorSelectedFamilyRepairGuidance from "./MomentInspectorSelectedFamilyRepairGuidance";
import MomentInspectorSelectedFamilyConfidenceExplainer from "./MomentInspectorSelectedFamilyConfidenceExplainer";

import MomentInspectorSelectedFamilyReadinessPanel from "./MomentInspectorSelectedFamilyReadinessPanel";
import MomentInspectorSelectedFamilyEngineVerdictPanel from "./MomentInspectorSelectedFamilyEngineVerdictPanel";
import MomentInspectorSelectedFamilyRiskFactorsPanel from "./MomentInspectorSelectedFamilyRiskFactorsPanel";
import MomentInspectorSelectedFamilyNextStepsPanel from "./MomentInspectorSelectedFamilyNextStepsPanel";

import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { ConfidenceHistoryResult } from "./playerMomentConfidenceHistory";
import type { FamilyLineageResult } from "./playerMomentFamilyLineage";
import type { FamilyTrustStateResult } from "./playerMomentFamilyTrustState";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function getStatusTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
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

export default function MomentInspectorSelectedFamilyStack(props: {
  selectedPhraseFamilyId: string;
  selectedActionSummaryRow: InspectorIntendedActionSummaryRow | null;
  selectedRepairQueueRow: InspectorRepairQueueRow | null;
  selectedDriftFamily: InspectorPhraseDriftFamilyRow | null;
  selectedStabilityFamily: InspectorPhraseStabilityFamilyRow | null;
  selectedTrustStateResult?: FamilyTrustStateResult | null;
  selectedConfidenceHistoryResult?: ConfidenceHistoryResult | null;
  selectedLineageResult?: FamilyLineageResult | null;
}) {
  const {
    selectedPhraseFamilyId,
    selectedActionSummaryRow,
    selectedRepairQueueRow,
    selectedDriftFamily,
    selectedStabilityFamily,
    selectedTrustStateResult = null,
    selectedConfidenceHistoryResult = null,
    selectedLineageResult = null,
  } = props;

  const familyId = normalizeText(selectedPhraseFamilyId);
  const hasSelectedFamily = Boolean(familyId);
  const hasActionData = Boolean(selectedActionSummaryRow);
  const hasRepairData = Boolean(selectedRepairQueueRow);
  const hasDriftData = Boolean(selectedDriftFamily);
  const hasStabilityData = Boolean(selectedStabilityFamily);
  const hasTrustData = Boolean(selectedTrustStateResult);
  const confidencePointCount = getConfidencePointCount(selectedConfidenceHistoryResult);
  const confidenceTrend = getConfidenceTrend(selectedConfidenceHistoryResult);
  const lineageSnapshotCount = getLineageSnapshotCount(selectedLineageResult);
  const lineageDirection = getLineageDirection(selectedLineageResult);
  const hasConfidenceHistory = confidencePointCount > 0 || Boolean(confidenceTrend);
  const hasLineage = lineageSnapshotCount > 0 || Boolean(lineageDirection);

  return (
    <div className="space-y-3">
      <div className="rounded border border-sky-100 bg-sky-50 px-2 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
            Selected Family
          </div>

          <div className="text-[10px] text-sky-700">
            {hasSelectedFamily ? familyId : "none"}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasActionData
            )}`}
          >
            Actions {hasActionData ? "ready" : "missing"}
          </div>

          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasRepairData
            )}`}
          >
            Repair {hasRepairData ? "ready" : "missing"}
          </div>

          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasDriftData
            )}`}
          >
            Drift {hasDriftData ? "ready" : "missing"}
          </div>

          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasStabilityData
            )}`}
          >
            Stability {hasStabilityData ? "ready" : "missing"}
          </div>

          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasTrustData
            )}`}
          >
            Trust {hasTrustData ? "ready" : "missing"}
          </div>

          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasConfidenceHistory
            )}`}
          >
            Confidence history {hasConfidenceHistory ? "ready" : "missing"}
          </div>

          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasLineage
            )}`}
          >
            Lineage {hasLineage ? "ready" : "missing"}
          </div>
        </div>
      </div>

      {(hasConfidenceHistory || hasLineage) ? (
        <div className="rounded border border-violet-100 bg-violet-50 px-2 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-violet-700">
            History + Lineage Signals
          </div>

          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div className="rounded border border-white bg-white px-2 py-2">
              <div className="text-[10px] text-zinc-500">Confidence History</div>
              <div className="mt-1 text-[11px] text-zinc-700">
                {hasConfidenceHistory
                  ? `${confidencePointCount} point${confidencePointCount === 1 ? "" : "s"}${
                      confidenceTrend ? ` • ${confidenceTrend}` : ""
                    }`
                  : "No confidence history available"}
              </div>
            </div>

            <div className="rounded border border-white bg-white px-2 py-2">
              <div className="text-[10px] text-zinc-500">Family Lineage</div>
              <div className="mt-1 text-[11px] text-zinc-700">
                {hasLineage
                  ? `${lineageSnapshotCount} snapshot${
                      lineageSnapshotCount === 1 ? "" : "s"
                    }${lineageDirection ? ` • ${lineageDirection}` : ""}`
                  : "No lineage available"}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <MomentInspectorSelectedFamilyDecisionStrip
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
      />

      <MomentInspectorPhraseFamilyHealthBar
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
      />

      <MomentInspectorSelectedFamilySignalSummaryPanel
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
      />

      <MomentInspectorSelectedFamilyDiagnostics
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
      />

      <MomentInspectorSelectedFamilyRepairGuidance
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
      />

      <MomentInspectorSelectedFamilyConfidenceExplainer
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
      />

      <MomentInspectorSelectedFamilyReadinessPanel
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
      />

      <MomentInspectorSelectedFamilyEngineVerdictPanel
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
        selectedTrustStateResult={selectedTrustStateResult}
      />

      <MomentInspectorSelectedFamilyRiskFactorsPanel
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
      />

      <MomentInspectorSelectedFamilyNextStepsPanel
        selectedPhraseFamilyId={selectedPhraseFamilyId}
        selectedActionSummaryRow={selectedActionSummaryRow}
        selectedRepairQueueRow={selectedRepairQueueRow}
        selectedDriftFamily={selectedDriftFamily}
        selectedStabilityFamily={selectedStabilityFamily}
      />
    </div>
  );
}