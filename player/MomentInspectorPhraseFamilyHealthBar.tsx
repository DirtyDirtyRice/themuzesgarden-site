"use client";

import {
  buildMomentInspectorRuntimeDiagnostic,
  type MomentInspectorEngineVerdict,
} from "./momentInspectorRuntimeDiagnostics";
import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";

type HealthLabel = "Strong" | "Watch" | "Weak";

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

function buildHealthScore(params: {
  confidenceScore: number;
  driftSeverityScore: number;
  repairPriorityScore: number;
  readinessScore: number;
}): number {
  const {
    confidenceScore,
    driftSeverityScore,
    repairPriorityScore,
    readinessScore,
  } = params;

  const repairPenalty = Math.min(100, repairPriorityScore * 4.5);

  return clamp100(
    confidenceScore * 0.34 +
      readinessScore * 0.34 +
      (100 - driftSeverityScore) * 0.22 +
      (100 - repairPenalty) * 0.1
  );
}

function getHealthLabel(params: {
  score: number;
  verdict: MomentInspectorEngineVerdict;
}): HealthLabel {
  const { score, verdict } = params;
  const safe = clamp100(score);

  if (verdict === "blocked" || verdict === "repair" || safe < 40) return "Weak";
  if (verdict === "watch" || safe < 75) return "Watch";
  return "Strong";
}

function getTone(label: HealthLabel): string {
  if (label === "Weak") return "text-red-700";
  if (label === "Watch") return "text-amber-700";
  return "text-emerald-700";
}

function getBarTone(label: HealthLabel): string {
  if (label === "Weak") return "bg-red-500";
  if (label === "Watch") return "bg-amber-500";
  return "bg-emerald-500";
}

function getSummary(params: {
  label: HealthLabel;
  missingActions: number;
  driftSeverityScore: number;
  readinessScore: number;
}): string {
  const { label, missingActions, driftSeverityScore, readinessScore } = params;

  if (label === "Weak") {
    if (missingActions > 0) {
      return "This phrase family is carrying action gaps and should stay in active repair.";
    }

    if (driftSeverityScore >= 70) {
      return "This phrase family is carrying enough drift risk to stay in active repair.";
    }

    return "This phrase family is carrying enough structural risk to stay in active repair.";
  }

  if (label === "Watch") {
    if (readinessScore < 75) {
      return "This phrase family is usable for inspection, but it still needs caution before stronger trust.";
    }

    return "This phrase family is usable for inspection, but it still needs caution.";
  }

  return "This phrase family is currently in a healthy enough range for stronger trust.";
}

export default function MomentInspectorPhraseFamilyHealthBar(props: {
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

  const topConfidence = clamp01(Number(selectedActionSummaryRow?.topConfidence ?? 0));
  const missingActions = Number(selectedActionSummaryRow?.missingActions ?? 0);

  const score = buildHealthScore({
    confidenceScore: diagnostic.confidenceScore,
    driftSeverityScore: diagnostic.driftSeverityScore,
    repairPriorityScore: diagnostic.repairPriorityScore,
    readinessScore: diagnostic.readinessScore,
  });

  const label = getHealthLabel({
    score,
    verdict: diagnostic.engineVerdict,
  });

  const tone = getTone(label);
  const barTone = getBarTone(label);
  const summary = getSummary({
    label,
    missingActions,
    driftSeverityScore: diagnostic.driftSeverityScore,
    readinessScore: diagnostic.readinessScore,
  });

  return (
    <div className="rounded-lg border border-lime-200 bg-lime-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-lime-700">
          Phrase Family Health
        </div>
        <div className={`text-[10px] font-medium ${tone}`}>
          {label} • {formatPercent100(score)}
        </div>
      </div>

      <div className="mt-2 h-3 w-full overflow-hidden rounded-full border border-lime-200 bg-white">
        <div
          className={`h-full rounded-full ${barTone}`}
          style={{ width: formatPercent100(score) }}
        />
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <div className="rounded border border-lime-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Confidence
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent100(diagnostic.confidenceScore)}
          </div>
        </div>

        <div className="rounded border border-lime-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Drift Severity
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent100(diagnostic.driftSeverityScore)}
          </div>
        </div>

        <div className="rounded border border-lime-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Readiness
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent100(diagnostic.readinessScore)}
          </div>
        </div>

        <div className="rounded border border-lime-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Top Action
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent01(topConfidence)}
          </div>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-zinc-700">{summary}</div>
    </div>
  );
}