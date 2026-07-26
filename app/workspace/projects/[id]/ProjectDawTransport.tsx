"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import {
  TimelineTransportAndSynchronizationEngine,
  type TimelineTransportSynchronization,
} from "../../../../lib/timeline/TimelineTransportAndSynchronizationEngine";
import {
  secondsToTimelineTick,
  timelineTickToPosition,
} from "../../../../lib/timeline/TimelineDawTransportViewModel";
import { getUploadedTracks } from "../../../../lib/uploadedTracks";
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

function createTransport(session: DawSession, userId: string) {
  const engine = new TimelineTransportAndSynchronizationEngine();
  let transport = engine.createTransport({
    projectId: session.projectId,
    sessionId: session.id,
    audioGraphId: `browser-audio-graph-${session.id}`,
    name: `${session.name} transport`,
    sampleRate: 48_000,
    ppq: PPQ,
    bpm: BPM,
    createdBy: userId,
  });
  transport = engine.validate({
    transportId: transport.id,
    expectedHead: transport.head,
    validatedBy: userId,
  });
  transport = engine.activate({
    transportId: transport.id,
    expectedHead: transport.head,
    activatedBy: userId,
  });
  return { engine, transport };
}

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function ProjectDawTransport({
  session,
  userId,
}: {
  session: DawSession;
  userId: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controllerRef = useRef<ReturnType<typeof createTransport> | null>(null);
  const [transport, setTransport] = useState<TimelineTransportSynchronization | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [source, setSource] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = createTransport(session, userId);
    controllerRef.current = controller;
    setTransport(controller.transport);
    return () => {
      controllerRef.current = null;
    };
  }, [session.id, session.name, session.projectId, userId]);

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
  const events = controllerRef.current?.engine.listEvents(transport?.id).slice(-6).reverse() ?? [];

  function update(
    command: (controller: ReturnType<typeof createTransport>) => TimelineTransportSynchronization,
  ) {
    const controller = controllerRef.current;
    if (!controller) return null;
    const next = command(controller);
    controller.transport = next;
    setTransport(next);
    return next;
  }

  async function play() {
    const audio = audioRef.current;
    if (!active || !audio || !source || !transport) return;
    setError(null);
    try {
      update(({ engine, transport: current }) =>
        engine.play({
          transportId: current.id,
          expectedHead: current.head,
          playedBy: userId,
        }),
      );
      await audio.play();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Playback could not start.");
    }
  }

  function pause() {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    audio.pause();
    update(({ engine, transport: current }) =>
      engine.pause({
        transportId: current.id,
        expectedHead: current.head,
        pausedBy: userId,
      }),
    );
  }

  function stop() {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    audio.pause();
    audio.currentTime = 0;
    setElapsed(0);
    update(({ engine, transport: current }) =>
      engine.stop({
        transportId: current.id,
        expectedHead: current.head,
        returnToTick: 0,
        stoppedBy: userId,
      }),
    );
  }

  function locate(nextSeconds: number) {
    const audio = audioRef.current;
    if (!active || !audio || !transport) return;
    audio.currentTime = nextSeconds;
    setElapsed(nextSeconds);
    update(({ engine, transport: current }) =>
      engine.locate({
        transportId: current.id,
        expectedHead: current.head,
        tick: secondsToTimelineTick(nextSeconds, BPM, PPQ),
        locatedBy: userId,
      }),
    );
  }

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
        <button type="button" onClick={pause} disabled={!active || !source} className="rounded-xl border border-white/25 px-5 py-3 font-black disabled:opacity-35">
          Pause
        </button>
        <button type="button" onClick={stop} disabled={!active || !source} className="rounded-xl border border-white/25 px-5 py-3 font-black disabled:opacity-35">
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
        onChange={(event) => locate(Number(event.target.value))}
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
            {events.map((event) => (
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
        onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onEnded={() => {
          setElapsed(0);
          if (transport?.playbackState === "playing") stop();
        }}
      />
    </section>
  );
}
