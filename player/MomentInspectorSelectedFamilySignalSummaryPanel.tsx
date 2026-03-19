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

function formatPercent100(value: number): string {
  return `${Math.round(clamp100(value))}%`;
}

function formatScore(value: number): string {
  return Number(clamp100(value).toFixed(1)).toString();
}

function getVerdictUi(verdict: MomentInspectorEngineVerdict): string {
  if (verdict === "stable") return "STABLE";
  if (verdict === "watch") return "WATCH";
  if (verdict === "repair") return "REPAIR";
  return "BLOCKED";
}

function getStrongestPositive(params: {
  confidenceScore: number;
  readinessScore: number;
  driftSeverityScore: number;
  stabilityScore: number;
  missingActions: number;
}): string {
  const {
    confidenceScore,
    readinessScore,
    driftSeverityScore,
    stabilityScore,
    missingActions,
  } = params;

  if (
    confidenceScore >= 80 &&
    readinessScore >= 75 &&
    driftSeverityScore < 30 &&
    stabilityScore >= 75 &&
    missingActions === 0
  ) {
    return "Shared runtime diagnostics show strong trust across confidence, readiness, and stability.";
  }

  if (readinessScore >= 75) {
    return "Discovery readiness is currently the strongest positive signal.";
  }

  if (confidenceScore >= 75) {
    return "Confidence is currently the strongest positive signal.";
  }

  if (stabilityScore >= 75) {
    return "Phrase stability is currently the strongest positive signal.";
  }

  if (missingActions === 0) {
    return "No missing intended actions were detected.";
  }

  return "No dominant positive signal yet.";
}

function getStrongestNegative(params: {
  missingActions: number;
  driftSeverityScore: number;
  repairPriorityScore: number;
  stabilityScore: number;
  readinessScore: number;
}): string {
  const {
    missingActions,
    driftSeverityScore,
    repairPriorityScore,
    stabilityScore,
    readinessScore,
  } = params;

  if (missingActions > 0) {
    return "Missing intended actions are the strongest negative signal.";
  }

  if (driftSeverityScore >= 70) {
    return "High drift severity is the strongest negative signal.";
  }

  if (repairPriorityScore >= 12) {
    return "Repair queue pressure is the strongest negative signal.";
  }

  if (stabilityScore > 0 && stabilityScore < 55) {
    return "Weak phrase stability is the strongest negative signal.";
  }

  if (readinessScore < 55) {
    return "Low readiness is the strongest negative signal.";
  }

  return "No dominant negative signal detected.";
}

function getOverallSummary(params: {
  verdict: MomentInspectorEngineVerdict;
  confidenceScore: number;
  readinessScore: number;
  driftSeverityScore: number;
  missingActions: number;
}): string {
  const {
    verdict,
    confidenceScore,
    readinessScore,
    driftSeverityScore,
    missingActions,
  } = params;

  if (
    verdict === "stable" &&
    confidenceScore >= 75 &&
    readinessScore >= 75 &&
    driftSeverityScore < 30 &&
    missingActions === 0
  ) {
    return "This family is in a healthy state across the shared engine diagnostics.";
  }

  if (verdict === "blocked" || verdict === "repair") {
    return "This family has meaningful structural risk and should stay in active repair-oriented review.";
  }

  return "This family is partially healthy but still carries mixed runtime signals.";
}

export default function MomentInspectorSelectedFamilySignalSummaryPanel(props: {
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

  if (!selectedPhraseFamilyId) return null;

  const diagnostic = buildMomentInspectorRuntimeDiagnostic({
    familyId: selectedPhraseFamilyId,
    actionSummaryRow: selectedActionSummaryRow,
    driftFamilyRow: selectedDriftFamily,
    repairQueueRow: selectedRepairQueueRow,
    stabilityFamilyRow: selectedStabilityFamily,
  });

  const missingActions = Number(selectedActionSummaryRow?.missingActions ?? 0);
  const stabilityScore = Number(selectedStabilityFamily?.stabilityScore ?? 0);

  const strongestPositive = getStrongestPositive({
    confidenceScore: diagnostic.confidenceScore,
    readinessScore: diagnostic.readinessScore,
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore,
    missingActions,
  });

  const strongestNegative = getStrongestNegative({
    missingActions,
    driftSeverityScore: diagnostic.driftSeverityScore,
    repairPriorityScore: diagnostic.repairPriorityScore,
    stabilityScore,
    readinessScore: diagnostic.readinessScore,
  });

  const overallSummary = getOverallSummary({
    verdict: diagnostic.engineVerdict,
    confidenceScore: diagnostic.confidenceScore,
    readinessScore: diagnostic.readinessScore,
    driftSeverityScore: diagnostic.driftSeverityScore,
    missingActions,
  });

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-cyan-700">
          Selected Family Signal Summary
        </div>
        <div className="text-[10px] text-cyan-700">
          {getVerdictUi(diagnostic.engineVerdict)}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-5">
        <div className="rounded border border-cyan-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Confidence
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent100(diagnostic.confidenceScore)}
          </div>
        </div>

        <div className="rounded border border-cyan-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Drift Severity
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent100(diagnostic.driftSeverityScore)}
          </div>
        </div>

        <div className="rounded border border-cyan-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Repair Priority
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatScore(diagnostic.repairPriorityScore)}
          </div>
        </div>

        <div className="rounded border border-cyan-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Readiness
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent100(diagnostic.readinessScore)}
          </div>
        </div>

        <div className="rounded border border-cyan-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Verdict
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {getVerdictUi(diagnostic.engineVerdict)}
          </div>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-cyan-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Strongest Positive
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{strongestPositive}</div>
        </div>

        <div className="rounded border border-cyan-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Strongest Negative
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{strongestNegative}</div>
        </div>
      </div>

      <div className="mt-2 rounded border border-cyan-200 bg-white px-2 py-2">
        <div className="text-[10px] uppercase tracking-wide text-zinc-500">
          Recommended Next Step
        </div>
        <div className="mt-1 text-[11px] text-zinc-700">
          {diagnostic.recommendedNextStep}
        </div>
      </div>

      <div className="mt-2 rounded border border-cyan-200 bg-white px-2 py-2">
        <div className="text-[10px] uppercase tracking-wide text-zinc-500">
          Overall Summary
        </div>
        <div className="mt-1 text-[11px] text-zinc-700">{overallSummary}</div>
      </div>
    </div>
  );
}