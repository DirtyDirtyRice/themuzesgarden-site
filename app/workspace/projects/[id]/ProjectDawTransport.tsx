"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import {
  type TimelineTransportEvent,
  type TimelineTransportSynchronization,
} from "../../../../lib/timeline/TimelineTransportAndSynchronizationEngine";
import {
  clampTimelineDawMediaPosition,
  parseTimelineDawMonitorLevel,
  retryTimelineDawTransportConflict,
  resolveTimelineDawTransportShortcut,
  shouldCheckpointTransport,
  shouldIssueTransportPlay,
  TimelineDawTransportCommandQueue,
  tempoMappedSecondsToTimelineTick,
  timelineCountInSchedule,
  timelineBarNavigationTick,
  timelineMetronomeBeatAtOrAfterTick,
  timelineSnapTick,
  timelineTempoAtTick,
  timelineTickToTempoMappedSeconds,
  timelineTickToMappedPosition,
} from "../../../../lib/timeline/TimelineDawTransportViewModel";
import { getUploadedTracks } from "../../../../lib/uploadedTracks";
import {
  changeDawTransport,
  loadDawTransport,
  ProjectDawApiError,
} from "./projectDawApi";
import { getPlayableTrackUrl } from "./projectPlaybackHelpers";
import type { DawSession } from "./projectDawTypes";

type Track = {
  id: string;
  title?: string | null;
  artist?: string | null;
  [key: string]: unknown;
};
type AutomationFrameDetail = {
  sessionId: string;
  trackId: string;
  sourceTrackId?: string;
  volume: number | null;
  pan: number | null;
};

const FALLBACK_PPQ = 960;
const FALLBACK_TEMPO_MAP = [{ tick: 0, bpm: 120 }];
const FALLBACK_SIGNATURE_MAP = [{ tick: 0, numerator: 4, denominator: 4 }];
const MONITOR_LEVEL_KEY = "muzes-daw-monitor-level";

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function ProjectDawTransport({
  session,
  workspaceRevision,
  onWorkspaceRevision,
}: {
  session: DawSession;
  workspaceRevision: number;
  onWorkspaceRevision: (revision: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transportRef = useRef<TimelineTransportSynchronization | null>(null);
  const workspaceRevisionRef = useRef(workspaceRevision);
  const checkpointPendingRef = useRef(false);
  const lastCheckpointTickRef = useRef(0);
  const checkpointRef = useRef<() => Promise<void>>(async () => undefined);
  const finalizePlaybackRef = useRef<() => Promise<void>>(async () => undefined);
  const shortcutRef = useRef<(
    action:
      | "toggle-playback"
      | "stop"
      | "previous-bar"
      | "next-bar"
      | "return-to-start"
  ) => Promise<void>>(
    async () => undefined,
  );
  const mediaSeekRef = useRef<(seconds: number) => Promise<void>>(async () => undefined);
  const mediaPlayRef = useRef<() => Promise<void>>(async () => undefined);
  const mediaPauseRef = useRef<() => Promise<void>>(async () => undefined);
  const commandQueueRef = useRef(new TimelineDawTransportCommandQueue());
  const scrubSecondsRef = useRef(0);
  const scrubDirtyRef = useRef(false);
  const countInTokenRef = useRef(0);
  const countInAudioRef = useRef<AudioContext | null>(null);
  const metronomeAudioRef = useRef<AudioContext | null>(null);
  const mediaAudioContextRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const mediaPannerRef = useRef<StereoPannerNode | null>(null);
  const automationVolumeRef = useRef<number | null>(null);
  const automationPanRef = useRef<number | null>(null);
  const availableTracksRef = useRef<Track[]>([]);
  const activeSourceTrackIdRef = useRef(session.songId);
  const sourceSwitchSeekRef = useRef<number | null>(null);
  const sourceSwitchPlayingRef = useRef(false);
  const [transport, setTransport] = useState<TimelineTransportSynchronization | null>(null);
  const [events, setEvents] = useState<TimelineTransportEvent[]>([]);
  const [track, setTrack] = useState<Track | null>(null);
  const [source, setSource] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [monitorReady, setMonitorReady] = useState(false);
  const [loopStartTick, setLoopStartTick] = useState(0);
  const [loopEndTick, setLoopEndTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    void (async () => {
      try {
        let next = await loadDawTransport(session.id);
        if (!next.transport) {
          const initialized = await changeDawTransport({
            action: "initialize",
            sessionId: session.id,
            expectedWorkspaceRevision: next.workspaceRevision,
          });
          next = initialized.receipt;
        }
        if (!current) return;
        setTransport(next.transport);
        transportRef.current = next.transport;
        setEvents(next.events);
        if (next.transport) {
          lastCheckpointTickRef.current = next.transport.tick;
          setLoopStartTick(next.transport.loop.startTick);
          setLoopEndTick(next.transport.loop.endTick);
          const restoredSeconds = timelineTickToTempoMappedSeconds(
            next.transport.tick,
            next.transport.ppq,
            next.transport.tempoMap,
          );
          scrubSecondsRef.current = restoredSeconds;
          setElapsed(restoredSeconds);
        }
        workspaceRevisionRef.current = next.workspaceRevision;
        onWorkspaceRevision(next.workspaceRevision);
      } catch (cause) {
        if (current) {
          setError(cause instanceof Error ? cause.message : "Transport could not be restored.");
        }
      }
    })();
    return () => { current = false; };
  }, [session.id, onWorkspaceRevision]);

  useEffect(() => {
    let current = true;
    void (async () => {
      try {
        const remote = await getSupabaseTracks();
        const all = [...(Array.isArray(remote) ? remote : []), ...getUploadedTracks()];
        const match = all.find((item: Track) => String(item.id) === session.songId) ?? null;
        if (!current) return;
        availableTracksRef.current = all as Track[];
        activeSourceTrackIdRef.current = session.songId;
        setTrack(match);
        setSource(getPlayableTrackUrl(match));
      } catch (cause) {
        if (current) {
          setError(cause instanceof Error ? cause.message : "Song audio could not be loaded.");
        }
      }
    })();
    return () => {
      current = false;
    };
  }, [session.songId]);

  const active = session.state === "active";
  const activeTransport = transport ?? transportRef.current;
  const activePpq = activeTransport?.ppq ?? FALLBACK_PPQ;
  const activeTempoMap = activeTransport?.tempoMap ?? FALLBACK_TEMPO_MAP;
  const activeTick = tempoMappedSecondsToTimelineTick(elapsed, activePpq, activeTempoMap);
  const activeSignatureMap = activeTransport?.timeSignatureMap ?? FALLBACK_SIGNATURE_MAP;
  const position = timelineTickToMappedPosition(
    activeTick,
    activePpq,
    activeSignatureMap,
  );
  const activeBpm = timelineTempoAtTick(activeTick, activeTempoMap);

  function secondsToTick(seconds: number) {
    const current = transportRef.current;
    return tempoMappedSecondsToTimelineTick(
      seconds,
      current?.ppq ?? FALLBACK_PPQ,
      current?.tempoMap ?? FALLBACK_TEMPO_MAP,
    );
  }

  function tickToSeconds(tick: number) {
    const current = transportRef.current;
    return timelineTickToTempoMappedSeconds(
      tick,
      current?.ppq ?? FALLBACK_PPQ,
      current?.tempoMap ?? FALLBACK_TEMPO_MAP,
    );
  }
  useEffect(() => {
    workspaceRevisionRef.current = workspaceRevision;
  }, [workspaceRevision]);

  useEffect(() => {
    try {
      const saved = parseTimelineDawMonitorLevel(localStorage.getItem(MONITOR_LEVEL_KEY));
      setVolume(saved.volume);
      setMuted(saved.muted);
    } catch {
      setVolume(1);
      setMuted(false);
    } finally {
      setMonitorReady(true);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.min(1, Math.max(0, volume * (automationVolumeRef.current ?? 1)));
      audio.muted = muted;
    }
    if (monitorReady) {
      try {
        localStorage.setItem(MONITOR_LEVEL_KEY, JSON.stringify({ volume, muted }));
      } catch {}
    }
  }, [monitorReady, muted, volume]);

  useEffect(() => {
    const updateAutomation = (event: Event) => {
      const detail = (event as CustomEvent<AutomationFrameDetail>).detail;
      if (!detail || detail.sessionId !== session.id || detail.trackId !== session.songId) return;
      if (
        detail.sourceTrackId
        && detail.sourceTrackId !== activeSourceTrackIdRef.current
      ) {
        const nextTrack = availableTracksRef.current.find(
          (item) => String(item.id) === detail.sourceTrackId,
        ) ?? null;
        if (nextTrack) {
          sourceSwitchSeekRef.current = audioRef.current?.currentTime ?? elapsed;
          sourceSwitchPlayingRef.current = audioRef.current ? !audioRef.current.paused : false;
          activeSourceTrackIdRef.current = detail.sourceTrackId;
          setTrack(nextTrack);
          setSource(getPlayableTrackUrl(nextTrack));
        }
      }
      automationVolumeRef.current = detail.volume;
      automationPanRef.current = detail.pan;
      const audio = audioRef.current;
      if (audio) {
        audio.volume = Math.min(1, Math.max(0, volume * (detail.volume ?? 1)));
      }
      if (mediaPannerRef.current) {
        mediaPannerRef.current.pan.value = Math.min(1, Math.max(-1, detail.pan ?? 0));
      }
    };
    window.addEventListener("muzes:daw-automation-frame", updateAutomation);
    return () => window.removeEventListener("muzes:daw-automation-frame", updateAutomation);
  }, [elapsed, session.id, session.songId, volume]);

  async function ensureMediaPanner() {
    const audio = audioRef.current;
    if (!audio || typeof AudioContext === "undefined") return;
    if (!mediaAudioContextRef.current) {
      const context = new AudioContext();
      const sourceNode = context.createMediaElementSource(audio);
      const panner = context.createStereoPanner();
      sourceNode.connect(panner).connect(context.destination);
      mediaAudioContextRef.current = context;
      mediaSourceRef.current = sourceNode;
      mediaPannerRef.current = panner;
    }
    const context = mediaAudioContextRef.current;
    if (context.state === "suspended") await context.resume();
    if (mediaPannerRef.current) {
      mediaPannerRef.current.pan.value = Math.min(
        1,
        Math.max(-1, automationPanRef.current ?? 0),
      );
    }
  }

  async function update(
    action:
      | "play"
      | "pause"
      | "stop"
      | "locate"
      | "set-loop"
      | "set-count-in"
      | "complete-count-in"
      | "set-metronome"
      | "set-cue"
      | "set-stop-return"
      | "set-scrub-snap",
    extras: {
      returnToTick?: number;
      tick?: number;
      enabled?: boolean;
      startTick?: number;
      endTick?: number;
      bars?: number;
      cueTick?: number | null;
      returnToCue?: boolean;
      snap?: "free" | "beat" | "bar";
    } = {},
  ) {
    return commandQueueRef.current.enqueue(async () => {
      const operate = async () => {
        const currentTransport = transportRef.current;
        if (!currentTransport) return null;
        const result = await changeDawTransport({
          action,
          sessionId: session.id,
          expectedTransportHead: currentTransport.head,
          expectedWorkspaceRevision: workspaceRevisionRef.current,
          ...extras,
        });
        return result.receipt;
      };
      const receipt = await retryTimelineDawTransportConflict(
        operate,
        async () => {
          const refreshed = await loadDawTransport(session.id);
          transportRef.current = refreshed.transport;
          workspaceRevisionRef.current = refreshed.workspaceRevision;
          setTransport(refreshed.transport);
          setEvents(refreshed.events);
          onWorkspaceRevision(refreshed.workspaceRevision);
        },
        (cause) => cause instanceof ProjectDawApiError && cause.status === 409,
      );
      if (!receipt) return null;
      setTransport(receipt.transport);
      transportRef.current = receipt.transport;
      setEvents(receipt.events);
      workspaceRevisionRef.current = receipt.workspaceRevision;
      onWorkspaceRevision(receipt.workspaceRevision);
      return receipt.transport;
    });
  }

  async function play() {
    const audio = audioRef.current;
    if (!active || !audio || !source || !transport) return;
    setError(null);
    try {
      let nextTransport = transportRef.current;
      if (shouldIssueTransportPlay(nextTransport?.playbackState ?? "stopped")) {
        nextTransport = await update("play");
      }
      if (nextTransport?.playbackState === "counting-in") {
        const token = ++countInTokenRef.current;
        const signature = timelineTickToMappedPosition(
          nextTransport.tick,
          nextTransport.ppq,
          nextTransport.timeSignatureMap,
        );
        const schedule = timelineCountInSchedule({
          bars: nextTransport.countInBars,
          bpm: timelineTempoAtTick(nextTransport.tick, nextTransport.tempoMap),
          numerator: signature.numerator,
        });
        const context = new AudioContext();
        countInAudioRef.current = context;
        for (const [index, offsetMs] of schedule.beatOffsetsMs.entries()) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const start = context.currentTime + offsetMs / 1_000;
          const peak = muted ? 0.0001 : Math.max(0.0001, volume * 0.2);
          oscillator.frequency.value = index % signature.numerator === 0 ? 1_320 : 880;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(peak, start + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.06);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start(start);
          oscillator.stop(start + 0.065);
        }
        await new Promise((resolve) => window.setTimeout(resolve, schedule.durationMs));
        if (context.state !== "closed") await context.close();
        if (countInAudioRef.current === context) countInAudioRef.current = null;
        if (token !== countInTokenRef.current) return;
        nextTransport = await update("complete-count-in");
        if (nextTransport?.playbackState !== "playing") return;
      }
      await ensureMediaPanner();
      await audio.play();
      window.dispatchEvent(new CustomEvent("muzes:daw-transport-state", { detail: { sessionId: session.id, state: "playing", elapsed: audio.currentTime } }));
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Playback could not start.");
    }
  }

  async function pause() {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    countInTokenRef.current += 1;
    void countInAudioRef.current?.close();
    countInAudioRef.current = null;
    audio.pause();
    window.dispatchEvent(new CustomEvent("muzes:daw-transport-state", { detail: { sessionId: session.id, state: "paused", elapsed: audio.currentTime } }));
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
    try {
      const tick = secondsToTick(audio.currentTime);
      await update("pause", { tick });
      lastCheckpointTickRef.current = tick;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pause could not be saved.");
    }
  }

  async function stop() {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    countInTokenRef.current += 1;
    void countInAudioRef.current?.close();
    countInAudioRef.current = null;
    audio.pause();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
    const current = transportRef.current;
    const returnTick = current?.returnToCueOnStop && current.cueTick !== null
      ? current.cueTick
      : 0;
    const returnSeconds = current
      ? timelineTickToTempoMappedSeconds(returnTick, current.ppq, current.tempoMap)
      : 0;
    audio.currentTime = returnSeconds;
    window.dispatchEvent(new CustomEvent("muzes:daw-transport-state", { detail: { sessionId: session.id, state: "stopped", elapsed: returnSeconds } }));
    scrubSecondsRef.current = returnSeconds;
    scrubDirtyRef.current = false;
    setElapsed(returnSeconds);
    lastCheckpointTickRef.current = returnTick;
    try { await update("stop", { returnToTick: returnTick }); } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Stop could not be saved.");
    }
  }

  async function locate(nextSeconds: number) {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    audio.currentTime = nextSeconds;
    setElapsed(nextSeconds);
    try {
      const tick = secondsToTick(nextSeconds);
      await update("locate", { tick });
      lastCheckpointTickRef.current = tick;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Transport location could not be saved.");
    }
  }

  async function navigateToBar(direction: "previous" | "next") {
    const audio = audioRef.current;
    const current = transportRef.current;
    if (!active || !audio || !current) return;
    const currentTick = tempoMappedSecondsToTimelineTick(
      audio.currentTime,
      current.ppq,
      current.tempoMap,
    );
    const targetTick = timelineBarNavigationTick(
      currentTick,
      direction,
      current.ppq,
      current.timeSignatureMap,
    );
    await locate(timelineTickToTempoMappedSeconds(
      targetTick,
      current.ppq,
      current.tempoMap,
    ));
  }

  function previewLocate(nextSeconds: number) {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    audio.currentTime = nextSeconds;
    scrubSecondsRef.current = nextSeconds;
    scrubDirtyRef.current = true;
    setElapsed(nextSeconds);
  }

  function snapScrubSeconds(nextSeconds: number) {
    const current = transportRef.current;
    if (!current || current.scrubSnap === "free") return nextSeconds;
    const rawTick = tempoMappedSecondsToTimelineTick(
      nextSeconds,
      current.ppq,
      current.tempoMap,
    );
    const snappedTick = timelineSnapTick(
      rawTick,
      current.scrubSnap,
      current.ppq,
      current.timeSignatureMap,
    );
    return Math.min(
      timelineTickToTempoMappedSeconds(snappedTick, current.ppq, current.tempoMap),
      duration,
    );
  }

  async function commitScrub() {
    if (!scrubDirtyRef.current) return;
    const nextSeconds = scrubSecondsRef.current;
    scrubDirtyRef.current = false;
    try {
      await locate(nextSeconds);
    } catch {
      scrubDirtyRef.current = true;
    }
  }

  function setLoopBoundary(boundary: "start" | "end") {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = secondsToTick(audio.currentTime);
    if (boundary === "start") {
      setLoopStartTick(tick);
      if (loopEndTick <= tick) setLoopEndTick(0);
    } else if (tick > loopStartTick) {
      setLoopEndTick(tick);
    } else {
      setError("Loop Out must be after Loop In.");
    }
  }

  async function saveLoop(enabled: boolean) {
    if (!transportRef.current) return;
    const startTick = loopStartTick;
    const endTick = loopEndTick;
    if (enabled && endTick <= startTick) {
      setError("Set Loop In and Loop Out before enabling the loop.");
      return;
    }
    setError(null);
    try {
      await update("set-loop", { enabled, startTick, endTick });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Loop settings could not be saved.");
    }
  }

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("muzes:daw-loop", {
      detail: {
        sessionId: session.id,
        enabled: transport?.loop.enabled ?? false,
        startSeconds: tickToSeconds(loopStartTick),
        endSeconds: tickToSeconds(loopEndTick),
      },
    }));
  }, [loopEndTick, loopStartTick, session.id, transport?.loop.enabled]);

  useEffect(() => {
    const handleLoopCommand = (event: Event) => {
      const detail = (event as CustomEvent<{
        sessionId: string;
        action: "set-start" | "set-end" | "toggle";
      }>).detail;
      if (!detail || detail.sessionId !== session.id) return;
      if (detail.action === "set-start") setLoopBoundary("start");
      else if (detail.action === "set-end") setLoopBoundary("end");
      else void saveLoop(!(transportRef.current?.loop.enabled ?? false));
    };
    window.addEventListener("muzes:daw-loop-command", handleLoopCommand);
    return () => window.removeEventListener("muzes:daw-loop-command", handleLoopCommand);
  });

  useEffect(() => {
    const handleLocateCommand = (event: Event) => {
      const detail = (event as CustomEvent<{ sessionId: string; seconds: number }>).detail;
      if (!detail || detail.sessionId !== session.id || !Number.isFinite(detail.seconds)) return;
      void locate(detail.seconds);
    };
    window.addEventListener("muzes:daw-locate-command", handleLocateCommand);
    return () => window.removeEventListener("muzes:daw-locate-command", handleLocateCommand);
  });

  async function saveCountIn(bars: number) {
    setError(null);
    try {
      await update("set-count-in", { bars });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Count-in could not be saved.");
    }
  }

  async function saveCue(tick: number | null) {
    setError(null);
    try {
      await update("set-cue", { cueTick: tick });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cue position could not be saved.");
    }
  }

  async function saveStopReturn(returnToCue: boolean) {
    setError(null);
    try {
      await update("set-stop-return", { returnToCue });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Stop return preference could not be saved.");
    }
  }

  async function saveScrubSnap(snap: "free" | "beat" | "bar") {
    setError(null);
    try {
      await update("set-scrub-snap", { snap });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Scrub snap could not be saved.");
    }
  }

  async function setCueAtPlayhead() {
    const audio = audioRef.current;
    if (!audio) return;
    await saveCue(secondsToTick(audio.currentTime));
  }

  async function goToCue() {
    const current = transportRef.current;
    if (current?.cueTick === null || current?.cueTick === undefined) return;
    await locate(timelineTickToTempoMappedSeconds(
      current.cueTick,
      current.ppq,
      current.tempoMap,
    ));
  }

  async function saveMetronome(enabled: boolean) {
    setError(null);
    try {
      await update("set-metronome", { enabled });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Metronome could not be saved.");
    }
  }

  async function checkpoint() {
    const audio = audioRef.current;
    if (!active || !audio || audio.paused || checkpointPendingRef.current) return;
    const tick = secondsToTick(audio.currentTime);
    if (!shouldCheckpointTransport(
      tick,
      lastCheckpointTickRef.current,
      transportRef.current?.ppq ?? FALLBACK_PPQ,
    )) return;
    checkpointPendingRef.current = true;
    try {
      await update("locate", { tick });
      lastCheckpointTickRef.current = tick;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Playback checkpoint could not be saved.");
    } finally {
      checkpointPendingRef.current = false;
    }
  }
  checkpointRef.current = checkpoint;

  async function finalizePlayback() {
    const audio = audioRef.current;
    const currentTransport = transportRef.current;
    if (!audio || !currentTransport || !["playing", "counting-in"].includes(currentTransport.playbackState)) {
      return;
    }
    audio.pause();
    const tick = secondsToTick(audio.currentTime);
    await update("pause", { tick });
    lastCheckpointTickRef.current = tick;
  }
  finalizePlaybackRef.current = finalizePlayback;

  async function runShortcut(
    action:
      | "toggle-playback"
      | "stop"
      | "previous-bar"
      | "next-bar"
      | "return-to-start",
  ) {
    const audio = audioRef.current;
    if (!active || !source || !audio || !transportRef.current) return;
    if (action === "stop") {
      await stop();
    } else if (action === "previous-bar") {
      await navigateToBar("previous");
    } else if (action === "next-bar") {
      await navigateToBar("next");
    } else if (action === "return-to-start") {
      await locate(0);
    } else if (audio.paused) {
      await play();
    } else {
      await pause();
    }
  }
  shortcutRef.current = runShortcut;
  mediaSeekRef.current = locate;
  mediaPlayRef.current = play;
  mediaPauseRef.current = pause;

  useEffect(() => {
    const interval = window.setInterval(() => void checkpointRef.current(), 10_000);
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") void checkpointRef.current();
    };
    const saveWhenLeaving = () => void finalizePlaybackRef.current().catch(() => undefined);
    document.addEventListener("visibilitychange", saveWhenHidden);
    window.addEventListener("pagehide", saveWhenLeaving);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", saveWhenHidden);
      window.removeEventListener("pagehide", saveWhenLeaving);
    };
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => void mediaPlayRef.current()],
      ["pause", () => void mediaPauseRef.current()],
      ["stop", () => void shortcutRef.current("stop")],
      ["seekto", (details) => {
        const audio = audioRef.current;
        const position = clampTimelineDawMediaPosition(
          details.seekTime ?? Number.NaN,
          audio?.duration ?? Number.NaN,
        );
        if (position !== null) void mediaSeekRef.current(position);
      }],
      ["seekbackward", (details) => {
        const audio = audioRef.current;
        const position = clampTimelineDawMediaPosition(
          (audio?.currentTime ?? 0) - (details.seekOffset ?? 10),
          audio?.duration ?? Number.NaN,
        );
        if (position !== null) void mediaSeekRef.current(position);
      }],
      ["seekforward", (details) => {
        const audio = audioRef.current;
        const position = clampTimelineDawMediaPosition(
          (audio?.currentTime ?? 0) + (details.seekOffset ?? 10),
          audio?.duration ?? Number.NaN,
        );
        if (position !== null) void mediaSeekRef.current(position);
      }],
    ];
    for (const [action, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    }
    return () => {
      for (const [action] of handlers) {
        try { navigator.mediaSession.setActionHandler(action, null); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !("MediaMetadata" in window)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track?.title || session.name,
      artist: track?.artist || "The Muzes Garden",
      album: "DAW Studio",
    });
  }, [session.name, track?.artist, track?.title]);

  useEffect(() => {
    if (!transport?.metronomeEnabled || transport.playbackState !== "playing") {
      void metronomeAudioRef.current?.close();
      metronomeAudioRef.current = null;
      return;
    }
    const context = new AudioContext();
    metronomeAudioRef.current = context;
    let nextBeatTick: number | null = null;
    let lastAudioSeconds = -1;
    const schedule = () => {
      const audio = audioRef.current;
      const current = transportRef.current;
      if (!audio || !current || audio.paused) return;
      const audioSeconds = audio.currentTime;
      const currentTick = tempoMappedSecondsToTimelineTick(
        audioSeconds,
        current.ppq,
        current.tempoMap,
      );
      if (nextBeatTick === null || audioSeconds + 0.05 < lastAudioSeconds) {
        nextBeatTick = timelineMetronomeBeatAtOrAfterTick(
          currentTick,
          current.ppq,
          current.timeSignatureMap,
        ).tick;
      }
      lastAudioSeconds = audioSeconds;
      while (nextBeatTick !== null) {
        const beat = timelineMetronomeBeatAtOrAfterTick(
          nextBeatTick,
          current.ppq,
          current.timeSignatureMap,
        );
        const beatSeconds = timelineTickToTempoMappedSeconds(
          beat.tick,
          current.ppq,
          current.tempoMap,
        );
        if (beatSeconds > audioSeconds + 0.12) break;
        if (beatSeconds < audioSeconds - 0.5) {
          nextBeatTick = timelineMetronomeBeatAtOrAfterTick(
            currentTick,
            current.ppq,
            current.timeSignatureMap,
          ).tick;
          continue;
        }
        if (beatSeconds >= audioSeconds - 0.03) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const start = Math.max(context.currentTime, context.currentTime + beatSeconds - audioSeconds);
          const peak = muted ? 0.0001 : Math.max(0.0001, volume * 0.16);
          oscillator.frequency.value = beat.accent ? 1_320 : 880;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(peak, start + 0.004);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start(start);
          oscillator.stop(start + 0.055);
        }
        nextBeatTick = timelineMetronomeBeatAtOrAfterTick(
          beat.tick + 1,
          current.ppq,
          current.timeSignatureMap,
        ).tick;
      }
    };
    const interval = window.setInterval(schedule, 25);
    schedule();
    return () => {
      window.clearInterval(interval);
      if (metronomeAudioRef.current === context) metronomeAudioRef.current = null;
      void context.close();
    };
  }, [muted, transport?.metronomeEnabled, transport?.playbackState, volume]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const action = resolveTimelineDawTransportShortcut({
        key: event.key,
        repeat: event.repeat,
        defaultPrevented: event.defaultPrevented,
        hasModifier: event.altKey || event.ctrlKey || event.metaKey,
        shiftKey: event.shiftKey,
        editableTarget: Boolean(target?.closest(
          "input, textarea, select, button, a, [contenteditable='true'], [role='textbox']",
        )),
      });
      if (!action) return;
      event.preventDefault();
      void shortcutRef.current(action);
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <section className="rounded-3xl border border-white/15 bg-black p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Live Transport
          </p>
          <h2 className="mt-1 text-2xl font-black">{track?.title || session.name}</h2>
          <p className="mt-1 text-sm text-white/45">{track?.artist || "Project audio"}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-black">{position.label}</p>
          <p className="text-xs text-white/45">
            {activeBpm} BPM · {position.numerator}/{position.denominator} · 48 kHz
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void play()} disabled={!active || !source} aria-keyshortcuts="Space" className="rounded-xl bg-emerald-300 px-5 py-3 font-black text-black disabled:opacity-35">
          Play
        </button>
        <button type="button" onClick={() => void pause()} disabled={!active || !source} aria-keyshortcuts="Space" className="rounded-xl border border-white/25 px-5 py-3 font-black disabled:opacity-35">
          Pause
        </button>
        <button type="button" onClick={() => void stop()} disabled={!active || !source} aria-keyshortcuts="Escape" className="rounded-xl border border-white/25 px-5 py-3 font-black disabled:opacity-35">
          Stop
        </button>
        <button type="button" onClick={() => void navigateToBar("previous")} disabled={!active || !source} aria-keyshortcuts="Shift+ArrowLeft" className="rounded-xl border border-white/25 px-4 py-3 text-sm font-black disabled:opacity-35">
          Previous Bar
        </button>
        <button type="button" onClick={() => void navigateToBar("next")} disabled={!active || !source} aria-keyshortcuts="Shift+ArrowRight" className="rounded-xl border border-white/25 px-4 py-3 text-sm font-black disabled:opacity-35">
          Next Bar
        </button>
        <button type="button" onClick={() => void locate(0)} disabled={!active || !source} aria-keyshortcuts="Home" className="rounded-xl border border-white/25 px-4 py-3 text-sm font-black disabled:opacity-35">
          Start
        </button>
        <span className="ml-auto font-mono text-sm text-white/65">
          {clock(elapsed)} / {clock(duration)}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(duration, 0)}
        step={0.01}
        value={Math.min(elapsed, duration || 0)}
        onChange={(event) => previewLocate(snapScrubSeconds(Number(event.target.value)))}
        onPointerUp={() => void commitScrub()}
        onKeyUp={() => void commitScrub()}
        onBlur={() => void commitScrub()}
        disabled={!active || !source || duration <= 0}
        className="mt-4 w-full accent-emerald-300 disabled:opacity-35"
        aria-label="DAW transport location"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor={`daw-scrub-snap-${session.id}`} className="text-xs font-bold text-white/45">
          Scrub grid
        </label>
        <select
          id={`daw-scrub-snap-${session.id}`}
          value={transport?.scrubSnap ?? "free"}
          onChange={(event) => void saveScrubSnap(
            event.target.value as "free" | "beat" | "bar",
          )}
          disabled={!active || !transport}
          className="rounded-lg border border-white/15 bg-black px-3 py-1.5 text-xs font-black disabled:opacity-35"
        >
          <option value="free">Free</option>
          <option value="beat">Beat</option>
          <option value="bar">Bar</option>
        </select>
        <span className="text-xs text-white/35">
          Slider moves lock to the selected musical grid.
        </span>
      </div>
      <p className="mt-2 text-xs text-white/35">
        Keyboard: Space plays/pauses · Escape stops · Shift+←/→ moves by bar · Home returns to start
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
        <button type="button" onClick={() => void setCueAtPlayhead()} disabled={!active || !source} className="rounded-lg bg-sky-300 px-3 py-2 text-xs font-black text-black disabled:opacity-35">
          Set Cue
        </button>
        <button type="button" onClick={() => void goToCue()} disabled={!active || !source || transport?.cueTick === null || transport?.cueTick === undefined} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-35">
          Go to Cue
        </button>
        <button type="button" onClick={() => void saveCue(null)} disabled={!active || transport?.cueTick === null || transport?.cueTick === undefined} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-35">
          Clear Cue
        </button>
        <button
          type="button"
          onClick={() => void saveStopReturn(!transport?.returnToCueOnStop)}
          disabled={!active || transport?.cueTick === null || transport?.cueTick === undefined}
          aria-pressed={transport?.returnToCueOnStop ?? false}
          className={`rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-35 ${
            transport?.returnToCueOnStop
              ? "border-sky-300 bg-sky-300 text-black"
              : "border-white/15"
          }`}
        >
          Stop Returns to {transport?.returnToCueOnStop ? "Cue" : "Start"}
        </button>
        <span className="ml-auto font-mono text-xs text-white/55">
          {transport?.cueTick === null || transport?.cueTick === undefined
            ? "No saved cue"
            : `Cue ${timelineTickToMappedPosition(
              transport.cueTick,
              activePpq,
              activeSignatureMap,
            ).label}`}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
        <label htmlFor={`daw-count-in-${session.id}`} className="text-xs font-bold text-white/55">
          Count-in
        </label>
        <select
          id={`daw-count-in-${session.id}`}
          value={transport?.countInBars ?? 0}
          onChange={(event) => void saveCountIn(Number(event.target.value))}
          disabled={!active || !transport || ["playing", "counting-in"].includes(transport.playbackState)}
          className="rounded-lg border border-white/15 bg-black px-3 py-2 text-xs font-black disabled:opacity-35"
        >
          <option value={0}>Off</option>
          <option value={1}>1 bar</option>
          <option value={2}>2 bars</option>
          <option value={4}>4 bars</option>
        </select>
        <button
          type="button"
          onClick={() => void saveMetronome(!transport?.metronomeEnabled)}
          disabled={!active || !transport}
          aria-pressed={transport?.metronomeEnabled ?? false}
          className={`rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-35 ${
            transport?.metronomeEnabled
              ? "border-emerald-300 bg-emerald-300 text-black"
              : "border-white/15"
          }`}
        >
          Metronome {transport?.metronomeEnabled ? "On" : "Off"}
        </button>
        <span className="text-xs text-white/35">
          {transport?.playbackState === "counting-in"
            ? "Counting in…"
            : "Audible beat cues play before the song starts."}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
        <button
          type="button"
          onClick={() => setMuted((current) => !current)}
          className="min-w-16 rounded-lg border border-white/15 px-3 py-2 text-xs font-black"
          aria-pressed={muted}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        <label htmlFor={`daw-volume-${session.id}`} className="text-xs font-bold text-white/55">
          Monitor
        </label>
        <input
          id={`daw-volume-${session.id}`}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="min-w-0 flex-1 accent-emerald-300"
          aria-label="DAW monitor volume"
        />
        <span className="w-10 text-right font-mono text-xs text-white/55">
          {Math.round(volume * 100)}%
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-white/[0.04] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setLoopBoundary("start")} disabled={!active || !source} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-35">
            Set Loop In
          </button>
          <button type="button" onClick={() => setLoopBoundary("end")} disabled={!active || !source} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-35">
            Set Loop Out
          </button>
          <button type="button" onClick={() => void saveLoop(true)} disabled={!active || !source || loopEndTick <= loopStartTick} className="rounded-lg bg-violet-300 px-3 py-2 text-xs font-black text-black disabled:opacity-35">
            {transport?.loop.enabled ? "Update Loop" : "Enable Loop"}
          </button>
          <button type="button" onClick={() => void saveLoop(false)} disabled={!active || !transport?.loop.enabled} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-35">
            Disable Loop
          </button>
          <span className="ml-auto font-mono text-xs text-white/55">
            {timelineTickToMappedPosition(loopStartTick, activePpq, activeSignatureMap).label}
            {" → "}
            {timelineTickToMappedPosition(loopEndTick, activePpq, activeSignatureMap).label}
          </span>
        </div>
        <p className="mt-2 text-xs text-white/35">
          Move the playhead, set Loop In and Loop Out, then enable the saved loop.
        </p>
      </div>

      {!active ? (
        <p className="mt-3 text-sm text-amber-200">
          Activate this DAW session before operating the transport.
        </p>
      ) : !source ? (
        <p className="mt-3 text-sm text-amber-200">
          This song does not currently expose a playable audio source.
        </p>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-200">{error}</p> : null}

      {events.length ? (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-xs font-black uppercase tracking-wider text-white/40">
            Recent transport receipts
          </p>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...events].slice(-6).reverse().map((event) => (
              <li key={event.id} className="rounded-xl bg-white/[0.04] p-3 text-xs">
                <span className="font-black uppercase text-emerald-300">{event.action}</span>
                <span className="ml-2 text-white/45">rev {event.id.split("-").at(-1)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <audio
        ref={audioRef}
        src={source || undefined}
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
          const switchedSource = sourceSwitchSeekRef.current !== null;
          if (switchedSource) {
            audio.currentTime = Math.min(
              sourceSwitchSeekRef.current!,
              Number.isFinite(audio.duration) ? audio.duration : sourceSwitchSeekRef.current!,
            );
            sourceSwitchSeekRef.current = null;
            if (sourceSwitchPlayingRef.current) void audio.play().catch(() => undefined);
            sourceSwitchPlayingRef.current = false;
          }
          window.dispatchEvent(new CustomEvent("muzes:daw-playhead", {
            detail: {
              sessionId: session.id,
              elapsed: audio.currentTime,
              duration: Number.isFinite(audio.duration) ? audio.duration : 0,
            },
          }));
          if (!switchedSource && transport?.tick) {
            const restored = tickToSeconds(transport.tick);
            audio.currentTime = Math.min(restored, Number.isFinite(audio.duration) ? audio.duration : restored);
            scrubSecondsRef.current = audio.currentTime;
            setElapsed(audio.currentTime);
          }
          const savedLoop = transportRef.current?.loop;
          if (savedLoop && savedLoop.endTick > savedLoop.startTick) {
            setLoopStartTick(savedLoop.startTick);
            setLoopEndTick(savedLoop.endTick);
          } else if (Number.isFinite(audio.duration)) {
            setLoopEndTick(secondsToTick(audio.duration));
          }
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          const activeLoop = transportRef.current?.loop;
          if (activeLoop?.enabled
            && secondsToTick(audio.currentTime) >= activeLoop.endTick) {
            audio.currentTime = tickToSeconds(activeLoop.startTick);
          }
          scrubSecondsRef.current = audio.currentTime;
          setElapsed(audio.currentTime);
          window.dispatchEvent(new CustomEvent("muzes:daw-playhead", {
            detail: {
              sessionId: session.id,
              elapsed: audio.currentTime,
              duration: Number.isFinite(audio.duration) ? audio.duration : 0,
            },
          }));
          if ("mediaSession" in navigator && Number.isFinite(audio.duration) && audio.duration > 0) {
            try {
              navigator.mediaSession.setPositionState({
                duration: audio.duration,
                playbackRate: audio.playbackRate,
                position: Math.min(audio.currentTime, audio.duration),
              });
            } catch {}
          }
        }}
        onEnded={() => {
          setElapsed(0);
          if (transport?.playbackState === "playing") void stop();
        }}
      />
    </section>
  );
}
