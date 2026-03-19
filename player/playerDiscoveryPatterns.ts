import type { DiscoveryMoment } from "./playerDiscoveryTypes";
import {
  buildDiscoveryMomentClusters,
  type DiscoveryMomentCluster,
} from "./playerDiscoveryClusters";

export type DiscoveryPatternMatch = {
  sourceTrackId: string;
  targetTrackId: string;
  sourceStartTime: number;
  targetStartTime: number;
  sharedTags: string[];
  sharedLabels: string[];
  score: number;
  sourceCluster: DiscoveryMomentCluster;
  targetCluster: DiscoveryMomentCluster;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean))
  );
}

function intersectStrings(a: string[], b: string[]): string[] {
  const bSet = new Set(uniqStrings(b));
  return uniqStrings(a).filter((value) => bSet.has(value));
}

function buildClusterSignature(cluster: DiscoveryMomentCluster): {
  tags: string[];
  labels: string[];
} {
  return {
    tags: uniqStrings(cluster.tags ?? []),
    labels: uniqStrings(cluster.labels ?? []),
  };
}

function scoreClusterPatternMatch(args: {
  sharedTags: string[];
  sharedLabels: string[];
  sourceCluster: DiscoveryMomentCluster;
  targetCluster: DiscoveryMomentCluster;
}): number {
  let score = 0;

  score += args.sharedTags.length * 20;
  score += args.sharedLabels.length * 10;

  const sourceCount = Number(args.sourceCluster.momentCount ?? 0);
  const targetCount = Number(args.targetCluster.momentCount ?? 0);

  if (sourceCount > 0 && targetCount > 0) {
    const smaller = Math.min(sourceCount, targetCount);
    const larger = Math.max(sourceCount, targetCount);

    if (smaller === larger) score += 18;
    else if (smaller >= Math.max(1, Math.floor(larger * 0.75))) score += 12;
    else if (smaller >= Math.max(1, Math.floor(larger * 0.5))) score += 6;
  }

  return score;
}

function compareClusters(
  sourceCluster: DiscoveryMomentCluster,
  targetCluster: DiscoveryMomentCluster,
  minScore: number
): DiscoveryPatternMatch | null {
  const sourceSignature = buildClusterSignature(sourceCluster);
  const targetSignature = buildClusterSignature(targetCluster);

  const sharedTags = intersectStrings(sourceSignature.tags, targetSignature.tags);
  const sharedLabels = intersectStrings(sourceSignature.labels, targetSignature.labels);

  if (!sharedTags.length && !sharedLabels.length) return null;

  const score = scoreClusterPatternMatch({
    sharedTags,
    sharedLabels,
    sourceCluster,
    targetCluster,
  });

  if (score < minScore) return null;

  return {
    sourceTrackId: String(sourceCluster.trackId ?? "").trim(),
    targetTrackId: String(targetCluster.trackId ?? "").trim(),
    sourceStartTime: Number(sourceCluster.startTime ?? 0),
    targetStartTime: Number(targetCluster.startTime ?? 0),
    sharedTags,
    sharedLabels,
    score,
    sourceCluster,
    targetCluster,
  };
}

export function findDiscoveryPatternMatches(args: {
  sourceMoments: DiscoveryMoment[];
  targetMoments: DiscoveryMoment[];
  windowSec?: number;
  minScore?: number;
}): DiscoveryPatternMatch[] {
  const windowSec = Number.isFinite(args.windowSec) ? Number(args.windowSec) : 12;
  const minScore = Number.isFinite(args.minScore) ? Number(args.minScore) : 20;

  const sourceClusters = buildDiscoveryMomentClusters(args.sourceMoments ?? [], windowSec);
  const targetClusters = buildDiscoveryMomentClusters(args.targetMoments ?? [], windowSec);

  const out: DiscoveryPatternMatch[] = [];

  for (const sourceCluster of sourceClusters) {
    for (const targetCluster of targetClusters) {
      const sameTrack =
        String(sourceCluster.trackId ?? "") === String(targetCluster.trackId ?? "");

      if (sameTrack) continue;

      const match = compareClusters(sourceCluster, targetCluster, minScore);
      if (!match) continue;

      out.push(match);
    }
  }

  return out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const bySharedTags = b.sharedTags.length - a.sharedTags.length;
    if (bySharedTags !== 0) return bySharedTags;

    const bySharedLabels = b.sharedLabels.length - a.sharedLabels.length;
    if (bySharedLabels !== 0) return bySharedLabels;

    if (a.sourceStartTime !== b.sourceStartTime) {
      return a.sourceStartTime - b.sourceStartTime;
    }

    return String(a.targetTrackId).localeCompare(String(b.targetTrackId), undefined, {
      sensitivity: "base",
    });
  });
}

export function findBestDiscoveryPatternMatch(args: {
  sourceMoments: DiscoveryMoment[];
  targetMoments: DiscoveryMoment[];
  windowSec?: number;
  minScore?: number;
}): DiscoveryPatternMatch | null {
  const matches = findDiscoveryPatternMatches(args);
  return matches[0] ?? null;
}