"use client";

import {
  buildMomentInspectorRuntimeDiagnostic,
  type MomentInspectorEngineVerdict,
} from "./momentInspectorRuntimeDiagnostics";
import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { FamilyTrustStateResult } from "./playerMomentFamilyTrustState";

function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function formatPercent100(value: number): string {
  return `${Math.round(clamp100(value))}%`;
}

function formatScore(value: number): string {
  return Number(clamp100(value).toFixed(1)).toString();
}

function formatTrustLevel(value: string | null | undefined): string {
  const clean = String(value ?? "").trim();
  if (!clean) return "—";
  return clean.replace(/-/g, " ").toUpperCase();
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function getVerdictUi(verdict: MomentInspectorEngineVerdict): string {
  if (verdict === "stable") return "STABLE";
  if (verdict === "watch") return "WATCH";
  if (verdict === "repair") return "REPAIR";
  return "BLOCKED";
}

function getVerdictTone(verdict: MomentInspectorEngineVerdict): string {
  if (verdict === "blocked") return "text-red-700";
  if (verdict === "repair") return "text-orange-700";
  if (verdict === "watch") return "text-amber-700";
  return "text-emerald-700";
}

function getVerdictPanelTone(verdict: MomentInspectorEngineVerdict): string {
  if (verdict === "blocked") return "border-red-200 bg-red-50";
  if (verdict === "repair") return "border-orange-200 bg-orange-50";
  if (verdict === "watch") return "border-amber-200 bg-amber-50";
  return "border-emerald-200 bg-emerald-50";
}

function getMetricTone(value: number): string {
  if (value >= 70) return "text-emerald-700";
  if (value >= 40) return "text-amber-700";
  return "text-red-700";
}

function getInverseMetricTone(value: number): string {
  if (value >= 70) return "text-red-700";
  if (value >= 40) return "text-amber-700";
  return "text-emerald-700";
}

function getStatusTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
}

function getVerdictReason(params: {
  verdict: MomentInspectorEngineVerdict;
  missingActions: number;
  confidenceScore: number;
  driftSeverityScore: number;
  repairPriorityScore: number;
  readinessScore: number;
  stabilityScore: number;
}): string {
  const {
    verdict,
    missingActions,
    confidenceScore,
    driftSeverityScore,
    repairPriorityScore,
    readinessScore,
    stabilityScore,
  } = params;

  if (verdict === "blocked") {
    if (missingActions >= 2) {
      return "Blocked because intended action coverage is too incomplete for safe engine trust.";
    }

    if (driftSeverityScore >= 78) {
      return "Blocked because drift severity is too high for stable engine use.";
    }

    if (repairPriorityScore >= 18) {
      return "Blocked because repair pressure is too high.";
    }

    if (stabilityScore > 0 && stabilityScore < 40) {
      return "Blocked because phrase stability is too weak.";
    }

    if (readinessScore < 35) {
      return "Blocked because this family is not ready for reliable downstream use.";
    }

    return "Blocked because the combined runtime signals are too weak.";
  }

  if (verdict === "repair") {
    if (missingActions > 0) {
      return "Repair because intended action coverage still has gaps.";
    }

    if (driftSeverityScore >= 55) {
      return "Repair because drift severity is still too elevated.";
    }

    if (repairPriorityScore >= 10) {
      return "Repair because queue priority remains meaningfully elevated.";
    }

    if (confidenceScore < 55) {
      return "Repair because confidence is still too soft.";
    }

    if (stabilityScore > 0 && stabilityScore < 60) {
      return "Repair because phrase stability is not strong enough yet.";
    }

    return "Repair because the family needs more stabilization before stronger trust.";
  }

  if (verdict === "watch") {
    if (driftSeverityScore >= 30) {
      return "Watch because drift is noticeable but not yet severe.";
    }

    if (repairPriorityScore >= 5) {
      return "Watch because some repair pressure remains active.";
    }

    if (confidenceScore < 75) {
      return "Watch because confidence is usable but not fully strong yet.";
    }

    if (readinessScore < 75) {
      return "Watch because readiness is promising but not fully proven.";
    }

    return "Watch because the family is promising but still mixed.";
  }

  return "Stable because confidence, readiness, drift control, and repair pressure are all in a healthy range.";
}

function getEngineUse(verdict: MomentInspectorEngineVerdict): string {
  if (verdict === "blocked") {
    return "Use for debugging only. Exclude from trusted discovery or ranking influence.";
  }

  if (verdict === "repair") {
    return "Keep in repair-first handling. Do not promote into stronger engine trust yet.";
  }

  if (verdict === "watch") {
    return "Allow as a soft engine signal only. Keep monitoring and secondary checks in the loop.";
  }

  return "Allow as a stronger candidate engine signal for future search, discovery, and ranking experiments.";
}

export default function MomentInspectorSelectedFamilyEngineVerdictPanel(props: {
  selectedPhraseFamilyId: string;
  selectedActionSummaryRow: InspectorIntendedActionSummaryRow | null;
  selectedRepairQueueRow: InspectorRepairQueueRow | null;
  selectedDriftFamily: InspectorPhraseDriftFamilyRow | null;
  selectedStabilityFamily: InspectorPhraseStabilityFamilyRow | null;
  selectedTrustStateResult?: FamilyTrustStateResult | null;
}) {
  const {
    selectedPhraseFamilyId,
    selectedActionSummaryRow,
    selectedRepairQueueRow,
    selectedDriftFamily,
    selectedStabilityFamily,
    selectedTrustStateResult = null,
  } = props;

  const familyId = normalizeText(selectedPhraseFamilyId);
  if (!familyId) return null;

  const diagnostic = buildMomentInspectorRuntimeDiagnostic({
    familyId,
    actionSummaryRow: selectedActionSummaryRow,
    driftFamilyRow: selectedDriftFamily,
    repairQueueRow: selectedRepairQueueRow,
    stabilityFamilyRow: selectedStabilityFamily,
    trustStateResult: selectedTrustStateResult,
  });

  const missingActions = Number(selectedActionSummaryRow?.missingActions ?? 0);
  const stabilityScore = Number(selectedStabilityFamily?.stabilityScore ?? 0);

  const verdictTone = getVerdictTone(diagnostic.engineVerdict);
  const panelTone = getVerdictPanelTone(diagnostic.engineVerdict);

  const verdictReason = getVerdictReason({
    verdict: diagnostic.engineVerdict,
    missingActions,
    confidenceScore: diagnostic.confidenceScore,
    driftSeverityScore: diagnostic.driftSeverityScore,
    repairPriorityScore: diagnostic.repairPriorityScore,
    readinessScore: diagnostic.readinessScore,
    stabilityScore,
  });

  const engineUse = getEngineUse(diagnostic.engineVerdict);
  const hasTrustReason = Boolean(normalizeText(diagnostic.trustStrongestReason));
  const hasTrustScore = diagnostic.trustScore !== null;
  const hasTrustLevel = Boolean(normalizeText(diagnostic.trustLevel));

  return (
    <div className={`rounded-lg border px-3 py-2 ${panelTone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
            Selected Family Engine Verdict
          </div>
          <div className="mt-1 text-[10px] text-zinc-600">{familyId}</div>
        </div>

        <div className={`text-[10px] font-medium ${verdictTone}`}>
          {getVerdictUi(diagnostic.engineVerdict)}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            Boolean(selectedActionSummaryRow)
          )}`}
        >
          Actions {selectedActionSummaryRow ? "ready" : "missing"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            Boolean(selectedRepairQueueRow)
          )}`}
        >
          Repair queue {selectedRepairQueueRow ? "ready" : "missing"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            Boolean(selectedDriftFamily)
          )}`}
        >
          Drift {selectedDriftFamily ? "ready" : "missing"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            Boolean(selectedStabilityFamily)
          )}`}
        >
          Stability {selectedStabilityFamily ? "ready" : "missing"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            Boolean(selectedTrustStateResult)
          )}`}
        >
          Trust state {selectedTrustStateResult ? "ready" : "missing"}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-7">
        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Confidence
          </div>
          <div
            className={`mt-1 text-[11px] font-medium ${getMetricTone(
              diagnostic.confidenceScore
            )}`}
          >
            {formatPercent100(diagnostic.confidenceScore)}
          </div>
        </div>

        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Trust Score
          </div>
          <div
            className={`mt-1 text-[11px] font-medium ${
              hasTrustScore ? getMetricTone(Number(diagnostic.trustScore)) : "text-zinc-700"
            }`}
          >
            {diagnostic.trustScore === null ? "—" : formatPercent100(diagnostic.trustScore)}
          </div>
        </div>

        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Trust Level
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatTrustLevel(diagnostic.trustLevel)}
          </div>
        </div>

        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Drift Severity
          </div>
          <div
            className={`mt-1 text-[11px] font-medium ${getInverseMetricTone(
              diagnostic.driftSeverityScore
            )}`}
          >
            {formatPercent100(diagnostic.driftSeverityScore)}
          </div>
        </div>

        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Repair Priority
          </div>
          <div
            className={`mt-1 text-[11px] font-medium ${getInverseMetricTone(
              diagnostic.repairPriorityScore
            )}`}
          >
            {formatScore(diagnostic.repairPriorityScore)}
          </div>
        </div>

        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Readiness
          </div>
          <div
            className={`mt-1 text-[11px] font-medium ${getMetricTone(
              diagnostic.readinessScore
            )}`}
          >
            {formatPercent100(diagnostic.readinessScore)}
          </div>
        </div>

        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Verdict
          </div>
          <div className={`mt-1 text-[11px] font-medium ${verdictTone}`}>
            {getVerdictUi(diagnostic.engineVerdict)}
          </div>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Verdict Reason
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{verdictReason}</div>
        </div>

        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Engine Use
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{engineUse}</div>
        </div>

        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Trust Reason
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">
            {hasTrustReason
              ? String(diagnostic.trustStrongestReason).replace(/-/g, " ")
              : "No trust-state reason available yet."}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            hasTrustScore
          )}`}
        >
          Trust score {hasTrustScore ? "available" : "missing"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            hasTrustLevel
          )}`}
        >
          Trust level {hasTrustLevel ? "available" : "missing"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            hasTrustReason
          )}`}
        >
          Trust reason {hasTrustReason ? "available" : "missing"}
        </div>
      </div>
    </div>
  );
}