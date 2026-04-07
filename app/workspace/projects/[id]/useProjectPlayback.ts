"use client";

import { useEffect, useMemo, useState } from "react";
import { logProjectActivity } from "../../../../lib/projectActivity";
import { buildShuffleOrder, clamp, clamp01, nextLoopMode } from "./projectDetailsUtils";
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
  const { projectId, audioRef, orderedLinkedTracks, nowPlayingId, setNowPlayingId, setPreviewTrackId } =
    args;

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

  const playbackTracks = useMemo(() => {
    if (!orderedLinkedTracks.length) return [];
    if (!shuffleOn) return orderedLinkedTracks;

    const ids = orderedLinkedTracks.map((t: any) => String(t.id));
    const set = new Set(ids);
    const filteredOrder = shuffleOrder.filter((tid) => set.has(String(tid)));
    const missing = ids.filter((tid) => !filteredOrder.includes(tid));
    const finalIds = [...filteredOrder, ...missing];

    const map = new Map<string, any>();
    for (const t of orderedLinkedTracks) map.set(String(t.id), t);
    return finalIds.map((tid) => map.get(String(tid))).filter(Boolean);
  }, [orderedLinkedTracks, shuffleOn, shuffleOrder]);

  const nowPlayingTrack = useMemo(() => {
    if (!nowPlayingId) return null;
    return orderedLinkedTracks.find((t: any) => String(t.id) === nowPlayingId) ?? null;
  }, [nowPlayingId, orderedLinkedTracks]);

  const playbackIndex = useMemo(() => {
    if (!nowPlayingId) return -1;
    return playbackTracks.findIndex((t: any) => String(t.id) === nowPlayingId);
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

    const d = Number.isFinite(el.duration) ? el.duration : 0;
    const t = Number.isFinite(el.currentTime) ? el.currentTime : 0;

    setDurationSec(d || 0);
    if (!seeking) setElapsedSec(t || 0);
  }

  function seekTo(percent01: number) {
    const el = audioRef.current;
    if (!el) return;

    const d = Number.isFinite(el.duration) ? el.duration : 0;
    if (!d || d <= 0) return;

    const nextTime = clamp(percent01, 0, 1) * d;
    try {
      el.currentTime = nextTime;
      setElapsedSec(nextTime);
    } catch {
      // ignore
    }
  }

  function playTrackById(tid: string) {
    setPlayerErr(null);

    const t = getTrackById(tid);
    const playableUrl = getPlayableTrackUrl(t);

    if (!playableUrl) {
      setPlayerErr("Track URL missing. Cannot play.");
      return;
    }

    setNowPlayingId(String(tid));
    setPreviewTrackId(String(tid));

    logProjectActivity(
      projectId,
      "play",
      `Played track: ${t?.title ?? "Untitled"}`,
      { trackId: tid }
    );

    const el = audioRef.current;
    if (!el) return;

    try {
      el.src = playableUrl;
      el.currentTime = 0;
      el.volume = clamp01(volume01);
      el.muted = !!muted;
      el.loop = loopMode === "track";

      const p = el.play();
      if (p && typeof (p as any).catch === "function") {
        (p as any).catch((err: any) => {
          setPlayerErr(err?.message ?? "Playback blocked by browser.");
        });
      }
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

    const tid = nowPlayingId ? nowPlayingId : String(playbackTracks[0]?.id ?? "");
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
    const prevIdx = Math.max(0, idx - 1);
    const tid = String(playbackTracks[prevIdx]?.id ?? "");
    if (!tid) return;

    playTrackById(tid);
  }

  function nextTrack(opts?: { wrapIfSetlistLoop?: boolean }) {
    setPlayerErr(null);
    if (playbackTracks.length === 0) return;

    const idx = playbackIndex >= 0 ? playbackIndex : -1;
    let nextIdx = Math.min(playbackTracks.length - 1, idx + 1);

    if (opts?.wrapIfSetlistLoop && loopMode === "setlist" && idx >= playbackTracks.length - 1) {
      nextIdx = 0;
    }

    const tid = String(playbackTracks[nextIdx]?.id ?? "");
    if (!tid) return;

    playTrackById(tid);
  }

  function stopPlayer() {
    setPlayerErr(null);

    const el = audioRef.current;
    if (!el) {
      setNowPlayingId(null);
      return;
    }

    try {
      el.pause();
      el.currentTime = 0;
      el.loop = false;
    } catch {
      // ignore
    } finally {
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
        const p = el.play();
        if (p && typeof (p as any).catch === "function") {
          (p as any).catch((err: any) => {
            setPlayerErr(err?.message ?? "Playback blocked by browser.");
          });
        }
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
      if (el) el.loop = next === "track";
      return next;
    });
  }

  function toggleShuffle() {
    setShuffleOn((prev) => {
      const next = !prev;
      if (next) {
        const ids = orderedLinkedTracks.map((t: any) => String(t.id));
        setShuffleOrder(buildShuffleOrder(ids, nowPlayingId));
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
    function onLoadedMeta() {
      syncTimesFromAudio();
    }
    function onDurationChange() {
      syncTimesFromAudio();
    }
    function onPlay() {
      setIsPaused(false);
      syncTimesFromAudio();
    }
    function onPause() {
      setIsPaused(true);
      syncTimesFromAudio();
    }

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoadedMeta);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoadedMeta);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [audioRef, nowPlayingId, loopMode, seeking]);

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
      const set = new Set(ids);
      const filtered = prev.filter((tid) => set.has(String(tid)));
      const missing = ids.filter((tid) => !filtered.includes(tid));
      return [...filtered, ...missing];
    });
  }, [shuffleOn, orderedLinkedTracks, nowPlayingId]);

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