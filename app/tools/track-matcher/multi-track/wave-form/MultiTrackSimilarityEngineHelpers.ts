import { multiTrackSimilarityEngineWorkspace } from "./MultiTrackSimilarityEngineSeed";
import type {
  MultiTrackSimilarityEngineFeature,
  MultiTrackSimilarityEngineFinding,
  MultiTrackSimilarityEngineMatch,
  MultiTrackSimilarityEngineMatchStrength,
  MultiTrackSimilarityEngineReadiness,
  MultiTrackSimilarityEngineRegion,
  MultiTrackSimilarityEngineRisk,
  MultiTrackSimilarityEngineSource,
  MultiTrackSimilarityEngineStatus,
  MultiTrackSimilarityEngineWorkspace,
} from "./MultiTrackSimilarityEngineTypes";

export function getMultiTrackSimilarityEngineWorkspace(): MultiTrackSimilarityEngineWorkspace {
  return multiTrackSimilarityEngineWorkspace;
}

export function getSimilarityEngineReadinessLabel(
  readiness: MultiTrackSimilarityEngineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-waveform") return "Needs Waveform";
  if (readiness === "needs-statistics") return "Needs Statistics";
  if (readiness === "needs-transients") return "Needs Transients";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getSimilarityEngineStatusLabel(status: MultiTrackSimilarityEngineStatus): string {
  if (status === "matched") return "Matched";
  if (status === "estimated") return "Estimated";
  if (status === "seeded") return "Seeded";
  if (status === "missing") return "Missing";
  return "Future";
}

export function getSimilarityEngineRiskLabel(risk: MultiTrackSimilarityEngineRisk): string {
  if (risk === "low") return "Low";
  if (risk === "medium") return "Medium";
  if (risk === "high") return "High";
  return "Blocked";
}

export function getSimilarityEngineStrengthLabel(
  strength: MultiTrackSimilarityEngineMatchStrength,
): string {
  if (strength === "weak") return "Weak";
  if (strength === "moderate") return "Moderate";
  if (strength === "strong") return "Strong";
  if (strength === "keeper") return "Keeper";
  return "Blocked";
}

export function getSimilarityEngineBooleanLabel(value: boolean): string {
  return value ? "Ready" : "Not Ready";
}

export function getSimilarityEngineTimeLabel(timeMs: number): string {
  const seconds = Math.round(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function getSimilarityEngineRegionTimeLabel(
  region: MultiTrackSimilarityEngineRegion,
): string {
  return `${getSimilarityEngineTimeLabel(region.startMs)} - ${getSimilarityEngineTimeLabel(
    region.endMs,
  )}`;
}

export function getSimilarityEnginePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 100;
  return Math.round(value * 100);
}

export function getSimilarityEngineScoreWidth(score: number): string {
  return `${Math.max(4, getSimilarityEnginePercent(score))}%`;
}

export function getSimilarityEngineBestRegion(
  source: MultiTrackSimilarityEngineSource,
): MultiTrackSimilarityEngineRegion | null {
  if (source.regions.length === 0) return null;

  return source.regions.reduce((best, region) => {
    if (region.confidence > best.confidence) return region;
    return best;
  }, source.regions[0]);
}

export function getSimilarityEngineBestFeature(
  source: MultiTrackSimilarityEngineSource,
): MultiTrackSimilarityEngineFeature | null {
  if (source.features.length === 0) return null;

  return source.features.reduce((best, feature) => {
    if (feature.score > best.score) return feature;
    return best;
  }, source.features[0]);
}

export function getSimilarityEngineBestMatch(
  matches: MultiTrackSimilarityEngineMatch[],
): MultiTrackSimilarityEngineMatch | null {
  if (matches.length === 0) return null;

  return matches.reduce((best, match) => {
    if (match.overallScore > best.overallScore) return match;
    return best;
  }, matches[0]);
}

export function getSimilarityEngineStrongMatchCount(
  matches: MultiTrackSimilarityEngineMatch[],
): number {
  return matches.filter(
    (match) => match.matchStrength === "strong" || match.matchStrength === "keeper",
  ).length;
}

export function getSimilarityEngineRiskCount(matches: MultiTrackSimilarityEngineMatch[]): number {
  return matches.filter(
    (match) => match.risk === "medium" || match.risk === "high" || match.risk === "blocked",
  ).length;
}

export function getSimilarityEngineAverageMatchScore(
  matches: MultiTrackSimilarityEngineMatch[],
): number {
  if (matches.length === 0) return 0;
  const total = matches.reduce((sum, match) => sum + match.overallScore, 0);
  return roundSimilarityNumber(total / matches.length);
}

export function getSimilarityEngineSourceSummary(
  source: MultiTrackSimilarityEngineSource,
): string {
  const bestRegion = getSimilarityEngineBestRegion(source);
  const bestFeature = getSimilarityEngineBestFeature(source);

  if (!bestRegion || !bestFeature) {
    return "Similarity source needs regions and features before planning.";
  }

  return `${bestRegion.title} is strongest region. Best feature is ${bestFeature.label}.`;
}

export function getSimilarityEngineMatchSummary(match: MultiTrackSimilarityEngineMatch): string {
  return `${getSimilarityEngineStrengthLabel(match.matchStrength)} match, score ${
    match.overallScore
  }, drift ${match.timingDriftMs}ms, overlap ${roundSimilarityNumber(match.transientOverlap)}.`;
}

export function getSimilarityEngineFindingAction(
  finding: MultiTrackSimilarityEngineFinding,
): string {
  return `${getSimilarityEngineStatusLabel(finding.status)} / ${getSimilarityEngineRiskLabel(
    finding.risk,
  )}: ${finding.action}`;
}

export function buildSimilarityEnginePlanningSentence(
  workspace: MultiTrackSimilarityEngineWorkspace,
): string {
  const bestMatch = getSimilarityEngineBestMatch(workspace.matches);

  if (!bestMatch) {
    return "Similarity engine needs matches before planning survivor candidates.";
  }

  return `${bestMatch.title} is the strongest current match with score ${
    bestMatch.overallScore
  }. Recommendation: ${bestMatch.recommendation}`;
}

function roundSimilarityNumber(value: number): number {
  return Math.round(value * 100) / 100;
}