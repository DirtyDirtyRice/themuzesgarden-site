import type { Persisted } from "./playerTypes";
import { clampNonNegative } from "./audioEngineHelpers";

export type PlaybackQueueSource = "project" | "search";

export type PlaybackTarget = {
  track: import("./playerTypes").AnyTrack;
  startTime?: number;
  sectionId?: string | null;
};

export type HydratedPlaybackState = {
  currentSectionId: string | null;
  currentSectionStartTime: number | null;
  currentSectionEndTime: number | null;
  initialQueueSource: PlaybackQueueSource;
  initialNowId: string | null;
  initialShuffle: boolean | null;
  initialLoop: boolean | null;
  initialCurrentTime: number | null;
  initialVolume: number | null;
};

export function hydratePlaybackStateFromPersisted(
  persisted: Persisted
): HydratedPlaybackState {
  const currentSectionId =
    typeof persisted.currentSectionId === "string"
      ? persisted.currentSectionId
      : null;

  const currentSectionStartTime =
    typeof persisted.sectionStartTime === "number" &&
    Number.isFinite(persisted.sectionStartTime)
      ? clampNonNegative(persisted.sectionStartTime)
      : typeof persisted.lastMatchedSectionStartTime === "number" &&
        Number.isFinite(persisted.lastMatchedSectionStartTime)
      ? clampNonNegative(persisted.lastMatchedSectionStartTime)
      : null;

  return {
    currentSectionId,
    currentSectionStartTime,
    currentSectionEndTime: null,
    initialQueueSource: persisted.tab === "search" ? "search" : "project",
    initialNowId:
      typeof persisted.nowId === "string" || persisted.nowId === null
        ? (persisted.nowId ?? null)
        : null,
    initialShuffle:
      typeof persisted.shuffle === "boolean" ? persisted.shuffle : null,
    initialLoop: typeof persisted.loop === "boolean" ? persisted.loop : null,
    initialCurrentTime:
      typeof persisted.currentTime === "number" && Number.isFinite(persisted.currentTime)
        ? clampNonNegative(persisted.currentTime)
        : null,
    initialVolume:
      typeof persisted.volume === "number" && Number.isFinite(persisted.volume)
        ? Math.max(0, Math.min(1, persisted.volume))
        : null,
  };
}

export function buildPersistedSectionSnapshot(args: {
  nowId: string | null;
  currentTime: number;
  currentSectionId: string | null;
  currentSectionStartTime: number | null;
}) {
  const { nowId, currentTime, currentSectionId, currentSectionStartTime } = args;

  return {
    nowId,
    currentTime,
    currentSectionId,
    sectionStartTime: currentSectionStartTime,
    lastMatchedSectionId: currentSectionId,
    lastMatchedSectionStartTime: currentSectionStartTime,
  };
}

export function buildClearedPlaybackSnapshot() {
  return {
    nowId: null,
    currentTime: 0,
    currentSectionId: null,
    sectionStartTime: null,
    lastMatchedSectionId: null,
    lastMatchedSectionStartTime: null,
  };
}