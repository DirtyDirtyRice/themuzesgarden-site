"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import {
  type TimelineTransportEvent,
  type TimelineTransportSynchronization,
} from "../../../../lib/timeline/TimelineTransportAndSynchronizationEngine";
import {
  secondsToTimelineTick,
  shouldCheckpointTransport,
  timelineTickToSeconds,
  timelineTickToPosition,
} from "../../../../lib/timeline/TimelineDawTransportViewModel";
import { getUploadedTracks } from "../../../../lib/uploadedTracks";
import { changeDawTransport, loadDawTransport } from "./projectDawApi";
import { getPlayableTrackUrl } from "./projectPlaybackHelpers";
import type { DawSession } from "./projectDawTypes";

type Track = {
  id: string;
  title?: string | null;
  artist?: string | null;
  [key: string]: unknown;
};

const BPM = 120;
const PPQ = 960;

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
  const [transport, setTransport] = useState<TimelineTransportSynchronization | null>(null);
  const [events, setEvents] = useState<TimelineTransportEvent[]>([]);
  const [track, setTrack] = useState<Track | null>(null);
  const [source, setSource] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
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
          setElapsed(timelineTickToSeconds(next.transport.tick, BPM, PPQ));
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

  const position = useMemo(
    () => timelineTickToPosition(secondsToTimelineTick(elapsed, BPM, PPQ), PPQ),
    [elapsed],
  );
  const active = session.state === "active";
  useEffect(() => {
    workspaceRevisionRef.current = workspaceRevision;
  }, [workspaceRevision]);

  async function update(
    action: "play" | "pause" | "stop" | "locate",
    extras: { returnToTick?: number; tick?: number } = {},
  ) {
    const currentTransport = transportRef.current;
    if (!currentTransport) return null;
    const result = await changeDawTransport({
      action,
      sessionId: session.id,
      expectedTransportHead: currentTransport.head,
      expectedWorkspaceRevision: workspaceRevisionRef.current,
      ...extras,
    });
    setTransport(result.receipt.transport);
    transportRef.current = result.receipt.transport;
    setEvents(result.receipt.events);
    workspaceRevisionRef.current = result.receipt.workspaceRevision;
    onWorkspaceRevision(result.receipt.workspaceRevision);
    return result.receipt.transport;
  }

  async function play() {
    const audio = audioRef.current;
    if (!active || !audio || !source || !transport) return;
    setError(null);
    try {
      await update("play");
      await audio.play();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Playback could not start.");
    }
  }

  async function pause() {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    audio.pause();
    try {
      const tick = secondsToTimelineTick(audio.currentTime, BPM, PPQ);
      await update("pause", { tick });
      lastCheckpointTickRef.current = tick;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pause could not be saved.");
    }
  }

  async function stop() {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    audio.pause();
    audio.currentTime = 0;
    setElapsed(0);
    lastCheckpointTickRef.current = 0;
    try { await update("stop", { returnToTick: 0 }); } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Stop could not be saved.");
    }
  }

  async function locate(nextSeconds: number) {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    audio.currentTime = nextSeconds;
    setElapsed(nextSeconds);
    try {
      const tick = secondsToTimelineTick(nextSeconds, BPM, PPQ);
      await update("locate", { tick });
      lastCheckpointTickRef.current = tick;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Transport location could not be saved.");
    }
  }

  async function checkpoint() {
    const audio = audioRef.current;
    if (!active || !audio || audio.paused || checkpointPendingRef.current) return;
    const tick = secondsToTimelineTick(audio.currentTime, BPM, PPQ);
    if (!shouldCheckpointTransport(tick, lastCheckpointTickRef.current, PPQ)) return;
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

  useEffect(() => {
    const interval = window.setInterval(() => void checkpointRef.current(), 10_000);
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") void checkpointRef.current();
    };
    const saveWhenLeaving = () => void checkpointRef.current();
    document.addEventListener("visibilitychange", saveWhenHidden);
    window.addEventListener("pagehide", saveWhenLeaving);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", saveWhenHidden);
      window.removeEventListener("pagehide", saveWhenLeaving);
    };
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
          <p className="text-xs text-white/45">{BPM} BPM · 4/4 · 48 kHz</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void play()} disabled={!active || !source} className="rounded-xl bg-emerald-300 px-5 py-3 font-black text-black disabled:opacity-35">
          Play
        </button>
        <button type="button" onClick={() => void pause()} disabled={!active || !source} className="rounded-xl border border-white/25 px-5 py-3 font-black disabled:opacity-35">
          Pause
        </button>
        <button type="button" onClick={() => void stop()} disabled={!active || !source} className="rounded-xl border border-white/25 px-5 py-3 font-black disabled:opacity-35">
          Stop
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
        onChange={(event) => void locate(Number(event.target.value))}
        disabled={!active || !source || duration <= 0}
        className="mt-4 w-full accent-emerald-300 disabled:opacity-35"
        aria-label="DAW transport location"
      />

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
          if (transport?.tick) {
            const restored = timelineTickToSeconds(transport.tick, BPM, PPQ);
            audio.currentTime = Math.min(restored, Number.isFinite(audio.duration) ? audio.duration : restored);
            setElapsed(audio.currentTime);
          }
        }}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onEnded={() => {
          setElapsed(0);
          if (transport?.playbackState === "playing") void stop();
        }}
      />
    </section>
  );
}
