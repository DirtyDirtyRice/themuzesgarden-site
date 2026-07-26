"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import { listLinkedProjectTrackIds } from "../../../../lib/projectTracksApi";
import {
  clampTimelineZoom,
  createTimelineRulerMarks,
  createTimelineWaveformBars,
  moveTimelineClip,
  moveTimelineLane,
  reconcileTimelineClips,
  reconcileTimelineLanes,
  selectTimelineClip,
  splitTimelineClip,
  timelineCanvasWidth,
  timelinePlayheadPercent,
  trimTimelineClip,
  type TimelineDawClipState,
  type TimelineDawLaneState,
} from "../../../../lib/timeline/TimelineDawMultitrackViewModel";
import { getUploadedTracks } from "../../../../lib/uploadedTracks";
import type { DawSession } from "./projectDawTypes";

type Track = { id: string; title?: string | null; artist?: string | null };
type PlayheadDetail = { sessionId: string; elapsed: number; duration: number };

function clock(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

export default function ProjectDawTimeline({ session }: { session: DawSession }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [lanes, setLanes] = useState<TimelineDawLaneState[]>([]);
  const [clips, setClips] = useState<TimelineDawClipState[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(180);
  const [zoom, setZoom] = useState(1);
  const [follow, setFollow] = useState(true);
  const storageKey = `muzes:daw-timeline-lanes:v2:${session.id}`;
  const clipStorageKey = `muzes:daw-timeline-clips:v1:${session.id}`;
  const canvasWidth = timelineCanvasWidth(duration, zoom);
  const playhead = timelinePlayheadPercent(elapsed, duration);
  const ruler = useMemo(() => createTimelineRulerMarks(duration, zoom), [duration, zoom]);
  const trackById = useMemo(() => new Map(tracks.map((track) => [String(track.id), track])), [tracks]);
  const anySoloed = lanes.some((lane) => lane.soloed);

  useEffect(() => {
    let current = true;
    void (async () => {
      const [remote, linked] = await Promise.all([
        getSupabaseTracks().catch(() => []),
        listLinkedProjectTrackIds(session.projectId).catch(() => new Set<string>([session.songId])),
      ]);
      const all = [...(Array.isArray(remote) ? remote : []), ...getUploadedTracks()] as Track[];
      const unique = new Map<string, Track>();
      for (const track of all) unique.set(String(track.id), track);
      const linkedIds = Array.from(linked);
      if (!linkedIds.includes(session.songId)) linkedIds.unshift(session.songId);
      const projectTracks = linkedIds.map((id) => unique.get(id) ?? { id, title: id });
      if (!current) return;
      setTracks(projectTracks);
      setLanes(reconcileTimelineLanes(localStorage.getItem(storageKey), linkedIds, session.songId));
      setClips(reconcileTimelineClips(
        localStorage.getItem(clipStorageKey),
        linkedIds,
        duration,
      ));
    })();
    return () => { current = false; };
  }, [clipStorageKey, duration, session.projectId, session.songId, storageKey]);

  useEffect(() => {
    if (lanes.length) localStorage.setItem(storageKey, JSON.stringify(lanes));
  }, [lanes, storageKey]);

  useEffect(() => {
    if (clips.length) localStorage.setItem(clipStorageKey, JSON.stringify(clips));
  }, [clipStorageKey, clips]);

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

  function updateLane(trackId: string, patch: Partial<TimelineDawLaneState>) {
    setLanes((current) => current.map((lane) => lane.trackId === trackId
      ? { ...lane, ...patch }
      : patch.selected ? { ...lane, selected: false } : lane));
  }

  const selectedClip = clips.find((clip) => clip.selected) ?? null;
  const editStep = zoom >= 4 ? 0.25 : zoom >= 2 ? 0.5 : 1;

  function editSelected(action: "move-left" | "move-right" | "trim-start" | "trim-end" | "split") {
    if (!selectedClip) return;
    if (action === "move-left") {
      setClips((value) => moveTimelineClip(value, selectedClip.id, -editStep));
    } else if (action === "move-right") {
      setClips((value) => moveTimelineClip(value, selectedClip.id, editStep));
    } else if (action === "trim-start") {
      setClips((value) => trimTimelineClip(value, selectedClip.id, "start", editStep));
    } else if (action === "trim-end") {
      setClips((value) => trimTimelineClip(value, selectedClip.id, "end", -editStep));
    } else {
      setClips((value) => splitTimelineClip(value, selectedClip.id, elapsed));
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/15 bg-[#050505]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Multitrack Timeline</p>
          <h2 className="mt-1 text-2xl font-black">Arrangement Workspace</h2>
          <p className="mt-1 text-sm text-white/45">
            {lanes.length} project {lanes.length === 1 ? "track" : "tracks"} · saved ordering and lane controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setFollow((value) => !value)} aria-pressed={follow}
            className={`rounded-lg border px-3 py-2 text-xs font-black ${follow ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/15"}`}>
            Follow {follow ? "On" : "Off"}
          </button>
          <button type="button" onClick={() => setZoom((value) => clampTimelineZoom(value - 0.25))}
            className="rounded-lg border border-white/15 px-3 py-2 font-black" aria-label="Zoom timeline out">−</button>
          <span className="min-w-14 text-center font-mono text-xs text-white/55">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((value) => clampTimelineZoom(value + 0.25))}
            className="rounded-lg border border-white/15 px-3 py-2 font-black" aria-label="Zoom timeline in">+</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/[0.025] px-5 py-3">
        <span className="mr-1 text-xs font-black uppercase tracking-wider text-white/35">Clip edit</span>
        <button type="button" disabled={!selectedClip} onClick={() => editSelected("move-left")}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-30">
          Move −{editStep}s
        </button>
        <button type="button" disabled={!selectedClip} onClick={() => editSelected("move-right")}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-30">
          Move +{editStep}s
        </button>
        <button type="button" disabled={!selectedClip} onClick={() => editSelected("trim-start")}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-30">
          Trim Start
        </button>
        <button type="button" disabled={!selectedClip} onClick={() => editSelected("trim-end")}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-30">
          Trim End
        </button>
        <button type="button" disabled={!selectedClip} onClick={() => editSelected("split")}
          className="rounded-lg bg-violet-300 px-3 py-2 text-xs font-black text-black disabled:opacity-30">
          Split at Playhead
        </button>
        <span className="ml-auto font-mono text-xs text-white/40">
          {selectedClip
            ? `${clock(selectedClip.timelineStartSeconds)}–${clock(selectedClip.timelineEndSeconds)} · source preserved`
            : "Select a clip"}
        </span>
      </div>

      <div className="grid grid-cols-[220px_minmax(0,1fr)]">
        <div className="border-r border-white/10 bg-[#0a0a0a]">
          <div className="h-12 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-white/35">Tracks</div>
          {lanes.map((lane, index) => {
            const track = trackById.get(lane.trackId);
            return (
              <div key={lane.trackId} className={`h-28 border-b border-white/10 p-3 ${lane.selected ? "bg-cyan-300/10" : ""}`}>
                <button type="button" onClick={() => updateLane(lane.trackId, { selected: true })}
                  className="block w-full truncate text-left text-sm font-black">
                  {track?.title || lane.trackId}
                </button>
                <p className="mt-1 truncate text-xs text-white/40">{track?.artist || "Project audio"} · Audio {index + 1}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <button type="button" aria-pressed={lane.muted} onClick={() => updateLane(lane.trackId, { muted: !lane.muted })}
                    className={`rounded px-2 py-1 text-[10px] font-black ${lane.muted ? "bg-amber-300 text-black" : "bg-white/10"}`}>M</button>
                  <button type="button" aria-pressed={lane.soloed} onClick={() => updateLane(lane.trackId, { soloed: !lane.soloed })}
                    className={`rounded px-2 py-1 text-[10px] font-black ${lane.soloed ? "bg-emerald-300 text-black" : "bg-white/10"}`}>S</button>
                  <button type="button" disabled={index === 0} onClick={() => setLanes((value) => moveTimelineLane(value, lane.trackId, -1))}
                    className="ml-auto rounded bg-white/10 px-2 py-1 text-[10px] font-black disabled:opacity-25" aria-label={`Move ${track?.title || lane.trackId} up`}>↑</button>
                  <button type="button" disabled={index === lanes.length - 1} onClick={() => setLanes((value) => moveTimelineLane(value, lane.trackId, 1))}
                    className="rounded bg-white/10 px-2 py-1 text-[10px] font-black disabled:opacity-25" aria-label={`Move ${track?.title || lane.trackId} down`}>↓</button>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={scrollerRef} className="overflow-x-auto" onScroll={() => setFollow(false)}>
          <div style={{ width: canvasWidth }} className="relative min-w-full">
            <div className="relative h-12 border-b border-white/10 bg-[#0a0a0a]">
              {ruler.map((mark) => (
                <div key={mark.seconds} className="absolute inset-y-0 border-l border-white/15" style={{ left: `${mark.leftPercent}%` }}>
                  <span className={`ml-1 font-mono text-[10px] ${mark.major ? "text-cyan-200" : "text-white/35"}`}>{mark.label}</span>
                </div>
              ))}
            </div>
            {lanes.map((lane, laneIndex) => {
              const track = trackById.get(lane.trackId);
              const audible = !lane.muted && (!anySoloed || lane.soloed);
              const laneClips = clips.filter((clip) => clip.trackId === lane.trackId);
              return (
                <div key={lane.trackId} className={`relative h-28 border-b border-white/10 ${lane.selected ? "bg-cyan-300/[0.04]" : "bg-white/[0.02]"}`}>
                  {laneClips.map((clip) => {
                    const bars = createTimelineWaveformBars(`${session.id}:${clip.id}`, 80);
                    const left = timelinePlayheadPercent(clip.timelineStartSeconds, duration);
                    const right = timelinePlayheadPercent(clip.timelineEndSeconds, duration);
                    return (
                      <button
                        key={clip.id}
                        type="button"
                        onClick={() => {
                          setClips((value) => selectTimelineClip(value, clip.id));
                          updateLane(lane.trackId, { selected: true });
                        }}
                        className={`absolute inset-y-3 overflow-hidden rounded-xl border text-left ${
                          clip.selected
                            ? "z-10 border-rose-300 bg-rose-300/15 ring-2 ring-rose-300/30"
                            : audible
                              ? "border-cyan-300/25 bg-cyan-300/10"
                              : "border-white/10 bg-white/[0.03] opacity-45"
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(0.25, right - left)}%`,
                        }}
                        aria-label={`Select ${track?.title || lane.trackId} clip from ${clock(clip.timelineStartSeconds)} to ${clock(clip.timelineEndSeconds)}`}
                      >
                        <span className="flex h-full items-center gap-px px-2" aria-hidden="true">
                          {bars.map((height, index) => (
                            <span key={index} className={`min-w-px flex-1 rounded-full ${laneIndex % 2 ? "bg-violet-200/70" : "bg-cyan-200/75"}`} style={{ height: `${height}%` }} />
                          ))}
                        </span>
                        <span className="absolute left-2 top-2 max-w-[80%] truncate rounded bg-black/65 px-2 py-1 text-[10px] font-black text-cyan-100">
                          {track?.title || lane.trackId}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            <div className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.9)]" style={{ left: `${playhead}%` }}>
              <span className="absolute -left-6 top-1 rounded bg-rose-400 px-1.5 py-0.5 font-mono text-[9px] font-black text-black">{clock(elapsed)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3 text-xs text-white/35">
        <span>{clips.length} non-destructive {clips.length === 1 ? "clip" : "clips"} · edits and lane order saved on this device</span>
        <span className="font-mono">{clock(elapsed)} / {clock(duration)}</span>
      </div>
    </section>
  );
}
