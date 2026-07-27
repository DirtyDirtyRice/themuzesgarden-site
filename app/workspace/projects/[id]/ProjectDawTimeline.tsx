"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import { listLinkedProjectTrackIds } from "../../../../lib/projectTracksApi";
import {
  addTimelineClip,
  addTimelineAutomationPoint,
  addTimelineMarker,
  archiveTimelineMarker,
  archiveTimelineAutomationPoint,
  archiveSelectedTimelineClips,
  clampTimelineZoom,
  copySelectedTimelineClips,
  createTimelineRulerMarks,
  createTimelineSections,
  createTimelineCrossfades,
  createTimelineWaveformBars,
  duplicateSelectedTimelineClips,
  moveSelectedTimelineClips,
  moveTimelineAutomationPoint,
  moveTimelineLane,
  normalizeTimelineLoopRegion,
  pasteTimelineClips,
  reconcileTimelineClips,
  reconcileTimelineLanes,
  reconcileTimelineMarkers,
  reconcileTimelineAutomation,
  restoreTimelineClip,
  restoreTimelineMarker,
  renameTimelineMarker,
  selectTimelineClip,
  selectTimelineMarker,
  selectTimelineAutomationPoint,
  snapTimelineSeconds,
  setTimelineClipFade,
  splitTimelineClip,
  timelineCanvasWidth,
  timelinePlayheadPercent,
  timelineSecondsFromPixels,
  timelineAutomationValueAt,
  timelineLaneMeterLevel,
  toggleTimelineClipSelection,
  trimTimelineClip,
  type TimelineDawClipState,
  type TimelineDawLaneState,
  type TimelineDawMarkerState,
  type TimelineDawAutomationParameter,
  type TimelineDawAutomationPoint,
} from "../../../../lib/timeline/TimelineDawMultitrackViewModel";
import { getUploadedTracks } from "../../../../lib/uploadedTracks";
import type { DawSession } from "./projectDawTypes";

type Track = { id: string; title?: string | null; artist?: string | null };
type PlayheadDetail = { sessionId: string; elapsed: number; duration: number };
type LoopDetail = {
  sessionId: string;
  enabled: boolean;
  startSeconds: number;
  endSeconds: number;
};
type ClipDrag = {
  clipId: string;
  mode: "move" | "trim-start" | "trim-end" | "fade-in" | "fade-out";
  originX: number;
  originClips: TimelineDawClipState[];
};
type AutomationDrag = {
  pointId: string;
  originX: number;
  originY: number;
  originPoint: TimelineDawAutomationPoint;
  originPoints: TimelineDawAutomationPoint[];
};

function clock(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

export default function ProjectDawTimeline({ session }: { session: DawSession }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const clipDragRef = useRef<ClipDrag | null>(null);
  const automationDragRef = useRef<AutomationDrag | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [lanes, setLanes] = useState<TimelineDawLaneState[]>([]);
  const [clips, setClips] = useState<TimelineDawClipState[]>([]);
  const [clipHistory, setClipHistory] = useState<TimelineDawClipState[][]>([]);
  const [clipClipboard, setClipClipboard] = useState<TimelineDawClipState[]>([]);
  const [markers, setMarkers] = useState<TimelineDawMarkerState[]>([]);
  const [automation, setAutomation] = useState<TimelineDawAutomationPoint[]>([]);
  const [automationParameter, setAutomationParameter] =
    useState<TimelineDawAutomationParameter>("volume");
  const [automationValue, setAutomationValue] = useState(0.75);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(180);
  const [zoom, setZoom] = useState(1);
  const [follow, setFollow] = useState(true);
  const [snapSeconds, setSnapSeconds] = useState(1);
  const [loop, setLoop] = useState<LoopDetail>({
    sessionId: session.id,
    enabled: false,
    startSeconds: 0,
    endSeconds: 0,
  });
  const storageKey = `muzes:daw-timeline-lanes:v2:${session.id}`;
  const clipStorageKey = `muzes:daw-timeline-clips:v1:${session.id}`;
  const snapStorageKey = `muzes:daw-timeline-snap:v1:${session.id}`;
  const markerStorageKey = `muzes:daw-timeline-markers:v1:${session.id}`;
  const automationStorageKey = `muzes:daw-timeline-automation:v1:${session.id}`;
  const canvasWidth = timelineCanvasWidth(duration, zoom);
  const playhead = timelinePlayheadPercent(elapsed, duration);
  const ruler = useMemo(() => createTimelineRulerMarks(duration, zoom), [duration, zoom]);
  const loopRegion = normalizeTimelineLoopRegion(loop.startSeconds, loop.endSeconds, duration);
  const sections = createTimelineSections(markers, duration);
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
      setMarkers(reconcileTimelineMarkers(localStorage.getItem(markerStorageKey), duration));
      setAutomation(reconcileTimelineAutomation(
        localStorage.getItem(automationStorageKey),
        linkedIds,
        duration,
      ));
    })();
    return () => { current = false; };
  }, [
    automationStorageKey,
    clipStorageKey,
    duration,
    markerStorageKey,
    session.projectId,
    session.songId,
    storageKey,
  ]);

  useEffect(() => {
    if (lanes.length) localStorage.setItem(storageKey, JSON.stringify(lanes));
  }, [lanes, storageKey]);

  useEffect(() => {
    if (clips.length) localStorage.setItem(clipStorageKey, JSON.stringify(clips));
  }, [clipStorageKey, clips]);

  useEffect(() => {
    if (markers.length) localStorage.setItem(markerStorageKey, JSON.stringify(markers));
  }, [markerStorageKey, markers]);

  useEffect(() => {
    if (automation.length) {
      localStorage.setItem(automationStorageKey, JSON.stringify(automation));
    }
  }, [automation, automationStorageKey]);

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
    const update = (event: Event) => {
      const detail = (event as CustomEvent<LoopDetail>).detail;
      if (!detail || detail.sessionId !== session.id) return;
      setLoop(detail);
    };
    window.addEventListener("muzes:daw-loop", update);
    return () => window.removeEventListener("muzes:daw-loop", update);
  }, [session.id]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!follow || !scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    const target = (playhead / 100) * scroller.scrollWidth - scroller.clientWidth * 0.35;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [follow, playhead]);

  useEffect(() => {
    const primaryLane = lanes.find((lane) => lane.trackId === session.songId);
    const audible = primaryLane
      ? !primaryLane.muted && (!anySoloed || primaryLane.soloed)
      : true;
    const automatedVolume = timelineAutomationValueAt(
      automation, session.songId, "volume", elapsed,
    );
    const automatedPan = timelineAutomationValueAt(
      automation, session.songId, "pan", elapsed,
    );
    window.dispatchEvent(new CustomEvent("muzes:daw-automation-frame", {
      detail: {
        sessionId: session.id,
        trackId: session.songId,
        volume: audible ? (primaryLane?.volume ?? 1) * (automatedVolume ?? 1) : 0,
        pan: Math.min(1, Math.max(-1, (primaryLane?.pan ?? 0) + (automatedPan ?? 0))),
      },
    }));
  }, [anySoloed, automation, elapsed, lanes, session.id, session.songId]);

  function updateLane(trackId: string, patch: Partial<TimelineDawLaneState>) {
    setLanes((current) => current.map((lane) => lane.trackId === trackId
      ? { ...lane, ...patch }
      : patch.selected ? { ...lane, selected: false } : lane));
  }

  const selectedClips = clips.filter((clip) => clip.selected && !clip.archived);
  const selectedClip = selectedClips[0] ?? null;
  const archivedClips = clips.filter((clip) => clip.archived);
  const selectedMarker = markers.find((marker) => marker.selected && !marker.archived) ?? null;
  const archivedMarkers = markers.filter((marker) => marker.archived);
  const selectedAutomation = automation.find((point) => point.selected && !point.archived) ?? null;
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

  function copyClips() {
    const copied = copySelectedTimelineClips(clips);
    if (copied.length) setClipClipboard(copied);
  }

  function pasteClips() {
    if (!clipClipboard.length) return;
    applyClipEdit((value) => pasteTimelineClips(
      value,
      clipClipboard,
      snapTimelineSeconds(elapsed, snapSeconds),
    ));
  }

  function duplicateClips() {
    if (!selectedClips.length) return;
    applyClipEdit((value) => duplicateSelectedTimelineClips(value, editStep));
  }

  function sendLoopCommand(action: "set-start" | "set-end" | "toggle") {
    window.dispatchEvent(new CustomEvent("muzes:daw-loop-command", {
      detail: { sessionId: session.id, action },
    }));
  }

  function addMarker() {
    setMarkers((value) => addTimelineMarker(
      value,
      snapTimelineSeconds(elapsed, snapSeconds),
      duration,
    ));
  }

  function locateMarker(marker: TimelineDawMarkerState) {
    setMarkers((value) => selectTimelineMarker(value, marker.id));
    window.dispatchEvent(new CustomEvent("muzes:daw-locate-command", {
      detail: { sessionId: session.id, seconds: marker.seconds },
    }));
  }

  function writeAutomationPoint() {
    const trackId = lanes.find((lane) => lane.selected)?.trackId ?? session.songId;
    setAutomation((value) => addTimelineAutomationPoint(value, {
      trackId,
      parameter: automationParameter,
      seconds: snapTimelineSeconds(elapsed, snapSeconds),
      value: automationValue,
      durationSeconds: duration,
    }));
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
      : drag.mode === "fade-in"
        ? originClip?.fadeInSeconds
        : drag.mode === "fade-out"
          ? originClip?.fadeOutSeconds
      : originClip?.timelineStartSeconds;
    const deltaSeconds = anchor === undefined
      ? rawDelta
      : snapTimelineSeconds(anchor + rawDelta, snapSeconds) - anchor;
    if (drag.mode === "move") {
      setClips(moveSelectedTimelineClips(drag.originClips, deltaSeconds));
    } else if (drag.mode === "fade-in" || drag.mode === "fade-out") {
      const originFade = drag.mode === "fade-in"
        ? originClip?.fadeInSeconds ?? 0
        : originClip?.fadeOutSeconds ?? 0;
      const nextFade = drag.mode === "fade-in"
        ? originFade + rawDelta
        : originFade - rawDelta;
      setClips(setTimelineClipFade(
        drag.originClips,
        drag.clipId,
        drag.mode === "fade-in" ? "in" : "out",
        nextFade,
      ));
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

  function startAutomationDrag(
    event: ReactPointerEvent<HTMLButtonElement>,
    point: TimelineDawAutomationPoint,
  ) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const originPoints = selectTimelineAutomationPoint(automation, point.id);
    automationDragRef.current = {
      pointId: point.id,
      originX: event.clientX,
      originY: event.clientY,
      originPoint: { ...point },
      originPoints,
    };
    setAutomation(originPoints);
    setAutomationValue(point.value);
    updateLane(point.trackId, { selected: true });
    setFollow(false);
  }

  function continueAutomationDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = automationDragRef.current;
    if (!drag) return;
    const seconds = snapTimelineSeconds(
      drag.originPoint.seconds + timelineSecondsFromPixels(
        event.clientX - drag.originX,
        canvasWidth,
        duration,
      ),
      snapSeconds,
    );
    const valueScale = drag.originPoint.parameter === "volume" ? 72 : 36;
    const value = drag.originPoint.value - (event.clientY - drag.originY) / valueScale;
    const next = moveTimelineAutomationPoint(drag.originPoints, drag.pointId, {
      seconds,
      value,
      durationSeconds: duration,
    });
    setAutomation(next);
    setAutomationValue(next.find((point) => point.id === drag.pointId)?.value ?? value);
  }

  function finishAutomationDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!automationDragRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    automationDragRef.current = null;
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
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === "z") {
          event.preventDefault();
          undoClipEdit();
        } else if (key === "c" && selectedClip) {
          event.preventDefault();
          copyClips();
        } else if (key === "v" && clipClipboard.length) {
          event.preventDefault();
          pasteClips();
        } else if (key === "d" && selectedClip) {
          event.preventDefault();
          duplicateClips();
        }
        return;
      }
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
          <button
            type="button"
            onClick={() => sendLoopCommand("set-start")}
            className="rounded-lg border border-violet-300/30 px-3 py-2 text-xs font-black text-violet-100"
          >
            Loop In
          </button>
          <button
            type="button"
            onClick={() => sendLoopCommand("set-end")}
            className="rounded-lg border border-violet-300/30 px-3 py-2 text-xs font-black text-violet-100"
          >
            Loop Out
          </button>
          <button
            type="button"
            disabled={!loopRegion}
            onClick={() => sendLoopCommand("toggle")}
            aria-pressed={loop.enabled}
            className={`rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-30 ${
              loop.enabled
                ? "border-violet-300 bg-violet-300 text-black"
                : "border-white/15 text-white/60"
            }`}
          >
            Repeat {loop.enabled ? "On" : "Off"}
          </button>
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
        <button type="button" disabled={!selectedClip} onClick={duplicateClips}
          className="rounded-lg border border-cyan-300/35 px-3 py-2 text-xs font-black text-cyan-100 disabled:opacity-30">
          Duplicate{selectedClips.length > 1 ? ` ${selectedClips.length}` : ""}
        </button>
        <button type="button" disabled={!selectedClip} onClick={copyClips}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black disabled:opacity-30">
          Copy
        </button>
        <button type="button" disabled={!clipClipboard.length} onClick={pasteClips}
          className="rounded-lg border border-violet-300/35 px-3 py-2 text-xs font-black text-violet-100 disabled:opacity-30">
          Paste{clipClipboard.length ? ` ${clipClipboard.length}` : ""}
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

      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-violet-300/[0.035] px-5 py-3">
        <span className="mr-1 text-xs font-black uppercase tracking-wider text-violet-200/70">
          Arrangement
        </span>
        <button
          type="button"
          onClick={addMarker}
          className="rounded-lg bg-violet-300 px-3 py-2 text-xs font-black text-black"
        >
          Add Marker
        </button>
        {selectedMarker ? (
          <>
            <input
              key={selectedMarker.id}
              defaultValue={selectedMarker.label}
              onBlur={(event) => setMarkers((value) => renameTimelineMarker(
                value,
                selectedMarker.id,
                event.target.value,
              ))}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              aria-label="Selected arrangement section name"
              className="w-36 rounded-lg border border-white/15 bg-black px-3 py-2 text-xs font-bold text-white outline-none focus:border-violet-300"
            />
            <button
              type="button"
              onClick={() => locateMarker(selectedMarker)}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black"
            >
              Go to {clock(selectedMarker.seconds)}
            </button>
            <button
              type="button"
              onClick={() => setMarkers((value) => archiveTimelineMarker(value, selectedMarker.id))}
              className="rounded-lg border border-amber-300/35 px-3 py-2 text-xs font-black text-amber-100"
            >
              Archive Marker
            </button>
          </>
        ) : (
          <span className="text-xs text-white/35">Add or select a section marker</span>
        )}
        <span className="ml-auto text-xs text-white/35">
          {sections.length} named {sections.length === 1 ? "section" : "sections"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-emerald-300/[0.035] px-5 py-3">
        <span className="text-xs font-black uppercase tracking-wider text-emerald-200/75">
          Automation
        </span>
        <select
          value={automationParameter}
          onChange={(event) => {
            const parameter = event.target.value as TimelineDawAutomationParameter;
            setAutomationParameter(parameter);
            setAutomationValue(parameter === "volume" ? 0.75 : 0);
          }}
          className="rounded-lg border border-white/15 bg-black px-3 py-2 text-xs font-black text-emerald-100"
          aria-label="Automation parameter"
        >
          <option value="volume">Volume</option>
          <option value="pan">Pan</option>
        </select>
        <input
          type="range"
          min={automationParameter === "volume" ? 0 : -1}
          max={1}
          step={0.01}
          value={automationValue}
          onChange={(event) => setAutomationValue(Number(event.target.value))}
          className="w-40 accent-emerald-300"
          aria-label={`${automationParameter} automation value`}
        />
        <span className="w-14 font-mono text-xs text-emerald-100">
          {automationParameter === "volume"
            ? `${Math.round(automationValue * 100)}%`
            : automationValue === 0
              ? "Center"
              : `${automationValue < 0 ? "L" : "R"}${Math.round(Math.abs(automationValue) * 100)}`}
        </span>
        <button
          type="button"
          onClick={writeAutomationPoint}
          className="rounded-lg bg-emerald-300 px-3 py-2 text-xs font-black text-black"
        >
          Write at Playhead
        </button>
        {selectedAutomation ? (
          <button
            type="button"
            onClick={() => setAutomation((value) =>
              archiveTimelineAutomationPoint(value, selectedAutomation.id))}
            className="rounded-lg border border-amber-300/35 px-3 py-2 text-xs font-black text-amber-100"
          >
            Remove Point
          </button>
        ) : null}
        <span className="ml-auto text-xs text-white/35">
          {automation.filter((point) => !point.archived).length} active points
        </span>
      </div>

      <div className="grid grid-cols-[220px_minmax(0,1fr)]">
        <div className="border-r border-white/10 bg-[#0a0a0a]">
          <div className="h-12 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-white/35">Tracks</div>
          {lanes.map((lane, index) => {
            const track = trackById.get(lane.trackId);
            const automatedValue = timelineAutomationValueAt(
              automation,
              lane.trackId,
              automationParameter,
              elapsed,
            );
            const audible = !lane.muted && (!anySoloed || lane.soloed);
            const meterLevel = timelineLaneMeterLevel(
              lane.trackId,
              elapsed,
              lane.volume,
              audible,
            );
            return (
              <div key={lane.trackId} className={`relative h-28 border-b border-white/10 p-3 pr-6 ${lane.selected ? "bg-cyan-300/10" : ""}`}>
                <div className="absolute bottom-3 right-2 top-3 w-2 overflow-hidden rounded-full bg-black/70" aria-label={`${Math.round(meterLevel * 100)} percent level`}>
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-emerald-400 via-amber-300 to-rose-400 transition-[height] duration-100"
                    style={{ height: `${meterLevel * 100}%` }}
                  />
                </div>
                <button type="button" onClick={() => updateLane(lane.trackId, { selected: true })}
                  className="block w-full truncate text-left text-sm font-black">
                  {track?.title || lane.trackId}
                </button>
                <p className="mt-1 truncate text-xs text-white/40">{track?.artist || "Project audio"} · Audio {index + 1}</p>
                {automatedValue !== null ? (
                  <p className="mt-1 font-mono text-[10px] text-emerald-200/70">
                    {automationParameter === "volume"
                      ? `VOL ${Math.round(automatedValue * 100)}%`
                      : `PAN ${automatedValue === 0 ? "C" : `${automatedValue < 0 ? "L" : "R"}${Math.round(Math.abs(automatedValue) * 100)}`}`}
                  </p>
                ) : null}
                <div className={`${automatedValue === null ? "mt-1" : "mt-0.5"} flex items-center gap-1.5`}>
                  <button type="button" aria-pressed={lane.muted} onClick={() => updateLane(lane.trackId, { muted: !lane.muted })}
                    className={`rounded px-2 py-1 text-[10px] font-black ${lane.muted ? "bg-amber-300 text-black" : "bg-white/10"}`}>M</button>
                  <button type="button" aria-pressed={lane.soloed} onClick={() => updateLane(lane.trackId, { soloed: !lane.soloed })}
                    className={`rounded px-2 py-1 text-[10px] font-black ${lane.soloed ? "bg-emerald-300 text-black" : "bg-white/10"}`}>S</button>
                  <button type="button" disabled={index === 0} onClick={() => setLanes((value) => moveTimelineLane(value, lane.trackId, -1))}
                    className="ml-auto rounded bg-white/10 px-2 py-1 text-[10px] font-black disabled:opacity-25" aria-label={`Move ${track?.title || lane.trackId} up`}>↑</button>
                  <button type="button" disabled={index === lanes.length - 1} onClick={() => setLanes((value) => moveTimelineLane(value, lane.trackId, 1))}
                    className="rounded bg-white/10 px-2 py-1 text-[10px] font-black disabled:opacity-25" aria-label={`Move ${track?.title || lane.trackId} down`}>↓</button>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="w-7 font-mono text-[9px] text-white/35">VOL</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={lane.volume}
                    onChange={(event) => updateLane(lane.trackId, { volume: Number(event.target.value) })}
                    className="w-16 accent-cyan-300"
                    aria-label={`${track?.title || lane.trackId} mixer volume`}
                  />
                  <span className="w-7 font-mono text-[9px] text-white/45">{Math.round(lane.volume * 100)}</span>
                  <span className="font-mono text-[9px] text-white/35">PAN</span>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={lane.pan}
                    onChange={(event) => updateLane(lane.trackId, { pan: Number(event.target.value) })}
                    className="w-12 accent-violet-300"
                    aria-label={`${track?.title || lane.trackId} mixer pan`}
                  />
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
              {sections.map((section, index) => (
                <button
                  key={section.markerId}
                  type="button"
                  onClick={() => {
                    const marker = markers.find((value) => value.id === section.markerId);
                    if (marker) locateMarker(marker);
                  }}
                  className={`absolute bottom-0 h-5 overflow-hidden border-x px-1 text-left text-[9px] font-black ${
                    index % 2
                      ? "border-fuchsia-200/30 bg-fuchsia-300/15 text-fuchsia-100"
                      : "border-violet-200/30 bg-violet-300/15 text-violet-100"
                  }`}
                  style={{
                    left: `${section.startPercent}%`,
                    width: `${section.widthPercent}%`,
                  }}
                  title={`${section.label}: ${clock(section.startSeconds)}–${clock(section.endSeconds)}`}
                >
                  <span className="block truncate">{section.label}</span>
                </button>
              ))}
            </div>
            {lanes.map((lane, laneIndex) => {
              const track = trackById.get(lane.trackId);
              const audible = !lane.muted && (!anySoloed || lane.soloed);
              const laneClips = clips.filter((clip) => clip.trackId === lane.trackId && !clip.archived);
              const crossfades = createTimelineCrossfades(laneClips);
              const laneAutomation = automation
                .filter((point) =>
                  point.trackId === lane.trackId
                  && point.parameter === automationParameter
                  && !point.archived)
                .sort((left, right) => left.seconds - right.seconds);
              const automationTop = (value: number) => automationParameter === "volume"
                ? 88 - value * 72
                : 52 - value * 36;
              return (
                <div key={lane.trackId} className={`relative h-28 border-b border-white/10 ${lane.selected ? "bg-cyan-300/[0.04]" : "bg-white/[0.02]"}`}>
                  {crossfades.map((crossfade) => (
                    <div
                      key={`${crossfade.leftClipId}:${crossfade.rightClipId}`}
                      className="pointer-events-none absolute inset-y-3 z-[9] overflow-hidden border-x border-fuchsia-200/60 bg-fuchsia-300/15"
                      style={{
                        left: `${timelinePlayheadPercent(crossfade.startSeconds, duration)}%`,
                        width: `${timelinePlayheadPercent(crossfade.endSeconds - crossfade.startSeconds, duration)}%`,
                      }}
                      title={`Crossfade ${clock(crossfade.startSeconds)}–${clock(crossfade.endSeconds)}`}
                    >
                      <span className="absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent_48%,rgba(245,208,254,.75)_49%,rgba(245,208,254,.75)_51%,transparent_52%)]" />
                      <span className="absolute inset-0 bg-[linear-gradient(to_top_right,transparent_48%,rgba(245,208,254,.75)_49%,rgba(245,208,254,.75)_51%,transparent_52%)]" />
                    </div>
                  ))}
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
                          className="pointer-events-none absolute inset-y-0 left-0 z-[13] border-r border-cyan-100/70 bg-gradient-to-r from-black/75 to-transparent"
                          style={{ width: `${Math.min(100, (clip.fadeInSeconds / Math.max(0.25, clip.timelineEndSeconds - clip.timelineStartSeconds)) * 100)}%` }}
                        />
                        <div
                          className="pointer-events-none absolute inset-y-0 right-0 z-[13] border-l border-cyan-100/70 bg-gradient-to-l from-black/75 to-transparent"
                          style={{ width: `${Math.min(100, (clip.fadeOutSeconds / Math.max(0.25, clip.timelineEndSeconds - clip.timelineStartSeconds)) * 100)}%` }}
                        />
                        <div
                          className="absolute left-3 top-0 z-30 h-4 w-4 -translate-x-1/2 cursor-ew-resize touch-none rounded-b bg-cyan-200 text-center text-[9px] font-black text-black"
                          style={{ left: `${(clip.fadeInSeconds / Math.max(0.25, clip.timelineEndSeconds - clip.timelineStartSeconds)) * 100}%` }}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            startClipDrag(event, clip.id, "fade-in", lane.trackId);
                          }}
                          onPointerMove={continueClipDrag}
                          onPointerUp={finishClipDrag}
                          onPointerCancel={finishClipDrag}
                          title={`Fade in ${clip.fadeInSeconds.toFixed(2)}s`}
                        >F</div>
                        <div
                          className="absolute right-3 top-0 z-30 h-4 w-4 translate-x-1/2 cursor-ew-resize touch-none rounded-b bg-violet-200 text-center text-[9px] font-black text-black"
                          style={{ right: `${(clip.fadeOutSeconds / Math.max(0.25, clip.timelineEndSeconds - clip.timelineStartSeconds)) * 100}%` }}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            startClipDrag(event, clip.id, "fade-out", lane.trackId);
                          }}
                          onPointerMove={continueClipDrag}
                          onPointerUp={finishClipDrag}
                          onPointerCancel={finishClipDrag}
                          title={`Fade out ${clip.fadeOutSeconds.toFixed(2)}s`}
                        >F</div>
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
                  {laneAutomation.map((point, index) => {
                    const next = laneAutomation[index + 1];
                    const left = timelinePlayheadPercent(point.seconds, duration);
                    const top = automationTop(point.value);
                    const nextLeft = next
                      ? timelinePlayheadPercent(next.seconds, duration)
                      : left;
                    const nextTop = next ? automationTop(next.value) : top;
                    return (
                      <div key={point.id}>
                        {next ? (
                          <>
                            <div
                              className="pointer-events-none absolute z-[11] h-px bg-emerald-300/75"
                              style={{ left: `${left}%`, width: `${nextLeft - left}%`, top }}
                            />
                            <div
                              className="pointer-events-none absolute z-[11] w-px bg-emerald-300/45"
                              style={{
                                left: `${nextLeft}%`,
                                top: Math.min(top, nextTop),
                                height: Math.abs(nextTop - top),
                              }}
                            />
                          </>
                        ) : null}
                        <button
                          type="button"
                          onPointerDown={(event) => startAutomationDrag(event, point)}
                          onPointerMove={continueAutomationDrag}
                          onPointerUp={finishAutomationDrag}
                          onPointerCancel={finishAutomationDrag}
                          className={`absolute z-[12] h-3 w-3 touch-none -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border ${
                            point.selected
                              ? "border-white bg-emerald-300 ring-2 ring-emerald-300/30"
                              : "border-emerald-100 bg-emerald-500"
                          }`}
                          style={{ left: `${left}%`, top }}
                          aria-label={`Select ${automationParameter} automation point at ${clock(point.seconds)}`}
                          title={`${automationParameter} ${point.value} at ${clock(point.seconds)}`}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {loopRegion ? (
              <div
                className={`pointer-events-none absolute bottom-0 top-12 z-[5] border-x ${
                  loop.enabled
                    ? "border-violet-300/80 bg-violet-300/10"
                    : "border-violet-200/35 bg-violet-200/[0.035]"
                }`}
                style={{
                  left: `${loopRegion.startPercent}%`,
                  width: `${loopRegion.widthPercent}%`,
                }}
                aria-hidden="true"
              >
                <span className="absolute left-1 top-1 rounded bg-violet-300 px-1.5 py-0.5 font-mono text-[9px] font-black text-black">
                  LOOP {clock(loopRegion.startSeconds)}–{clock(loopRegion.endSeconds)}
                </span>
              </div>
            ) : null}
            {markers.filter((marker) => !marker.archived).map((marker) => (
              <div
                key={marker.id}
                className="pointer-events-none absolute bottom-0 top-12 z-[6] border-l border-amber-300/70"
                style={{ left: `${timelinePlayheadPercent(marker.seconds, duration)}%` }}
              >
                <button
                  type="button"
                  onClick={() => locateMarker(marker)}
                  className={`pointer-events-auto absolute left-1 top-7 max-w-28 truncate rounded px-1.5 py-1 text-[9px] font-black ${
                    marker.selected
                      ? "bg-amber-300 text-black"
                      : "border border-amber-300/40 bg-black/85 text-amber-100"
                  }`}
                  title={`Go to ${marker.label} at ${clock(marker.seconds)}`}
                >
                  {marker.label}
                </button>
              </div>
            ))}
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
        <span>Ctrl/Cmd + C/V: copy/paste</span>
        <span>Ctrl/Cmd + D: duplicate</span>
        <span>Loop In/Out: use playhead</span>
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
      {archivedMarkers.length ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-violet-300/[0.035] px-5 py-3">
          <span className="text-xs font-black uppercase tracking-wider text-violet-200">
            Marker archive
          </span>
          {archivedMarkers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              onClick={() => setMarkers((value) => restoreTimelineMarker(value, marker.id))}
              className="rounded-lg border border-violet-300/25 px-3 py-1.5 text-xs font-bold text-violet-100"
            >
              Restore {marker.label} {clock(marker.seconds)}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
