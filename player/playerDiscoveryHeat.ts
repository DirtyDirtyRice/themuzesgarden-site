import type { DiscoveryMoment } from "./playerDiscoveryTypes";

export type DiscoveryHeatSummary = {
  momentCount: number;
  primaryMomentHeat: number;
  maxClusterSize: number;
  densityScore: number;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function getSearchTier(value: unknown, query: string): 3 | 2 | 1 | 0 {
  const normalized = normalizeText(value);

  if (!normalized || !query) return 0;
  if (normalized === query) return 3;
  if (normalized.startsWith(query)) return 2;
  if (normalized.includes(query)) return 1;
  return 0;
}

function sortMomentsByTime(moments: DiscoveryMoment[]): DiscoveryMoment[] {
  return [...moments].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;

    const byTrack = String(a.trackId ?? "").localeCompare(String(b.trackId ?? ""), undefined, {
      sensitivity: "base",
    });
    if (byTrack !== 0) return byTrack;

    return String(a.sectionId ?? "").localeCompare(String(b.sectionId ?? ""), undefined, {
      sensitivity: "base",
    });
  });
}

export function getDiscoveryMomentClusterSizes(
  moments: DiscoveryMoment[],
  windowSec = 12
): Map<string, number> {
  const sorted = sortMomentsByTime(moments);
  const result = new Map<string, number>();

  if (!sorted.length) return result;

  let startIdx = 0;

  for (let endIdx = 0; endIdx < sorted.length; endIdx += 1) {
    while (sorted[endIdx]!.startTime - sorted[startIdx]!.startTime > windowSec) {
      startIdx += 1;
    }

    const clusterSize = endIdx - startIdx + 1;

    for (let i = startIdx; i <= endIdx; i += 1) {
      const moment = sorted[i]!;
      const key = `${moment.trackId}__${moment.sectionId}__${moment.startTime}`;
      const prev = result.get(key) ?? 0;

      if (clusterSize > prev) {
        result.set(key, clusterSize);
      }
    }
  }

  return result;
}

export function getDiscoveryMaxClusterSize(
  moments: DiscoveryMoment[],
  windowSec = 12
): number {
  const clusterSizes = getDiscoveryMomentClusterSizes(moments, windowSec);

  let max = 0;

  for (const size of clusterSizes.values()) {
    if (size > max) max = size;
  }

  return max;
}

export function getDiscoveryPrimaryMomentHeat(
  moments: DiscoveryMoment[],
  query: string
): number {
  const cleanQuery = normalizeText(query);
  const primary = sortMomentsByTime(moments)[0] ?? null;

  if (!primary || !cleanQuery) return 0;

  let bestTier: 3 | 2 | 1 | 0 = 0;

  for (const tag of primary.tags ?? []) {
    const tier = getSearchTier(tag, cleanQuery);
    if (tier > bestTier) bestTier = tier;
    if (bestTier === 3) break;
  }

  if (bestTier === 3) return 120;
  if (bestTier === 2) return 90;
  if (bestTier === 1) return 65;

  const labelTier = getSearchTier(primary.label, cleanQuery);
  if (labelTier === 3) return 64;
  if (labelTier === 2) return 48;
  if (labelTier === 1) return 34;

  return 40;
}

export function getDiscoveryMomentDensityScore(
  momentCount: number,
  sourceSectionCount: number
): number {
  if (momentCount <= 0 || sourceSectionCount <= 0) return 0;

  const density = momentCount / sourceSectionCount;

  if (density >= 0.9) return 18;
  if (density >= 0.75) return 14;
  if (density >= 0.5) return 10;
  if (density >= 0.25) return 6;
  return 0;
}

export function getDiscoveryHeatSummary(args: {
  moments: DiscoveryMoment[];
  query: string;
  sourceSectionCount: number;
  windowSec?: number;
}): DiscoveryHeatSummary {
  const moments = Array.isArray(args.moments) ? args.moments : [];
  const windowSec = Number.isFinite(args.windowSec) ? Number(args.windowSec) : 12;

  return {
    momentCount: moments.length,
    primaryMomentHeat: getDiscoveryPrimaryMomentHeat(moments, args.query),
    maxClusterSize: getDiscoveryMaxClusterSize(moments, windowSec),
    densityScore: getDiscoveryMomentDensityScore(moments.length, args.sourceSectionCount),
  };
}