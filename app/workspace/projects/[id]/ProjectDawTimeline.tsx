"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import { listLinkedProjectTrackIds } from "../../../../lib/projectTracksApi";
import {
  addTimelineClip,
  archiveSelectedTimelineClips,
  clampTimelineZoom,
  createTimelineRulerMarks,
  createTimelineWaveformBars,
  moveSelectedTimelineClips,
  moveTimelineLane,
  reconcileTimelineClips,
  reconcileTimelineLanes,
  restoreTimelineClip,
  selectTimelineClip,
  snapTimelineSeconds,
  splitTimelineClip,
  timelineCanvasWidth,
  timelinePlayheadPercent,
  timelineSecondsFromPixels,
  toggleTimelineClipSelection,
  trimTimelineClip,
  type TimelineDawClipState,
  type TimelineDawLaneState,
} from "../../../../lib/timeline/TimelineDawMultitrackViewModel";
import { getUploadedTracks } from "../../../../lib/uploadedTracks";
import type { DawSession } from "./projectDawTypes";

type Track = { id: string; title?: string | null; artist?: string | null };
type PlayheadDetail = { sessionId: string; elapsed: number; duration: number };
type ClipDrag = {
  clipId: string;
  mode: "move" | "trim-start" | "trim-end";
  originX: number;
  originClips: TimelineDawClipState[];
};

function clock(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

export default function ProjectDawTimeline({ session }: { session: DawSession }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const clipDragRef = useRef<ClipDrag | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [lanes, setLanes] = useState<TimelineDawLaneState[]>([]);
  const [clips, setClips] = useState<TimelineDawClipState[]>([]);
  const [clipHistory, setClipHistory] = useState<TimelineDawClipState[][]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(180);
  const [zoom, setZoom] = useState(1);
  const [follow, setFollow] = useState(true);
  const [snapSeconds, setSnapSeconds] = useState(1);
  const storageKey = `muzes:daw-timeline-lanes:v2:${session.id}`;
  const clipStorageKey = `muzes:daw-timeline-clips:v1:${session.id}`;
  const snapStorageKey = `muzes:daw-timeline-snap:v1:${session.id}`;
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
    const raw = localStorage.getItem(snapStorageKey);
    if (raw === null) return;
    const saved = Number(raw);
    if ([0, 0.25, 0.5, 1, 5].includes(saved)) setSnapSeconds(saved);
  }, [snapStorageKey]);

  useEffect(() => {
    localStorage.setItem(snapStorageKey, String(snapSeconds));
  }, [snapSeconds, snapStorageKey]);

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

  const selectedClips = clips.filter((clip) => clip.selected && !clip.archived);
  const selectedClip = selectedClips[0] ?? null;
  const archivedClips = clips.filter((clip) => clip.archived);
  const editStep = snapSeconds || (zoom >= 4 ? 0.25 : zoom >= 2 ? 0.5 : 1);

  function applyClipEdit(
    edit: (current: TimelineDawClipState[]) => TimelineDawClipState[],
  ) {
    const snapshot = clips.map((clip) => ({ ...clip }));
    setClipHistory((history) => [...history.slice(-19), snapshot]);
    setClips(edit(clips));
  }

  function editSelected(action: "move-left" | "move-right" | "trim-start" | "trim-end" | "split") {
    if (!selectedClip) return;
    if (action === "move-left") {
      applyClipEdit((value) => moveSelectedTimelineClips(value, -editStep));
    } else if (action === "move-right") {
      applyClipEdit((value) => moveSelectedTimelineClips(value, editStep));
    } else if (action === "trim-start") {
      applyClipEdit((value) => trimTimelineClip(value, selectedClip.id, "start", editStep));
    } else if (action === "trim-end") {
      applyClipEdit((value) => trimTimelineClip(value, selectedClip.id, "end", -editStep));
    } else {
      applyClipEdit((value) => splitTimelineClip(
        value,
        selectedClip.id,
        snapTimelineSeconds(elapsed, snapSeconds),
      ));
    }
  }

  function addClip() {
    const trackId = lanes.find((lane) => lane.selected)?.trackId ?? session.songId;
    applyClipEdit((value) => addTimelineClip(value, {
      trackId,
      timelineStartSeconds: snapTimelineSeconds(elapsed, snapSeconds),
      durationSeconds: Math.min(8, Math.max(0.25, duration - elapsed)),
    }));
  }

  function undoClipEdit() {
    setClipHistory((history) => {
      const previous = history.at(-1);
      if (previous) setClips(previous.map((clip) => ({ ...clip })));
      return history.slice(0, -1);
    });
  }

  function startClipDrag(
    event: ReactPointerEvent<HTMLDivElement>,
    clipId: string,
    mode: ClipDrag["mode"],
    trackId: string,
  ) {
    if (event.button !== 0) return;
    event.preventDefault();
    if (mode === "move" && (event.ctrlKey || event.metaKey)) {
      setClips((value) => toggleTimelineClipSelection(value, clipId));
      updateLane(trackId, { selected: true });
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const clickedClip = clips.find((clip) => clip.id === clipId);
    const originClips = clickedClip?.selected
      ? clips.map((clip) => ({ ...clip }))
      : selectTimelineClip(clips, clipId);
    clipDragRef.current = { clipId, mode, originX: event.clientX, originClips };
    setClipHistory((history) => [...history.slice(-19), originClips]);
    setClips(originClips);
    updateLane(trackId, { selected: true });
    setFollow(false);
  }

  function continueClipDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = clipDragRef.current;
    if (!drag) return;
    const rawDelta = timelineSecondsFromPixels(
      event.clientX - drag.originX,
      canvasWidth,
      duration,
    );
    const originClip = drag.originClips.find((clip) => clip.id === drag.clipId);
    const anchor = drag.mode === "trim-end"
      ? originClip?.timelineEndSeconds
      : originClip?.timelineStartSeconds;
    const deltaSeconds = anchor === undefined
      ? rawDelta
      : snapTimelineSeconds(anchor + rawDelta, snapSeconds) - anchor;
    if (drag.mode === "move") {
      setClips(moveSelectedTimelineClips(drag.originClips, deltaSeconds));
    } else {
      setClips(trimTimelineClip(
        drag.originClips,
        drag.clipId,
        drag.mode === "trim-start" ? "start" : "end",
        deltaSeconds,
      ));
    }
  }

  function finishClipDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!clipDragRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    clipDragRef.current = null;
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable
        || target?.tagName === "INPUT"
        || target?.tagName === "TEXTAREA"
        || target?.tagName === "SELECT"
      ) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoClipEdit();
        return;
      }
      if (event.ctrlKey || event.metaKey) return;
      if (!selectedClip) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        if (event.altKey) {
          applyClipEdit((value) => trimTimelineClip(
            value,
            selectedClip.id,
            "start",
            direction * editStep,
          ));
        } else if (event.shiftKey) {
          applyClipEdit((value) => trimTimelineClip(
            value,
            selectedClip.id,
            "end",
            direction * editStep,
          ));
        } else {
          applyClipEdit((value) => moveSelectedTimelineClips(value, direction * editStep));
        }
      } else if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        editSelected("split");
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        applyClipEdit(archiveSelectedTimelineClips);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

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
          <label className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-black">
            <span className="text-white/45">Snap</span>
            <select
              value={snapSeconds}
              onChange={(event) => setSnapSeconds(Number(event.target.value))}
              className="bg-transparent text-cyan-200 outline-none"
              aria-label="Timeline snap grid"
            >
              <option className="bg-black" value={0}>Off</option>
              <option className="bg-black" value={0.25}>0.25s</option>
              <option className="bg-black" value={0.5}>0.5s</option>
              <option className="bg-black" value={1}>1s</option>
              <option className="bg-black" value={5}>5s</option>
            </select>
          </label>
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
        <button type="button" onClick={addClip}
          className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-black">
          Add Clip
        </button>
        <button type="button" disabled={!selectedClip} onClick={() => applyClipEdit(archiveSelectedTimelineClips)}
          className="rounded-lg border border-amber-300/40 px-3 py-2 text-xs font-black text-amber-200 disabled:opacity-30">
          Archive{selectedClips.length > 1 ? ` ${selectedClips.length}` : ""}
        </button>
        <button type="button" disabled={!clipHistory.length} onClick={undoClipEdit}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-30">
          Undo
        </button>
        <span className="ml-auto font-mono text-xs text-white/40">
          {selectedClip
            ? selectedClips.length > 1
              ? `${selectedClips.length} clips selected · grouped movement`
              : `${clock(selectedClip.timelineStartSeconds)}–${clock(selectedClip.timelineEndSeconds)} · source preserved`
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
              const laneClips = clips.filter((clip) => clip.trackId === lane.trackId && !clip.archived);
              return (
                <div key={lane.trackId} className={`relative h-28 border-b border-white/10 ${lane.selected ? "bg-cyan-300/[0.04]" : "bg-white/[0.02]"}`}>
                  {laneClips.map((clip) => {
                    const bars = createTimelineWaveformBars(`${session.id}:${clip.id}`, 80);
                    const left = timelinePlayheadPercent(clip.timelineStartSeconds, duration);
                    const right = timelinePlayheadPercent(clip.timelineEndSeconds, duration);
                    return (
                      <div
                        key={clip.id}
                        role="button"
                        tabIndex={0}
                        onPointerDown={(event) => startClipDrag(event, clip.id, "move", lane.trackId)}
                        onPointerMove={continueClipDrag}
                        onPointerUp={finishClipDrag}
                        onPointerCancel={finishClipDrag}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setClips((value) => selectTimelineClip(value, clip.id));
                            updateLane(lane.trackId, { selected: true });
                          }
                        }}
                        className={`absolute inset-y-3 touch-none overflow-hidden rounded-xl border text-left ${
                          clip.selected
                            ? "z-10 cursor-grab border-rose-300 bg-rose-300/15 ring-2 ring-rose-300/30 active:cursor-grabbing"
                            : audible
                              ? "cursor-grab border-cyan-300/25 bg-cyan-300/10 active:cursor-grabbing"
                              : "border-white/10 bg-white/[0.03] opacity-45"
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(0.25, right - left)}%`,
                        }}
                        aria-label={`Select ${track?.title || lane.trackId} clip from ${clock(clip.timelineStartSeconds)} to ${clock(clip.timelineEndSeconds)}`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 z-20 w-3 cursor-ew-resize border-r border-white/30 bg-black/25 hover:bg-rose-300/40"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            startClipDrag(event, clip.id, "trim-start", lane.trackId);
                          }}
                          onPointerMove={continueClipDrag}
                          onPointerUp={finishClipDrag}
                          onPointerCancel={finishClipDrag}
                          aria-hidden="true"
                        />
                        <span className="pointer-events-none flex h-full items-center gap-px px-3" aria-hidden="true">
                          {bars.map((height, index) => (
                            <span key={index} className={`min-w-px flex-1 rounded-full ${laneIndex % 2 ? "bg-violet-200/70" : "bg-cyan-200/75"}`} style={{ height: `${height}%` }} />
                          ))}
                        </span>
                        <span className="pointer-events-none absolute left-4 top-2 max-w-[75%] truncate rounded bg-black/65 px-2 py-1 text-[10px] font-black text-cyan-100">
                          {track?.title || lane.trackId}
                        </span>
                        <div
                          className="absolute inset-y-0 right-0 z-20 w-3 cursor-ew-resize border-l border-white/30 bg-black/25 hover:bg-rose-300/40"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            startClipDrag(event, clip.id, "trim-end", lane.trackId);
                          }}
                          onPointerMove={continueClipDrag}
                          onPointerUp={finishClipDrag}
                          onPointerCancel={finishClipDrag}
                          aria-hidden="true"
                        />
                      </div>
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
        <span>{clips.length - archivedClips.length} active · {archivedClips.length} archived · edits and lane order saved on this device</span>
        <span className="font-mono">{clock(elapsed)} / {clock(duration)}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 bg-white/[0.02] px-5 py-2 text-[10px] font-bold uppercase tracking-wide text-white/30">
        <span>Ctrl/Cmd + click: multiselect</span>
        <span>Arrow: move</span>
        <span>Shift + Arrow: trim end</span>
        <span>Alt + Arrow: trim start</span>
        <span>S: split</span>
        <span>Delete: archive</span>
        <span>Ctrl/Cmd + Z: undo</span>
      </div>
      {archivedClips.length ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-amber-300/[0.04] px-5 py-3">
          <span className="text-xs font-black uppercase tracking-wider text-amber-200">Clip archive</span>
          {archivedClips.map((clip) => (
            <button
              key={clip.id}
              type="button"
              onClick={() => applyClipEdit((value) => restoreTimelineClip(value, clip.id))}
              className="rounded-lg border border-amber-300/25 px-3 py-1.5 text-xs font-bold text-amber-100"
            >
              Restore {trackById.get(clip.trackId)?.title || clip.trackId} {clock(clip.timelineStartSeconds)}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
