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
  return Number(value.toFixed(1)).toString();
}

function getPriorityLabel(params: {
  verdict: MomentInspectorEngineVerdict;
  repairPriorityScore: number;
}): "High" | "Medium" | "Low" {
  const { verdict, repairPriorityScore } = params;

  if (verdict === "blocked" || verdict === "repair" || repairPriorityScore >= 12) {
    return "High";
  }

  if (verdict === "watch" || repairPriorityScore >= 5) {
    return "Medium";
  }

  return "Low";
}

function getPriorityTone(priority: "High" | "Medium" | "Low"): string {
  if (priority === "High") return "text-red-700";
  if (priority === "Medium") return "text-amber-700";
  return "text-emerald-700";
}

function getPrimaryCause(params: {
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
    return "Missing intended actions are the strongest repair signal. The repeat plan is not being fully satisfied yet.";
  }

  if (driftSeverityScore >= 70) {
    return "Drift severity is the strongest repair signal. The phrase family is diverging too much for reliable trust.";
  }

  if (stabilityScore > 0 && stabilityScore < 55) {
    return "Phrase stability is the strongest repair signal. The family pattern is still too fragile.";
  }

  if (repairPriorityScore >= 10) {
    return "Repair queue pressure is the strongest repair signal. The family needs focused cleanup before promotion.";
  }

  if (confidenceScore < 55) {
    return "Soft confidence is the strongest repair signal. The family still needs stronger reinforcement.";
  }

  if (readinessScore < 55) {
    return "Low readiness is the strongest repair signal. The family is not ready for dependable downstream use.";
  }

  return "No major repair signal is dominant right now. This family looks relatively healthy.";
}

function getInspectFirst(params: {
  missingActions: number;
  driftSeverityScore: number;
  stabilityScore: number;
  confidenceScore: number;
  readinessScore: number;
}): string {
  const {
    missingActions,
    driftSeverityScore,
    stabilityScore,
    confidenceScore,
    readinessScore,
  } = params;

  if (missingActions > 0) {
    return "Inspect intended action coverage first, then compare the family members against the expected repeat plan.";
  }

  if (driftSeverityScore >= 70) {
    return "Inspect phrase drift first, especially unstable members, timing offsets, and duration drift.";
  }

  if (stabilityScore > 0 && stabilityScore < 55) {
    return "Inspect stability first, especially repeat coverage, timing consistency, and structural confidence.";
  }

  if (confidenceScore < 55) {
    return "Inspect confidence inputs first and verify whether the family has enough reliable support for engine trust.";
  }

  if (readinessScore < 55) {
    return "Inspect readiness blockers first and confirm what is preventing safe promotion into downstream use.";
  }

  return "No urgent repair pass is needed. Use a light review only if another panel suggests contradiction.";
}

function getVerdictUi(verdict: MomentInspectorEngineVerdict): string {
  if (verdict === "stable") return "STABLE";
  if (verdict === "watch") return "WATCH";
  if (verdict === "repair") return "REPAIR";
  return "BLOCKED";
}

export default function MomentInspectorSelectedFamilyRepairGuidance(props: {
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

  const priority = getPriorityLabel({
    verdict: diagnostic.engineVerdict,
    repairPriorityScore: diagnostic.repairPriorityScore,
  });

  const priorityTone = getPriorityTone(priority);

  const primaryCause = getPrimaryCause({
    missingActions,
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore,
    repairPriorityScore: diagnostic.repairPriorityScore,
    confidenceScore: diagnostic.confidenceScore,
    readinessScore: diagnostic.readinessScore,
  });

  const inspectFirst = getInspectFirst({
    missingActions,
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore,
    confidenceScore: diagnostic.confidenceScore,
    readinessScore: diagnostic.readinessScore,
  });

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-rose-700">
          Selected Family Repair Guidance
        </div>
        <div className={`text-[10px] font-medium ${priorityTone}`}>
          Priority {priority} • {getVerdictUi(diagnostic.engineVerdict)}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-rose-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Primary Cause
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{primaryCause}</div>
        </div>

        <div className="rounded border border-rose-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Inspect First
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{inspectFirst}</div>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <div className="rounded border border-rose-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Missing
          </div>
          <div className="mt-1 text-[11px] font-medium text-red-600">
            {missingActions}
          </div>
        </div>

        <div className="rounded border border-rose-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Near
          </div>
          <div className="mt-1 text-[11px] font-medium text-amber-600">
            {nearActions}
          </div>
        </div>

        <div className="rounded border border-rose-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Drift Severity
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent100(diagnostic.driftSeverityScore)}
          </div>
        </div>

        <div className="rounded border border-rose-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Repair Priority
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatScore(diagnostic.repairPriorityScore)}
          </div>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-rose-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Risk Flags
          </div>
          {diagnostic.riskFlags.length ? (
            <div className="mt-1 text-[11px] text-zinc-700">
              {diagnostic.riskFlags.join(" • ")}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-zinc-500">
              No active runtime risk flags.
            </div>
          )}
        </div>

        <div className="rounded border border-rose-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Readiness
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">
            {formatPercent100(diagnostic.readinessScore)} • confidence{" "}
            {formatPercent100(diagnostic.confidenceScore)}
          </div>
        </div>
      </div>

      <div className="mt-2 rounded border border-rose-200 bg-white px-2 py-2">
        <div className="text-[10px] uppercase tracking-wide text-zinc-500">
          Recommended Repair Action
        </div>
        <div className="mt-1 text-[11px] text-zinc-700">
          {diagnostic.recommendedNextStep}
        </div>
      </div>
    </div>
  );
}