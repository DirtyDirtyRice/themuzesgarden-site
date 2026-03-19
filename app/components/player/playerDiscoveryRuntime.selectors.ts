import { buildDiscoveryMomentClusters } from "./playerDiscoveryClusters";
import { getDiscoveryHeatSummary } from "./playerDiscoveryHeat";

import type { DiscoveryMoment, DiscoveryTrack } from "./playerDiscoveryTypes";
import type {
  DiscoveryRuntime,
  DiscoveryRuntimeTrackSnapshot,
} from "./playerDiscoveryRuntime.types";

import {
  dedupeMoments,
  normalizeText,
  uniqStrings,
} from "./playerDiscoveryRuntime.shared";

export function getDiscoveryTrackById(
  runtime: DiscoveryRuntime,
  trackId: string
): DiscoveryTrack | null {
  const cleanTrackId = String(trackId ?? "").trim();
  if (!cleanTrackId) return null;

  return runtime.index.tracks.get(cleanTrackId) ?? null;
}

export function getAllDiscoveryMoments(runtime: DiscoveryRuntime): DiscoveryMoment[] {
  const out: DiscoveryMoment[] = [];

  for (const track of runtime.tracks) {
    out.push(...(Array.isArray(track.moments) ? track.moments : []));
  }

  return dedupeMoments(out);
}

export function getDiscoveryMomentsForTrack(
  runtime: DiscoveryRuntime,
  trackId: string
): DiscoveryMoment[] {
  const track = getDiscoveryTrackById(runtime, trackId);
  if (!track) return [];

  return dedupeMoments(track.moments ?? []);
}

export function getDiscoveryMomentsForExactTag(
  runtime: DiscoveryRuntime,
  query: string
): DiscoveryMoment[] {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return [];

  const hits = runtime.index.tagIndex.get(cleanQuery) ?? [];
  return dedupeMoments(hits);
}

export function getDiscoveryTrackIdsForExactTrackTag(
  runtime: DiscoveryRuntime,
  query: string
): string[] {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return [];

  const hits = runtime.index.trackTagIndex.get(cleanQuery) ?? [];
  return [...hits];
}

export function findDiscoveryMomentsByLooseTag(
  runtime: DiscoveryRuntime,
  query: string
): DiscoveryMoment[] {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return [];

  const out: DiscoveryMoment[] = [];

  for (const [tag, moments] of runtime.index.tagIndex.entries()) {
    if (tag === cleanQuery || tag.startsWith(cleanQuery) || tag.includes(cleanQuery)) {
      out.push(...moments);
    }
  }

  return dedupeMoments(out);
}

export function findDiscoveryTrackIdsByLooseTrackTag(
  runtime: DiscoveryRuntime,
  query: string
): string[] {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return [];

  const out: string[] = [];

  for (const [tag, trackIds] of runtime.index.trackTagIndex.entries()) {
    if (tag === cleanQuery || tag.startsWith(cleanQuery) || tag.includes(cleanQuery)) {
      out.push(...trackIds);
    }
  }

  return uniqStrings(out);
}

export function getDiscoveryClusterCountForTrack(
  runtime: DiscoveryRuntime,
  trackId: string,
  windowSec = 12
): number {
  const moments = getDiscoveryMomentsForTrack(runtime, trackId);
  if (!moments.length) return 0;

  return buildDiscoveryMomentClusters(moments, windowSec).length;
}

export function getDiscoveryPrimaryHeatForTrack(
  runtime: DiscoveryRuntime,
  trackId: string,
  query: string
): number {
  const moments = getDiscoveryMomentsForTrack(runtime, trackId);
  if (!moments.length) return 0;

  return getDiscoveryHeatSummary({
    moments,
    query,
    sourceSectionCount: moments.length,
  }).primaryMomentHeat;
}

export function getDiscoveryRuntimeTrackSnapshot(args: {
  runtime: DiscoveryRuntime;
  trackId: string;
  query?: string;
  matchedTags?: string[];
  windowSec?: number;
}): DiscoveryRuntimeTrackSnapshot | null {
  const { runtime, trackId } = args;
  const track = getDiscoveryTrackById(runtime, trackId);
  if (!track) return null;

  const moments = getDiscoveryMomentsForTrack(runtime, trackId);
  const matchedTags = uniqStrings(args.matchedTags ?? []);
  const sourceSectionCount = moments.length;
  const windowSec = Number.isFinite(args.windowSec) ? Number(args.windowSec) : 12;

  const heatSummary = getDiscoveryHeatSummary({
    moments,
    query: String(args.query ?? "").trim(),
    sourceSectionCount,
    windowSec,
  });

  const clusters = buildDiscoveryMomentClusters(moments, windowSec);

  return {
    trackId: track.trackId,
    title: track.title,
    artist: track.artist,
    trackTagCount: Array.isArray(track.trackTags) ? track.trackTags.length : 0,
    momentCount: moments.length,
    clusterCount: clusters.length,
    primaryHeat: heatSummary.primaryMomentHeat,
    matchedTagCount: matchedTags.length,
  };
}

export function getDiscoveryRuntimeSummary(runtime: DiscoveryRuntime): {
  sourceTrackCount: number;
  discoveryTrackCount: number;
  indexedMomentCount: number;
  indexedMomentTagCount: number;
  indexedTrackTagCount: number;
  totalClusterCount: number;
  averageMomentsPerTrack: number;
} {
  let indexedMomentCount = 0;
  let totalClusterCount = 0;

  for (const track of runtime.tracks) {
    const moments = dedupeMoments(track.moments ?? []);
    indexedMomentCount += moments.length;
    totalClusterCount += buildDiscoveryMomentClusters(moments).length;
  }

  return {
    sourceTrackCount: runtime.sourceTrackCount,
    discoveryTrackCount: runtime.discoveryTrackCount,
    indexedMomentCount,
    indexedMomentTagCount: runtime.index.tagIndex.size,
    indexedTrackTagCount: runtime.index.trackTagIndex.size,
    totalClusterCount,
    averageMomentsPerTrack:
      runtime.discoveryTrackCount > 0
        ? indexedMomentCount / runtime.discoveryTrackCount
        : 0,
  };
}