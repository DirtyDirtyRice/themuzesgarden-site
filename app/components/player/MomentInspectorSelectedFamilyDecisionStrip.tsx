"use client";

import {
  buildMomentInspectorRuntimeDiagnostic,
  type MomentInspectorEngineVerdict,
} from "./momentInspectorRuntimeDiagnostics";
import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";

type StripStatus = "Healthy" | "Mixed" | "Risky";

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

function getStripStatus(params: {
  verdict: MomentInspectorEngineVerdict;
  readinessScore: number;
}): StripStatus {
  const { verdict, readinessScore } = params;

  if (verdict === "blocked" || verdict === "repair" || readinessScore < 55) {
    return "Risky";
  }

  if (verdict === "watch" || readinessScore < 75) {
    return "Mixed";
  }

  return "Healthy";
}

function getStatusTone(status: StripStatus): string {
  if (status === "Risky") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Mixed") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getHeadline(params: {
  status: StripStatus;
  verdict: MomentInspectorEngineVerdict;
}): string {
  const { status, verdict } = params;

  if (status === "Risky") {
    if (verdict === "blocked") return "Selected family is blocked and needs active repair.";
    return "Selected family needs active repair.";
  }

  if (status === "Mixed") {
    if (verdict === "watch") return "Selected family is promising but still under watch.";
    return "Selected family is usable but still unstable.";
  }

  return "Selected family is currently in a healthy range.";
}

function getCompactReason(params: {
  missingActions: number;
  nearActions: number;
  driftSeverityScore: number;
  stabilityScore: number;
  repairPriorityScore: number;
  readinessScore: number;
  riskFlags: string[];
}): string {
  const {
    missingActions,
    nearActions,
    driftSeverityScore,
    stabilityScore,
    repairPriorityScore,
    readinessScore,
    riskFlags,
  } = params;

  if (missingActions > 0) {
    return `${missingActions} missing intended action${
      missingActions === 1 ? "" : "s"
    } are leading the risk profile.`;
  }

  if (driftSeverityScore >= 70) {
    return `Drift severity is high at ${formatPercent100(driftSeverityScore)}.`;
  }

  if (stabilityScore > 0 && stabilityScore < 55) {
    return `Phrase stability is weak at ${formatPercent100(stabilityScore)}.`;
  }

  if (repairPriorityScore >= 10) {
    return `Repair priority is elevated at ${Number(repairPriorityScore.toFixed(1))}.`;
  }

  if (nearActions > 0) {
    return `${nearActions} near-match action${
      nearActions === 1 ? "" : "s"
    } still need cleanup.`;
  }

  if (readinessScore < 75) {
    return `Readiness is currently ${formatPercent100(
      readinessScore
    )}, so the family still needs monitoring.`;
  }

  if (riskFlags.length > 0) {
    return `Runtime flags: ${riskFlags.join(" • ")}.`;
  }

  return "Core family signals are aligned well enough for this pass.";
}

export default function MomentInspectorSelectedFamilyDecisionStrip(props: {
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
  const nearActions = Number(selectedActionSummaryRow?.nearActions ?? 0);
  const stabilityScore = Number(selectedStabilityFamily?.stabilityScore ?? 0);

  const status = getStripStatus({
    verdict: diagnostic.engineVerdict,
    readinessScore: diagnostic.readinessScore,
  });

  const tone = getStatusTone(status);
  const headline = getHeadline({
    status,
    verdict: diagnostic.engineVerdict,
  });

  const reason = getCompactReason({
    missingActions,
    nearActions,
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore,
    repairPriorityScore: diagnostic.repairPriorityScore,
    readinessScore: diagnostic.readinessScore,
    riskFlags: diagnostic.riskFlags,
  });

  return (
    <div className={`rounded-lg border px-3 py-2 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide">
          Selected Family Decision Strip
        </div>
        <div className="text-[10px] font-medium">{status}</div>
      </div>

      <div className="mt-1 text-[11px] font-medium">{headline}</div>
      <div className="mt-1 text-[10px]">{reason}</div>
    </div>
  );
}