import type {
  MultiTrackConfidenceBucket,
  MultiTrackConfidenceEvidence,
  MultiTrackConfidenceEvidenceType,
  MultiTrackConfidenceReadinessStatus,
  MultiTrackConfidenceRisk,
  MultiTrackConfidenceSource,
  MultiTrackConfidenceWorkspaceState,
} from "./MultiTrackConfidenceIntelligenceTypes";

export function getMultiTrackConfidenceStatusLabel(status: MultiTrackConfidenceReadinessStatus): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackConfidenceBucketLabel(bucket: MultiTrackConfidenceBucket): string {
  if (bucket === "verified") return "Verified";
  if (bucket === "strong") return "Strong";
  if (bucket === "moderate") return "Moderate";
  if (bucket === "weak") return "Weak";
  if (bucket === "unknown") return "Unknown";
  if (bucket === "manual-review") return "Manual Review";
  return "Blocked";
}

export function getMultiTrackConfidenceEvidenceLabel(evidenceType: MultiTrackConfidenceEvidenceType): string {
  if (evidenceType === "user-confirmed") return "User Confirmed";
  if (evidenceType === "metadata-confirmed") return "Metadata Confirmed";
  if (evidenceType === "future-analyzer-confirmed") return "Future Analyzer";
  if (evidenceType === "future-ai-confirmed") return "Future AI";
  if (evidenceType === "future-dsp-confirmed") return "Future DSP";
  if (evidenceType === "seed-only") return "Seed Only";
  return "Missing Evidence";
}

export function getMultiTrackConfidenceStatusClass(status: MultiTrackConfidenceReadinessStatus): string {
  if (status === "ready") return "border-white/30 text-white";
  if (status === "needs-review") return "border-white/20 text-white/80";
  if (status === "blocked") return "border-white/15 text-white/60";
  return "border-white/10 text-white/50";
}

export function getMultiTrackConfidenceBucketClass(bucket: MultiTrackConfidenceBucket): string {
  if (bucket === "verified") return "border-white/30 text-white";
  if (bucket === "strong") return "border-white/25 text-white";
  if (bucket === "moderate") return "border-white/20 text-white/80";
  if (bucket === "weak") return "border-white/15 text-white/65";
  if (bucket === "unknown") return "border-white/10 text-white/55";
  if (bucket === "manual-review") return "border-white/25 text-white";
  return "border-white/15 text-white/60";
}

export function countMultiTrackConfidenceStatus(
  items: { status: MultiTrackConfidenceReadinessStatus }[],
  status: MultiTrackConfidenceReadinessStatus,
): number {
  return items.filter((item) => item.status === status).length;
}

export function getMultiTrackConfidenceWorkspaceSummary(state: MultiTrackConfidenceWorkspaceState): {
  ready: number;
  needsReview: number;
  blocked: number;
  future: number;
  total: number;
  averageScore: number;
} {
  const statusItems = [
    ...state.sources,
    ...state.evidence,
    ...state.risks,
    ...state.dashboardCards,
    ...state.safetyRules,
  ];

  const totalScore = state.sources.reduce((sum, source) => sum + source.score, 0);
  const averageScore = Math.round(totalScore / Math.max(state.sources.length, 1));

  return {
    ready: countMultiTrackConfidenceStatus(statusItems, "ready"),
    needsReview: countMultiTrackConfidenceStatus(statusItems, "needs-review"),
    blocked: countMultiTrackConfidenceStatus(statusItems, "blocked"),
    future: countMultiTrackConfidenceStatus(statusItems, "future"),
    total: statusItems.length,
    averageScore,
  };
}

export function getMultiTrackConfidenceSourcesByBucket(
  sources: MultiTrackConfidenceSource[],
  bucket: MultiTrackConfidenceBucket,
): MultiTrackConfidenceSource[] {
  return sources.filter((source) => source.bucket === bucket);
}

export function getMultiTrackConfidenceEvidenceForSource(
  evidence: MultiTrackConfidenceEvidence[],
  sourceId: string,
): MultiTrackConfidenceEvidence[] {
  return evidence.filter((item) => item.sourceId === sourceId);
}

export function getMultiTrackConfidenceRisksForSource(
  risks: MultiTrackConfidenceRisk[],
  sourceId: string,
): MultiTrackConfidenceRisk[] {
  return risks.filter((risk) => risk.sourceId === sourceId);
}

export function getMultiTrackConfidenceManualSources(
  sources: MultiTrackConfidenceSource[],
): MultiTrackConfidenceSource[] {
  return sources.filter(
    (source) =>
      source.bucket === "manual-review" ||
      source.status === "needs-review",
  );
}

export function getMultiTrackConfidenceFutureSources(
  sources: MultiTrackConfidenceSource[],
): MultiTrackConfidenceSource[] {
  return sources.filter((source) => source.status === "future");
}

export function getMultiTrackConfidenceReadyEvidence(
  evidence: MultiTrackConfidenceEvidence[],
): MultiTrackConfidenceEvidence[] {
  return evidence.filter((item) => item.status === "ready");
}

export function getMultiTrackConfidenceBlockingRisks(
  risks: MultiTrackConfidenceRisk[],
): MultiTrackConfidenceRisk[] {
  return risks.filter(
    (risk) =>
      risk.escalation === "blocked" ||
      risk.status === "blocked",
  );
}

export function buildMultiTrackConfidencePlanningSentence(
  state: MultiTrackConfidenceWorkspaceState,
): string {
  const summary = getMultiTrackConfidenceWorkspaceSummary(state);

  return `${summary.ready} ready item(s), ${summary.needsReview} review item(s), ${summary.future} future item(s), average source score ${summary.averageScore}/100.`;
}

export function buildMultiTrackConfidenceBucketCounts(
  sources: MultiTrackConfidenceSource[],
): {
  verified: number;
  strong: number;
  moderate: number;
  weak: number;
  unknown: number;
  manualReview: number;
  blocked: number;
} {
  return {
    verified: getMultiTrackConfidenceSourcesByBucket(
      sources,
      "verified",
    ).length,
    strong: getMultiTrackConfidenceSourcesByBucket(
      sources,
      "strong",
    ).length,
    moderate: getMultiTrackConfidenceSourcesByBucket(
      sources,
      "moderate",
    ).length,
    weak: getMultiTrackConfidenceSourcesByBucket(
      sources,
      "weak",
    ).length,
    unknown: getMultiTrackConfidenceSourcesByBucket(
      sources,
      "unknown",
    ).length,
    manualReview: getMultiTrackConfidenceSourcesByBucket(
      sources,
      "manual-review",
    ).length,
    blocked: getMultiTrackConfidenceSourcesByBucket(
      sources,
      "blocked",
    ).length,
  };
}

export function buildMultiTrackConfidenceSafetySummary(): string[] {
  return [
    "Read-only confidence planning.",
    "No engine state.",
    "No DSP.",
    "No audio processing.",
    "No save or Supabase writes.",
    "No duplicate track state.",
    "No automatic lineage claims.",
    "No automatic ownership claims.",
    "User overrides everything.",
  ];
}