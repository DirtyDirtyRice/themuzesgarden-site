import type { AnyTrack } from "./playerTypes";
import { writePersisted } from "./playerStorage";
import { fmtTime } from "./audioEngineHelpers";
import { buildPersistedSectionSnapshot } from "./audioEngineState";
import { shouldStopAtSectionEnd } from "./audioEnginePlayback";

export function attachEndedErrorPlayingHandlers(args: {
  audio: HTMLAudioElement;
  getCurrentActiveQueue: () => AnyTrack[];
  nowIdRef: React.MutableRefObject<string | null>;
  playbackQueueSourceRef: React.MutableRefObject<"project" | "search">;
  loopRef: React.MutableRefObject<boolean>;
  currentSectionIdRef: React.MutableRefObject<string | null>;
  currentSectionStartRef: React.MutableRefObject<number | null>;
  errorSkipGuardRef: React.MutableRefObject<number>;
  setNowLabel: (value: string) => void;
  setStatusTime: (value: string) => void;
  allTracksRef: React.MutableRefObject<AnyTrack[]>;
  playAll: () => void;
  next: () => void;
  stop: () => void;
  playTarget: (args: {
    track: AnyTrack;
    startTime?: number;
    sectionId?: string | null;
  }) => void;
}) {
  const {
    audio,
    getCurrentActiveQueue,
    nowIdRef,
    playbackQueueSourceRef,
    loopRef,
    currentSectionIdRef,
    currentSectionStartRef,
    errorSkipGuardRef,
    setNowLabel,
    setStatusTime,
    allTracksRef,
    playAll,
    next,
    stop,
    playTarget,
  } = args;

  function onEnded() {
    const list = getCurrentActiveQueue();
    if (!list.length) return;

    const nid = String(nowIdRef.current ?? "");
    const exists = list.some((t) => String(t.id) === nid);

    if (!exists) {
      if (playbackQueueSourceRef.current === "project") {
        playAll();
      }
      return;
    }

    if (loopRef.current) {
      const cur = list.find((t) => String(t.id) === nid);
      if (cur) {
        if (currentSectionIdRef.current) {
          playTarget({
            track: cur,
            sectionId: currentSectionIdRef.current,
            startTime:
              typeof currentSectionStartRef.current === "number"
                ? currentSectionStartRef.current
                : undefined,
          });
          return;
        }

        playTarget({ track: cur, startTime: 0, sectionId: null });
        return;
      }
    }

    next();
  }

  function onError() {
    const list = getCurrentActiveQueue();
    if (!list.length) return;

    errorSkipGuardRef.current += 1;
    if (errorSkipGuardRef.current > 3) {
      setNowLabel("Audio error (too many skips). Stopping.");
      stop();
      return;
    }

    setNowLabel("Audio error → skipping…");
    window.setTimeout(() => next(), 150);
  }

  function onPlaying() {
    errorSkipGuardRef.current = 0;
    setStatusTime(fmtTime(audio.currentTime));
  }

  audio.addEventListener("ended", onEnded);
  audio.addEventListener("error", onError);
  audio.addEventListener("playing", onPlaying);

  return () => {
    audio.removeEventListener("ended", onEnded);
    audio.removeEventListener("error", onError);
    audio.removeEventListener("playing", onPlaying);
  };
}

export function attachVolumeAndTimeHandlers(args: {
  audio: HTMLAudioElement;
  loopRef: React.MutableRefObject<boolean>;
  currentSectionIdRef: React.MutableRefObject<string | null>;
  currentSectionStartRef: React.MutableRefObject<number | null>;
  currentSectionEndRef: React.MutableRefObject<number | null>;
  nowIdRef: React.MutableRefObject<string | null>;
  allTracksRef: React.MutableRefObject<AnyTrack[]>;
  lastTimeSavedRef: React.MutableRefObject<number>;
  setStatusVolPct: (value: number) => void;
  setStatusTime: (value: string) => void;
  playTarget: (args: {
    track: AnyTrack;
    startTime?: number;
    sectionId?: string | null;
  }) => void;
}) {
  const {
    audio,
    loopRef,
    currentSectionIdRef,
    currentSectionStartRef,
    currentSectionEndRef,
    nowIdRef,
    allTracksRef,
    lastTimeSavedRef,
    setStatusVolPct,
    setStatusTime,
    playTarget,
  } = args;

  function onVolume() {
    const v = Math.max(0, Math.min(1, audio.volume ?? 0));
    writePersisted({ volume: v });
    setStatusVolPct(Math.round(v * 100));
  }

  function onTime() {
    const now = Date.now();
    if (now - lastTimeSavedRef.current < 500) return;
    lastTimeSavedRef.current = now;

    if (
      shouldStopAtSectionEnd({
        currentTime: audio.currentTime,
        sectionEnd: currentSectionEndRef.current,
      })
    ) {
      if (loopRef.current && currentSectionIdRef.current && nowIdRef.current) {
        const curTrack =
          allTracksRef.current.find((t) => String(t.id) === String(nowIdRef.current)) ?? null;

        if (curTrack) {
          playTarget({
            track: curTrack,
            sectionId: currentSectionIdRef.current,
            startTime:
              typeof currentSectionStartRef.current === "number"
                ? currentSectionStartRef.current
                : undefined,
          });
          return;
        }
      }

      const sectionEnd = currentSectionEndRef.current ?? audio.currentTime;

      try {
        audio.currentTime = sectionEnd;
      } catch {}

      audio.pause();
      setStatusTime(fmtTime(sectionEnd));

      writePersisted(
        buildPersistedSectionSnapshot({
          nowId: nowIdRef.current,
          currentTime: sectionEnd,
          currentSectionId: currentSectionIdRef.current,
          currentSectionStartTime: currentSectionStartRef.current,
        })
      );

      return;
    }

    writePersisted(
      buildPersistedSectionSnapshot({
        nowId: nowIdRef.current,
        currentTime: audio.currentTime,
        currentSectionId: currentSectionIdRef.current,
        currentSectionStartTime: currentSectionStartRef.current,
      })
    );

    setStatusTime(fmtTime(audio.currentTime));
  }

  audio.addEventListener("volumechange", onVolume);
  audio.addEventListener("timeupdate", onTime);

  return () => {
    audio.removeEventListener("volumechange", onVolume);
    audio.removeEventListener("timeupdate", onTime);
  };
}