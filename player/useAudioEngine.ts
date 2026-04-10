"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack, PlayerTab } from "./playerTypes";
import { readPersisted, writePersisted } from "./playerStorage";
import { buildNowLabel } from "./audioEngineHelpers";
import {
  getTrackSectionById,
  getTrackSectionByStartTime,
} from "./audioEngineSections";
import {
  getActiveQueue,
  getTrackForCurrentPlayIntent,
  pickNextTrack,
  pickPlayAllTrack,
  pickPrevTrack,
} from "./audioEngineQueue";
import type { PlaybackQueueSource, PlaybackTarget } from "./audioEngineState";
import { initializeAudioEngineFromPersisted } from "./audioEngineInit";
import { logProjectPlayIfPossible } from "./audioEngineProject";
import {
  clearNowState,
  playResolvedTarget,
  stopAudio,
} from "./audioEngineActions";
import {
  attachEndedErrorPlayingHandlers,
  attachVolumeAndTimeHandlers,
} from "./audioEngineMediaEffects";
import { attachKeyboardAndCustomEventHandlers } from "./audioEngineEventEffects";

export function useAudioEngine(args: {
  tab: PlayerTab;
  setTab: (t: PlayerTab) => void;
  onProjectPage: boolean;
  projectId: string;
  allTracks: AnyTrack[];
  projectTracks: AnyTrack[];
}) {
  const { tab, onProjectPage, projectId, allTracks, projectTracks } = args;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [open, setOpen] = useState(true);
  const [nowId, setNowId] = useState<string | null>(null);
  const [nowLabel, setNowLabel] = useState<string>("");

  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);

  const [statusTime, setStatusTime] = useState("0:00");
  const [statusVolPct, setStatusVolPct] = useState(100);

  const lastTimeSavedRef = useRef<number>(0);
  const errorSkipGuardRef = useRef<number>(0);
  const didInitRef = useRef(false);

  const tabRef = useRef<PlayerTab>(tab);
  const nowIdRef = useRef<string | null>(nowId);
  const shuffleRef = useRef<boolean>(shuffle);
  const loopRef = useRef<boolean>(loop);
  const projectTracksRef = useRef<AnyTrack[]>(projectTracks);
  const allTracksRef = useRef<AnyTrack[]>(allTracks);
  const onProjectPageRef = useRef<boolean>(onProjectPage);
  const projectIdRef = useRef<string>(projectId);
  const playbackQueueSourceRef = useRef<PlaybackQueueSource>("project");

  const playSeqRef = useRef<number>(0);
  const resumeMetaHandlerRef = useRef<(() => void) | null>(null);

  const currentSectionIdRef = useRef<string | null>(null);
  const currentSectionStartRef = useRef<number | null>(null);
  const currentSectionEndRef = useRef<number | null>(null);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  useEffect(() => {
    nowIdRef.current = nowId;
  }, [nowId]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    projectTracksRef.current = projectTracks;
  }, [projectTracks]);

  useEffect(() => {
    allTracksRef.current = allTracks;
  }, [allTracks]);

  useEffect(() => {
    onProjectPageRef.current = onProjectPage;
  }, [onProjectPage]);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  const clearResumeMetaHandler = useCallback(() => {
    const el = audioRef.current;
    const handler = resumeMetaHandlerRef.current;
    if (el && handler) {
      el.removeEventListener("loadedmetadata", handler);
    }
    resumeMetaHandlerRef.current = null;
  }, []);

  const setQueueSourceFromCurrentContext = useCallback(() => {
    playbackQueueSourceRef.current = tabRef.current === "project" ? "project" : "search";
  }, []);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    initializeAudioEngineFromPersisted({
      persisted: readPersisted(),
      setShuffle,
      setLoop,
      setNowId,
      setStatusTime,
      setStatusVolPct,
      currentSectionIdRef,
      currentSectionStartRef,
      currentSectionEndRef,
      playbackQueueSourceRef,
    });
  }, []);

  useEffect(() => writePersisted({ shuffle, loop }), [shuffle, loop]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const persisted = readPersisted();
    if (typeof persisted.volume === "number" && !Number.isNaN(persisted.volume)) {
      const v = Math.max(0, Math.min(1, persisted.volume));
      el.volume = v;
      setStatusVolPct(Math.round(v * 100));
    }
  }, [open]);

  const logProjectPlay = useCallback(
    (track: AnyTrack, meta?: { sectionId?: string | null; startTime?: number }) => {
      logProjectPlayIfPossible({
        track,
        onProjectPage: onProjectPageRef.current,
        projectId: projectIdRef.current,
        meta,
      });
    },
    []
  );

  const stop = useCallback(() => {
    stopAudio(audioRef);
  }, []);

  const clearNow = useCallback(() => {
    clearNowState({
      audioRef,
      clearResumeMetaHandler,
      setNowId,
      setNowLabel,
      setStatusTime,
      errorSkipGuardRef,
      currentSectionIdRef,
      currentSectionStartRef,
      currentSectionEndRef,
    });
  }, [clearResumeMetaHandler]);

  const playTarget = useCallback(
    (target: PlaybackTarget) => {
      playResolvedTarget({
        target,
        audioRef,
        clearResumeMetaHandler,
        resumeMetaHandlerRef,
        playSeqRef,
        errorSkipGuardRef,
        currentSectionIdRef,
        currentSectionStartRef,
        currentSectionEndRef,
        onProjectPage: onProjectPageRef.current,
        projectId: projectIdRef.current,
        setNowId,
        setNowLabel,
        setStatusTime,
        lastTimeSavedRef,
        onLogProjectPlay: logProjectPlay,
      });
    },
    [clearResumeMetaHandler, logProjectPlay]
  );

  const playTrack = useCallback(
    (track: AnyTrack) => {
      setQueueSourceFromCurrentContext();
      playTarget({ track, startTime: 0, sectionId: null });
    },
    [playTarget, setQueueSourceFromCurrentContext]
  );

  const playTrackAtTime = useCallback(
    (track: AnyTrack, startTime: number) => {
      setQueueSourceFromCurrentContext();
      playTarget({ track, startTime, sectionId: null });
    },
    [playTarget, setQueueSourceFromCurrentContext]
  );

  const playSection = useCallback(
    (track: AnyTrack, sectionId: string) => {
      setQueueSourceFromCurrentContext();
      playTarget({ track, sectionId });
    },
    [playTarget, setQueueSourceFromCurrentContext]
  );

  const playFromHere = useCallback(
    (track: AnyTrack) => {
      playbackQueueSourceRef.current = "project";
      setShuffle(false);
      playTarget({ track, startTime: 0, sectionId: null });
    },
    [playTarget]
  );

  const getCurrentActiveQueue = useCallback((): AnyTrack[] => {
    return getActiveQueue({
      source: playbackQueueSourceRef.current,
      allTracks: allTracksRef.current,
      projectTracks: projectTracksRef.current,
    });
  }, []);

  const togglePlayPause = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;

    const hasLoadedSource = Boolean(el.currentSrc || el.src);

    if (el.paused) {
      if (!hasLoadedSource) {
        const activeQueue = getCurrentActiveQueue();
        const track = getTrackForCurrentPlayIntent({
          nowId: nowIdRef.current,
          activeQueue,
          allTracks: allTracksRef.current,
        });

        if (!track) {
          setNowLabel("Nothing to play yet");
          return;
        }

        playTarget({ track, startTime: 0, sectionId: null });
        return;
      }

      el.play().catch(() => {
        setNowLabel("Playback blocked (press Play again)");
      });
    } else {
      el.pause();
    }
  }, [getCurrentActiveQueue, playTarget]);

  const next = useCallback(() => {
    const list = getCurrentActiveQueue();
    if (!list.length) return;

    currentSectionIdRef.current = null;
    currentSectionStartRef.current = null;
    currentSectionEndRef.current = null;

    const picked = pickNextTrack({
      list,
      nowId: nowIdRef.current,
      shuffle: shuffleRef.current,
    });

    if (!picked) return;
    playTarget({ track: picked, startTime: 0, sectionId: null });
  }, [getCurrentActiveQueue, playTarget]);

  const prev = useCallback(() => {
    const list = getCurrentActiveQueue();
    if (!list.length) return;

    currentSectionIdRef.current = null;
    currentSectionStartRef.current = null;
    currentSectionEndRef.current = null;

    const picked = pickPrevTrack({
      list,
      nowId: nowIdRef.current,
      shuffle: shuffleRef.current,
    });

    if (!picked) return;
    playTarget({ track: picked, startTime: 0, sectionId: null });
  }, [getCurrentActiveQueue, playTarget]);

  const playAll = useCallback(() => {
    const picked = pickPlayAllTrack({
      projectTracks: projectTracksRef.current,
      shuffle: shuffleRef.current,
    });

    if (!picked) return;

    playbackQueueSourceRef.current = "project";
    currentSectionIdRef.current = null;
    currentSectionStartRef.current = null;
    currentSectionEndRef.current = null;

    playTarget({ track: picked, startTime: 0, sectionId: null });
  }, [playTarget]);

  const resumeLastSession = useCallback(() => {
    const persisted = readPersisted();
    const id = typeof persisted.nowId === "string" ? persisted.nowId : null;

    if (!id) {
      setNowLabel("Nothing to resume yet");
      return;
    }

    const track = allTracksRef.current.find((t) => String(t.id) === String(id));
    if (!track) {
      setNowLabel("Resume failed: track not found");
      return;
    }

    const sectionId =
      typeof persisted.currentSectionId === "string"
        ? persisted.currentSectionId
        : typeof persisted.lastMatchedSectionId === "string"
        ? persisted.lastMatchedSectionId
        : null;

    const section = sectionId ? getTrackSectionById(track, sectionId) : null;

    const seekTo =
      typeof persisted.currentTime === "number" && persisted.currentTime >= 0
        ? persisted.currentTime
        : typeof persisted.sectionStartTime === "number" && persisted.sectionStartTime >= 0
        ? persisted.sectionStartTime
        : typeof persisted.lastMatchedSectionStartTime === "number" &&
          persisted.lastMatchedSectionStartTime >= 0
        ? persisted.lastMatchedSectionStartTime
        : section
        ? Number(section.start)
        : 0;

    playbackQueueSourceRef.current = persisted.tab === "search" ? "search" : "project";

    playTarget({
      track,
      startTime: seekTo,
      sectionId: section ? section.id : null,
    });
  }, [playTarget]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    return attachEndedErrorPlayingHandlers({
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
    });
  }, [getCurrentActiveQueue, next, playAll, playTarget, stop]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    return attachVolumeAndTimeHandlers({
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
    });
  }, [open, playTarget]);

  useEffect(() => {
    return attachKeyboardAndCustomEventHandlers({
      open,
      togglePlayPause,
      next,
      prev,
      resumeLastSession,
      setShuffle,
      setLoop,
      playbackQueueSourceRef,
      onProjectPageRef,
      projectIdRef,
      projectTracksRef,
      allTracksRef,
      setNowLabel,
      setShuffleDirect: setShuffle,
      playTarget,
    });
  }, [open, next, prev, resumeLastSession, togglePlayPause, playTarget]);

  useEffect(() => {
    const nid = nowId;
    if (!nid) return;

    const track = allTracks.find((x) => String(x.id) === String(nid)) ?? null;
    if (!track) return;

    const activeSection =
      getTrackSectionById(track, currentSectionIdRef.current) ??
      getTrackSectionByStartTime(track, currentSectionStartRef.current);

    const activeStartTime =
      typeof currentSectionStartRef.current === "number"
        ? currentSectionStartRef.current
        : undefined;

    setNowLabel(buildNowLabel(track, activeSection, activeStartTime));
  }, [allTracks, nowId]);

  useEffect(() => {
    return () => {
      clearResumeMetaHandler();
    };
  }, [clearResumeMetaHandler]);

  const status = useMemo(() => {
    return {
      statusTime,
      statusVolPct,
    };
  }, [statusTime, statusVolPct]);

  return {
    audioRef,
    open,
    setOpen,

    nowId,
    nowLabel,

    shuffle,
    setShuffle,
    loop,
    setLoop,

    statusTime: status.statusTime,
    statusVolPct: status.statusVolPct,

    playTrack,
    playTrackAtTime,
    playSection,
    playFromHere,
    playTarget,
    stop,
    togglePlayPause,
    next,
    prev,
    playAll,
    clearNow,
    resumeLastSession,
  };
}