"use client";

import {
  buildMomentInspectorRuntimeDiagnostic,
  type MomentInspectorEngineVerdict,
} from "./momentInspectorRuntimeDiagnostics";
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

function formatPercent100(value: number): string {
  return `${Math.round(clamp100(value))}%`;
}

function formatPercent01(value: number): string {
  return `${Math.round(clamp01(value) * 100)}%`;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

type ReadinessLabel = "Ready" | "Caution" | "Not Ready";

function getReadinessLabel(params: {
  verdict: MomentInspectorEngineVerdict;
  readinessScore: number;
}): ReadinessLabel {
  const { verdict, readinessScore } = params;

  if (verdict === "blocked" || verdict === "repair" || readinessScore < 55) {
    return "Not Ready";
  }

  if (verdict === "watch" || readinessScore < 75) {
    return "Caution";
  }

  return "Ready";
}

function getReadinessTone(label: ReadinessLabel): string {
  if (label === "Not Ready") return "text-red-700";
  if (label === "Caution") return "text-amber-700";
  return "text-emerald-700";
}

function getReadinessBg(label: ReadinessLabel): string {
  if (label === "Not Ready") return "border-red-200 bg-red-50";
  if (label === "Caution") return "border-amber-200 bg-amber-50";
  return "border-emerald-200 bg-emerald-50";
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

function getSupportChipTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
}

function getPrimaryReason(params: {
  missingActions: number;
  driftSeverityScore: number;
  stabilityScore: number;
  repairPriorityScore: number;
  confidenceScore: number;
  readinessScore: number;
}): string {
  const {
    missingActions,
    driftSeverityScore,
    stabilityScore,
    repairPriorityScore,
    confidenceScore,
    readinessScore,
  } = params;

  if (missingActions > 0) {
    return "Missing intended actions prevent this family from being trusted yet.";
  }

  if (driftSeverityScore >= 70) {
    return "Drift severity is too high for reliable search and discovery use.";
  }

  if (stabilityScore > 0 && stabilityScore < 55) {
    return "Phrase stability is too weak to trust this family consistently.";
  }

  if (repairPriorityScore >= 10) {
    return "Repair pressure is still too high for stronger engine trust.";
  }

  if (confidenceScore < 55) {
    return "Confidence is not strong enough yet for full readiness.";
  }

  if (readinessScore < 75) {
    return "This family is promising, but still needs more stabilization before full readiness.";
  }

  return "This family looks stable enough for future search and discovery experiments.";
}

function getRecommendedUse(label: ReadinessLabel): string {
  if (label === "Not Ready") {
    return "Use for debugging only. Do not let it strongly influence discovery or ranking.";
  }

  if (label === "Caution") {
    return "Use as a soft signal only. Keep human review or secondary checks in the loop.";
  }

  return "This family can be used as a stronger candidate signal for future search and discovery experiments.";
}

export default function MomentInspectorSelectedFamilyReadinessPanel(props: {
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

  const missingActions = Number(selectedActionSummaryRow?.missingActions ?? 0);
  const topConfidence = clamp01(Number(selectedActionSummaryRow?.topConfidence ?? 0));
  const stabilityScore = Number(selectedStabilityFamily?.stabilityScore ?? 0);

  const readiness = getReadinessLabel({
    verdict: diagnostic.engineVerdict,
    readinessScore: diagnostic.readinessScore,
  });

  const tone = getReadinessTone(readiness);
  const panelTone = getReadinessBg(readiness);

  const primaryReason = getPrimaryReason({
    missingActions,
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore,
    repairPriorityScore: diagnostic.repairPriorityScore,
    confidenceScore: diagnostic.confidenceScore,
    readinessScore: diagnostic.readinessScore,
  });

  const recommendedUse = getRecommendedUse(readiness);

  const hasActionCoverage = missingActions === 0;
  const hasStableDrift = diagnostic.driftSeverityScore < 30;
  const hasStableRepairPressure = diagnostic.repairPriorityScore < 5;
  const hasReadinessSupport = diagnostic.readinessScore >= 75;

  return (
    <div className={`rounded-lg border px-3 py-2 ${panelTone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
            Selected Family Readiness
          </div>
          <div className="mt-1 text-[10px] text-zinc-600">{familyId}</div>
        </div>

        <div className={`text-[10px] font-medium ${tone}`}>{readiness}</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <div
          className={`rounded border px-2 py-1 text-[10px] ${getSupportChipTone(
            hasActionCoverage
          )}`}
        >
          Actions {hasActionCoverage ? "covered" : "gapped"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getSupportChipTone(
            hasStableDrift
          )}`}
        >
          Drift {hasStableDrift ? "controlled" : "elevated"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getSupportChipTone(
            hasStableRepairPressure
          )}`}
        >
          Repair {hasStableRepairPressure ? "light" : "active"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getSupportChipTone(
            hasReadinessSupport
          )}`}
        >
          Readiness {hasReadinessSupport ? "supported" : "soft"}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-5">
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
            Top Confidence
          </div>
          <div
            className={`mt-1 text-[11px] font-medium ${getMetricTone(
              topConfidence * 100
            )}`}
          >
            {formatPercent01(topConfidence)}
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
              diagnostic.repairPriorityScore * 10
            )}`}
          >
            {Number(diagnostic.repairPriorityScore.toFixed(1))}
          </div>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Primary Reason
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{primaryReason}</div>
        </div>

        <div className="rounded border border-white bg-white/80 px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Recommended Use
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{recommendedUse}</div>
        </div>
      </div>
    </div>
  );
}