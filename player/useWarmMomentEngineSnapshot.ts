"use client";

import { useEffect } from "react";
import type { AnyTrack } from "./playerTypes";
import {
  getMomentEngineCacheStatus,
  warmMomentEngineSnapshot,
} from "./searchTabHelpers";

const warmedTrackSets = new WeakSet<AnyTrack[]>();

export function useWarmMomentEngineSnapshot(allTracks: AnyTrack[]) {
  useEffect(() => {
    if (!Array.isArray(allTracks) || allTracks.length === 0) return;
    if (warmedTrackSets.has(allTracks)) return;

    warmMomentEngineSnapshot(allTracks);
    warmedTrackSets.add(allTracks);

    if (process.env.NODE_ENV !== "production") {
      const status = getMomentEngineCacheStatus();
      console.log("[MomentEngineWarmBoot]", {
        trackCount: allTracks.length,
        cacheStatus: status,
      });
    }
  }, [allTracks]);
}