import type { DiscoveryMoment } from "./playerDiscoveryTypes";

export type DiscoveryMomentCluster = {
  trackId: string;
  startTime: number;
  endTime: number;
  momentCount: number;
  sectionIds: string[];
  labels: string[];
  tags: string[];
  moments: DiscoveryMoment[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean))
  );
}

function sortMomentsByTime(moments: DiscoveryMoment[]): DiscoveryMoment[] {
  return [...moments].sort((a, b) => {
    const byTrack = String(a.trackId ?? "").localeCompare(String(b.trackId ?? ""), undefined, {
      sensitivity: "base",
    });
    if (byTrack !== 0) return byTrack;

    if (a.startTime !== b.startTime) return a.startTime - b.startTime;

    return String(a.sectionId ?? "").localeCompare(String(b.sectionId ?? ""), undefined, {
      sensitivity: "base",
    });
  });
}

function buildCluster(moments: DiscoveryMoment[]): DiscoveryMomentCluster {
  const safeMoments = sortMomentsByTime(moments);
  const first = safeMoments[0];

  return {
    trackId: String(first?.trackId ?? "").trim(),
    startTime: Number(first?.startTime ?? 0),
    endTime: Number(safeMoments[safeMoments.length - 1]?.startTime ?? first?.startTime ?? 0),
    momentCount: safeMoments.length,
    sectionIds: uniqStrings(safeMoments.map((moment) => String(moment.sectionId ?? ""))),
    labels: uniqStrings(safeMoments.map((moment) => String(moment.label ?? ""))),
    tags: uniqStrings(safeMoments.flatMap((moment) => moment.tags ?? [])),
    moments: safeMoments,
  };
}

export function buildDiscoveryMomentClusters(
  moments: DiscoveryMoment[],
  windowSec = 12
): DiscoveryMomentCluster[] {
  const safeMoments = sortMomentsByTime(Array.isArray(moments) ? moments : []);
  if (!safeMoments.length) return [];

  const clusters: DiscoveryMomentCluster[] = [];
  let working: DiscoveryMoment[] = [];

  for (const moment of safeMoments) {
    const prev = working[working.length - 1];

    if (!prev) {
      working.push(moment);
      continue;
    }

    const sameTrack = String(prev.trackId ?? "") === String(moment.trackId ?? "");
    const withinWindow = Math.abs(Number(moment.startTime) - Number(prev.startTime)) <= windowSec;

    if (sameTrack && withinWindow) {
      working.push(moment);
      continue;
    }

    clusters.push(buildCluster(working));
    working = [moment];
  }

  if (working.length) {
    clusters.push(buildCluster(working));
  }

  return clusters.sort((a, b) => {
    if (b.momentCount !== a.momentCount) return b.momentCount - a.momentCount;
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;

    return String(a.trackId).localeCompare(String(b.trackId), undefined, {
      sensitivity: "base",
    });
  });
}

export function getLargestDiscoveryCluster(
  moments: DiscoveryMoment[],
  windowSec = 12
): DiscoveryMomentCluster | null {
  const clusters = buildDiscoveryMomentClusters(moments, windowSec);
  return clusters[0] ?? null;
}