"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import {
  clampTimelineZoom,
  createTimelineRulerMarks,
  createTimelineWaveformBars,
  parseTimelineLaneState,
  timelineCanvasWidth,
  timelinePlayheadPercent,
  type TimelineDawLaneState,
} from "../../../../lib/timeline/TimelineDawMultitrackViewModel";
import { getUploadedTracks } from "../../../../lib/uploadedTracks";
import type { DawSession } from "./projectDawTypes";

type Track = {
  id: string;
  title?: string | null;
  artist?: string | null;
};

type PlayheadDetail = {
  sessionId: string;
  elapsed: number;
  duration: number;
};

function clock(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

export default function ProjectDawTimeline({ session }: { session: DawSession }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(180);
  const [zoom, setZoom] = useState(1);
  const [follow, setFollow] = useState(true);
  const [lane, setLane] = useState<TimelineDawLaneState>({
    trackId: session.songId,
    selected: true,
    muted: false,
    soloed: false,
  });

  const storageKey = `muzes:daw-timeline-lane:v1:${session.id}:${session.songId}`;
  const canvasWidth = timelineCanvasWidth(duration, zoom);
  const playhead = timelinePlayheadPercent(elapsed, duration);
  const ruler = useMemo(() => createTimelineRulerMarks(duration, zoom), [duration, zoom]);
  const bars = useMemo(
    () => createTimelineWaveformBars(`${session.id}:${session.songId}`),
    [session.id, session.songId],
  );

  useEffect(() => {
    let current = true;
    void (async () => {
      const remote = await getSupabaseTracks().catch(() => []);
      const all = [...(Array.isArray(remote) ? remote : []), ...getUploadedTracks()];
      const match = all.find((item: Track) => String(item.id) === session.songId) ?? null;
      if (current) setTrack(match);
    })();
    return () => {
      current = false;
    };
  }, [session.songId]);

  useEffect(() => {
    setLane(parseTimelineLaneState(localStorage.getItem(storageKey), session.songId));
  }, [session.songId, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(lane));
  }, [lane, storageKey]);

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<PlayheadDetail>).detail;
      if (!detail || detail.sessionId !== session.id) return;
      setElapsed(detail.elapsed);
      if (detail.duration > 0) setDuration(detail.duration);
    };
    window.addEventListener("muzes:daw-playhead", update);
    return () => window.removeEventListener("muzes:daw-playhead", update);
  }, [session.id]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!follow || !scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    const target = (playhead / 100) * scroller.scrollWidth - scroller.clientWidth * 0.35;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [follow, playhead]);

  function updateLane(patch: Partial<TimelineDawLaneState>) {
    setLane((current) => ({ ...current, ...patch }));
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/15 bg-[#050505]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Multitrack Timeline
          </p>
          <h2 className="mt-1 text-2xl font-black">Arrangement Workspace</h2>
          <p className="mt-1 text-sm text-white/45">
            Musical ruler, synchronized playhead, waveform lanes, zoom, and track focus.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFollow((value) => !value)}
            aria-pressed={follow}
            className={`rounded-lg border px-3 py-2 text-xs font-black ${
              follow ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/15"
            }`}
          >
            Follow {follow ? "On" : "Off"}
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => clampTimelineZoom(value - 0.25))}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm font-black"
            aria-label="Zoom timeline out"
          >
            -
          </button>
          <span className="min-w-14 text-center font-mono text-xs text-white/55">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((value) => clampTimelineZoom(value + 0.25))}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm font-black"
            aria-label="Zoom timeline in"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[190px_minmax(0,1fr)]">
        <div className="border-r border-white/10 bg-[#0a0a0a]">
          <div className="h-12 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-white/35">
            Tracks
          </div>
          <button
            type="button"
            onClick={() => updateLane({ selected: true })}
            className={`h-28 w-full border-b border-white/10 p-3 text-left ${
              lane.selected ? "bg-cyan-300/10" : "bg-transparent"
            }`}
          >
            <span className="block truncate text-sm font-black">{track?.title || session.name}</span>
            <span className="mt-1 block truncate text-xs text-white/40">
              {track?.artist || "Project audio"} · Audio 1
            </span>
            <span className="mt-3 flex gap-2">
              <span
                role="button"
                tabIndex={0}
                aria-pressed={lane.muted}
                onClick={(event) => {
                  event.stopPropagation();
                  updateLane({ muted: !lane.muted });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    updateLane({ muted: !lane.muted });
                  }
                }}
                className={`rounded px-2 py-1 text-[10px] font-black ${
                  lane.muted ? "bg-amber-300 text-black" : "bg-white/10"
                }`}
              >
                M
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-pressed={lane.soloed}
                onClick={(event) => {
                  event.stopPropagation();
                  updateLane({ soloed: !lane.soloed });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    updateLane({ soloed: !lane.soloed });
                  }
                }}
                className={`rounded px-2 py-1 text-[10px] font-black ${
                  lane.soloed ? "bg-emerald-300 text-black" : "bg-white/10"
                }`}
              >
                S
              </span>
            </span>
          </button>
        </div>

        <div ref={scrollerRef} className="overflow-x-auto" onScroll={() => setFollow(false)}>
          <div style={{ width: canvasWidth }} className="relative min-w-full">
            <div className="relative h-12 border-b border-white/10 bg-[#0a0a0a]">
              {ruler.map((mark) => (
                <div
                  key={mark.seconds}
                  className="absolute bottom-0 top-0 border-l border-white/15"
                  style={{ left: `${mark.leftPercent}%` }}
                >
                  <span className={`ml-1 font-mono text-[10px] ${mark.major ? "text-cyan-200" : "text-white/35"}`}>
                    {mark.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative h-28 border-b border-white/10 bg-white/[0.025]">
              <div className="absolute inset-y-3 left-2 right-2 overflow-hidden rounded-xl border border-cyan-300/25 bg-cyan-300/10">
                <div className="flex h-full items-center gap-px px-2" aria-label="Song waveform overview">
                  {bars.map((height, index) => (
                    <span
                      key={index}
                      className="min-w-px flex-1 rounded-full bg-cyan-200/75"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <span className="absolute left-3 top-2 rounded bg-black/65 px-2 py-1 text-[10px] font-black text-cyan-100">
                  {track?.title || session.name}
                </span>
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 z-20 w-px bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.9)]"
                style={{ left: `${playhead}%` }}
              >
                <span className="absolute -left-6 top-1 rounded bg-rose-400 px-1.5 py-0.5 font-mono text-[9px] font-black text-black">
                  {clock(elapsed)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3 text-xs text-white/35">
        <span>{lane.muted ? "Track muted" : lane.soloed ? "Track soloed" : "Track audible"} · Selection saved on this device</span>
        <span className="font-mono">{clock(elapsed)} / {clock(duration)}</span>
      </div>
    </section>
  );
}
