import type {
  MultiTrackEngineSignalPolarity,
  MultiTrackEngineState,
} from "./multiTrackEngineTypes";
import type {
  MultiTrackEngineRelationshipItem,
  MultiTrackEngineRelationshipState,
  MultiTrackEngineRelationshipStrength,
} from "./multiTrackEngineRelationshipTypes";
import { DEFAULT_MULTI_TRACK_ENGINE_RELATIONSHIP_STATE } from "./multiTrackEngineRelationshipSeed";

export function createMultiTrackEngineRelationshipState(): MultiTrackEngineRelationshipState {
  return structuredClone(DEFAULT_MULTI_TRACK_ENGINE_RELATIONSHIP_STATE);
}

export function getRelationshipStrength(score: number): MultiTrackEngineRelationshipStrength {
  if (score >= 90) return "excellent";
  if (score >= 75) return "strong";
  if (score >= 50) return "usable";
  if (score > 0) return "weak";
  return "unknown";
}

export function getRelationshipPolarity(score: number): MultiTrackEngineSignalPolarity {
  if (score >= 70) return "positive";
  if (score >= 30) return "neutral";
  return "negative";
}

export function calculateRelationshipAverageScore(
  relationships: MultiTrackEngineRelationshipItem[],
): number {
  if (relationships.length === 0) return 0;

  const total = relationships.reduce((sum, relationship) => sum + relationship.score, 0);
  return Math.round(total / relationships.length);
}

export function calculateRelationshipAverageConfidence(
  relationships: MultiTrackEngineRelationshipItem[],
): number {
  if (relationships.length === 0) return 0;

  const total = relationships.reduce((sum, relationship) => sum + relationship.confidence, 0);
  return Math.round(total / relationships.length);
}

export function getStrongestRelationshipLabel(
  relationships: MultiTrackEngineRelationshipItem[],
): string {
  if (relationships.length === 0) return "No strongest relationship yet";

  return (
    [...relationships].sort((left, right) => right.score - left.score)[0]?.label ??
    "No strongest relationship yet"
  );
}

export function getWeakestRelationshipLabel(
  relationships: MultiTrackEngineRelationshipItem[],
): string {
  if (relationships.length === 0) return "No weakest relationship yet";

  return (
    [...relationships].sort((left, right) => left.score - right.score)[0]?.label ??
    "No weakest relationship yet"
  );
}

export function recalculateMultiTrackEngineRelationshipState(
  relationshipState: MultiTrackEngineRelationshipState,
  engineState: MultiTrackEngineState,
): MultiTrackEngineRelationshipState {
  const relationships: MultiTrackEngineRelationshipItem[] = relationshipState.relationships.map(
    (relationship) => {
      if (relationship.id === "relationship-tempo") {
        const score = calculateRelationshipTempoScore(engineState.trackA.bpm, engineState.trackB.bpm);

        return {
          ...relationship,
          trackALabel: engineState.trackA.bpm ? `${engineState.trackA.bpm} BPM` : "Track A BPM unknown",
          trackBLabel: engineState.trackB.bpm ? `${engineState.trackB.bpm} BPM` : "Track B BPM unknown",
          detail: getRelationshipTempoDetail(engineState.trackA.bpm, engineState.trackB.bpm),
          score,
          confidence: score > 0 ? 80 : 0,
          strength: getRelationshipStrength(score),
          polarity: getRelationshipPolarity(score),
          ready: score > 0,
        };
      }

      if (relationship.id === "relationship-key") {
        const score = calculateRelationshipKeyScore(engineState.trackA.keyLabel, engineState.trackB.keyLabel);

        return {
          ...relationship,
          trackALabel: engineState.trackA.keyLabel,
          trackBLabel: engineState.trackB.keyLabel,
          detail: getRelationshipKeyDetail(engineState.trackA.keyLabel, engineState.trackB.keyLabel),
          score,
          confidence: score > 0 ? 75 : 0,
          strength: getRelationshipStrength(score),
          polarity: getRelationshipPolarity(score),
          ready: score > 0,
        };
      }

      if (relationship.id === "relationship-section") {
        const score = calculateRelationshipSectionScore(engineState.timeline.markers.length);

        return {
          ...relationship,
          trackALabel: `${engineState.timeline.markers.length} marker(s) available`,
          trackBLabel: `${engineState.timeline.cues.length} cue(s) available`,
          detail: getRelationshipSectionDetail(engineState.timeline.markers.length),
          score,
          confidence: score > 0 ? 55 : 0,
          strength: getRelationshipStrength(score),
          polarity: getRelationshipPolarity(score),
          ready: score > 0,
        };
      }

      if (relationship.id === "relationship-confidence") {
        const score = calculateRelationshipReadinessScore(engineState);

        return {
          ...relationship,
          trackALabel: engineState.trackA.readiness,
          trackBLabel: engineState.trackB.readiness,
          detail: `Relationship confidence is ${score}% based on current engine readiness fields.`,
          score,
          confidence: score,
          strength: getRelationshipStrength(score),
          polarity: getRelationshipPolarity(score),
          ready: score > 0,
        };
      }

      return relationship;
    },
  );

  const averageScore = calculateRelationshipAverageScore(relationships);
  const averageConfidence = calculateRelationshipAverageConfidence(relationships);

  return {
    ...relationshipState,
    readiness: averageScore >= 75 ? "ready" : averageScore >= 35 ? "warning" : "draft",
    summary: getRelationshipSummary(averageScore),
    strongestRelationshipLabel: getStrongestRelationshipLabel(relationships),
    weakestRelationshipLabel: getWeakestRelationshipLabel(relationships),
    averageScore,
    averageConfidence,
    relationships,
  };
}

export function calculateRelationshipTempoScore(
  trackABpm: number | null,
  trackBBpm: number | null,
): number {
  if (!trackABpm || !trackBBpm) return 0;

  const difference = Math.abs(trackABpm - trackBBpm);
  if (difference === 0) return 100;
  if (difference <= 2) return 92;
  if (difference <= 5) return 78;
  if (difference <= 10) return 55;
  return 25;
}

export function calculateRelationshipKeyScore(trackAKey: string, trackBKey: string): number {
  if (trackAKey === "Unknown key" || trackBKey === "Unknown key") return 0;
  if (trackAKey === trackBKey) return 100;

  const normalizedA = trackAKey.replace(" minor", "").replace(" major", "");
  const normalizedB = trackBKey.replace(" minor", "").replace(" major", "");

  if (normalizedA === normalizedB) return 82;
  return 45;
}

export function calculateRelationshipSectionScore(markerCount: number): number {
  if (markerCount <= 1) return 15;
  if (markerCount <= 3) return 45;
  if (markerCount <= 6) return 70;
  return 88;
}

export function calculateRelationshipReadinessScore(engineState: MultiTrackEngineState): number {
  const checks = [
    engineState.trackA.loaded,
    engineState.trackB.loaded,
    engineState.trackA.waveformReady,
    engineState.trackB.waveformReady,
    engineState.trackA.metadataReady,
    engineState.trackB.metadataReady,
    engineState.trackA.analysisReady,
    engineState.trackB.analysisReady,
    engineState.trackA.syncReady,
    engineState.trackB.syncReady,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function getRelationshipTempoDetail(
  trackABpm: number | null,
  trackBBpm: number | null,
): string {
  if (!trackABpm || !trackBBpm) return "Waiting for BPM values before tempo relationship can be scored.";

  const difference = Math.abs(trackABpm - trackBBpm);
  return `Track A and Track B are ${difference} BPM apart.`;
}

export function getRelationshipKeyDetail(trackAKey: string, trackBKey: string): string {
  if (trackAKey === "Unknown key" || trackBKey === "Unknown key") {
    return "Waiting for key labels before harmonic relationship can be scored.";
  }

  if (trackAKey === trackBKey) return `Both tracks share ${trackAKey}.`;
  return `Track A is ${trackAKey}; Track B is ${trackBKey}.`;
}

export function getRelationshipSectionDetail(markerCount: number): string {
  if (markerCount <= 1) return "Waiting for more timeline markers before section relationship can be scored.";
  return `${markerCount} timeline markers are available for section relationship scoring.`;
}

export function getRelationshipSummary(averageScore: number): string {
  if (averageScore >= 85) return "Track relationship foundation is excellent.";
  if (averageScore >= 70) return "Track relationship foundation is strong.";
  if (averageScore >= 45) return "Track relationship foundation is usable but incomplete.";
  if (averageScore > 0) return "Track relationship foundation is weak and needs more data.";
  return "Relationship intelligence is waiting for real Track A and Track B analysis data.";
}