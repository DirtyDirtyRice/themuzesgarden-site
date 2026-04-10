import type { AnyTrack } from "./playerTypes";
import { readPersisted, writePersisted } from "./playerStorage";
import { fmtTime } from "./audioEngineHelpers";
import { buildClearedPlaybackSnapshot, buildPersistedSectionSnapshot, type PlaybackTarget } from "./audioEngineState";
import { resolvePlaybackTarget } from "./audioEnginePlayback";

export function clearNowState(args: {
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  clearResumeMetaHandler: () => void;
  setNowId: (value: string | null) => void;
  setNowLabel: (value: string) => void;
  setStatusTime: (value: string) => void;
  errorSkipGuardRef: React.MutableRefObject<number>;
  currentSectionIdRef: React.MutableRefObject<string | null>;
  currentSectionStartRef: React.MutableRefObject<number | null>;
  currentSectionEndRef: React.MutableRefObject<number | null>;
}) {
  const {
    audioRef,
    clearResumeMetaHandler,
    setNowId,
    setNowLabel,
    setStatusTime,
    errorSkipGuardRef,
    currentSectionIdRef,
    currentSectionStartRef,
    currentSectionEndRef,
  } = args;

  clearResumeMetaHandler();

  const el = audioRef.current;
  if (el) {
    el.pause();
    el.removeAttribute("src");
    try {
      el.load();
    } catch {}
  }

  setNowId(null);
  setNowLabel("");
  errorSkipGuardRef.current = 0;

  currentSectionIdRef.current = null;
  currentSectionStartRef.current = null;
  currentSectionEndRef.current = null;

  writePersisted(buildClearedPlaybackSnapshot());
  setStatusTime("0:00");
}

export function stopAudio(audioRef: React.MutableRefObject<HTMLAudioElement | null>) {
  const el = audioRef.current;
  if (!el) return;
  el.pause();
}

export function playResolvedTarget(args: {
  target: PlaybackTarget;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  clearResumeMetaHandler: () => void;
  resumeMetaHandlerRef: React.MutableRefObject<(() => void) | null>;
  playSeqRef: React.MutableRefObject<number>;
  errorSkipGuardRef: React.MutableRefObject<number>;
  currentSectionIdRef: React.MutableRefObject<string | null>;
  currentSectionStartRef: React.MutableRefObject<number | null>;
  currentSectionEndRef: React.MutableRefObject<number | null>;
  onProjectPage: boolean;
  projectId: string;
  setNowId: (value: string | null) => void;
  setNowLabel: (value: string) => void;
  setStatusTime: (value: string) => void;
  lastTimeSavedRef: React.MutableRefObject<number>;
  onLogProjectPlay: (track: AnyTrack, meta?: { sectionId?: string | null; startTime?: number }) => void;
}) {
  const {
    target,
    audioRef,
    clearResumeMetaHandler,
    resumeMetaHandlerRef,
    playSeqRef,
    errorSkipGuardRef,
    currentSectionIdRef,
    currentSectionStartRef,
    currentSectionEndRef,
    onProjectPage,
    projectId,
    setNowId,
    setNowLabel,
    setStatusTime,
    lastTimeSavedRef,
    onLogProjectPlay,
  } = args;

  const resolved = resolvePlaybackTarget(target);

  if (!resolved) {
    setNowLabel("Track URL missing");
    return;
  }

  clearResumeMetaHandler();

  const el = audioRef.current;
  if (!el) {
    setNowLabel("Audio element missing");
    return;
  }

  const seq = ++playSeqRef.current;
  errorSkipGuardRef.current = 0;

  const tid = String(target.track.id);
  setNowId(tid);
  setNowLabel(resolved.displayLabel);

  currentSectionIdRef.current = resolved.resolvedSectionId;
  currentSectionStartRef.current =
    resolved.resolvedSection || resolved.resolvedStartTime > 0
      ? resolved.resolvedStartTime
      : null;
  currentSectionEndRef.current = resolved.resolvedSectionEnd;

  const persisted = readPersisted();
  writePersisted({
    ...buildPersistedSectionSnapshot({
      nowId: tid,
      currentTime: resolved.resolvedStartTime,
      currentSectionId: resolved.resolvedSectionId,
      currentSectionStartTime:
        resolved.resolvedSection || resolved.resolvedStartTime > 0
          ? resolved.resolvedStartTime
          : null,
    }),
    lastProjectId: onProjectPage ? projectId : persisted.lastProjectId,
  });

  lastTimeSavedRef.current = 0;
  setStatusTime(fmtTime(resolved.resolvedStartTime));

  onLogProjectPlay(target.track, {
    sectionId: resolved.resolvedSectionId,
    startTime:
      resolved.resolvedSection || resolved.resolvedStartTime > 0
        ? resolved.resolvedStartTime
        : undefined,
  });

  el.src = resolved.rawUrl;

  try {
    el.currentTime = 0;
  } catch {}

  const applyStartTime = () => {
    if (seq !== playSeqRef.current) return;

    try {
      el.currentTime = resolved.resolvedStartTime;
    } catch {}

    setStatusTime(fmtTime(resolved.resolvedStartTime));

    el.play().catch(() => {
      if (seq !== playSeqRef.current) return;
      setNowLabel("Playback blocked (click Play again)");
    });
  };

  if (el.readyState >= 1) {
    applyStartTime();
    return;
  }

  const onMeta = () => {
    clearResumeMetaHandler();
    applyStartTime();
  };

  resumeMetaHandlerRef.current = onMeta;
  el.addEventListener("loadedmetadata", onMeta);
}