import type { Persisted } from "./playerTypes";
import { fmtTime } from "./audioEngineHelpers";
import {
  hydratePlaybackStateFromPersisted,
  type PlaybackQueueSource,
} from "./audioEngineState";

export function initializeAudioEngineFromPersisted(args: {
  persisted: Persisted;
  setShuffle: (value: boolean) => void;
  setLoop: (value: boolean) => void;
  setNowId: (value: string | null) => void;
  setStatusTime: (value: string) => void;
  setStatusVolPct: (value: number) => void;
  currentSectionIdRef: React.MutableRefObject<string | null>;
  currentSectionStartRef: React.MutableRefObject<number | null>;
  currentSectionEndRef: React.MutableRefObject<number | null>;
  playbackQueueSourceRef: React.MutableRefObject<PlaybackQueueSource>;
}) {
  const {
    persisted,
    setShuffle,
    setLoop,
    setNowId,
    setStatusTime,
    setStatusVolPct,
    currentSectionIdRef,
    currentSectionStartRef,
    currentSectionEndRef,
    playbackQueueSourceRef,
  } = args;

  const hydrated = hydratePlaybackStateFromPersisted(persisted);

  if (hydrated.initialShuffle !== null) setShuffle(hydrated.initialShuffle);
  if (hydrated.initialLoop !== null) setLoop(hydrated.initialLoop);
  if (hydrated.initialNowId !== null || persisted.nowId === null) {
    setNowId(hydrated.initialNowId);
  }

  currentSectionIdRef.current = hydrated.currentSectionId;
  currentSectionStartRef.current = hydrated.currentSectionStartTime;
  currentSectionEndRef.current = hydrated.currentSectionEndTime;

  if (hydrated.initialCurrentTime !== null) {
    setStatusTime(fmtTime(hydrated.initialCurrentTime));
  }

  if (hydrated.initialVolume !== null) {
    setStatusVolPct(Math.round(hydrated.initialVolume * 100));
  }

  playbackQueueSourceRef.current = hydrated.initialQueueSource;
}