"use client";

import { buildMomentInspectorRuntimeDiagnostic } from "./momentInspectorRuntimeDiagnostics";
import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";

function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function formatPercent01(value: number): string {
  return `${Math.round(clamp01(value) * 100)}%`;
}

function formatPercent100(value: number): string {
  return `${Math.round(clamp100(value))}%`;
}

function formatScore(value: number): string {
  return Number(value.toFixed(1)).toString();
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function getVerdictUi(
  verdict: "stable" | "watch" | "repair" | "blocked"
): string {
  if (verdict === "stable") return "STABLE";
  if (verdict === "watch") return "WATCH";
  if (verdict === "repair") return "REPAIR";
  return "BLOCKED";
}

function getChipTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
}

function getMetricTone(value: number): string {
  if (value >= 75) return "text-emerald-700";
  if (value >= 55) return "text-amber-700";
  return "text-red-700";
}

function getInverseMetricTone(value: number): string {
  if (value >= 70) return "text-red-700";
  if (value >= 30) return "text-amber-700";
  return "text-emerald-700";
}

export default function MomentInspectorSelectedFamilyDiagnostics(props: {
  selectedPhraseFamilyId: string;
  selectedActionSummaryRow: InspectorIntendedActionSummaryRow | null;
  selectedRepairQueueRow: InspectorRepairQueueRow | null;
  selectedDriftFamily: InspectorPhraseDriftFamilyRow | null;
  selectedStabilityFamily: InspectorPhraseStabilityFamilyRow | null;
}) {
  const {
    selectedPhraseFamilyId,
    selectedActionSummaryRow,
    selectedRepairQueueRow,
    selectedDriftFamily,
    selectedStabilityFamily,
  } = props;

  const familyId = normalizeText(selectedPhraseFamilyId);
  if (!familyId) return null;

  const diagnostic = buildMomentInspectorRuntimeDiagnostic({
    familyId,
    actionSummaryRow: selectedActionSummaryRow,
    driftFamilyRow: selectedDriftFamily,
    repairQueueRow: selectedRepairQueueRow,
    stabilityFamilyRow: selectedStabilityFamily,
  });

  const hasActionSummary = Boolean(selectedActionSummaryRow);
  const hasRepairQueue = Boolean(selectedRepairQueueRow);
  const hasDriftData = Boolean(selectedDriftFamily);
  const hasStabilityData = Boolean(selectedStabilityFamily);
  const hasRiskFlags = diagnostic.riskFlags.length > 0;
  const hasDiagnosticNotes = diagnostic.diagnosticNotes.length > 0;

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-indigo-700">
          Selected Family Diagnostics
        </div>
        <div className="text-[10px] text-indigo-700">
          {familyId} • {getVerdictUi(diagnostic.engineVerdict)}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <div className={`rounded border px-2 py-1 text-[10px] ${getChipTone(hasActionSummary)}`}>
          Actions {hasActionSummary ? "ready" : "missing"}
        </div>
        <div className={`rounded border px-2 py-1 text-[10px] ${getChipTone(hasRepairQueue)}`}>
          Repair {hasRepairQueue ? "ready" : "missing"}
        </div>
        <div className={`rounded border px-2 py-1 text-[10px] ${getChipTone(hasDriftData)}`}>
          Drift {hasDriftData ? "ready" : "missing"}
        </div>
        <div className={`rounded border px-2 py-1 text-[10px] ${getChipTone(hasStabilityData)}`}>
          Stability {hasStabilityData ? "ready" : "missing"}
        </div>
        <div className={`rounded border px-2 py-1 text-[10px] ${getChipTone(hasRiskFlags)}`}>
          Risk Flags {hasRiskFlags ? "active" : "clear"}
        </div>
        <div
          className={`rounded border px-2 py-1 text-[10px] ${getChipTone(hasDiagnosticNotes)}`}
        >
          Notes {hasDiagnosticNotes ? "ready" : "empty"}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-indigo-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Intended Actions
          </div>
          {selectedActionSummaryRow ? (
            <div className="mt-1 text-[11px] text-zinc-700">
              total {selectedActionSummaryRow.totalActions} • missing{" "}
              {selectedActionSummaryRow.missingActions} • near{" "}
              {selectedActionSummaryRow.nearActions} • present{" "}
              {selectedActionSummaryRow.presentActions} • top{" "}
              {formatPercent01(selectedActionSummaryRow.topConfidence)}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-zinc-500">
              No action summary available.
            </div>
          )}
        </div>

        <div className="rounded border border-indigo-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Repair Queue
          </div>
          {selectedRepairQueueRow ? (
            <div className="mt-1 text-[11px] text-zinc-700">
              priority {formatScore(selectedRepairQueueRow.repairPriorityScore)} •
              missing {selectedRepairQueueRow.missingCount} • near{" "}
              {selectedRepairQueueRow.nearCount} • drift unstable{" "}
              {selectedRepairQueueRow.driftUnstableCount} • stability{" "}
              {selectedRepairQueueRow.stabilityScore === null
                ? "n/a"
                : formatPercent100(selectedRepairQueueRow.stabilityScore)}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-zinc-500">
              No repair queue entry available.
            </div>
          )}
        </div>

        <div className="rounded border border-indigo-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Phrase Drift
          </div>
          {selectedDriftFamily ? (
            <div className="mt-1 text-[11px] text-zinc-700">
              severity {String(selectedDriftFamily.highestSeverity)} • unstable{" "}
              {selectedDriftFamily.unstableCount}/{selectedDriftFamily.comparedMemberCount} •
              health {formatPercent100(selectedDriftFamily.driftHealthScore)}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-zinc-500">
              No drift data available.
            </div>
          )}
        </div>

        <div className="rounded border border-indigo-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Phrase Stability
          </div>
          {selectedStabilityFamily ? (
            <div className="mt-1 text-[11px] text-zinc-700">
              label {String(selectedStabilityFamily.stabilityLabel)} • score{" "}
              {formatPercent100(selectedStabilityFamily.stabilityScore)} • repeat{" "}
              {formatPercent100(selectedStabilityFamily.repeatCoverage)} • structure{" "}
              {formatPercent100(selectedStabilityFamily.structuralConfidence)}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-zinc-500">
              No stability data available.
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-indigo-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Runtime Scores
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            <div className={getMetricTone(diagnostic.confidenceScore)}>
              confidence {formatPercent100(diagnostic.confidenceScore)}
            </div>
            <div className={getInverseMetricTone(diagnostic.driftSeverityScore)}>
              drift severity {formatPercent100(diagnostic.driftSeverityScore)}
            </div>
            <div className={getInverseMetricTone(diagnostic.repairPriorityScore * 10)}>
              repair priority {formatScore(diagnostic.repairPriorityScore)}
            </div>
            <div className={getMetricTone(diagnostic.readinessScore)}>
              readiness {formatPercent100(diagnostic.readinessScore)}
            </div>
          </div>
        </div>

        <div className="rounded border border-indigo-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Risk Flags
          </div>
          {diagnostic.riskFlags.length ? (
            <div className="mt-1 text-[11px] text-zinc-700">
              {diagnostic.riskFlags.join(" • ")}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-zinc-500">
              No runtime risk flags detected.
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 rounded border border-indigo-200 bg-white px-2 py-2">
        <div className="text-[10px] uppercase tracking-wide text-zinc-500">
          Diagnostic Notes
        </div>
        {diagnostic.diagnosticNotes.length ? (
          <div className="mt-1 space-y-1">
            {diagnostic.diagnosticNotes.map((note, idx) => (
              <div key={`${familyId}:note:${idx}`} className="text-[11px] text-zinc-700">
                {note}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-zinc-500">
            No diagnostic notes available.
          </div>
        )}
      </div>
    </div>
  );
}