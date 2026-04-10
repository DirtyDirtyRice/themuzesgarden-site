import type { AnyTrack } from "./playerTypes";
import { findMatchedMoments, scoreTrack } from "./playerUtils";

export type PlayerSearchInsights = {
  rankedCount: number;
  hotCount: number;
  warmCount: number;
  bestScore: number;
};

export function getHeatBucket(
  score: number,
  matchedMomentCount: number
): "hot" | "warm" | "none" {
  if (matchedMomentCount <= 0) return "none";
  if (score >= 220) return "hot";
  if (score >= 140) return "warm";
  return "none";
}

export function getSearchModeLabel(query: string): string {
  if (!query) return "Idle";
  return "Heat Ranked";
}

export function buildSearchInsights(
  allTracks: AnyTrack[],
  normalizedQuery: string
): PlayerSearchInsights {
  if (!normalizedQuery) {
    return {
      rankedCount: 0,
      hotCount: 0,
      warmCount: 0,
      bestScore: 0,
    };
  }

  let rankedCount = 0;
  let hotCount = 0;
  let warmCount = 0;
  let bestScore = 0;

  for (const track of allTracks) {
    const matchedMoments = findMatchedMoments(track, normalizedQuery);
    const score = scoreTrack(track, normalizedQuery, matchedMoments.length);

    if (score <= 0) continue;

    rankedCount += 1;
    if (score > bestScore) bestScore = score;

    const heatBucket = getHeatBucket(score, matchedMoments.length);
    if (heatBucket === "hot") hotCount += 1;
    else if (heatBucket === "warm") warmCount += 1;
  }

  return {
    rankedCount,
    hotCount,
    warmCount,
    bestScore,
  };
}