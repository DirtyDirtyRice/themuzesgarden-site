"use client";

import {
  buildMomentInspectorRuntimeDiagnostic,
  type MomentInspectorEngineVerdict,
} from "./momentInspectorRuntimeDiagnostics";
import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";

type RiskLevel = "High" | "Medium" | "Low";

type RiskFactorRow = {
  label: string;
  level: RiskLevel;
  detail: string;
};

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

function getRiskTone(level: RiskLevel): string {
  if (level === "High") return "text-red-700";
  if (level === "Medium") return "text-amber-700";
  return "text-emerald-700";
}

function getRiskChipTone(level: RiskLevel): string {
  if (level === "High") return "border-red-200 bg-red-50 text-red-700";
  if (level === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getVerdictRiskLevel(verdict: MomentInspectorEngineVerdict): RiskLevel {
  if (verdict === "blocked" || verdict === "repair") return "High";
  if (verdict === "watch") return "Medium";
  return "Low";
}

function buildRiskRows(params: {
  verdict: MomentInspectorEngineVerdict;
  missingActions: number;
  nearActions: number;
  topConfidence: number;
  driftSeverityScore: number;
  stabilityScore: number;
  repairPriorityScore: number;
  readinessScore: number;
  riskFlags: string[];
}): RiskFactorRow[] {
  const {
    verdict,
    missingActions,
    nearActions,
    topConfidence,
    driftSeverityScore,
    stabilityScore,
    repairPriorityScore,
    readinessScore,
    riskFlags,
  } = params;

  const rows: RiskFactorRow[] = [];

  rows.push({
    label: "Engine Verdict",
    level: getVerdictRiskLevel(verdict),
    detail:
      verdict === "blocked"
        ? "The shared runtime engine currently considers this family blocked."
        : verdict === "repair"
          ? "The shared runtime engine considers this family repair-first."
          : verdict === "watch"
            ? "The shared runtime engine considers this family watch-worthy but not fully trusted."
            : "The shared runtime engine currently considers this family stable.",
  });

  if (missingActions > 0) {
    rows.push({
      label: "Missing Actions",
      level: "High",
      detail: `${missingActions} intended action${
        missingActions === 1 ? "" : "s"
      } are still missing from the current family plan.`,
    });
  } else {
    rows.push({
      label: "Missing Actions",
      level: "Low",
      detail: "No missing intended actions detected.",
    });
  }

  if (nearActions > 0) {
    rows.push({
      label: "Near Actions",
      level: nearActions >= 3 ? "High" : "Medium",
      detail: `${nearActions} near-match action${
        nearActions === 1 ? "" : "s"
      } suggest soft alignment instead of full confirmation.`,
    });
  } else {
    rows.push({
      label: "Near Actions",
      level: "Low",
      detail: "No near-match action pressure detected.",
    });
  }

  if (driftSeverityScore >= 70) {
    rows.push({
      label: "Drift Severity",
      level: "High",
      detail: `Drift severity is ${formatPercent100(
        driftSeverityScore
      )}, which is high enough to reduce engine trust.`,
    });
  } else if (driftSeverityScore >= 30) {
    rows.push({
      label: "Drift Severity",
      level: "Medium",
      detail: `Drift severity is ${formatPercent100(
        driftSeverityScore
      )}, which suggests noticeable family divergence.`,
    });
  } else {
    rows.push({
      label: "Drift Severity",
      level: "Low",
      detail: `Drift severity is ${formatPercent100(
        driftSeverityScore
      )}, which is currently manageable.`,
    });
  }

  if (stabilityScore > 0 && stabilityScore < 55) {
    rows.push({
      label: "Phrase Stability",
      level: "High",
      detail: `Stability is only ${formatPercent100(
        stabilityScore
      )}, which is too weak for strong trust.`,
    });
  } else if (stabilityScore > 0 && stabilityScore < 75) {
    rows.push({
      label: "Phrase Stability",
      level: "Medium",
      detail: `Stability is ${formatPercent100(
        stabilityScore
      )}, so the family is usable but not fully proven.`,
    });
  } else {
    rows.push({
      label: "Phrase Stability",
      level: "Low",
      detail: `Stability is ${formatPercent100(
        stabilityScore
      )}, which is currently supportive.`,
    });
  }

  if (repairPriorityScore >= 12) {
    rows.push({
      label: "Repair Pressure",
      level: "High",
      detail: `Repair priority is ${Number(
        repairPriorityScore.toFixed(1)
      )}, which indicates elevated cleanup pressure.`,
    });
  } else if (repairPriorityScore >= 5) {
    rows.push({
      label: "Repair Pressure",
      level: "Medium",
      detail: `Repair priority is ${Number(
        repairPriorityScore.toFixed(1)
      )}, so this family still needs review.`,
    });
  } else {
    rows.push({
      label: "Repair Pressure",
      level: "Low",
      detail: "No meaningful repair pressure is currently active.",
    });
  }

  if (topConfidence < 0.45) {
    rows.push({
      label: "Top Action Confidence",
      level: "High",
      detail: `Top action confidence is only ${formatPercent01(
        topConfidence
      )}, which is weak for engine trust.`,
    });
  } else if (topConfidence < 0.75) {
    rows.push({
      label: "Top Action Confidence",
      level: "Medium",
      detail: `Top action confidence is ${formatPercent01(
        topConfidence
      )}, which is usable but not strong yet.`,
    });
  } else {
    rows.push({
      label: "Top Action Confidence",
      level: "Low",
      detail: `Top action confidence is ${formatPercent01(
        topConfidence
      )}, which is currently supportive.`,
    });
  }

  if (readinessScore < 55) {
    rows.push({
      label: "Readiness",
      level: "High",
      detail: `Readiness is only ${formatPercent100(
        readinessScore
      )}, which is too soft for stronger downstream trust.`,
    });
  } else if (readinessScore < 75) {
    rows.push({
      label: "Readiness",
      level: "Medium",
      detail: `Readiness is ${formatPercent100(
        readinessScore
      )}, so this family remains in a caution range.`,
    });
  } else {
    rows.push({
      label: "Readiness",
      level: "Low",
      detail: `Readiness is ${formatPercent100(
        readinessScore
      )}, which is supportive.`,
    });
  }

  if (riskFlags.length) {
    rows.push({
      label: "Runtime Risk Flags",
      level: riskFlags.length >= 4 ? "High" : riskFlags.length >= 2 ? "Medium" : "Low",
      detail: riskFlags.join(" • "),
    });
  } else {
    rows.push({
      label: "Runtime Risk Flags",
      level: "Low",
      detail: "No active runtime risk flags detected.",
    });
  }

  return rows;
}

export default function MomentInspectorSelectedFamilyRiskFactorsPanel(props: {
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
  const nearActions = Number(selectedActionSummaryRow?.nearActions ?? 0);
  const topConfidence = clamp01(Number(selectedActionSummaryRow?.topConfidence ?? 0));
  const stabilityScore = Number(selectedStabilityFamily?.stabilityScore ?? 0);

  const rows = buildRiskRows({
    verdict: diagnostic.engineVerdict,
    missingActions,
    nearActions,
    topConfidence,
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore,
    repairPriorityScore: diagnostic.repairPriorityScore,
    readinessScore: diagnostic.readinessScore,
    riskFlags: diagnostic.riskFlags,
  });

  const highCount = rows.filter((row) => row.level === "High").length;
  const mediumCount = rows.filter((row) => row.level === "Medium").length;
  const lowCount = rows.filter((row) => row.level === "Low").length;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-orange-700">
            Selected Family Risk Factors
          </div>
          <div className="mt-1 text-[10px] text-orange-700">{familyId}</div>
        </div>

        <div className="text-[10px] text-orange-700">{rows.length} signals</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <div className={`rounded border px-2 py-1 text-[10px] ${getRiskChipTone("High")}`}>
          High {highCount}
        </div>
        <div
          className={`rounded border px-2 py-1 text-[10px] ${getRiskChipTone("Medium")}`}
        >
          Medium {mediumCount}
        </div>
        <div className={`rounded border px-2 py-1 text-[10px] ${getRiskChipTone("Low")}`}>
          Low {lowCount}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded border border-orange-200 bg-white px-2 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {row.label}
              </div>
              <div className={`text-[10px] font-medium ${getRiskTone(row.level)}`}>
                {row.level}
              </div>
            </div>

            <div className="mt-1 text-[11px] text-zinc-700">{row.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}