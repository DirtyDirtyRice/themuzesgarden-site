import type {
  MultiTrackComparisonConfidenceLevel,
  MultiTrackComparisonFinding,
  MultiTrackComparisonGuardrail,
  MultiTrackComparisonMetric,
  MultiTrackComparisonReadinessStatus,
  MultiTrackComparisonWorkflowStep,
  MultiTrackComparisonWorkspaceState,
} from "./MultiTrackComparisonIntelligenceTypes";

export function getMultiTrackComparisonStatusLabel(status: MultiTrackComparisonReadinessStatus): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackComparisonConfidenceLabel(confidence: MultiTrackComparisonConfidenceLevel): string {
  if (confidence === "high") return "High Confidence";
  if (confidence === "medium") return "Medium Confidence";
  if (confidence === "low") return "Low Confidence";
  return "Manual Required";
}

export function getMultiTrackComparisonStatusClass(status: MultiTrackComparisonReadinessStatus): string {
  if (status === "ready") return "border-white/30 text-white";
  if (status === "needs-review") return "border-white/20 text-white/80";
  if (status === "blocked") return "border-white/15 text-white/60";
  return "border-white/10 text-white/50";
}

export function getMultiTrackComparisonConfidenceClass(confidence: MultiTrackComparisonConfidenceLevel): string {
  if (confidence === "high") return "border-white/30 text-white";
  if (confidence === "medium") return "border-white/20 text-white/80";
  if (confidence === "low") return "border-white/15 text-white/60";
  return "border-white/25 text-white";
}

export function countMultiTrackComparisonStatus(
  items: { status: MultiTrackComparisonReadinessStatus }[],
  status: MultiTrackComparisonReadinessStatus,
): number {
  return items.filter((item) => item.status === status).length;
}

export function getMultiTrackComparisonSummary(state: MultiTrackComparisonWorkspaceState): {
  ready: number;
  needsReview: number;
  blocked: number;
  future: number;
  total: number;
} {
  const items = [
    ...state.metrics,
    ...state.findings,
    ...state.workflowSteps,
    ...state.guardrails,
  ];

  return {
    ready: countMultiTrackComparisonStatus(items, "ready"),
    needsReview: countMultiTrackComparisonStatus(items, "needs-review"),
    blocked: countMultiTrackComparisonStatus(items, "blocked"),
    future: countMultiTrackComparisonStatus(items, "future"),
    total: items.length,
  };
}

export function getMultiTrackComparisonManualCount(state: MultiTrackComparisonWorkspaceState): number {
  const confidenceItems = [
    ...state.metrics.map((item) => item.confidence),
    ...state.findings.map((item) => item.confidence),
  ];

  return confidenceItems.filter((confidence) => confidence === "manual-required").length;
}

export function getMultiTrackComparisonFutureMetrics(
  metrics: MultiTrackComparisonMetric[],
): MultiTrackComparisonMetric[] {
  return metrics.filter((metric) => metric.status === "future");
}

export function getMultiTrackComparisonReviewFindings(
  findings: MultiTrackComparisonFinding[],
): MultiTrackComparisonFinding[] {
  return findings.filter((finding) => finding.status === "needs-review");
}

export function getMultiTrackComparisonReadyGuardrails(
  guardrails: MultiTrackComparisonGuardrail[],
): MultiTrackComparisonGuardrail[] {
  return guardrails.filter((guardrail) => guardrail.status === "ready");
}

export function getMultiTrackComparisonFutureSteps(
  steps: MultiTrackComparisonWorkflowStep[],
): MultiTrackComparisonWorkflowStep[] {
  return steps.filter((step) => step.status === "future");
}

export function buildMultiTrackComparisonPlanningSentence(state: MultiTrackComparisonWorkspaceState): string {
  const summary = getMultiTrackComparisonSummary(state);
  const manualCount = getMultiTrackComparisonManualCount(state);

  return `${summary.ready} ready item(s), ${summary.needsReview} review item(s), ${summary.future} future item(s), and ${manualCount} manual confirmation item(s).`;
}

export function buildMultiTrackComparisonLaneCounts(metrics: MultiTrackComparisonMetric[]): {
  tempo: number;
  key: number;
  structure: number;
  hook: number;
  melody: number;
  rhythm: number;
  energy: number;
  stem: number;
  arrangement: number;
  lineage: number;
} {
  return {
    tempo: metrics.filter((metric) => metric.lane === "tempo").length,
    key: metrics.filter((metric) => metric.lane === "key").length,
    structure: metrics.filter((metric) => metric.lane === "structure").length,
    hook: metrics.filter((metric) => metric.lane === "hook").length,
    melody: metrics.filter((metric) => metric.lane === "melody").length,
    rhythm: metrics.filter((metric) => metric.lane === "rhythm").length,
    energy: metrics.filter((metric) => metric.lane === "energy").length,
    stem: metrics.filter((metric) => metric.lane === "stem").length,
    arrangement: metrics.filter((metric) => metric.lane === "arrangement").length,
    lineage: metrics.filter((metric) => metric.lane === "lineage").length,
  };
}

export function buildMultiTrackComparisonSafetySummary(): string[] {
  return [
    "Read-only comparison planning.",
    "No lineage claims without user confirmation.",
    "No engine state.",
    "No DSP.",
    "No audio processing.",
    "No save or Supabase writes.",
    "No duplicate track state.",
    "Future analyzer described only.",
  ];
}