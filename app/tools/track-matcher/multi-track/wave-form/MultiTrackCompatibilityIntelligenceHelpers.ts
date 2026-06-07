import type {
  MultiTrackCompatibilityCategory,
  MultiTrackCompatibilityEvidenceSource,
  MultiTrackCompatibilityLane,
  MultiTrackCompatibilityPair,
  MultiTrackCompatibilityRating,
  MultiTrackCompatibilityReadinessStatus,
  MultiTrackCompatibilityRisk,
  MultiTrackCompatibilitySignal,
  MultiTrackCompatibilityUseCase,
  MultiTrackCompatibilityWorkspaceState,
} from "./MultiTrackCompatibilityIntelligenceTypes";

export function getMultiTrackCompatibilityStatusLabel(
  status: MultiTrackCompatibilityReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackCompatibilityStatusClass(
  status: MultiTrackCompatibilityReadinessStatus,
): string {
  if (status === "ready") return "border-white/40 bg-white/10 text-white";
  if (status === "needs-review") return "border-white/30 bg-black text-white/80";
  if (status === "blocked") return "border-white/20 bg-black text-white/70";
  return "border-white/10 bg-black text-white/60";
}

export function getMultiTrackCompatibilityCategoryLabel(
  category: MultiTrackCompatibilityCategory,
): string {
  if (category === "tempo") return "Tempo";
  if (category === "key") return "Key";
  if (category === "section") return "Section";
  if (category === "stem") return "Stem";
  if (category === "arrangement") return "Arrangement";
  if (category === "energy") return "Energy";
  if (category === "lineage") return "Lineage";
  if (category === "confidence") return "Confidence";
  if (category === "hybrid") return "Hybrid";
  if (category === "mix") return "Mix";
  return "Future";
}

export function getMultiTrackCompatibilityRatingLabel(
  rating: MultiTrackCompatibilityRating,
): string {
  if (rating === "excellent") return "Excellent";
  if (rating === "good") return "Good";
  if (rating === "possible") return "Possible";
  if (rating === "weak") return "Weak";
  if (rating === "blocked") return "Blocked";
  if (rating === "unknown") return "Unknown";
  return "Future";
}

export function getMultiTrackCompatibilityEvidenceSourceLabel(
  evidenceSource: MultiTrackCompatibilityEvidenceSource,
): string {
  if (evidenceSource === "waveform") return "Waveform";
  if (evidenceSource === "statistics") return "Statistics";
  if (evidenceSource === "cue") return "Cue";
  if (evidenceSource === "marker") return "Marker";
  if (evidenceSource === "detection") return "Detection";
  if (evidenceSource === "stem-ownership") return "Stem Ownership";
  if (evidenceSource === "dsp-ownership") return "DSP Ownership";
  if (evidenceSource === "arrangement") return "Arrangement";
  if (evidenceSource === "lineage") return "Lineage";
  if (evidenceSource === "section") return "Section";
  if (evidenceSource === "comparison") return "Comparison";
  if (evidenceSource === "confidence") return "Confidence";
  if (evidenceSource === "manual-review") return "Manual Review";
  return "Future AI";
}

export function getMultiTrackCompatibilityUseCaseLabel(
  useCase: MultiTrackCompatibilityUseCase,
): string {
  if (useCase === "a-b-review") return "A/B Review";
  if (useCase === "sync-check") return "Sync Check";
  if (useCase === "key-check") return "Key Check";
  if (useCase === "section-match") return "Section Match";
  if (useCase === "stem-match") return "Stem Match";
  if (useCase === "hybrid-planning") return "Hybrid Planning";
  if (useCase === "mashup-planning") return "Mashup Planning";
  if (useCase === "mix-planning") return "Mix Planning";
  return "Future Builder";
}

export function getMultiTrackCompatibilityRiskLabel(
  risk: MultiTrackCompatibilityRisk,
): string {
  if (risk === "missing-track-a") return "Missing Track A";
  if (risk === "missing-track-b") return "Missing Track B";
  if (risk === "missing-bpm") return "Missing BPM";
  if (risk === "missing-key") return "Missing Key";
  if (risk === "missing-section-map") return "Missing Section Map";
  if (risk === "missing-stem-map") return "Missing Stem Map";
  if (risk === "weak-confidence") return "Weak Confidence";
  if (risk === "conflicting-evidence") return "Conflicting Evidence";
  if (risk === "manual-review-required") return "Manual Review Required";
  return "Future Only";
}

export function getMultiTrackCompatibilitySignalById(
  signals: MultiTrackCompatibilitySignal[],
  signalId: string,
): MultiTrackCompatibilitySignal | undefined {
  return signals.find((signal) => signal.id === signalId);
}

export function getMultiTrackCompatibilityPairById(
  pairs: MultiTrackCompatibilityPair[],
  pairId: string,
): MultiTrackCompatibilityPair | undefined {
  return pairs.find((pair) => pair.id === pairId);
}

export function getMultiTrackCompatibilityLaneSignals(
  lane: MultiTrackCompatibilityLane,
  signals: MultiTrackCompatibilitySignal[],
): MultiTrackCompatibilitySignal[] {
  return lane.signalIds
    .map((signalId) => getMultiTrackCompatibilitySignalById(signals, signalId))
    .filter((signal): signal is MultiTrackCompatibilitySignal =>
      Boolean(signal),
    );
}

export function getMultiTrackCompatibilityLanePairs(
  lane: MultiTrackCompatibilityLane,
  pairs: MultiTrackCompatibilityPair[],
): MultiTrackCompatibilityPair[] {
  return lane.pairIds
    .map((pairId) => getMultiTrackCompatibilityPairById(pairs, pairId))
    .filter((pair): pair is MultiTrackCompatibilityPair => Boolean(pair));
}

export function getMultiTrackCompatibilityPairSignals(
  pair: MultiTrackCompatibilityPair,
  signals: MultiTrackCompatibilitySignal[],
): MultiTrackCompatibilitySignal[] {
  return pair.signalIds
    .map((signalId) => getMultiTrackCompatibilitySignalById(signals, signalId))
    .filter((signal): signal is MultiTrackCompatibilitySignal =>
      Boolean(signal),
    );
}

export function getMultiTrackCompatibilityRiskSummary(
  risks: MultiTrackCompatibilityRisk[],
): string {
  if (risks.length === 0) return "No risks listed.";
  return risks.map(getMultiTrackCompatibilityRiskLabel).join(", ");
}

export function getMultiTrackCompatibilityEvidenceSummary(
  evidenceSources: MultiTrackCompatibilityEvidenceSource[],
): string {
  if (evidenceSources.length === 0) return "No evidence listed.";
  return evidenceSources
    .map(getMultiTrackCompatibilityEvidenceSourceLabel)
    .join(", ");
}

export function getMultiTrackCompatibilityReadySignalCount(
  signals: MultiTrackCompatibilitySignal[],
): number {
  return signals.filter((signal) => signal.readinessStatus === "ready").length;
}

export function getMultiTrackCompatibilityReviewSignalCount(
  signals: MultiTrackCompatibilitySignal[],
): number {
  return signals.filter((signal) => signal.readinessStatus === "needs-review")
    .length;
}

export function getMultiTrackCompatibilityReadyPairCount(
  pairs: MultiTrackCompatibilityPair[],
): number {
  return pairs.filter((pair) => pair.readinessStatus === "ready").length;
}

export function getMultiTrackCompatibilityFutureCount(
  workspace: MultiTrackCompatibilityWorkspaceState,
): number {
  const futureSignals = workspace.signals.filter(
    (signal) => signal.readinessStatus === "future",
  ).length;
  const futurePairs = workspace.pairs.filter(
    (pair) => pair.readinessStatus === "future",
  ).length;
  const futureLanes = workspace.lanes.filter(
    (lane) => lane.status === "future",
  ).length;

  return futureSignals + futurePairs + futureLanes;
}

export function getMultiTrackCompatibilityWorkspaceSummary(
  workspace: MultiTrackCompatibilityWorkspaceState,
): string {
  const readySignals = getMultiTrackCompatibilityReadySignalCount(
    workspace.signals,
  );
  const reviewSignals = getMultiTrackCompatibilityReviewSignalCount(
    workspace.signals,
  );
  const readyPairs = getMultiTrackCompatibilityReadyPairCount(workspace.pairs);
  const futureItems = getMultiTrackCompatibilityFutureCount(workspace);

  return `${readySignals} ready signals, ${reviewSignals} review signals, ${readyPairs} ready pairs, and ${futureItems} future items.`;
}