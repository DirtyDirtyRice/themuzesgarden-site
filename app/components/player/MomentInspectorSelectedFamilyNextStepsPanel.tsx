"use client";

import {
  buildMomentInspectorRuntimeDiagnostic,
  type MomentInspectorEngineVerdict,
} from "./momentInspectorRuntimeDiagnostics";
import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";

type Step = {
  level: "High" | "Medium" | "Low";
  text: string;
};

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

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function getTone(level: Step["level"]): string {
  if (level === "High") return "text-red-700";
  if (level === "Medium") return "text-amber-700";
  return "text-emerald-700";
}

function getChipTone(level: Step["level"]): string {
  if (level === "High") return "border-red-200 bg-red-50 text-red-700";
  if (level === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getVerdictUi(verdict: MomentInspectorEngineVerdict): string {
  if (verdict === "stable") return "STABLE";
  if (verdict === "watch") return "WATCH";
  if (verdict === "repair") return "REPAIR";
  return "BLOCKED";
}

function buildSteps(params: {
  verdict: MomentInspectorEngineVerdict;
  recommendedNextStep: string;
  missingActions: number;
  nearActions: number;
  driftSeverityScore: number;
  stabilityScore: number;
  repairPriorityScore: number;
  readinessScore: number;
  riskFlags: string[];
}): Step[] {
  const {
    verdict,
    recommendedNextStep,
    missingActions,
    nearActions,
    driftSeverityScore,
    stabilityScore,
    repairPriorityScore,
    readinessScore,
    riskFlags,
  } = params;

  const steps: Step[] = [];

  steps.push({
    level:
      verdict === "blocked" || verdict === "repair"
        ? "High"
        : verdict === "watch"
          ? "Medium"
          : "Low",
    text: recommendedNextStep,
  });

  if (missingActions > 0) {
    steps.push({
      level: "High",
      text: `Fill ${missingActions} missing intended action${
        missingActions === 1 ? "" : "s"
      } before stronger engine trust.`,
    });
  }

  if (driftSeverityScore >= 70) {
    steps.push({
      level: "High",
      text: "Reduce high drift severity by tightening unstable phrase members and timing spread.",
    });
  } else if (driftSeverityScore >= 30) {
    steps.push({
      level: "Medium",
      text: "Review moderate drift and smooth out family divergence before promotion.",
    });
  }

  if (stabilityScore > 0 && stabilityScore < 55) {
    steps.push({
      level: "High",
      text: "Improve phrase stability by verifying repeat coverage, timing consistency, and structure.",
    });
  } else if (stabilityScore > 0 && stabilityScore < 75) {
    steps.push({
      level: "Medium",
      text: "Strengthen phrase stability so the family pattern locks more cleanly.",
    });
  }

  if (nearActions > 0) {
    steps.push({
      level: "Medium",
      text: `${nearActions} near-match action${
        nearActions === 1 ? "" : "s"
      } should be confirmed or corrected.`,
    });
  }

  if (repairPriorityScore >= 12) {
    steps.push({
      level: "High",
      text: `Repair priority is ${Number(
        repairPriorityScore.toFixed(1)
      )}, so this family should stay in a repair-first lane.`,
    });
  } else if (repairPriorityScore >= 5) {
    steps.push({
      level: "Medium",
      text: `Repair priority is ${Number(
        repairPriorityScore.toFixed(1)
      )}, so cleanup should continue before stronger promotion.`,
    });
  }

  if (readinessScore < 55) {
    steps.push({
      level: "High",
      text: `Readiness is only ${formatPercent100(
        readinessScore
      )}, so keep this family out of stronger downstream trust.`,
    });
  } else if (readinessScore < 75) {
    steps.push({
      level: "Medium",
      text: `Readiness is ${formatPercent100(
        readinessScore
      )}, so treat this family as promising but not fully ready.`,
    });
  }

  if (riskFlags.length > 0) {
    steps.push({
      level: riskFlags.length >= 4 ? "High" : "Medium",
      text: `Review runtime risk flags: ${riskFlags.join(" • ")}.`,
    });
  }

  if (
    steps.length === 1 &&
    verdict === "stable" &&
    missingActions === 0 &&
    driftSeverityScore < 30 &&
    repairPriorityScore < 5 &&
    readinessScore >= 75
  ) {
    steps.push({
      level: "Low",
      text: "No major issues detected. Continue passive monitoring while using this family as a stronger candidate signal.",
    });
  }

  return steps;
}

export default function MomentInspectorSelectedFamilyNextStepsPanel(props: {
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

  const steps = buildSteps({
    verdict: diagnostic.engineVerdict,
    recommendedNextStep: diagnostic.recommendedNextStep,
    missingActions: Number(selectedActionSummaryRow?.missingActions ?? 0),
    nearActions: Number(selectedActionSummaryRow?.nearActions ?? 0),
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore: Number(selectedStabilityFamily?.stabilityScore ?? 0),
    repairPriorityScore: diagnostic.repairPriorityScore,
    readinessScore: diagnostic.readinessScore,
    riskFlags: diagnostic.riskFlags,
  });

  const highCount = steps.filter((step) => step.level === "High").length;
  const mediumCount = steps.filter((step) => step.level === "Medium").length;
  const lowCount = steps.filter((step) => step.level === "Low").length;

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-indigo-700">
            Selected Family Next Steps
          </div>
          <div className="mt-1 text-[10px] text-indigo-700">{familyId}</div>
        </div>

        <div className="text-[10px] text-indigo-700">
          {steps.length} actions • {getVerdictUi(diagnostic.engineVerdict)}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <div className={`rounded border px-2 py-1 text-[10px] ${getChipTone("High")}`}>
          High {highCount}
        </div>
        <div className={`rounded border px-2 py-1 text-[10px] ${getChipTone("Medium")}`}>
          Medium {mediumCount}
        </div>
        <div className={`rounded border px-2 py-1 text-[10px] ${getChipTone("Low")}`}>
          Low {lowCount}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {steps.map((step, i) => (
          <div
            key={`${familyId}:step:${i}`}
            className="rounded border border-indigo-200 bg-white px-2 py-2"
          >
            <div className={`text-[11px] font-medium ${getTone(step.level)}`}>
              {step.level}
            </div>

            <div className="mt-1 text-[11px] text-zinc-700">{step.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}