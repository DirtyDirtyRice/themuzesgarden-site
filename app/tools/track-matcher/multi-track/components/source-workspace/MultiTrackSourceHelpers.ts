import type {
  MultiTrackEngineTrackSlotId,
  MultiTrackEngineTrackState,
} from "../../engine/multiTrackEngineTypes";
import { MULTI_TRACK_SOURCE_WORKSPACE_ITEMS } from "./MultiTrackSourceSeed";
import type {
  MultiTrackSourceWorkspaceItem,
  MultiTrackSourceWorkspaceRecommendation,
} from "./MultiTrackSourceTypes";

export function getMultiTrackSourceWorkspaceItems(): MultiTrackSourceWorkspaceItem[] {
  return MULTI_TRACK_SOURCE_WORKSPACE_ITEMS;
}

export function getMultiTrackSourceItemById(
  sourceId: string,
): MultiTrackSourceWorkspaceItem | undefined {
  return MULTI_TRACK_SOURCE_WORKSPACE_ITEMS.find((source) => source.id === sourceId);
}

export function createMultiTrackSourcePatch(
  source: MultiTrackSourceWorkspaceItem,
  trackSlotId: MultiTrackEngineTrackSlotId,
): Partial<MultiTrackEngineTrackState> {
  const laneLabel = trackSlotId === "track-a" ? "Track A" : "Track B";

  return {
    ...source.demoPatch,
    sourceId: `${source.demoPatch.sourceId}-${trackSlotId}`,
    sourceLabel: `${source.label} source for ${laneLabel}`,
    loaded: true,
  };
}

export function createMultiTrackSourceClearPatch(
  track: MultiTrackEngineTrackState,
): Partial<MultiTrackEngineTrackState> {
  return {
    sourceLabel: `Waiting for ${track.label}`,
    sourceKind: "empty",
    sourceId: "",
    title: "No track loaded",
    artist: "Unknown artist",
    album: "Unknown album",
    durationSeconds: 0,
    bpm: null,
    keyLabel: "Unknown key",
    sampleRate: null,
    channelCount: null,
    gainDb: 0,
    muted: false,
    solo: false,
    armed: false,
    locked: false,
    loaded: false,
    waveformReady: false,
    analysisReady: false,
    syncReady: false,
    transientReady: false,
    metadataReady: false,
    readiness: "empty",
    notes: [
      `${track.label} was cleared from the source workspace.`,
      "Select a Library, Finder, Upload, Project, or Seed source to continue.",
    ],
  };
}

export function getMultiTrackSourceRecommendation(
  trackA: MultiTrackEngineTrackState,
  trackB: MultiTrackEngineTrackState,
): MultiTrackSourceWorkspaceRecommendation {
  if (!trackA.loaded && !trackB.loaded) {
    return {
      title: "Load both source lanes",
      detail:
        "Track A and Track B are both empty. Start with Library or Seed sources for the safest comparison test.",
      actionLabel: "Pick two sources",
    };
  }

  if (trackA.loaded && !trackB.loaded) {
    return {
      title: "Track B needs a source",
      detail:
        "Track A is loaded. Add a Finder, Library, Project, Upload, or Seed source to Track B.",
      actionLabel: "Load Track B",
    };
  }

  if (!trackA.loaded && trackB.loaded) {
    return {
      title: "Track A needs a source",
      detail:
        "Track B is loaded. Add a Library, Finder, Project, Upload, or Seed source to Track A.",
      actionLabel: "Load Track A",
    };
  }

  if (trackA.sourceKind === trackB.sourceKind) {
    return {
      title: "Both lanes share source type",
      detail: `Both lanes are using ${trackA.sourceKind} sources. This is useful for controlled comparison work.`,
      actionLabel: "Compare now",
    };
  }

  return {
    title: "Mixed source comparison ready",
    detail: `Track A uses ${trackA.sourceKind}; Track B uses ${trackB.sourceKind}. This is ready for cross-source comparison testing.`,
    actionLabel: "Review match",
  };
}