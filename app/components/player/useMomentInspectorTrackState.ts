"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnyTrack } from "./playerTypes";
import { getTrackSortLabel } from "./momentInspectorHelpers";
import { syncTrackSelection } from "./momentInspectorSelectionSync";
import { getDiscoveryRuntime } from "./playerDiscoveryRuntime";

type UseMomentInspectorTrackStateResult = {
  discoveryRuntime: ReturnType<typeof getDiscoveryRuntime>;
  sortedTracks: AnyTrack[];
  trackId: string;
  setTrackId: React.Dispatch<React.SetStateAction<string>>;
  selectedTrack: AnyTrack | null;
};

export function useMomentInspectorTrackState(
  allTracks: AnyTrack[]
): UseMomentInspectorTrackStateResult {
  const [trackId, setTrackId] = useState("");

  const discoveryRuntime = useMemo(() => {
    return getDiscoveryRuntime(allTracks);
  }, [allTracks]);

  const sortedTracks = useMemo(() => {
    const copy = [...allTracks];

    copy.sort((a, b) => {
      const aa = getTrackSortLabel(a).toLowerCase();
      const bb = getTrackSortLabel(b).toLowerCase();

      const byLabel = aa.localeCompare(bb, undefined, { sensitivity: "base" });
      if (byLabel !== 0) return byLabel;

      return String(a?.id ?? "").localeCompare(String(b?.id ?? ""), undefined, {
        sensitivity: "base",
      });
    });

    return copy;
  }, [allTracks]);

  useEffect(() => {
    syncTrackSelection({
      sortedTracks,
      trackId,
      setTrackId,
    });
  }, [sortedTracks, trackId]);

  const selectedTrack = useMemo(() => {
    const clean = String(trackId).trim();

    if (clean) {
      return sortedTracks.find((track) => String(track?.id ?? "") === clean) ?? null;
    }

    return sortedTracks[0] ?? null;
  }, [sortedTracks, trackId]);

  return {
    discoveryRuntime,
    sortedTracks,
    trackId,
    setTrackId,
    selectedTrack,
  };
}