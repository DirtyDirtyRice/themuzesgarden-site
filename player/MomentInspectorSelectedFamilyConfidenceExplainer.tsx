"use client";

import { buildInspectorConfidenceHistoryView } from "./momentInspectorConfidenceHistoryView";
import { buildMomentInspectorRuntimeDiagnostic } from "./momentInspectorRuntimeDiagnostics";
import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { ConfidenceHistoryResult } from "./playerMomentConfidenceHistory";

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

function formatPercentNullable(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(clamp100(value))}%`;
}

function formatDelta(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  if (n > 0) return `+${Math.round(n)}`;
  return `${Math.round(n)}`;
}

function getTrustLabel(score: number): "Low" | "Medium" | "High" {
  const safe = clamp100(score);

  if (safe < 40) return "Low";
  if (safe < 75) return "Medium";
  return "High";
}

function getTrustTone(label: "Low" | "Medium" | "High"): string {
  if (label === "Low") return "text-red-700";
  if (label === "Medium") return "text-amber-700";
  return "text-emerald-700";
}

function getTrendTone(trend: string): string {
  if (trend === "improving") return "text-emerald-700";
  if (trend === "declining") return "text-red-700";
  if (trend === "volatile") return "text-amber-700";
  if (trend === "flat") return "text-sky-700";
  return "text-zinc-600";
}

function getTrendLabel(trend: string): string {
  const clean = String(trend ?? "").trim();
  if (!clean) return "unknown";
  return clean.replace(/-/g, " ");
}

function getStrongestSignal(params: {
  missingActions: number;
  driftSeverityScore: number;
  stabilityScore: number;
  topConfidence: number;
  repairPriorityScore: number;
  readinessScore: number;
}): string {
  const {
    missingActions,
    driftSeverityScore,
    stabilityScore,
    topConfidence,
    repairPriorityScore,
    readinessScore,
  } = params;

  if (missingActions > 0) {
    return "Missing intended actions are currently the strongest negative confidence signal.";
  }

  if (driftSeverityScore >= 70) {
    return "High drift severity is currently the strongest negative confidence signal.";
  }

  if (stabilityScore >= 75 && topConfidence >= 0.75) {
    return "Strong phrase stability plus strong action confidence is currently the strongest positive signal.";
  }

  if (repairPriorityScore >= 10) {
    return "Repair pressure is currently the strongest confidence warning signal.";
  }

  if (readinessScore >= 75) {
    return "High discovery readiness is currently the strongest positive confidence signal.";
  }

  return "No dominant negative confidence signal was detected in the current family snapshot.";
}

function getTrustSummary(params: {
  trustLabel: "Low" | "Medium" | "High";
  missingActions: number;
  driftSeverityScore: number;
  stabilityScore: number;
  readinessScore: number;
}): string {
  const {
    trustLabel,
    missingActions,
    driftSeverityScore,
    stabilityScore,
    readinessScore,
  } = params;

  if (trustLabel === "High") {
    return "This family looks trustworthy enough for future search and discovery experiments.";
  }

  if (trustLabel === "Medium") {
    return "This family is usable for debugging and soft engine trust, but it should still be handled carefully.";
  }

  if (
    missingActions > 0 ||
    driftSeverityScore >= 70 ||
    stabilityScore < 55 ||
    readinessScore < 55
  ) {
    return "This family is not yet trustworthy for stronger search and discovery use without more cleanup.";
  }

  return "This family currently needs more evidence before it should influence future discovery scoring.";
}

function getWhyScoreHappened(params: {
  topConfidence: number;
  missingActions: number;
  nearActions: number;
  driftSeverityScore: number;
  stabilityScore: number;
  repairPriorityScore: number;
  readinessScore: number;
}): string {
  const {
    topConfidence,
    missingActions,
    nearActions,
    driftSeverityScore,
    stabilityScore,
    repairPriorityScore,
    readinessScore,
  } = params;

  const parts: string[] = [];

  if (topConfidence > 0) {
    parts.push(`top action confidence is ${formatPercent01(topConfidence)}`);
  }

  if (missingActions > 0) {
    parts.push(`${missingActions} missing action${missingActions === 1 ? "" : "s"}`);
  }

  if (nearActions > 0) {
    parts.push(`${nearActions} near action${nearActions === 1 ? "" : "s"}`);
  }

  if (driftSeverityScore > 0) {
    parts.push(`drift severity is ${formatPercent100(driftSeverityScore)}`);
  }

  if (stabilityScore > 0) {
    parts.push(`stability is ${formatPercent100(stabilityScore)}`);
  }

  if (repairPriorityScore > 0) {
    parts.push(`repair priority is ${Number(repairPriorityScore.toFixed(1))}`);
  }

  if (readinessScore > 0) {
    parts.push(`readiness is ${formatPercent100(readinessScore)}`);
  }

  if (!parts.length) {
    return "No meaningful family confidence signals are available yet.";
  }

  return `This score is being shaped by ${parts.join(", ")}.`;
}

export default function MomentInspectorSelectedFamilyConfidenceExplainer(props: {
  selectedPhraseFamilyId: string;
  selectedActionSummaryRow: InspectorIntendedActionSummaryRow | null;
  selectedRepairQueueRow: InspectorRepairQueueRow | null;
  selectedDriftFamily: InspectorPhraseDriftFamilyRow | null;
  selectedStabilityFamily: InspectorPhraseStabilityFamilyRow | null;
  selectedConfidenceHistoryResult?: ConfidenceHistoryResult | null;
}) {
  const {
    selectedPhraseFamilyId,
    selectedActionSummaryRow,
    selectedRepairQueueRow,
    selectedDriftFamily,
    selectedStabilityFamily,
    selectedConfidenceHistoryResult = null,
  } = props;

  if (!selectedPhraseFamilyId) return null;

  const diagnostic = buildMomentInspectorRuntimeDiagnostic({
    familyId: selectedPhraseFamilyId,
    actionSummaryRow: selectedActionSummaryRow,
    driftFamilyRow: selectedDriftFamily,
    repairQueueRow: selectedRepairQueueRow,
    stabilityFamilyRow: selectedStabilityFamily,
  });

  const historyView = buildInspectorConfidenceHistoryView(selectedConfidenceHistoryResult);

  const missingActions = Number(selectedActionSummaryRow?.missingActions ?? 0);
  const nearActions = Number(selectedActionSummaryRow?.nearActions ?? 0);
  const topConfidence = clamp01(Number(selectedActionSummaryRow?.topConfidence ?? 0));
  const stabilityScore = Number(selectedStabilityFamily?.stabilityScore ?? 0);

  const trustLabel = getTrustLabel(diagnostic.confidenceScore);
  const trustTone = getTrustTone(trustLabel);

  const strongestSignal = getStrongestSignal({
    missingActions,
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore,
    topConfidence,
    repairPriorityScore: diagnostic.repairPriorityScore,
    readinessScore: diagnostic.readinessScore,
  });

  const trustSummary = getTrustSummary({
    trustLabel,
    missingActions,
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore,
    readinessScore: diagnostic.readinessScore,
  });

  const whyScoreHappened = getWhyScoreHappened({
    topConfidence,
    missingActions,
    nearActions,
    driftSeverityScore: diagnostic.driftSeverityScore,
    stabilityScore,
    repairPriorityScore: diagnostic.repairPriorityScore,
    readinessScore: diagnostic.readinessScore,
  });

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
          Selected Family Confidence Explainer
        </div>
        <div className={`text-[10px] font-medium ${trustTone}`}>
          Trust {trustLabel}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <div className="rounded border border-emerald-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Confidence Score
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent100(diagnostic.confidenceScore)}
          </div>
        </div>

        <div className="rounded border border-emerald-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Top Action Confidence
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent01(topConfidence)}
          </div>
        </div>

        <div className="rounded border border-emerald-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Readiness
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-700">
            {formatPercent100(diagnostic.readinessScore)}
          </div>
        </div>

        <div className="rounded border border-emerald-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Future Search Trust
          </div>
          <div className={`mt-1 text-[11px] font-medium ${trustTone}`}>{trustLabel}</div>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-emerald-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Strongest Signal
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{strongestSignal}</div>
        </div>

        <div className="rounded border border-emerald-200 bg-white px-2 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Trust Summary
          </div>
          <div className="mt-1 text-[11px] text-zinc-700">{trustSummary}</div>
        </div>
      </div>

      <div className="mt-2 rounded border border-emerald-200 bg-white px-2 py-2">
        <div className="text-[10px] uppercase tracking-wide text-zinc-500">
          Why This Score Happened
        </div>
        <div className="mt-1 text-[11px] text-zinc-700">{whyScoreHappened}</div>
      </div>

      {historyView ? (
        <div className="mt-2 rounded border border-emerald-200 bg-white px-2 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              Confidence History
            </div>
            <div className={`text-[10px] font-medium ${getTrendTone(historyView.reliabilityTrend)}`}>
              {getTrendLabel(historyView.reliabilityTrend)}
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Avg Trust
              </div>
              <div className="text-[11px] text-zinc-700">
                {formatPercent100(historyView.averageTrustScore)}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Avg Reliability
              </div>
              <div className="text-[11px] text-zinc-700">
                {formatPercent100(historyView.averageReliabilityScore)}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Trust Delta
              </div>
              <div className="text-[11px] text-zinc-700">
                {formatDelta(historyView.totalTrustDelta)}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Reliability Delta
              </div>
              <div className="text-[11px] text-zinc-700">
                {formatDelta(historyView.totalReliabilityDelta)}
              </div>
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Latest Trust
              </div>
              <div className="text-[11px] text-zinc-700">
                {formatPercentNullable(historyView.latestTrustScore)}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Previous Trust
              </div>
              <div className="text-[11px] text-zinc-700">
                {formatPercentNullable(historyView.previousTrustScore)}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Latest Reliability
              </div>
              <div className="text-[11px] text-zinc-700">
                {formatPercentNullable(historyView.latestReliabilityScore)}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Previous Reliability
              </div>
              <div className="text-[11px] text-zinc-700">
                {formatPercentNullable(historyView.previousReliabilityScore)}
              </div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-zinc-600">
            {historyView.pointCount} history point{historyView.pointCount === 1 ? "" : "s"} • trust trend{" "}
            <span className={getTrendTone(historyView.trustTrend)}>
              {getTrendLabel(historyView.trustTrend)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}