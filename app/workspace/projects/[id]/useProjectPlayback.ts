"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { logProjectActivity } from "../../../../lib/projectActivity";
import {
  buildShuffleOrder,
  clamp,
  clamp01,
  nextLoopMode,
} from "./projectDetailsUtils";
import { getPlayableTrackUrl } from "./projectPlaybackHelpers";
import type { LoopMode } from "./projectDetailsTypes";

type UseProjectPlaybackArgs = {
  projectId: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  orderedLinkedTracks: any[];
  nowPlayingId: string | null;
  setNowPlayingId: React.Dispatch<React.SetStateAction<string | null>>;
  setPreviewTrackId: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useProjectPlayback(args: UseProjectPlaybackArgs) {
  const {
    projectId,
    audioRef,
    orderedLinkedTracks,
    nowPlayingId,
    setNowPlayingId,
    setPreviewTrackId,
  } = args;

  const [playerErr, setPlayerErr] = useState<string | null>(null);
  const [autoAdvance] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [miniPlayerPinned, setMiniPlayerPinned] = useState(false);
  const [miniAutoVisible, setMiniAutoVisible] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>("off");
  const [isPaused, setIsPaused] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<string[]>([]);
  const [volume01, setVolume01] = useState(1);
  const [muted, setMuted] = useState(false);

  const lastLoadedTrackIdRef = useRef<string | null>(null);
  const lastLoadedUrlRef = useRef<string | null>(null);
  const playRequestIdRef = useRef(0);

  const playbackTracks = useMemo(() => {
    if (!orderedLinkedTracks.length) return [];
    if (!shuffleOn) return orderedLinkedTracks;

    const ids = orderedLinkedTracks.map((t: any) => String(t.id));
    const validIds = new Set(ids);
    const filteredOrder = shuffleOrder.filter((tid) => validIds.has(String(tid)));
    const missing = ids.filter((tid) => !filteredOrder.includes(tid));
    const finalIds = [...filteredOrder, ...missing];

    const trackMap = new Map<string, any>();
    for (const track of orderedLinkedTracks) {
      trackMap.set(String(track.id), track);
    }

    return finalIds.map((tid) => trackMap.get(String(tid))).filter(Boolean);
  }, [orderedLinkedTracks, shuffleOn, shuffleOrder]);

  const nowPlayingTrack = useMemo(() => {
    if (!nowPlayingId) return null;
    return playbackTracks.find((t: any) => String(t.id) === String(nowPlayingId)) ?? null;
  }, [nowPlayingId, playbackTracks]);

  const playbackIndex = useMemo(() => {
    if (!nowPlayingId) return -1;
    return playbackTracks.findIndex((t: any) => String(t.id) === String(nowPlayingId));
  }, [nowPlayingId, playbackTracks]);

  const upNextTrack = useMemo(() => {
    if (!nowPlayingId || !playbackTracks.length || playbackIndex < 0) return null;

    const atEnd = playbackIndex + 1 >= playbackTracks.length;
    if (atEnd) {
      if (loopMode === "setlist") return playbackTracks[0] ?? null;
      return null;
    }

    return playbackTracks[playbackIndex + 1] ?? null;
  }, [nowPlayingId, playbackTracks, playbackIndex, loopMode]);

  function getTrackById(tid: string) {
    return orderedLinkedTracks.find((t: any) => String(t.id) === String(tid)) ?? null;
  }

  function syncTimesFromAudio() {
    const el = audioRef.current;
    if (!el) return;

    const duration = Number.isFinite(el.duration) ? el.duration : 0;
    const currentTime = Number.isFinite(el.currentTime) ? el.currentTime : 0;

    setDurationSec(duration || 0);

    if (!seeking) {
      setElapsedSec(currentTime || 0);
    }
  }

  function seekTo(percent01: number) {
    const el = audioRef.current;
    if (!el) return;

    const duration = Number.isFinite(el.duration) ? el.duration : 0;
    if (!duration || duration <= 0) return;

    const nextTime = clamp(percent01, 0, 1) * duration;

    try {
      el.currentTime = nextTime;
      setElapsedSec(nextTime);
    } catch {
      // ignore
    }
  }

  function applyAudioSettings(el: HTMLAudioElement) {
    try {
      el.volume = clamp01(volume01);
      el.muted = !!muted;
      el.loop = loopMode === "track";
    } catch {
      // ignore
    }
  }

  function startPlayback(el: HTMLAudioElement, requestId: number) {
    try {
      const maybePromise = el.play();

      if (maybePromise && typeof (maybePromise as any).catch === "function") {
        (maybePromise as any).catch((err: any) => {
          if (requestId !== playRequestIdRef.current) return;
          setPlayerErr(err?.message ?? "Playback blocked by browser.");
        });
      }
    } catch (e: any) {
      if (requestId !== playRequestIdRef.current) return;
      setPlayerErr(e?.message ?? "Failed to start playback.");
    }
  }

  function playTrackById(tid: string) {
    const cleanId = String(tid ?? "");
    if (!cleanId) {
      setPlayerErr("Missing track id.");
      return;
    }

    const track = getTrackById(cleanId);
    const playableUrl = getPlayableTrackUrl(track);

    if (!playableUrl) {
      setPlayerErr("Track URL missing. Cannot play.");
      return;
    }

    const el = audioRef.current;
    if (!el) {
      setPlayerErr("Audio element missing.");
      return;
    }

    setPlayerErr(null);
    setNowPlayingId(cleanId);
    setPreviewTrackId(cleanId);

    logProjectActivity(projectId, "play", `Played track: ${track?.title ?? "Untitled"}`, {
      trackId: cleanId,
    });

    const isSameTrack = lastLoadedTrackIdRef.current === cleanId;
    const isSameUrl = lastLoadedUrlRef.current === playableUrl;
    const requestId = playRequestIdRef.current + 1;
    playRequestIdRef.current = requestId;

    try {
      applyAudioSettings(el);

      if (isSameTrack && isSameUrl) {
        startPlayback(el, requestId);
        return;
      }

      try {
        el.pause();
      } catch {
        // ignore
      }

      el.src = playableUrl;
      el.currentTime = 0;
      applyAudioSettings(el);

      lastLoadedTrackIdRef.current = cleanId;
      lastLoadedUrlRef.current = playableUrl;
      setElapsedSec(0);
      setDurationSec(0);
      setIsPaused(false);

      startPlayback(el, requestId);
    } catch (e: any) {
      setPlayerErr(e?.message ?? "Failed to start playback.");
    }
  }

  function playProject() {
    setPlayerErr(null);

    if (playbackTracks.length === 0) {
      setPlayerErr("No linked tracks. Link tracks first.");
      return;
    }

    const preferredId = nowPlayingId ? String(nowPlayingId) : "";
    const hasPreferred = preferredId
      ? playbackTracks.some((t: any) => String(t.id) === preferredId)
      : false;

    const tid = hasPreferred
      ? preferredId
      : String(playbackTracks[0]?.id ?? "");

    if (!tid) {
      setPlayerErr("No playable track found.");
      return;
    }

    playTrackById(tid);
  }

  function prevTrack() {
    setPlayerErr(null);
    if (playbackTracks.length === 0) return;

    const idx = playbackIndex >= 0 ? playbackIndex : 0;

    let prevIdx = idx - 1;
    if (prevIdx < 0) {
      if (loopMode === "setlist") {
        prevIdx = playbackTracks.length - 1;
      } else {
        prevIdx = 0;
      }
    }

    const tid = String(playbackTracks[prevIdx]?.id ?? "");
    if (!tid) return;

    playTrackById(tid);
  }

  function nextTrack(opts?: { wrapIfSetlistLoop?: boolean }) {
    setPlayerErr(null);
    if (playbackTracks.length === 0) return;

    const idx = playbackIndex >= 0 ? playbackIndex : -1;
    const atEnd = idx >= playbackTracks.length - 1;

    let nextIdx = idx + 1;

    if (atEnd) {
      if (opts?.wrapIfSetlistLoop && loopMode === "setlist") {
        nextIdx = 0;
      } else {
        nextIdx = playbackTracks.length - 1;
      }
    }

    nextIdx = clamp(nextIdx, 0, Math.max(0, playbackTracks.length - 1));

    const tid = String(playbackTracks[nextIdx]?.id ?? "");
    if (!tid) return;

    playTrackById(tid);
  }

  function stopPlayer() {
    setPlayerErr(null);

    const el = audioRef.current;

    if (!el) {
      lastLoadedTrackIdRef.current = null;
      lastLoadedUrlRef.current = null;
      setNowPlayingId(null);
      setElapsedSec(0);
      setDurationSec(0);
      setIsPaused(false);
      return;
    }

    try {
      el.pause();
      el.currentTime = 0;
      el.loop = false;
      el.removeAttribute("src");
      el.load();
    } catch {
      // ignore
    } finally {
      lastLoadedTrackIdRef.current = null;
      lastLoadedUrlRef.current = null;
      setNowPlayingId(null);
      setElapsedSec(0);
      setDurationSec(0);
      setIsPaused(false);
    }
  }

  function togglePlayPause() {
    setPlayerErr(null);

    const el = audioRef.current;
    if (!el) return;

    if (!nowPlayingId) {
      playProject();
      return;
    }

    try {
      if (el.paused) {
        const requestId = playRequestIdRef.current + 1;
        playRequestIdRef.current = requestId;
        applyAudioSettings(el);
        startPlayback(el, requestId);
      } else {
        el.pause();
      }
    } catch (e: any) {
      setPlayerErr(e?.message ?? "Failed to toggle playback.");
    }
  }

  function onEnded() {
    if (loopMode === "track") return;
    if (!autoAdvance) return;
    if (playbackTracks.length === 0) return;
    if (playbackIndex < 0) return;

    const atEnd = playbackIndex + 1 >= playbackTracks.length;

    if (atEnd) {
      if (loopMode === "setlist") {
        nextTrack({ wrapIfSetlistLoop: true });
      } else {
        setIsPaused(false);
        setElapsedSec(0);
      }
      return;
    }

    const tid = String(playbackTracks[playbackIndex + 1]?.id ?? "");
    if (!tid) return;

    playTrackById(tid);
  }

  function toggleLoop() {
    setLoopMode((prev) => {
      const next = nextLoopMode(prev);
      const el = audioRef.current;

      if (el) {
        el.loop = next === "track";
      }

      return next;
    });
  }

  function toggleShuffle() {
    setShuffleOn((prev) => {
      const next = !prev;

      if (next) {
        const ids = orderedLinkedTracks.map((t: any) => String(t.id));
        setShuffleOrder(buildShuffleOrder(ids, nowPlayingId));
      } else {
        setShuffleOrder([]);
      }

      return next;
    });
  }

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    function onTimeUpdate() {
      syncTimesFromAudio();
    }

    function onLoadedMetadata() {
      setPlayerErr(null);
      syncTimesFromAudio();
    }

    function onDurationChange() {
      syncTimesFromAudio();
    }

    function onPlay() {
      setPlayerErr(null);
      setIsPaused(false);
      syncTimesFromAudio();
    }

    function onPause() {
      setIsPaused(true);
      syncTimesFromAudio();
    }

    function onError() {
      const currentEl = audioRef.current;
      if (!currentEl) return;

      const mediaError = currentEl.error;
      if (!mediaError) {
        setPlayerErr("Audio playback failed.");
        return;
      }

      setPlayerErr(`Audio playback failed (code ${mediaError.code}).`);
    }

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
    };
  }, [audioRef, seeking]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.loop = loopMode === "track";
  }, [audioRef, loopMode]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    try {
      el.volume = clamp01(volume01);
      el.muted = !!muted;
    } catch {
      // ignore
    }
  }, [audioRef, volume01, muted]);

  useEffect(() => {
    if (!shuffleOn) return;

    const ids = orderedLinkedTracks.map((t: any) => String(t.id));

    if (!ids.length) {
      setShuffleOrder([]);
      return;
    }

    setShuffleOrder((prev) => {
      const validIds = new Set(ids);
      const filtered = prev.filter((tid) => validIds.has(String(tid)));
      const missing = ids.filter((tid) => !filtered.includes(tid));
      return [...filtered, ...missing];
    });
  }, [shuffleOn, orderedLinkedTracks]);

  useEffect(() => {
    if (!nowPlayingId) return;
    if (!orderedLinkedTracks.length) return;

    const stillExists = orderedLinkedTracks.some(
      (t: any) => String(t.id) === String(nowPlayingId)
    );

    if (!stillExists) {
      stopPlayer();
    }
  }, [nowPlayingId, orderedLinkedTracks]);

  return {
    playerErr,
    autoAdvance,
    elapsedSec,
    durationSec,
    seeking,
    setSeeking,
    miniPlayerPinned,
    setMiniPlayerPinned,
    miniAutoVisible,
    setMiniAutoVisible,
    loopMode,
    isPaused,
    shuffleOn,
    shuffleOrder,
    volume01,
    setVolume01,
    muted,
    setMuted,
    playbackTracks,
    nowPlayingTrack,
    playbackIndex,
    upNextTrack,
    syncTimesFromAudio,
    seekTo,
    playTrackById,
    playProject,
    prevTrack,
    nextTrack,
    stopPlayer,
    togglePlayPause,
    onEnded,
    toggleLoop,
    toggleShuffle,
  };
}