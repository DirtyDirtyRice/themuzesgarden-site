"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import { listLinkedProjectTrackIds } from "../../../../lib/projectTracksApi";
import {
  addTimelineClip,
  addTimelineLaneEffect,
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
  moveTimelineAutomationPoint,
  moveTimelineLane,
  moveTimelineLaneEffect,
  normalizeTimelineLoopRegion,
  pasteTimelineClips,
  reconcileTimelineClips,
  reconcileTimelineLanes,
  reconcileTimelineMarkers,
  reconcileTimelineAutomation,
  restoreTimelineClip,
  restoreTimelineMarker,
  renameTimelineMarker,
  removeTimelineLaneEffect,
  replaceTimelineLaneEffects,
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
  timelineMasterOutputLevel,
  timelineStereoMasterState,
  timelineReferenceMatchGain,
  parseTimelineMixSnapshotBundle,
  serializeTimelineMixSnapshotBundle,
  toggleTimelineLaneEffectBypass,
  updateTimelineLaneEffect,
  toggleTimelineClipSelection,
  trimTimelineClip,
  type TimelineDawClipState,
  type TimelineDawLaneState,
  type TimelineDawGroupId,
  type TimelineDawEffectKind,
  type TimelineDawLaneEffect,
  type TimelineDawMarkerState,
  type TimelineDawAutomationParameter,
  type TimelineDawAutomationPoint,
} from "../../../../lib/timeline/TimelineDawMultitrackViewModel";
import { getUploadedTracks } from "../../../../lib/uploadedTracks";
import {
  applyTimelineDawEditModeMove,
  timelineDawEditModeDescription,
  type TimelineDawEditMode,
} from "../../../../lib/timeline/TimelineDawEditModePolicy";
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
type TimelineGroupBus = { volume: number; muted: boolean };
type TimelineGroupBuses = Record<Exclude<TimelineDawGroupId, "none">, TimelineGroupBus>;
type MasterOverload = { id: string; seconds: number; peakDb: number };
type MixSnapshotState = {
  lanes: TimelineDawLaneState[];
  groupBuses: TimelineGroupBuses;
  reverbReturn: number;
  delayReturn: number;
  masterGain: number;
  limiterEnabled: boolean;
  limiterCeiling: number;
  masterBalance: number;
  monoCheck: boolean;
  referenceTrackId: string;
  comparisonMode: "mix" | "reference";
  referenceMatch: boolean;
};
type MixSnapshot = MixSnapshotState & {
  id: string;
  name: string;
  notes: string;
  createdAt: string;
};
type MixerHistoryEntry = {
  state: MixSnapshotState;
  label: string;
  createdAt: number;
};
type MixerCheckpoint = MixerHistoryEntry & {
  id: string;
  name: string;
  notes: string;
};

const defaultGroupBuses: TimelineGroupBuses = {
  vocals: { volume: 1, muted: false },
  music: { volume: 1, muted: false },
  drums: { volume: 1, muted: false },
};

function clock(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

export default function ProjectDawTimeline({ session }: { session: DawSession }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const clipDragRef = useRef<ClipDrag | null>(null);
  const automationDragRef = useRef<AutomationDrag | null>(null);
  const overloadActiveRef = useRef(false);
  const snapshotCompareRef = useRef<MixSnapshotState | null>(null);
  const mixerCheckpointCompareRef = useRef<MixSnapshotState | null>(null);
  const snapshotFileRef = useRef<HTMLInputElement | null>(null);
  const mixerCheckpointFileRef = useRef<HTMLInputElement | null>(null);
  const mixerLastStateRef = useRef<MixSnapshotState | null>(null);
  const mixerApplyingHistoryRef = useRef(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [lanes, setLanes] = useState<TimelineDawLaneState[]>([]);
  const [clips, setClips] = useState<TimelineDawClipState[]>([]);
  const [clipHistory, setClipHistory] = useState<TimelineDawClipState[][]>([]);
  const [clipClipboard, setClipClipboard] = useState<TimelineDawClipState[]>([]);
  const [markers, setMarkers] = useState<TimelineDawMarkerState[]>([]);
  const [automation, setAutomation] = useState<TimelineDawAutomationPoint[]>([]);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [effectClipboard, setEffectClipboard] = useState<TimelineDawLaneEffect[]>([]);
  const [reverbReturn, setReverbReturn] = useState(0.35);
  const [delayReturn, setDelayReturn] = useState(0.3);
  const [groupBuses, setGroupBuses] = useState<TimelineGroupBuses>(defaultGroupBuses);
  const [groupBusesReady, setGroupBusesReady] = useState(false);
  const [masterGain, setMasterGain] = useState(1);
  const [limiterEnabled, setLimiterEnabled] = useState(true);
  const [limiterCeiling, setLimiterCeiling] = useState(0.95);
  const [masterReady, setMasterReady] = useState(false);
  const [masterOverloads, setMasterOverloads] = useState<MasterOverload[]>([]);
  const [masterBalance, setMasterBalance] = useState(0);
  const [monoCheck, setMonoCheck] = useState(false);
  const [referenceTrackId, setReferenceTrackId] = useState("");
  const [comparisonMode, setComparisonMode] = useState<"mix" | "reference">("mix");
  const [referenceMatch, setReferenceMatch] = useState(true);
  const [mixSnapshots, setMixSnapshots] = useState<MixSnapshot[]>([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotEditName, setSnapshotEditName] = useState("");
  const [snapshotNotes, setSnapshotNotes] = useState("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [snapshotReady, setSnapshotReady] = useState(false);
  const [comparingSnapshot, setComparingSnapshot] = useState(false);
  const [snapshotTransferStatus, setSnapshotTransferStatus] = useState("");
  const [mixerUndoHistory, setMixerUndoHistory] = useState<MixerHistoryEntry[]>([]);
  const [mixerRedoHistory, setMixerRedoHistory] = useState<MixerHistoryEntry[]>([]);
  const [mixerHistorySearch, setMixerHistorySearch] = useState("");
  const [showMixerHistory, setShowMixerHistory] = useState(false);
  const [mixerCheckpoints, setMixerCheckpoints] = useState<MixerCheckpoint[]>([]);
  const [mixerCheckpointsReady, setMixerCheckpointsReady] = useState(false);
  const [mixerCheckpointTransferStatus, setMixerCheckpointTransferStatus] = useState("");
  const [comparedMixerCheckpointId, setComparedMixerCheckpointId] = useState("");
  const [expandedMixerCheckpointId, setExpandedMixerCheckpointId] = useState("");
  const [checkpointLaneSelections, setCheckpointLaneSelections] = useState<Record<string, string>>({});
  const [checkpointMultiLaneSelections, setCheckpointMultiLaneSelections] =
    useState<Record<string, string[]>>({});
  const [checkpointLaneSearches, setCheckpointLaneSearches] = useState<Record<string, string>>({});
  const [checkpointSelectedOnlyFilters, setCheckpointSelectedOnlyFilters] =
    useState<Record<string, boolean>>({});
  const [checkpointChangedOnlyFilters, setCheckpointChangedOnlyFilters] =
    useState<Record<string, boolean>>({});
  const [checkpointUnchangedOnlyFilters, setCheckpointUnchangedOnlyFilters] =
    useState<Record<string, boolean>>({});
  const [checkpointChangeSectionFilters, setCheckpointChangeSectionFilters] =
    useState<Record<string, LaneRecallSection>>({});
  const [checkpointLaneOrders, setCheckpointLaneOrders] =
    useState<Record<
      string,
      "checkpoint" | "name" | "selected" | "unselected" | "changed" | "unchanged"
    >>({});
  const [automationParameter, setAutomationParameter] =
    useState<TimelineDawAutomationParameter>("volume");
  const [automationValue, setAutomationValue] = useState(0.75);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(180);
  const [zoom, setZoom] = useState(1);
  const [follow, setFollow] = useState(true);
  const [snapSeconds, setSnapSeconds] = useState(1);
  const [editMode, setEditMode] = useState<TimelineDawEditMode>("grid");
  const [spotSeconds, setSpotSeconds] = useState(0);
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
  const busStorageKey = `muzes:daw-timeline-buses:v1:${session.id}`;
  const groupStorageKey = `muzes:daw-timeline-groups:v1:${session.id}`;
  const masterStorageKey = `muzes:daw-timeline-master:v1:${session.id}`;
  const snapshotStorageKey = `muzes:daw-timeline-snapshots:v1:${session.id}`;
  const mixerCheckpointStorageKey = `muzes:daw-mixer-checkpoints:v1:${session.id}`;
  const canvasWidth = timelineCanvasWidth(duration, zoom);
  const playhead = timelinePlayheadPercent(elapsed, duration);
  const ruler = useMemo(() => createTimelineRulerMarks(duration, zoom), [duration, zoom]);
  const loopRegion = normalizeTimelineLoopRegion(loop.startSeconds, loop.endSeconds, duration);
  const sections = createTimelineSections(markers, duration);
  const trackById = useMemo(() => new Map(tracks.map((track) => [String(track.id), track])), [tracks]);
  const anySoloed = lanes.some((lane) => lane.soloed);
  const selectedEffect = lanes
    .flatMap((lane) => lane.effects.map((effect) => ({ lane, effect })))
    .find(({ effect }) => effect.id === selectedEffectId) ?? null;
  const selectedMixSnapshot =
    mixSnapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null;
  const filteredMixerHistory = mixerUndoHistory
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) =>
      entry.label.toLowerCase().includes(mixerHistorySearch.trim().toLowerCase()));
  const filteredMixerCheckpoints = mixerCheckpoints.filter((entry) => {
    const query = mixerHistorySearch.trim().toLowerCase();
    return entry.name.toLowerCase().includes(query)
      || entry.notes.toLowerCase().includes(query)
      || entry.label.toLowerCase().includes(query);
  });
  const masterLaneLevels = lanes.map((lane) => {
      const groupBus = lane.groupId === "none" ? null : groupBuses[lane.groupId];
      const audible = !lane.muted && !groupBus?.muted && (!anySoloed || lane.soloed);
      return timelineLaneMeterLevel(
        lane.trackId,
        elapsed,
        lane.volume * (groupBus?.volume ?? 1),
        audible,
      );
    });
  const masterInputLevel = timelineMasterOutputLevel(
    masterLaneLevels,
    masterGain,
    false,
    limiterCeiling,
  );
  const masterLevel = timelineMasterOutputLevel(
    masterLaneLevels,
    masterGain,
    limiterEnabled,
    limiterCeiling,
  );
  const masterPeakDb = masterLevel > 0 ? 20 * Math.log10(masterLevel) : -60;
  const masterLoudness = Math.max(-60, masterPeakDb - 3);
  const stereoSpread = lanes.length
    ? lanes.reduce((sum, lane) => sum + Math.abs(lane.pan), 0) / lanes.length
    : 0;
  const stereoMaster = timelineStereoMasterState(
    masterLevel, masterBalance, monoCheck, stereoSpread,
  );
  const referenceLane = lanes.find((lane) => lane.trackId === referenceTrackId) ?? null;
  const referenceGroup = referenceLane?.groupId && referenceLane.groupId !== "none"
    ? groupBuses[referenceLane.groupId]
    : null;
  const referenceLevel = referenceLane
    ? timelineLaneMeterLevel(
        referenceLane.trackId,
        elapsed,
        referenceLane.volume * (referenceGroup?.volume ?? 1),
        !referenceLane.muted && !referenceGroup?.muted,
      )
    : 0;
  const referenceGain = timelineReferenceMatchGain(masterLevel, referenceLevel, referenceMatch);
  const matchedReferenceLevel = Math.min(1, referenceLevel * referenceGain);
  const effectPresets: Record<TimelineDawEffectKind, string[]> = {
    eq: ["Balanced", "Vocal Presence", "Bass Cleanup", "Air"],
    compressor: ["Vocal Glue", "Punch", "Gentle Bus", "Limiter"],
    reverb: ["Studio Room", "Plate", "Large Hall", "Dream"],
    delay: ["Quarter Note", "Eighth Note", "Slapback", "Ping Pong"],
  };

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
    if (!comparingSnapshot && !comparedMixerCheckpointId && lanes.length) {
      localStorage.setItem(storageKey, JSON.stringify(lanes));
    }
  }, [comparedMixerCheckpointId, comparingSnapshot, lanes, storageKey]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(busStorageKey) ?? "{}");
      if (Number.isFinite(saved.reverbReturn)) {
        setReverbReturn(Math.min(1, Math.max(0, saved.reverbReturn)));
      }
      if (Number.isFinite(saved.delayReturn)) {
        setDelayReturn(Math.min(1, Math.max(0, saved.delayReturn)));
      }
    } catch {}
  }, [busStorageKey]);

  useEffect(() => {
    if (!comparingSnapshot && !comparedMixerCheckpointId) {
      localStorage.setItem(busStorageKey, JSON.stringify({ reverbReturn, delayReturn }));
    }
  }, [
    busStorageKey, comparedMixerCheckpointId, comparingSnapshot, delayReturn, reverbReturn,
  ]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(groupStorageKey) ?? "{}");
      setGroupBuses(Object.fromEntries(
        (["vocals", "music", "drums"] as const).map((groupId) => [
          groupId,
          {
            volume: Number.isFinite(saved[groupId]?.volume)
              ? Math.min(1, Math.max(0, saved[groupId].volume))
              : 1,
            muted: saved[groupId]?.muted === true,
          },
        ]),
      ) as TimelineGroupBuses);
    } catch {
      setGroupBuses(defaultGroupBuses);
    } finally {
      setGroupBusesReady(true);
    }
  }, [groupStorageKey]);

  useEffect(() => {
    if (groupBusesReady && !comparingSnapshot && !comparedMixerCheckpointId) {
      localStorage.setItem(groupStorageKey, JSON.stringify(groupBuses));
    }
  }, [
    comparedMixerCheckpointId, comparingSnapshot, groupBuses, groupBusesReady, groupStorageKey,
  ]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(masterStorageKey) ?? "{}");
      if (Number.isFinite(saved.masterGain)) {
        setMasterGain(Math.min(1.25, Math.max(0, saved.masterGain)));
      }
      if (typeof saved.limiterEnabled === "boolean") setLimiterEnabled(saved.limiterEnabled);
      if (Number.isFinite(saved.limiterCeiling)) {
        setLimiterCeiling(Math.min(1, Math.max(0.5, saved.limiterCeiling)));
      }
      if (Number.isFinite(saved.masterBalance)) {
        setMasterBalance(Math.min(1, Math.max(-1, saved.masterBalance)));
      }
      if (typeof saved.monoCheck === "boolean") setMonoCheck(saved.monoCheck);
      if (typeof saved.referenceTrackId === "string") setReferenceTrackId(saved.referenceTrackId);
      if (saved.comparisonMode === "mix" || saved.comparisonMode === "reference") {
        setComparisonMode(saved.comparisonMode);
      }
      if (typeof saved.referenceMatch === "boolean") setReferenceMatch(saved.referenceMatch);
      if (Array.isArray(saved.overloads)) {
        setMasterOverloads(saved.overloads
          .filter((entry: MasterOverload) =>
            typeof entry?.id === "string"
            && Number.isFinite(entry.seconds)
            && Number.isFinite(entry.peakDb))
          .slice(-12));
      }
    } catch {} finally {
      setMasterReady(true);
    }
  }, [masterStorageKey]);

  useEffect(() => {
    if (masterReady && !comparingSnapshot && !comparedMixerCheckpointId) {
      localStorage.setItem(masterStorageKey, JSON.stringify({
        masterGain, limiterEnabled, limiterCeiling, overloads: masterOverloads,
        masterBalance, monoCheck, referenceTrackId, comparisonMode, referenceMatch,
      }));
    }
  }, [
    comparedMixerCheckpointId, comparingSnapshot, limiterCeiling, limiterEnabled, masterBalance,
    masterGain, masterOverloads, masterReady, masterStorageKey, monoCheck, referenceTrackId,
    comparisonMode, referenceMatch,
  ]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(snapshotStorageKey) ?? "[]");
      if (Array.isArray(saved)) {
        setMixSnapshots(saved.filter((snapshot: MixSnapshot) =>
          typeof snapshot?.id === "string"
          && typeof snapshot.name === "string"
          && Array.isArray(snapshot.lanes)
          && snapshot.groupBuses
          && typeof snapshot.groupBuses === "object")
          .map((snapshot: MixSnapshot) => ({
            ...snapshot,
            notes: typeof snapshot.notes === "string" ? snapshot.notes : "",
          }))
          .slice(-12));
      }
    } catch {} finally {
      setSnapshotReady(true);
    }
  }, [snapshotStorageKey]);

  useEffect(() => {
    if (snapshotReady) {
      localStorage.setItem(snapshotStorageKey, JSON.stringify(mixSnapshots));
    }
  }, [mixSnapshots, snapshotReady, snapshotStorageKey]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(mixerCheckpointStorageKey) ?? "[]");
      if (Array.isArray(stored)) {
        setMixerCheckpoints(stored.map((checkpoint: MixerCheckpoint) => ({
          ...checkpoint,
          name: typeof checkpoint.name === "string" ? checkpoint.name : checkpoint.label,
          notes: typeof checkpoint.notes === "string" ? checkpoint.notes : "",
        })).slice(-12));
      }
    } catch {} finally {
      setMixerCheckpointsReady(true);
    }
  }, [mixerCheckpointStorageKey]);

  useEffect(() => {
    if (mixerCheckpointsReady) {
      localStorage.setItem(mixerCheckpointStorageKey, JSON.stringify(mixerCheckpoints));
    }
  }, [mixerCheckpointStorageKey, mixerCheckpoints, mixerCheckpointsReady]);

  useEffect(() => {
    setSnapshotEditName(selectedMixSnapshot?.name ?? "");
    setSnapshotNotes(selectedMixSnapshot?.notes ?? "");
  }, [selectedMixSnapshot]);

  useEffect(() => {
    if (!lanes.length || !masterReady || !groupBusesReady) return;
    const current = captureMixState();
    const previous = mixerLastStateRef.current;
    if (!previous) {
      mixerLastStateRef.current = current;
      return;
    }
    if (mixerApplyingHistoryRef.current) {
      mixerApplyingHistoryRef.current = false;
      mixerLastStateRef.current = current;
      return;
    }
    if (comparingSnapshot || comparedMixerCheckpointId) {
      mixerLastStateRef.current = current;
      return;
    }
    if (JSON.stringify(previous) === JSON.stringify(current)) return;
    setMixerUndoHistory((history) => [...history, {
      state: previous,
      label: describeMixerChange(previous, current),
      createdAt: Date.now(),
    }].slice(-50));
    setMixerRedoHistory([]);
    mixerLastStateRef.current = current;
  }, [
    comparedMixerCheckpointId, comparingSnapshot, comparisonMode, delayReturn, groupBuses,
    groupBusesReady, lanes, limiterCeiling, limiterEnabled, masterBalance, masterGain,
    masterReady, monoCheck, referenceMatch, referenceTrackId, reverbReturn,
  ]);

  useEffect(() => {
    const handleMixerHistory = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable
        || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      ) return;
      event.preventDefault();
      if (event.shiftKey) redoMixerChange();
      else undoMixerChange();
    };
    window.addEventListener("keydown", handleMixerHistory);
    return () => window.removeEventListener("keydown", handleMixerHistory);
  }, [mixerRedoHistory, mixerUndoHistory]);

  useEffect(() => {
    const overloaded = masterInputLevel > limiterCeiling;
    if (comparingSnapshot || comparedMixerCheckpointId) {
      overloadActiveRef.current = overloaded;
      return;
    }
    if (overloaded && !overloadActiveRef.current) {
      setMasterOverloads((current) => [...current, {
        id: `${Date.now()}:${elapsed.toFixed(2)}`,
        seconds: elapsed,
        peakDb: 20 * Math.log10(masterInputLevel),
      }].slice(-12));
    }
    overloadActiveRef.current = overloaded;
  }, [
    comparedMixerCheckpointId, comparingSnapshot, elapsed, limiterCeiling, masterInputLevel,
  ]);

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
    const comparisonLane = comparisonMode === "reference" && referenceLane
      ? referenceLane
      : primaryLane;
    const comparisonGroup = comparisonLane?.groupId && comparisonLane.groupId !== "none"
      ? groupBuses[comparisonLane.groupId]
      : null;
    const audible = comparisonLane
      ? !comparisonLane.muted
        && !comparisonGroup?.muted
        && (!anySoloed || comparisonLane.soloed)
      : true;
    const automatedVolume = timelineAutomationValueAt(
      automation, comparisonLane?.trackId ?? session.songId, "volume", elapsed,
    );
    const automatedPan = timelineAutomationValueAt(
      automation, comparisonLane?.trackId ?? session.songId, "pan", elapsed,
    );
    const rawVolume =
      (comparisonLane?.volume ?? 1)
      * (comparisonGroup?.volume ?? 1)
      * (automatedVolume ?? 1)
      * masterGain
      * (comparisonMode === "reference" ? referenceGain : 1);
    const outputVolume = limiterEnabled ? Math.min(rawVolume, limiterCeiling) : rawVolume;
    window.dispatchEvent(new CustomEvent("muzes:daw-automation-frame", {
      detail: {
        sessionId: session.id,
        trackId: session.songId,
        sourceTrackId: comparisonLane?.trackId ?? session.songId,
        volume: audible ? outputVolume : 0,
        pan: monoCheck
          ? 0
          : Math.min(1, Math.max(
              -1,
              (comparisonLane?.pan ?? 0) + (automatedPan ?? 0) + masterBalance,
            )),
      },
    }));
  }, [
    anySoloed, automation, comparisonMode, elapsed, groupBuses, lanes, limiterCeiling,
    limiterEnabled, masterBalance, masterGain, monoCheck, referenceGain, referenceLane,
    session.id, session.songId,
  ]);

  function updateLane(trackId: string, patch: Partial<TimelineDawLaneState>) {
    const changesMix = Object.keys(patch).some((key) => key !== "selected");
    if (changesMix && (comparingSnapshot || comparedMixerCheckpointId)) return;
    setLanes((current) => current.map((lane) => lane.trackId === trackId
      ? { ...lane, ...patch }
      : patch.selected ? { ...lane, selected: false } : lane));
  }

  function clearMasterOverloads() {
    if (comparingSnapshot || comparedMixerCheckpointId) return;
    setMasterOverloads([]);
  }

  function captureMixState(): MixSnapshotState {
    return {
      lanes: lanes.map((lane) => ({
        ...lane,
        effects: lane.effects.map((effect) => ({ ...effect })),
      })),
      groupBuses: Object.fromEntries(
        Object.entries(groupBuses).map(([id, bus]) => [id, { ...bus }]),
      ) as TimelineGroupBuses,
      reverbReturn,
      delayReturn,
      masterGain,
      limiterEnabled,
      limiterCeiling,
      masterBalance,
      monoCheck,
      referenceTrackId,
      comparisonMode,
      referenceMatch,
    };
  }

  function applyMixState(snapshot: MixSnapshotState) {
    setLanes(snapshot.lanes.map((lane) => ({
      ...lane,
      effects: lane.effects.map((effect) => ({ ...effect })),
    })));
    setGroupBuses(Object.fromEntries(
      Object.entries(snapshot.groupBuses).map(([id, bus]) => [id, { ...bus }]),
    ) as TimelineGroupBuses);
    setReverbReturn(snapshot.reverbReturn);
    setDelayReturn(snapshot.delayReturn);
    setMasterGain(snapshot.masterGain);
    setLimiterEnabled(snapshot.limiterEnabled);
    setLimiterCeiling(snapshot.limiterCeiling);
    setMasterBalance(snapshot.masterBalance);
    setMonoCheck(snapshot.monoCheck);
    setReferenceTrackId(snapshot.referenceTrackId);
    setComparisonMode(snapshot.comparisonMode);
    setReferenceMatch(snapshot.referenceMatch);
  }

  function describeMixerChange(previous: MixSnapshotState, current: MixSnapshotState): string {
    for (const lane of current.lanes) {
      const before = previous.lanes.find((entry) => entry.trackId === lane.trackId);
      const name = trackById.get(lane.trackId)?.title || lane.trackId;
      if (!before) return `${name}: lane added`;
      if (before.volume !== lane.volume) {
        return `${name}: volume ${Math.round(before.volume * 100)} → ${Math.round(lane.volume * 100)}`;
      }
      if (before.pan !== lane.pan) return `${name}: pan changed`;
      if (before.muted !== lane.muted) return `${name}: ${lane.muted ? "muted" : "unmuted"}`;
      if (before.soloed !== lane.soloed) return `${name}: solo ${lane.soloed ? "on" : "off"}`;
      if (before.groupId !== lane.groupId) return `${name}: group → ${lane.groupId}`;
      if (before.reverbSend !== lane.reverbSend) return `${name}: reverb send changed`;
      if (before.delaySend !== lane.delaySend) return `${name}: delay send changed`;
      if (JSON.stringify(before.effects) !== JSON.stringify(lane.effects)) {
        return `${name}: effect rack changed`;
      }
    }
    if (JSON.stringify(previous.groupBuses) !== JSON.stringify(current.groupBuses)) {
      return "Group bus changed";
    }
    if (previous.reverbReturn !== current.reverbReturn) return "Reverb return changed";
    if (previous.delayReturn !== current.delayReturn) return "Delay return changed";
    if (previous.masterGain !== current.masterGain) return "Master gain changed";
    if (previous.limiterEnabled !== current.limiterEnabled) {
      return `Limiter ${current.limiterEnabled ? "enabled" : "disabled"}`;
    }
    if (previous.limiterCeiling !== current.limiterCeiling) return "Limiter ceiling changed";
    if (previous.masterBalance !== current.masterBalance) return "Master balance changed";
    if (previous.monoCheck !== current.monoCheck) {
      return `Mono check ${current.monoCheck ? "enabled" : "disabled"}`;
    }
    if (previous.referenceTrackId !== current.referenceTrackId) return "Reference track changed";
    if (previous.comparisonMode !== current.comparisonMode) {
      return `A/B switched to ${current.comparisonMode}`;
    }
    if (previous.referenceMatch !== current.referenceMatch) return "Reference matching changed";
    return "Mixer state changed";
  }

  function undoMixerChange() {
    if (comparingSnapshot || comparedMixerCheckpointId) return;
    const target = mixerUndoHistory.at(-1);
    if (!target) return;
    const current = captureMixState();
    setMixerUndoHistory((history) => history.slice(0, -1));
    setMixerRedoHistory((history) => [...history, {
      state: current,
      label: target.label,
      createdAt: Date.now(),
    }].slice(-50));
    mixerApplyingHistoryRef.current = true;
    applyMixState(target.state);
  }

  function redoMixerChange() {
    if (comparingSnapshot || comparedMixerCheckpointId) return;
    const target = mixerRedoHistory.at(-1);
    if (!target) return;
    const current = captureMixState();
    setMixerRedoHistory((history) => history.slice(0, -1));
    setMixerUndoHistory((history) => [...history, {
      state: current,
      label: target.label,
      createdAt: Date.now(),
    }].slice(-50));
    mixerApplyingHistoryRef.current = true;
    applyMixState(target.state);
  }

  function jumpToMixerHistory(index: number) {
    if (comparingSnapshot || comparedMixerCheckpointId) return;
    const target = mixerUndoHistory[index];
    if (!target) return;
    const current = captureMixState();
    const chronologicalFuture: MixerHistoryEntry[] = [
      ...mixerUndoHistory.slice(index + 1).map((entry, futureIndex) => ({
        state: entry.state,
        label: mixerUndoHistory[index + futureIndex]?.label ?? entry.label,
        createdAt: Date.now() + futureIndex,
      })),
      {
        state: current,
        label: mixerUndoHistory.at(-1)?.label ?? "Return to latest mix",
        createdAt: Date.now() + mixerUndoHistory.length,
      },
    ];
    setMixerUndoHistory(mixerUndoHistory.slice(0, index));
    setMixerRedoHistory(chronologicalFuture.reverse().slice(-50));
    mixerApplyingHistoryRef.current = true;
    applyMixState(target.state);
  }

  function pinMixerHistory(entry: MixerHistoryEntry) {
    if (comparingSnapshot || comparedMixerCheckpointId) return;
    setMixerCheckpoints((checkpoints) => {
      if (checkpoints.some((checkpoint) =>
        checkpoint.createdAt === entry.createdAt && checkpoint.label === entry.label)) {
        return checkpoints;
      }
      return [...checkpoints, {
        ...entry,
        id: `checkpoint:${Date.now()}`,
        name: entry.label,
        notes: "",
      }].slice(-12);
    });
  }

  function unpinMixerCheckpoint(id: string) {
    if (comparingSnapshot || comparedMixerCheckpointId) return;
    setMixerCheckpoints((checkpoints) =>
      checkpoints.filter((checkpoint) => checkpoint.id !== id));
  }

  function updateMixerCheckpoint(
    id: string,
    updates: Partial<Pick<MixerCheckpoint, "name" | "notes">>,
  ) {
    if (comparingSnapshot || comparedMixerCheckpointId) return;
    setMixerCheckpoints((checkpoints) => checkpoints.map((checkpoint) =>
      checkpoint.id === id ? { ...checkpoint, ...updates } : checkpoint));
  }

  function restoreMixerCheckpoint(checkpoint: MixerCheckpoint) {
    const current = mixerCheckpointCompareRef.current ?? captureMixState();
    mixerCheckpointCompareRef.current = null;
    setComparedMixerCheckpointId("");
    if (JSON.stringify(current) === JSON.stringify(checkpoint.state)) return;
    setMixerUndoHistory((history) => [...history, {
      state: current,
      label: `Restore checkpoint: ${checkpoint.name}`,
      createdAt: Date.now(),
    }].slice(-50));
    setMixerRedoHistory([]);
    mixerApplyingHistoryRef.current = true;
    applyMixState(checkpoint.state);
  }

  function buildMixerCheckpointSectionState(
    checkpoint: MixerCheckpoint,
    section: "lanes" | "master" | "buses",
    current: MixSnapshotState,
  ): MixSnapshotState {
    const sourceByTrackId = new Map(
      checkpoint.state.lanes.map((lane) => [lane.trackId, lane]),
    );
    return section === "lanes"
      ? {
          ...current,
          lanes: current.lanes.map((lane) => sourceByTrackId.get(lane.trackId) ?? lane),
        }
      : section === "master"
        ? {
            ...current,
            masterGain: checkpoint.state.masterGain,
            limiterEnabled: checkpoint.state.limiterEnabled,
            limiterCeiling: checkpoint.state.limiterCeiling,
            masterBalance: checkpoint.state.masterBalance,
            monoCheck: checkpoint.state.monoCheck,
            referenceTrackId: checkpoint.state.referenceTrackId,
            comparisonMode: checkpoint.state.comparisonMode,
            referenceMatch: checkpoint.state.referenceMatch,
          }
        : {
            ...current,
            groupBuses: checkpoint.state.groupBuses,
            reverbReturn: checkpoint.state.reverbReturn,
            delayReturn: checkpoint.state.delayReturn,
          };
  }

  function mixerCheckpointSectionHasChanges(
    checkpoint: MixerCheckpoint,
    section: "lanes" | "master" | "buses",
  ): boolean {
    const current = captureMixState();
    return JSON.stringify(buildMixerCheckpointSectionState(
      checkpoint,
      section,
      current,
    )) !== JSON.stringify(current);
  }

  function recallMixerCheckpointSection(
    checkpoint: MixerCheckpoint,
    section: "lanes" | "master" | "buses",
  ) {
    if (comparedMixerCheckpointId || comparingSnapshot) return;
    const current = captureMixState();
    const recalled = buildMixerCheckpointSectionState(checkpoint, section, current);
    if (JSON.stringify(recalled) === JSON.stringify(current)) return;
    setMixerUndoHistory((history) => [...history, {
      state: current,
      label: `Recall ${section} from ${checkpoint.name}`,
      createdAt: Date.now(),
    }].slice(-50));
    setMixerRedoHistory([]);
    mixerApplyingHistoryRef.current = true;
    applyMixState(recalled);
  }

  type LaneRecallSection = "all" | "mix" | "routing" | "effects";

  function mergeCheckpointLaneSection(
    currentLane: TimelineDawLaneState,
    savedLane: TimelineDawLaneState,
    section: LaneRecallSection,
  ): TimelineDawLaneState {
    if (section === "all") return savedLane;
    if (section === "mix") {
      return {
        ...currentLane,
        volume: savedLane.volume,
        pan: savedLane.pan,
        muted: savedLane.muted,
        soloed: savedLane.soloed,
      };
    }
    if (section === "routing") {
      return {
        ...currentLane,
        groupId: savedLane.groupId,
        reverbSend: savedLane.reverbSend,
        delaySend: savedLane.delaySend,
      };
    }
    return { ...currentLane, effects: savedLane.effects };
  }

  function recallMixerCheckpointLane(
    checkpoint: MixerCheckpoint,
    trackId: string,
    section: LaneRecallSection,
  ) {
    if (comparedMixerCheckpointId || comparingSnapshot || !trackId) return;
    const current = captureMixState();
    const savedLane = checkpoint.state.lanes.find((lane) => lane.trackId === trackId);
    if (!savedLane || !current.lanes.some((lane) => lane.trackId === trackId)) return;
    const currentLane = current.lanes.find((lane) => lane.trackId === trackId)!;
    const recalledLane = mergeCheckpointLaneSection(currentLane, savedLane, section);
    const recalled: MixSnapshotState = {
      ...current,
      lanes: current.lanes.map((lane) => lane.trackId === trackId ? recalledLane : lane),
    };
    const laneName = trackById.get(trackId)?.title ?? trackId;
    const sectionName = {
      all: "channel",
      mix: "level and pan",
      routing: "routing and sends",
      effects: "effects",
    }[section];
    setMixerUndoHistory((history) => [...history, {
      state: current,
      label: `Recall ${laneName} ${sectionName} from ${checkpoint.name}`,
      createdAt: Date.now(),
    }].slice(-50));
    setMixerRedoHistory([]);
    mixerApplyingHistoryRef.current = true;
    applyMixState(recalled);
  }

  function recallMixerCheckpointLanes(
    checkpoint: MixerCheckpoint,
    trackIds: string[],
    section: LaneRecallSection,
  ) {
    if (comparedMixerCheckpointId || comparingSnapshot || !trackIds.length) return;
    const current = captureMixState();
    const selectedIds = new Set(trackIds);
    const savedByTrackId = new Map(
      checkpoint.state.lanes.map((lane) => [lane.trackId, lane]),
    );
    let recalledCount = 0;
    const recalled: MixSnapshotState = {
      ...current,
      lanes: current.lanes.map((lane) => {
        const savedLane = savedByTrackId.get(lane.trackId);
        if (!selectedIds.has(lane.trackId) || !savedLane) return lane;
        const recalledLane = mergeCheckpointLaneSection(lane, savedLane, section);
        if (JSON.stringify(recalledLane) === JSON.stringify(lane)) return lane;
        recalledCount += 1;
        return recalledLane;
      }),
    };
    if (!recalledCount) return;
    setMixerUndoHistory((history) => [...history, {
      state: current,
      label: `Recall ${recalledCount} lanes ${section} from ${checkpoint.name}`,
      createdAt: Date.now(),
    }].slice(-50));
    setMixerRedoHistory([]);
    mixerApplyingHistoryRef.current = true;
    applyMixState(recalled);
  }

  function toggleMixerCheckpointComparison(checkpoint: MixerCheckpoint) {
    if (comparedMixerCheckpointId) {
      if (comparedMixerCheckpointId !== checkpoint.id) {
        mixerApplyingHistoryRef.current = true;
        applyMixState(checkpoint.state);
        setComparedMixerCheckpointId(checkpoint.id);
        return;
      }
      const current = mixerCheckpointCompareRef.current;
      if (current) {
        mixerApplyingHistoryRef.current = true;
        applyMixState(current);
      }
      mixerCheckpointCompareRef.current = null;
      setComparedMixerCheckpointId("");
      return;
    }
    mixerCheckpointCompareRef.current = captureMixState();
    mixerApplyingHistoryRef.current = true;
    applyMixState(checkpoint.state);
    setComparedMixerCheckpointId(checkpoint.id);
  }

  function exportMixerCheckpoints() {
    if (!mixerCheckpoints.length) return;
    const bundle = JSON.stringify({
      format: "muzes-daw-mixer-checkpoints",
      version: 1,
      sessionName: session.name,
      exportedAt: new Date().toISOString(),
      checkpoints: mixerCheckpoints,
    }, null, 2);
    const url = URL.createObjectURL(new Blob([bundle], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${session.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "daw"}-mixer-checkpoints.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMixerCheckpointTransferStatus(
      `${mixerCheckpoints.length} checkpoint${mixerCheckpoints.length === 1 ? "" : "s"} exported`,
    );
  }

  async function importMixerCheckpoints(file: File) {
    if (comparingSnapshot || comparedMixerCheckpointId) {
      if (mixerCheckpointFileRef.current) mixerCheckpointFileRef.current.value = "";
      return;
    }
    try {
      const bundle = JSON.parse(await file.text()) as {
        format?: string;
        checkpoints?: Array<Partial<MixerCheckpoint>>;
      };
      if (bundle.format !== "muzes-daw-mixer-checkpoints" || !Array.isArray(bundle.checkpoints)) {
        throw new Error("Choose a Muzes mixer checkpoint file");
      }
      const stamp = Date.now();
      const imported = bundle.checkpoints.flatMap((checkpoint, index): MixerCheckpoint[] => {
        const state = checkpoint.state as MixSnapshotState | undefined;
        if (!state || !Array.isArray(state.lanes) || !state.groupBuses) return [];
        const label = typeof checkpoint.label === "string"
          ? checkpoint.label
          : `Imported checkpoint ${index + 1}`;
        return [{
          id: `checkpoint:${stamp}:import:${index + 1}`,
          name: typeof checkpoint.name === "string" && checkpoint.name.trim()
            ? checkpoint.name.trim()
            : label,
          notes: typeof checkpoint.notes === "string" ? checkpoint.notes : "",
          label,
          createdAt: typeof checkpoint.createdAt === "number" ? checkpoint.createdAt : stamp,
          state,
        }];
      });
      if (!imported.length) throw new Error("No valid mixer checkpoints found");
      setMixerCheckpoints((checkpoints) => [...checkpoints, ...imported].slice(-12));
      setMixerCheckpointTransferStatus(
        `${imported.length} checkpoint${imported.length === 1 ? "" : "s"} imported`,
      );
    } catch (cause) {
      setMixerCheckpointTransferStatus(cause instanceof Error ? cause.message : "Import failed");
    } finally {
      if (mixerCheckpointFileRef.current) mixerCheckpointFileRef.current.value = "";
    }
  }

  function saveMixSnapshot() {
    if (comparingSnapshot || comparedMixerCheckpointId) return;
    const name = snapshotName.trim() || `Mix ${mixSnapshots.length + 1}`;
    const snapshot: MixSnapshot = {
      id: `mix:${Date.now()}`,
      name,
      notes: "",
      createdAt: new Date().toISOString(),
      ...captureMixState(),
    };
    setMixSnapshots((current) => [...current, snapshot].slice(-12));
    setSelectedSnapshotId(snapshot.id);
    setSnapshotName("");
  }

  function duplicateMixSnapshot() {
    if (!selectedMixSnapshot || comparingSnapshot || comparedMixerCheckpointId) return;
    const duplicate: MixSnapshot = {
      ...selectedMixSnapshot,
      id: `mix:${Date.now()}`,
      name: `${selectedMixSnapshot.name} Copy`,
      createdAt: new Date().toISOString(),
      lanes: selectedMixSnapshot.lanes.map((lane) => ({
        ...lane,
        effects: lane.effects.map((effect) => ({ ...effect })),
      })),
      groupBuses: Object.fromEntries(
        Object.entries(selectedMixSnapshot.groupBuses).map(([id, bus]) => [id, { ...bus }]),
      ) as TimelineGroupBuses,
    };
    setMixSnapshots((current) => [...current, duplicate].slice(-12));
    setSelectedSnapshotId(duplicate.id);
  }

  function deleteMixSnapshot() {
    if (!selectedMixSnapshot || comparingSnapshot || comparedMixerCheckpointId) return;
    setMixSnapshots((current) =>
      current.filter((snapshot) => snapshot.id !== selectedMixSnapshot.id));
    setSelectedSnapshotId("");
  }

  function recallMixSnapshot() {
    if (
      !selectedMixSnapshot
      || comparingSnapshot
      || comparedMixerCheckpointId
      || summarizeSnapshotDifference(selectedMixSnapshot) === "Matches current mixer"
    ) return;
    const current = captureMixState();
    setMixerUndoHistory((history) => [...history, {
      state: current,
      label: `Recall snapshot: ${selectedMixSnapshot.name}`,
      createdAt: Date.now(),
    }].slice(-50));
    setMixerRedoHistory([]);
    mixerApplyingHistoryRef.current = true;
    applyMixState(selectedMixSnapshot);
  }

  function updateSnapshotDetails() {
    if (!selectedMixSnapshot || comparingSnapshot || comparedMixerCheckpointId) return;
    const name = snapshotEditName.trim() || selectedMixSnapshot.name;
    setMixSnapshots((current) => current.map((snapshot) =>
      snapshot.id === selectedMixSnapshot.id
        ? { ...snapshot, name, notes: snapshotNotes.trim() }
        : snapshot));
  }

  function summarizeSnapshotDifference(snapshot: MixSnapshotState): string {
    const currentById = new Map(lanes.map((lane) => [lane.trackId, lane]));
    const changedLanes = snapshot.lanes.filter((savedLane) => {
      const current = currentById.get(savedLane.trackId);
      if (!current) return true;
      return current.volume !== savedLane.volume
        || current.pan !== savedLane.pan
        || current.muted !== savedLane.muted
        || current.soloed !== savedLane.soloed
        || current.groupId !== savedLane.groupId
        || current.reverbSend !== savedLane.reverbSend
        || current.delaySend !== savedLane.delaySend
        || JSON.stringify(current.effects) !== JSON.stringify(savedLane.effects);
    }).length + lanes.filter(
      (lane) => !snapshot.lanes.some((savedLane) => savedLane.trackId === lane.trackId),
    ).length;
    const masterChanges = [
      snapshot.masterGain !== masterGain,
      snapshot.limiterEnabled !== limiterEnabled,
      snapshot.limiterCeiling !== limiterCeiling,
      snapshot.masterBalance !== masterBalance,
      snapshot.monoCheck !== monoCheck,
      snapshot.referenceTrackId !== referenceTrackId,
      snapshot.comparisonMode !== comparisonMode,
      snapshot.referenceMatch !== referenceMatch,
    ].filter(Boolean).length;
    const busesChanged =
      snapshot.reverbReturn !== reverbReturn
      || snapshot.delayReturn !== delayReturn
      || JSON.stringify(snapshot.groupBuses) !== JSON.stringify(groupBuses);
    if (!changedLanes && !masterChanges && !busesChanged) return "Matches current mixer";
    return [
      changedLanes ? `${changedLanes} lane${changedLanes === 1 ? "" : "s"}` : "",
      masterChanges ? `${masterChanges} master setting${masterChanges === 1 ? "" : "s"}` : "",
      busesChanged ? "buses changed" : "",
    ].filter(Boolean).join(" · ");
  }

  function listSnapshotDifferences(snapshot: MixSnapshotState): string[] {
    const currentById = new Map(lanes.map((lane) => [lane.trackId, lane]));
    const details = snapshot.lanes.flatMap((savedLane) => {
      const current = currentById.get(savedLane.trackId);
      const laneName = trackById.get(savedLane.trackId)?.title ?? savedLane.trackId;
      if (!current) return [`${laneName}: lane is not in the current mix`];
      const changes = [
        current.volume !== savedLane.volume ? "volume" : "",
        current.pan !== savedLane.pan ? "pan" : "",
        current.muted !== savedLane.muted ? "mute" : "",
        current.soloed !== savedLane.soloed ? "solo" : "",
        current.groupId !== savedLane.groupId ? "group" : "",
        current.reverbSend !== savedLane.reverbSend ? "reverb send" : "",
        current.delaySend !== savedLane.delaySend ? "delay send" : "",
        JSON.stringify(current.effects) !== JSON.stringify(savedLane.effects) ? "effects" : "",
      ].filter(Boolean);
      return changes.length ? [`${laneName}: ${changes.join(", ")}`] : [];
    });
    lanes.forEach((lane) => {
      if (!snapshot.lanes.some((savedLane) => savedLane.trackId === lane.trackId)) {
        details.push(`${trackById.get(lane.trackId)?.title ?? lane.trackId}: not in checkpoint`);
      }
    });
    const masterChanges = [
      snapshot.masterGain !== masterGain ? "gain" : "",
      snapshot.limiterEnabled !== limiterEnabled ? "limiter" : "",
      snapshot.limiterCeiling !== limiterCeiling ? "limiter ceiling" : "",
      snapshot.masterBalance !== masterBalance ? "balance" : "",
      snapshot.monoCheck !== monoCheck ? "mono check" : "",
      snapshot.referenceTrackId !== referenceTrackId ? "reference track" : "",
      snapshot.comparisonMode !== comparisonMode ? "A/B source" : "",
      snapshot.referenceMatch !== referenceMatch ? "reference match" : "",
    ].filter(Boolean);
    if (masterChanges.length) details.push(`Master: ${masterChanges.join(", ")}`);
    const busChanges = [
      snapshot.reverbReturn !== reverbReturn ? "reverb return" : "",
      snapshot.delayReturn !== delayReturn ? "delay return" : "",
      JSON.stringify(snapshot.groupBuses) !== JSON.stringify(groupBuses) ? "group buses" : "",
    ].filter(Boolean);
    if (busChanges.length) details.push(`Buses: ${busChanges.join(", ")}`);
    return details.length ? details : ["No differences from the current mixer"];
  }

  function changedCheckpointLaneIds(
    snapshot: MixSnapshotState,
    section: LaneRecallSection = "all",
  ): string[] {
    const currentById = new Map(lanes.map((lane) => [lane.trackId, lane]));
    return snapshot.lanes.flatMap((savedLane) => {
      const current = currentById.get(savedLane.trackId);
      if (!current) return [];
      const mixChanged = current.volume !== savedLane.volume
        || current.pan !== savedLane.pan
        || current.muted !== savedLane.muted
        || current.soloed !== savedLane.soloed;
      const routingChanged = current.groupId !== savedLane.groupId
        || current.reverbSend !== savedLane.reverbSend
        || current.delaySend !== savedLane.delaySend;
      const effectsChanged =
        JSON.stringify(current.effects) !== JSON.stringify(savedLane.effects);
      const changed = section === "mix"
        ? mixChanged
        : section === "routing"
          ? routingChanged
          : section === "effects"
            ? effectsChanged
            : mixChanged || routingChanged || effectsChanged;
      return changed ? [savedLane.trackId] : [];
    });
  }

  function matchingCheckpointLanes(checkpoint: MixerCheckpoint): TimelineDawLaneState[] {
    const query = (checkpointLaneSearches[checkpoint.id] ?? "").trim().toLowerCase();
    const selectedIds = new Set(checkpointMultiLaneSelections[checkpoint.id] ?? []);
    const changedIds = checkpointChangedOnlyFilters[checkpoint.id]
      ? new Set(changedCheckpointLaneIds(
        checkpoint.state,
        checkpointChangeSectionFilters[checkpoint.id] ?? "all",
      ))
      : checkpointUnchangedOnlyFilters[checkpoint.id]
        ? new Set(changedCheckpointLaneIds(
          checkpoint.state,
          checkpointChangeSectionFilters[checkpoint.id] ?? "all",
        ))
        : null;
    const matching = checkpoint.state.lanes.filter((savedLane) => {
      if (!lanes.some((lane) => lane.trackId === savedLane.trackId)) return false;
      if (checkpointSelectedOnlyFilters[checkpoint.id] && !selectedIds.has(savedLane.trackId)) {
        return false;
      }
      if (
        changedIds
        && checkpointChangedOnlyFilters[checkpoint.id]
        && !changedIds.has(savedLane.trackId)
      ) return false;
      if (
        changedIds
        && checkpointUnchangedOnlyFilters[checkpoint.id]
        && changedIds.has(savedLane.trackId)
      ) return false;
      if (!query) return true;
      const laneName = trackById.get(savedLane.trackId)?.title ?? "";
      return laneName.toLowerCase().includes(query)
        || savedLane.trackId.toLowerCase().includes(query);
    });
    const order = checkpointLaneOrders[checkpoint.id] ?? "checkpoint";
    if (order === "name") {
      return matching.sort((left, right) => {
        const leftName = trackById.get(left.trackId)?.title ?? left.trackId;
        const rightName = trackById.get(right.trackId)?.title ?? right.trackId;
        return leftName.localeCompare(rightName, undefined, { sensitivity: "base" });
      });
    }
    if (order === "selected") {
      return matching.sort((left, right) =>
        Number(selectedIds.has(right.trackId)) - Number(selectedIds.has(left.trackId)));
    }
    if (order === "unselected") {
      return matching.sort((left, right) =>
        Number(selectedIds.has(left.trackId)) - Number(selectedIds.has(right.trackId)));
    }
    if (order === "changed") {
      const orderedChangedIds = new Set(changedCheckpointLaneIds(
        checkpoint.state,
        checkpointChangeSectionFilters[checkpoint.id] ?? "all",
      ));
      return matching.sort((left, right) =>
        Number(orderedChangedIds.has(right.trackId))
        - Number(orderedChangedIds.has(left.trackId)));
    }
    if (order === "unchanged") {
      const orderedChangedIds = new Set(changedCheckpointLaneIds(
        checkpoint.state,
        checkpointChangeSectionFilters[checkpoint.id] ?? "all",
      ));
      return matching.sort((left, right) =>
        Number(orderedChangedIds.has(left.trackId))
        - Number(orderedChangedIds.has(right.trackId)));
    }
    return matching;
  }

  function availableCheckpointLaneCount(checkpoint: MixerCheckpoint): number {
    return checkpoint.state.lanes.filter((savedLane) =>
      lanes.some((lane) => lane.trackId === savedLane.trackId)).length;
  }

  function hiddenCheckpointLanes(checkpoint: MixerCheckpoint): TimelineDawLaneState[] {
    const visibleIds = new Set(
      matchingCheckpointLanes(checkpoint).map((lane) => lane.trackId),
    );
    return checkpoint.state.lanes.filter((savedLane) =>
      lanes.some((lane) => lane.trackId === savedLane.trackId)
      && !visibleIds.has(savedLane.trackId));
  }

  function changedMatchingCheckpointLaneIds(
    checkpoint: MixerCheckpoint,
    section: LaneRecallSection = "all",
  ): string[] {
    const changedIds = new Set(changedCheckpointLaneIds(checkpoint.state, section));
    return matchingCheckpointLanes(checkpoint)
      .filter((lane) => changedIds.has(lane.trackId))
      .map((lane) => lane.trackId);
  }

  function changedHiddenCheckpointLaneIds(
    checkpoint: MixerCheckpoint,
    section: LaneRecallSection = "all",
  ): string[] {
    const changedIds = new Set(changedCheckpointLaneIds(checkpoint.state, section));
    return hiddenCheckpointLanes(checkpoint)
      .filter((lane) => changedIds.has(lane.trackId))
      .map((lane) => lane.trackId);
  }

  function unchangedMatchingCheckpointLaneIds(
    checkpoint: MixerCheckpoint,
    section: LaneRecallSection = "all",
  ): string[] {
    const changedIds = new Set(changedCheckpointLaneIds(checkpoint.state, section));
    return matchingCheckpointLanes(checkpoint)
      .filter((lane) => !changedIds.has(lane.trackId))
      .map((lane) => lane.trackId);
  }

  function selectedMatchingCheckpointLaneCount(checkpoint: MixerCheckpoint): number {
    const selectedIds = new Set(checkpointMultiLaneSelections[checkpoint.id] ?? []);
    return matchingCheckpointLanes(checkpoint)
      .filter((lane) => selectedIds.has(lane.trackId)).length;
  }

  function selectedHiddenCheckpointLaneCount(checkpoint: MixerCheckpoint): number {
    const selectedIds = new Set(checkpointMultiLaneSelections[checkpoint.id] ?? []);
    const visibleIds = new Set(
      matchingCheckpointLanes(checkpoint).map((lane) => lane.trackId),
    );
    return checkpoint.state.lanes.filter((savedLane) =>
      lanes.some((lane) => lane.trackId === savedLane.trackId)
      && selectedIds.has(savedLane.trackId)
      && !visibleIds.has(savedLane.trackId)).length;
  }

  function selectedUnavailableCheckpointLaneCount(checkpoint: MixerCheckpoint): number {
    const selectedIds = new Set(checkpointMultiLaneSelections[checkpoint.id] ?? []);
    return checkpoint.state.lanes.filter((savedLane) =>
      selectedIds.has(savedLane.trackId)
      && !lanes.some((lane) => lane.trackId === savedLane.trackId)).length;
  }

  function changedSelectedCheckpointLaneIds(
    checkpoint: MixerCheckpoint,
    section: LaneRecallSection = "all",
  ): string[] {
    const selectedIds = new Set(checkpointMultiLaneSelections[checkpoint.id] ?? []);
    return changedCheckpointLaneIds(checkpoint.state, section)
      .filter((trackId) => selectedIds.has(trackId));
  }

  function selectedCheckpointLaneChangeCount(
    checkpoint: MixerCheckpoint,
    changed: boolean,
  ): number {
    const selectedIds = new Set(checkpointMultiLaneSelections[checkpoint.id] ?? []);
    const changedIds = new Set(changedCheckpointLaneIds(
      checkpoint.state,
      checkpointChangeSectionFilters[checkpoint.id] ?? "all",
    ));
    return checkpoint.state.lanes.filter((savedLane) =>
      lanes.some((lane) => lane.trackId === savedLane.trackId)
      && selectedIds.has(savedLane.trackId)
      && changedIds.has(savedLane.trackId) === changed).length;
  }

  function resetCheckpointLaneView(checkpointId: string) {
    setCheckpointLaneSearches((searches) => ({
      ...searches,
      [checkpointId]: "",
    }));
    setCheckpointSelectedOnlyFilters((filters) => ({
      ...filters,
      [checkpointId]: false,
    }));
    setCheckpointChangedOnlyFilters((filters) => ({
      ...filters,
      [checkpointId]: false,
    }));
    setCheckpointUnchangedOnlyFilters((filters) => ({
      ...filters,
      [checkpointId]: false,
    }));
    setCheckpointChangeSectionFilters((filters) => ({
      ...filters,
      [checkpointId]: "all",
    }));
    setCheckpointLaneOrders((orders) => ({
      ...orders,
      [checkpointId]: "checkpoint",
    }));
  }

  function exportMixSnapshots() {
    if (!mixSnapshots.length) return;
    const blob = new Blob(
      [serializeTimelineMixSnapshotBundle(session.name, mixSnapshots)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${session.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "daw"}-mix-snapshots.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSnapshotTransferStatus(`${mixSnapshots.length} snapshot${mixSnapshots.length === 1 ? "" : "s"} exported`);
  }

  async function importMixSnapshots(file: File) {
    if (comparingSnapshot || comparedMixerCheckpointId) {
      if (snapshotFileRef.current) snapshotFileRef.current.value = "";
      return;
    }
    try {
      const imported = parseTimelineMixSnapshotBundle(await file.text()) as MixSnapshot[];
      const stamp = Date.now();
      const normalized = imported.map((snapshot, snapshotIndex): MixSnapshot => ({
        ...snapshot,
        id: `mix:${stamp}:import:${snapshotIndex + 1}`,
        name: snapshot.name.trim() || `Imported Mix ${snapshotIndex + 1}`,
        notes: typeof snapshot.notes === "string" ? snapshot.notes : "",
        createdAt: new Date().toISOString(),
        lanes: lanes.map((currentLane, laneIndex) => {
          const sourceLane =
            snapshot.lanes.find((lane) => lane.trackId === currentLane.trackId)
            ?? snapshot.lanes[laneIndex]
            ?? currentLane;
          return {
            ...sourceLane,
            trackId: currentLane.trackId,
            effects: (sourceLane.effects ?? []).map((effect, effectIndex) => ({
              ...effect,
              id: `${currentLane.trackId}:fx:${effectIndex + 1}`,
            })),
          };
        }),
      }));
      setMixSnapshots((current) => [...current, ...normalized].slice(-12));
      if (normalized.length) setSelectedSnapshotId(normalized.at(-1)!.id);
      setSnapshotTransferStatus(
        `${normalized.length} snapshot${normalized.length === 1 ? "" : "s"} imported`,
      );
    } catch (cause) {
      setSnapshotTransferStatus(cause instanceof Error ? cause.message : "Import failed");
    } finally {
      if (snapshotFileRef.current) snapshotFileRef.current.value = "";
    }
  }

  function toggleSnapshotComparison() {
    if (comparedMixerCheckpointId) return;
    const snapshot = mixSnapshots.find((entry) => entry.id === selectedSnapshotId);
    if (!snapshot) return;
    if (comparingSnapshot) {
      if (snapshotCompareRef.current) {
        mixerApplyingHistoryRef.current = true;
        applyMixState(snapshotCompareRef.current);
      }
      snapshotCompareRef.current = null;
      setComparingSnapshot(false);
      return;
    }
    if (summarizeSnapshotDifference(snapshot) === "Matches current mixer") return;
    snapshotCompareRef.current = captureMixState();
    mixerApplyingHistoryRef.current = true;
    applyMixState(snapshot);
    setComparingSnapshot(true);
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
      applyClipEdit((value) => applyTimelineDawEditModeMove(value, {
        mode: editMode, deltaSeconds: -editStep, gridSeconds: snapSeconds,
      }));
    } else if (action === "move-right") {
      applyClipEdit((value) => applyTimelineDawEditModeMove(value, {
        mode: editMode, deltaSeconds: editStep, gridSeconds: snapSeconds,
      }));
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
    if (comparingSnapshot || comparedMixerCheckpointId) return;
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
      setClips(applyTimelineDawEditModeMove(drag.originClips, {
        mode: editMode, deltaSeconds, gridSeconds: snapSeconds,
      }));
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
    if (event.button !== 0 || comparingSnapshot || comparedMixerCheckpointId) return;
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
    if (comparingSnapshot || comparedMixerCheckpointId) return;
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
          applyClipEdit((value) => applyTimelineDawEditModeMove(value, {
            mode: editMode, deltaSeconds: direction * editStep, gridSeconds: snapSeconds,
          }));
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
        <span className="mr-1 text-xs font-black uppercase tracking-wider text-cyan-200/70">Edit mode</span>
        {(["grid", "slip", "shuffle", "spot"] as TimelineDawEditMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setEditMode(mode)}
            aria-pressed={editMode === mode}
            className={`rounded-lg border px-3 py-2 text-xs font-black capitalize ${
              editMode === mode
                ? "border-cyan-300 bg-cyan-300 text-black"
                : "border-white/15 text-white/65"
            }`}
          >
            {mode}
          </button>
        ))}
        {editMode === "spot" ? (
          <>
            <label className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-black">
              <span className="text-white/45">Position</span>
              <input
                type="number"
                min={0}
                max={duration}
                step={0.01}
                value={spotSeconds}
                onChange={(event) => setSpotSeconds(Math.max(0, Number(event.target.value) || 0))}
                aria-label="Exact clip position in seconds"
                className="w-20 bg-transparent font-mono text-cyan-200 outline-none"
              />
            </label>
            <button
              type="button"
              disabled={!selectedClip}
              onClick={() => applyClipEdit((value) => applyTimelineDawEditModeMove(value, {
                mode: "spot", deltaSeconds: 0, gridSeconds: snapSeconds, spotSeconds,
              }))}
              className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-black disabled:opacity-30"
            >
              Spot Selected
            </button>
          </>
        ) : null}
        <span className="text-xs text-white/40">{timelineDawEditModeDescription(editMode)}</span>
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
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          onClick={writeAutomationPoint}
          className="rounded-lg bg-emerald-300 px-3 py-2 text-xs font-black text-black disabled:opacity-30"
        >
          Write at Playhead
        </button>
        {selectedAutomation ? (
          <button
            type="button"
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onClick={() => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setAutomation((value) =>
                archiveTimelineAutomationPoint(value, selectedAutomation.id));
            }}
            className="rounded-lg border border-amber-300/35 px-3 py-2 text-xs font-black text-amber-100 disabled:opacity-30"
          >
            Remove Point
          </button>
        ) : null}
        <span className="ml-auto text-xs text-white/35">
          {automation.filter((point) => !point.archived).length} active points
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-amber-300/15 bg-amber-300/[0.035] px-5 py-3">
        <span className="text-xs font-black uppercase tracking-wider text-amber-200/80">Master Output</span>
        <select
          value={
            masterGain === 0.9 && limiterEnabled && limiterCeiling === 0.89
              ? "streaming"
              : masterGain === 1 && limiterEnabled && limiterCeiling === 0.95
                ? "balanced"
                : masterGain === 1.15 && limiterEnabled && limiterCeiling === 0.98
                  ? "loud"
                  : "custom"
          }
          onChange={(event) => {
            if (comparingSnapshot || comparedMixerCheckpointId) return;
            const preset = event.target.value;
            if (preset === "streaming") {
              setMasterGain(0.9); setLimiterEnabled(true); setLimiterCeiling(0.89);
            } else if (preset === "balanced") {
              setMasterGain(1); setLimiterEnabled(true); setLimiterCeiling(0.95);
            } else if (preset === "loud") {
              setMasterGain(1.15); setLimiterEnabled(true); setLimiterCeiling(0.98);
            }
          }}
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          className="rounded-lg border border-amber-300/20 bg-black px-3 py-2 text-[10px] font-black uppercase text-amber-100 disabled:opacity-30"
          aria-label="Master output preset"
        >
          <option value="streaming">Streaming Safe</option>
          <option value="balanced">Balanced</option>
          <option value="loud">Loud Preview</option>
          <option value="custom" disabled>Custom</option>
        </select>
        <label className="flex items-center gap-2 text-[10px] font-black text-white/45">
          GAIN
          <input
            type="range"
            min={0}
            max={1.25}
            step={0.01}
            value={masterGain}
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onChange={(event) => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setMasterGain(Number(event.target.value));
            }}
            className="w-28 accent-amber-300 disabled:opacity-30"
          />
          {Math.round(masterGain * 100)}%
        </label>
        <button
          type="button"
          aria-pressed={limiterEnabled}
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          onClick={() => {
            if (comparingSnapshot || comparedMixerCheckpointId) return;
            setLimiterEnabled((enabled) => !enabled);
          }}
          className={`rounded-lg px-3 py-2 text-[10px] font-black disabled:opacity-30 ${
            limiterEnabled ? "bg-amber-300 text-black" : "border border-white/15 text-white/55"
          }`}
        >
          LIMITER {limiterEnabled ? "ON" : "OFF"}
        </button>
        <label className="flex items-center gap-2 text-[10px] font-black text-white/45">
          CEILING
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.01}
            value={limiterCeiling}
            onChange={(event) => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setLimiterCeiling(Number(event.target.value));
            }}
            className="w-24 accent-rose-300 disabled:opacity-30"
            disabled={
              !limiterEnabled
              || comparingSnapshot
              || Boolean(comparedMixerCheckpointId)
            }
          />
          {(20 * Math.log10(limiterCeiling)).toFixed(1)} dB
        </label>
        <div className="flex min-w-44 flex-1 items-center gap-2">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/70">
            <div
              className={`h-full rounded-full transition-[width] duration-100 ${
                masterPeakDb > -1 ? "bg-rose-400" : masterPeakDb > -6 ? "bg-amber-300" : "bg-emerald-400"
              }`}
              style={{ width: `${masterLevel * 100}%` }}
            />
          </div>
          <span className="w-16 font-mono text-[10px] text-white/65">
            {masterPeakDb.toFixed(1)} dB
          </span>
        </div>
        <span className="font-mono text-[10px] font-black text-amber-100">
          {masterLoudness.toFixed(1)} LUFS
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-sky-300/10 bg-sky-300/[0.025] px-5 py-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-sky-200/70">
          Stereo Image
        </span>
        <label className="flex items-center gap-2 text-[10px] font-black text-white/45">
          BALANCE
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={masterBalance}
            onChange={(event) => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setMasterBalance(Number(event.target.value));
            }}
            className="w-28 accent-sky-300 disabled:opacity-30"
            disabled={
              monoCheck
              || comparingSnapshot
              || Boolean(comparedMixerCheckpointId)
            }
          />
          <span className="w-8 font-mono text-[9px]">
            {masterBalance === 0
              ? "C"
              : `${masterBalance < 0 ? "L" : "R"}${Math.round(Math.abs(masterBalance) * 100)}`}
          </span>
        </label>
        <button
          type="button"
          aria-pressed={monoCheck}
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          onClick={() => {
            if (comparingSnapshot || comparedMixerCheckpointId) return;
            setMonoCheck((enabled) => !enabled);
          }}
          className={`rounded px-3 py-1.5 text-[10px] font-black disabled:opacity-30 ${
            monoCheck ? "bg-sky-300 text-black" : "border border-sky-300/20 text-sky-100"
          }`}
        >
          MONO {monoCheck ? "ON" : "CHECK"}
        </button>
        <div className="grid min-w-44 flex-1 grid-cols-[10px_1fr_38px] items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[9px] text-white/35">L</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/70">
            <div className="h-full rounded-full bg-sky-300" style={{ width: `${stereoMaster.left * 100}%` }} />
          </div>
          <span className="font-mono text-[9px] text-white/45">{Math.round(stereoMaster.left * 100)}</span>
          <span className="font-mono text-[9px] text-white/35">R</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/70">
            <div className="h-full rounded-full bg-violet-300" style={{ width: `${stereoMaster.right * 100}%` }} />
          </div>
          <span className="font-mono text-[9px] text-white/45">{Math.round(stereoMaster.right * 100)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-white/35">PHASE</span>
          <div className="relative h-2 w-24 overflow-hidden rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400">
            <span
              className="absolute top-[-2px] h-3 w-1 rounded bg-white shadow"
              style={{ left: `${((stereoMaster.correlation + 1) / 2) * 100}%` }}
            />
          </div>
          <span className={`w-8 font-mono text-[9px] ${
            stereoMaster.correlation < 0 ? "text-rose-300" : "text-emerald-200"
          }`}>
            {stereoMaster.correlation.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-fuchsia-300/10 bg-fuchsia-300/[0.025] px-5 py-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-200/70">
          Reference A/B
        </span>
        <select
          value={referenceTrackId}
          onChange={(event) => {
            if (comparingSnapshot || comparedMixerCheckpointId) return;
            setReferenceTrackId(event.target.value);
            if (!event.target.value) setComparisonMode("mix");
          }}
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          className="max-w-52 rounded border border-fuchsia-300/20 bg-black px-3 py-1.5 text-[10px] font-black text-fuchsia-100 disabled:opacity-30"
          aria-label="Reference track"
        >
          <option value="">Choose linked track</option>
          {lanes.filter((lane) => lane.trackId !== session.songId).map((lane) => (
            <option key={lane.trackId} value={lane.trackId}>
              {trackById.get(lane.trackId)?.title || lane.trackId}
            </option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded-lg border border-white/10">
          <button
            type="button"
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onClick={() => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setComparisonMode("mix");
            }}
            className={`px-3 py-1.5 text-[10px] font-black disabled:opacity-30 ${
              comparisonMode === "mix" ? "bg-cyan-300 text-black" : "bg-black text-white/50"
            }`}
          >
            A · MIX
          </button>
          <button
            type="button"
            disabled={
              !referenceTrackId
              || comparingSnapshot
              || Boolean(comparedMixerCheckpointId)
            }
            onClick={() => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setComparisonMode("reference");
            }}
            className={`px-3 py-1.5 text-[10px] font-black disabled:opacity-30 ${
              comparisonMode === "reference"
                ? "bg-fuchsia-300 text-black"
                : "bg-black text-white/50"
            }`}
          >
            B · REF
          </button>
        </div>
        <button
          type="button"
          aria-pressed={referenceMatch}
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          onClick={() => {
            if (comparingSnapshot || comparedMixerCheckpointId) return;
            setReferenceMatch((enabled) => !enabled);
          }}
          className={`rounded px-3 py-1.5 text-[10px] font-black disabled:opacity-30 ${
            referenceMatch ? "bg-fuchsia-300/20 text-fuchsia-100" : "border border-white/10 text-white/45"
          }`}
        >
          MATCH {referenceMatch ? "ON" : "OFF"}
        </button>
        <div className="flex min-w-40 flex-1 items-center gap-2">
          <span className="font-mono text-[9px] text-cyan-200/60">A</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/70">
            <div className="h-full rounded-full bg-cyan-300" style={{ width: `${masterLevel * 100}%` }} />
          </div>
          <span className="font-mono text-[9px] text-fuchsia-200/60">B</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/70">
            <div className="h-full rounded-full bg-fuchsia-300" style={{ width: `${matchedReferenceLevel * 100}%` }} />
          </div>
        </div>
        <span className="font-mono text-[9px] text-white/40">
          {referenceTrackId
            ? `${referenceGain >= 1 ? "+" : ""}${(20 * Math.log10(referenceGain)).toFixed(1)} dB match`
            : "Select a reference"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-indigo-300/10 bg-indigo-300/[0.025] px-5 py-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200/70">
          Mixer History
        </span>
        <button
          type="button"
          disabled={
            !mixerUndoHistory.length
            || comparingSnapshot
            || Boolean(comparedMixerCheckpointId)
          }
          onClick={undoMixerChange}
          className="rounded border border-indigo-300/20 px-3 py-1.5 text-[10px] font-black text-indigo-100 disabled:opacity-30"
        >
          Undo{mixerUndoHistory.length ? `: ${mixerUndoHistory.at(-1)!.label}` : ""}
        </button>
        <button
          type="button"
          disabled={
            !mixerRedoHistory.length
            || comparingSnapshot
            || Boolean(comparedMixerCheckpointId)
          }
          onClick={redoMixerChange}
          className="rounded border border-indigo-300/20 px-3 py-1.5 text-[10px] font-black text-indigo-100 disabled:opacity-30"
        >
          Redo{mixerRedoHistory.length ? `: ${mixerRedoHistory.at(-1)!.label}` : ""}
        </button>
        <span className="font-mono text-[9px] text-white/35">
          {mixerUndoHistory.length} undo · {mixerRedoHistory.length} redo · {mixerCheckpoints.length} pinned
        </span>
        <input
          value={mixerHistorySearch}
          onChange={(event) => {
            setMixerHistorySearch(event.target.value);
            if (event.target.value) setShowMixerHistory(true);
          }}
          placeholder="Search history"
          className="w-32 rounded border border-indigo-300/15 bg-black px-2 py-1.5 text-[9px] text-white placeholder:text-white/25"
          aria-label="Search mixer history"
        />
        <button
          type="button"
          onClick={() => setShowMixerHistory((visible) => !visible)}
          className="rounded border border-white/10 px-2 py-1.5 text-[9px] font-black text-white/55"
        >
          {showMixerHistory ? "Close Browser" : "Browse All"}
        </button>
        <button
          type="button"
          disabled={!mixerCheckpoints.length}
          onClick={exportMixerCheckpoints}
          className="rounded border border-amber-300/15 px-2 py-1.5 text-[9px] font-black text-amber-100 disabled:opacity-30"
        >
          Export Pins
        </button>
        <button
          type="button"
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          onClick={() => mixerCheckpointFileRef.current?.click()}
          className="rounded border border-violet-300/15 px-2 py-1.5 text-[9px] font-black text-violet-100 disabled:opacity-30"
        >
          Import Pins
        </button>
        <input
          ref={mixerCheckpointFileRef}
          type="file"
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importMixerCheckpoints(file);
          }}
          aria-label="Import mixer checkpoint file"
        />
        {mixerCheckpointTransferStatus ? (
          <span className="text-[9px] text-amber-100/45">
            {mixerCheckpointTransferStatus}
          </span>
        ) : null}
        <span className="ml-auto text-[9px] text-white/25">
          Ctrl+Z · Ctrl+Shift+Z · 50 changes
        </span>
      </div>

      {mixerUndoHistory.length ? (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-indigo-300/10 bg-indigo-300/[0.015] px-5 py-2">
          <span className="shrink-0 text-[9px] font-black uppercase text-indigo-200/45">
            Recent
          </span>
          {mixerUndoHistory.slice(-6).map((entry, index, recent) => (
            <div key={`${entry.createdAt}:${index}`} className="flex shrink-0 items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-300/70" />
              <span
                className={`max-w-48 truncate rounded border px-2 py-1 text-[9px] ${
                  index === recent.length - 1
                    ? "border-indigo-300/30 bg-indigo-300/10 text-indigo-100"
                    : "border-white/10 text-white/40"
                }`}
                title={`${entry.label} · ${new Date(entry.createdAt).toLocaleTimeString()}`}
              >
                {entry.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {showMixerHistory ? (
        <div className="border-b border-indigo-300/10 bg-black/35 px-5 py-3">
          {mixerCheckpoints.length ? (
            <div className="mb-3">
              <div className="mb-2 flex items-center justify-between text-[9px] text-amber-200/55">
                <span className="font-black uppercase tracking-wider">Pinned Checkpoints</span>
                <span>Protected from the 50-change history limit</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {[...filteredMixerCheckpoints].reverse().map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="grid gap-1 rounded-lg border border-amber-300/20 bg-amber-300/[0.04] p-2"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-amber-200">★</span>
                      <input
                        value={checkpoint.name}
                        disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                        onChange={(event) => updateMixerCheckpoint(checkpoint.id, {
                          name: event.target.value,
                        })}
                        className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-1 text-[9px] font-black text-amber-100 outline-none focus:border-amber-300/25 disabled:opacity-30"
                        aria-label={`Checkpoint name for ${checkpoint.label}`}
                      />
                      <button
                        type="button"
                        disabled={
                          comparingSnapshot
                          || (
                            !comparedMixerCheckpointId
                            && summarizeSnapshotDifference(checkpoint.state)
                              === "Matches current mixer"
                          )
                        }
                        onClick={() => restoreMixerCheckpoint(checkpoint)}
                        className="rounded bg-amber-300/15 px-2 py-1 text-[8px] font-black text-amber-100 hover:bg-amber-300/25 disabled:opacity-30"
                        title={`Restore ${checkpoint.name}`}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        disabled={comparingSnapshot}
                        onClick={() => toggleMixerCheckpointComparison(checkpoint)}
                        className={`rounded px-2 py-1 text-[8px] font-black disabled:opacity-30 ${
                          comparedMixerCheckpointId === checkpoint.id
                            ? "bg-cyan-300 text-black"
                            : "border border-cyan-300/20 text-cyan-100"
                        }`}
                      >
                        {comparedMixerCheckpointId === checkpoint.id ? "Return" : "A/B"}
                      </button>
                      <button
                        type="button"
                        disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                        onClick={() => unpinMixerCheckpoint(checkpoint.id)}
                        className="rounded px-1.5 py-1 text-[8px] text-white/35 hover:bg-white/5 hover:text-white/70 disabled:opacity-25"
                        aria-label={`Unpin ${checkpoint.name}`}
                      >
                        Unpin
                      </button>
                    </div>
                    <input
                      value={checkpoint.notes}
                      disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                      onChange={(event) => updateMixerCheckpoint(checkpoint.id, {
                        notes: event.target.value,
                      })}
                      placeholder="Add checkpoint notes"
                      className="w-full rounded border border-white/5 bg-black/25 px-2 py-1 text-[8px] text-white/55 outline-none placeholder:text-white/20 focus:border-amber-300/20 disabled:opacity-30"
                      aria-label={`Notes for ${checkpoint.name}`}
                    />
                    <div className="flex items-center justify-between gap-2 px-2">
                      <span className={`font-mono text-[8px] ${
                        summarizeSnapshotDifference(checkpoint.state) === "Matches current mixer"
                          ? "text-emerald-200/70"
                          : "text-amber-200/55"
                      }`}>
                        {summarizeSnapshotDifference(checkpoint.state)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedMixerCheckpointId((current) =>
                          current === checkpoint.id ? "" : checkpoint.id)}
                        className="text-[8px] font-black text-cyan-100/55 hover:text-cyan-100"
                        aria-expanded={expandedMixerCheckpointId === checkpoint.id}
                      >
                        {expandedMixerCheckpointId === checkpoint.id ? "Hide Details" : "Details"}
                      </button>
                    </div>
                    {expandedMixerCheckpointId === checkpoint.id ? (
                      <div className="grid gap-2 rounded border border-cyan-300/10 bg-black/25 px-3 py-2">
                        <ul className="grid gap-1">
                          {listSnapshotDifferences(checkpoint.state).map((detail) => (
                            <li key={detail} className="text-[8px] text-cyan-50/55">
                              <span className="mr-1 text-cyan-300/50">•</span>{detail}
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap items-center gap-1 border-t border-white/5 pt-2">
                          <select
                            value={checkpointLaneSelections[checkpoint.id]
                              ?? checkpoint.state.lanes.find((savedLane) =>
                                lanes.some((lane) => lane.trackId === savedLane.trackId))?.trackId
                              ?? ""}
                            onChange={(event) => setCheckpointLaneSelections((selections) => ({
                              ...selections,
                              [checkpoint.id]: event.target.value,
                            }))}
                            className="min-w-48 flex-1 basis-48 rounded border border-white/10 bg-black px-2 py-1 text-[8px] text-cyan-50/70"
                            aria-label={`Lane to recall from ${checkpoint.name}`}
                          >
                            {checkpoint.state.lanes
                              .filter((savedLane) =>
                                lanes.some((lane) => lane.trackId === savedLane.trackId))
                              .map((savedLane) => (
                                <option key={savedLane.trackId} value={savedLane.trackId}>
                                  {trackById.get(savedLane.trackId)?.title ?? savedLane.trackId}
                                </option>
                              ))}
                          </select>
                          {([
                            ["all", "All"],
                            ["mix", "Level/Pan"],
                            ["routing", "Sends"],
                            ["effects", "FX"],
                          ] as const).map(([section, label]) => (
                            <button
                              key={section}
                              type="button"
                              disabled={
                                Boolean(comparedMixerCheckpointId)
                                || comparingSnapshot
                                || !checkpoint.state.lanes.some((savedLane) =>
                                  lanes.some((lane) => lane.trackId === savedLane.trackId))
                              }
                              onClick={() => recallMixerCheckpointLane(
                                checkpoint,
                                checkpointLaneSelections[checkpoint.id]
                                  ?? checkpoint.state.lanes.find((savedLane) =>
                                    lanes.some((lane) => lane.trackId === savedLane.trackId))?.trackId
                                  ?? "",
                                section,
                              )}
                              className="rounded bg-cyan-300/15 px-2 py-1 text-[8px] font-black text-cyan-100 hover:bg-cyan-300/25 disabled:opacity-30"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="grid gap-1 border-t border-white/5 pt-2">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-[8px] font-black uppercase text-white/35">
                              Multi-lane recall · {checkpointMultiLaneSelections[checkpoint.id]?.length ?? 0} selected
                            </span>
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <span
                                className="rounded border border-white/10 px-2 py-1 text-[8px] text-white/40"
                                title="Selected lanes shown by the current filter"
                              >
                                {selectedMatchingCheckpointLaneCount(checkpoint)}/
                                {matchingCheckpointLanes(checkpoint).length} visible
                              </span>
                              <span
                                className="rounded border border-indigo-300/15 px-2 py-1 text-[8px] text-indigo-100/55"
                                title="Selected available lanes hidden by the current filter"
                              >
                                {selectedHiddenCheckpointLaneCount(checkpoint)} hidden
                              </span>
                              <span
                                className="rounded border border-rose-300/15 px-2 py-1 text-[8px] text-rose-100/55"
                                title="Selected checkpoint lanes whose project tracks are unavailable"
                              >
                                {selectedUnavailableCheckpointLaneCount(checkpoint)} unavailable
                              </span>
                              <span
                                className="rounded border border-amber-300/15 px-2 py-1 text-[8px] text-white/40"
                                title="Selected recall lanes by checkpoint comparison status"
                              >
                                <span className="text-amber-100/70">
                                  {selectedCheckpointLaneChangeCount(checkpoint, true)} changed
                                </span>
                                {" / "}
                                <span className="text-emerald-100/70">
                                  {selectedCheckpointLaneChangeCount(checkpoint, false)} unchanged
                                </span>
                              </span>
                              {([
                                ["all", "All"],
                                ["mix", "Level/Pan"],
                                ["routing", "Sends"],
                                ["effects", "FX"],
                              ] as const).map(([section, label]) => {
                                const changedIds = changedSelectedCheckpointLaneIds(
                                  checkpoint,
                                  section,
                                );
                                return (
                                  <button
                                    key={section}
                                    type="button"
                                    disabled={
                                      Boolean(comparedMixerCheckpointId)
                                      || comparingSnapshot
                                      || !changedIds.length
                                    }
                                    onClick={() => recallMixerCheckpointLanes(
                                      checkpoint,
                                      changedIds,
                                      section,
                                    )}
                                    className="rounded bg-indigo-300/15 px-2 py-1 text-[8px] font-black text-indigo-100 hover:bg-indigo-300/25 disabled:opacity-30"
                                  >
                                    {label} ({changedIds.length})
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <input
                              value={checkpointLaneSearches[checkpoint.id] ?? ""}
                              onChange={(event) => setCheckpointLaneSearches((searches) => ({
                                ...searches,
                                [checkpoint.id]: event.target.value,
                              }))}
                              onKeyDown={(event) => {
                                if (event.key !== "Escape") return;
                                event.preventDefault();
                                setCheckpointLaneSearches((searches) => ({
                                  ...searches,
                                  [checkpoint.id]: "",
                                }));
                              }}
                              placeholder="Filter checkpoint lanes"
                              className="min-w-48 flex-1 basis-48 rounded border border-white/10 bg-black px-2 py-1 text-[8px] text-white/60 outline-none placeholder:text-white/20 focus:border-indigo-300/25"
                              aria-label={`Filter lanes in ${checkpoint.name}`}
                              title="Press Escape to clear this search"
                            />
                            <span
                              className="whitespace-nowrap text-[8px] text-white/30"
                              title="Checkpoint lanes visible in the current view"
                            >
                              {matchingCheckpointLanes(checkpoint).length}/
                              {availableCheckpointLaneCount(checkpoint)} lanes
                            </span>
                            <button
                              type="button"
                              disabled={!checkpointLaneSearches[checkpoint.id]}
                              onClick={() => setCheckpointLaneSearches((searches) => ({
                                ...searches,
                                [checkpoint.id]: "",
                              }))}
                              className="rounded border border-white/10 px-2 py-1 text-[8px] text-white/45 hover:text-white/80 disabled:opacity-30"
                            >
                              Clear Search
                            </button>
                            <select
                              value={checkpointLaneOrders[checkpoint.id] ?? "checkpoint"}
                              onChange={(event) => setCheckpointLaneOrders((orders) => ({
                                ...orders,
                                [checkpoint.id]: event.target.value as
                                  | "checkpoint"
                                  | "name"
                                  | "selected"
                                  | "unselected"
                                  | "changed"
                                  | "unchanged",
                              }))}
                              className="rounded border border-white/10 bg-black px-2 py-1 text-[8px] text-white/55 outline-none"
                              aria-label={`Order lanes in ${checkpoint.name}`}
                            >
                              <option value="checkpoint">Checkpoint Order</option>
                              <option value="name">Name A-Z</option>
                              <option value="selected">Selected First</option>
                              <option value="unselected">Unselected First</option>
                              <option value="changed">Changed First</option>
                              <option value="unchanged">Unchanged First</option>
                            </select>
                            <button
                              type="button"
                              aria-pressed={Boolean(checkpointSelectedOnlyFilters[checkpoint.id])}
                              onClick={() => setCheckpointSelectedOnlyFilters((filters) => ({
                                ...filters,
                                [checkpoint.id]: !filters[checkpoint.id],
                              }))}
                              className={`rounded border px-2 py-1 text-[8px] ${
                                checkpointSelectedOnlyFilters[checkpoint.id]
                                  ? "border-indigo-300/30 bg-indigo-300/10 text-indigo-100"
                                  : "border-white/10 text-white/45 hover:text-white/80"
                              }`}
                            >
                              Selected Only
                            </button>
                            <button
                              type="button"
                              aria-pressed={Boolean(checkpointChangedOnlyFilters[checkpoint.id])}
                              onClick={() => {
                                setCheckpointChangedOnlyFilters((filters) => ({
                                  ...filters,
                                  [checkpoint.id]: !filters[checkpoint.id],
                                }));
                                setCheckpointUnchangedOnlyFilters((filters) => ({
                                  ...filters,
                                  [checkpoint.id]: false,
                                }));
                              }}
                              className={`rounded border px-2 py-1 text-[8px] ${
                                checkpointChangedOnlyFilters[checkpoint.id]
                                  ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                                  : "border-white/10 text-white/45 hover:text-white/80"
                              }`}
                            >
                              Changed Only
                            </button>
                            <button
                              type="button"
                              aria-pressed={Boolean(checkpointUnchangedOnlyFilters[checkpoint.id])}
                              onClick={() => {
                                setCheckpointUnchangedOnlyFilters((filters) => ({
                                  ...filters,
                                  [checkpoint.id]: !filters[checkpoint.id],
                                }));
                                setCheckpointChangedOnlyFilters((filters) => ({
                                  ...filters,
                                  [checkpoint.id]: false,
                                }));
                              }}
                              className={`rounded border px-2 py-1 text-[8px] ${
                                checkpointUnchangedOnlyFilters[checkpoint.id]
                                  ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                                  : "border-white/10 text-white/45 hover:text-white/80"
                              }`}
                            >
                              Unchanged Only
                            </button>
                            <select
                              value={checkpointChangeSectionFilters[checkpoint.id] ?? "all"}
                              disabled={
                                !checkpointChangedOnlyFilters[checkpoint.id]
                                && !checkpointUnchangedOnlyFilters[checkpoint.id]
                              }
                              onChange={(event) => setCheckpointChangeSectionFilters((filters) => ({
                                ...filters,
                                [checkpoint.id]: event.target.value as LaneRecallSection,
                              }))}
                              className={`rounded border bg-black px-2 py-1 text-[8px] outline-none disabled:opacity-30 ${
                                checkpointUnchangedOnlyFilters[checkpoint.id]
                                  ? "border-emerald-300/15 text-emerald-100/70"
                                  : "border-amber-300/15 text-amber-100/70"
                              }`}
                              aria-label={`Checkpoint lane comparison section in ${checkpoint.name}`}
                            >
                              <option value="all">All Sections</option>
                              <option value="mix">Level/Pan</option>
                              <option value="routing">Sends</option>
                              <option value="effects">FX</option>
                            </select>
                            <button
                              type="button"
                              disabled={
                                !checkpointLaneSearches[checkpoint.id]
                                && !checkpointSelectedOnlyFilters[checkpoint.id]
                                && !checkpointChangedOnlyFilters[checkpoint.id]
                                && !checkpointUnchangedOnlyFilters[checkpoint.id]
                              }
                              onClick={() => {
                                setCheckpointLaneSearches((searches) => ({
                                  ...searches,
                                  [checkpoint.id]: "",
                                }));
                                setCheckpointSelectedOnlyFilters((filters) => ({
                                  ...filters,
                                  [checkpoint.id]: false,
                                }));
                                setCheckpointChangedOnlyFilters((filters) => ({
                                  ...filters,
                                  [checkpoint.id]: false,
                                }));
                                setCheckpointUnchangedOnlyFilters((filters) => ({
                                  ...filters,
                                  [checkpoint.id]: false,
                                }));
                                setCheckpointChangeSectionFilters((filters) => ({
                                  ...filters,
                                  [checkpoint.id]: "all",
                                }));
                              }}
                              className="rounded border border-white/10 px-2 py-1 text-[8px] text-white/45 hover:text-white/80 disabled:opacity-30"
                            >
                              Clear Filter
                            </button>
                            <button
                              type="button"
                              disabled={
                                !checkpointLaneSearches[checkpoint.id]
                                && !checkpointSelectedOnlyFilters[checkpoint.id]
                                && !checkpointChangedOnlyFilters[checkpoint.id]
                                && !checkpointUnchangedOnlyFilters[checkpoint.id]
                                && (checkpointLaneOrders[checkpoint.id] ?? "checkpoint")
                                  === "checkpoint"
                              }
                              onClick={() => resetCheckpointLaneView(checkpoint.id)}
                              className="rounded border border-cyan-300/15 px-2 py-1 text-[8px] text-cyan-100/55 hover:text-cyan-100 disabled:opacity-30"
                            >
                              Reset View
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="mr-1 text-[8px] font-black uppercase text-cyan-100/45">
                              Recall visible
                            </span>
                            {([
                              ["all", "All"],
                              ["mix", "Level/Pan"],
                              ["routing", "Sends"],
                              ["effects", "FX"],
                            ] as const).map(([section, label]) => (
                              <button
                                key={section}
                                type="button"
                                disabled={
                                  Boolean(comparedMixerCheckpointId)
                                  || comparingSnapshot
                                  || !matchingCheckpointLanes(checkpoint).length
                                }
                                onClick={() => recallMixerCheckpointLanes(
                                  checkpoint,
                                  matchingCheckpointLanes(checkpoint)
                                    .map((lane) => lane.trackId),
                                  section,
                                )}
                                className="rounded bg-cyan-300/10 px-2 py-1 text-[8px] font-black text-cyan-100/70 hover:bg-cyan-300/20 disabled:opacity-30"
                              >
                                {label}
                              </button>
                            ))}
                            <span className="ml-auto whitespace-nowrap text-[8px] text-white/25">
                              Keeps saved selection
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="mr-1 text-[8px] font-black uppercase text-amber-100/45">
                              Recall changed visible
                            </span>
                            {([
                              ["all", "All"],
                              ["mix", "Level/Pan"],
                              ["routing", "Sends"],
                              ["effects", "FX"],
                            ] as const).map(([section, label]) => {
                              const changedIds = changedMatchingCheckpointLaneIds(
                                checkpoint,
                                section,
                              );
                              return (
                                <button
                                  key={section}
                                  type="button"
                                  disabled={
                                    Boolean(comparedMixerCheckpointId)
                                    || comparingSnapshot
                                    || !changedIds.length
                                  }
                                  onClick={() => recallMixerCheckpointLanes(
                                    checkpoint,
                                    changedIds,
                                    section,
                                  )}
                                  className="rounded bg-amber-300/10 px-2 py-1 text-[8px] font-black text-amber-100/70 hover:bg-amber-300/20 disabled:opacity-30"
                                >
                                  {label} ({changedIds.length})
                                </button>
                              );
                            })}
                            <span className="ml-auto whitespace-nowrap text-[8px] text-white/25">
                              Changes only
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="mr-1 text-[8px] font-black uppercase text-indigo-100/45">
                              Recall hidden
                            </span>
                            {([
                              ["all", "All"],
                              ["mix", "Level/Pan"],
                              ["routing", "Sends"],
                              ["effects", "FX"],
                            ] as const).map(([section, label]) => (
                              <button
                                key={section}
                                type="button"
                                disabled={
                                  Boolean(comparedMixerCheckpointId)
                                  || comparingSnapshot
                                  || !hiddenCheckpointLanes(checkpoint).length
                                }
                                onClick={() => recallMixerCheckpointLanes(
                                  checkpoint,
                                  hiddenCheckpointLanes(checkpoint)
                                    .map((lane) => lane.trackId),
                                  section,
                                )}
                                className="rounded bg-indigo-300/10 px-2 py-1 text-[8px] font-black text-indigo-100/70 hover:bg-indigo-300/20 disabled:opacity-30"
                              >
                                {label}
                              </button>
                            ))}
                            <span className="ml-auto whitespace-nowrap text-[8px] text-white/25">
                              {hiddenCheckpointLanes(checkpoint).length} available
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="mr-1 text-[8px] font-black uppercase text-violet-100/45">
                              Recall changed hidden
                            </span>
                            {([
                              ["all", "All"],
                              ["mix", "Level/Pan"],
                              ["routing", "Sends"],
                              ["effects", "FX"],
                            ] as const).map(([section, label]) => {
                              const changedIds = changedHiddenCheckpointLaneIds(
                                checkpoint,
                                section,
                              );
                              return (
                                <button
                                  key={section}
                                  type="button"
                                  disabled={
                                    Boolean(comparedMixerCheckpointId)
                                    || comparingSnapshot
                                    || !changedIds.length
                                  }
                                  onClick={() => recallMixerCheckpointLanes(
                                    checkpoint,
                                    changedIds,
                                    section,
                                  )}
                                  className="rounded bg-violet-300/10 px-2 py-1 text-[8px] font-black text-violet-100/70 hover:bg-violet-300/20 disabled:opacity-30"
                                >
                                  {label} ({changedIds.length})
                                </button>
                              );
                            })}
                            <span className="ml-auto whitespace-nowrap text-[8px] text-white/25">
                              Hidden changes only
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                ...selections,
                                [checkpoint.id]: checkpoint.state.lanes
                                  .filter((savedLane) =>
                                    lanes.some((lane) => lane.trackId === savedLane.trackId))
                                  .map((lane) => lane.trackId),
                              }))}
                              className="rounded border border-white/10 px-2 py-1 text-[8px] text-white/50 hover:text-white/80"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              disabled={!availableCheckpointLaneCount(checkpoint)}
                              onClick={() => setCheckpointMultiLaneSelections((selections) => {
                                const selectedIds = new Set(selections[checkpoint.id] ?? []);
                                return {
                                  ...selections,
                                  [checkpoint.id]: checkpoint.state.lanes
                                    .filter((savedLane) =>
                                      lanes.some((lane) =>
                                        lane.trackId === savedLane.trackId)
                                      && !selectedIds.has(savedLane.trackId))
                                    .map((lane) => lane.trackId),
                                };
                              })}
                              className="rounded border border-cyan-300/15 px-2 py-1 text-[8px] text-cyan-100/60 hover:text-cyan-100 disabled:opacity-30"
                            >
                              Invert All
                            </button>
                            <button
                              type="button"
                              disabled={!matchingCheckpointLanes(checkpoint).length}
                              onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                ...selections,
                                [checkpoint.id]: Array.from(new Set([
                                  ...(selections[checkpoint.id] ?? []),
                                  ...matchingCheckpointLanes(checkpoint).map((lane) => lane.trackId),
                                ])),
                              }))}
                              className="rounded border border-indigo-300/15 px-2 py-1 text-[8px] text-indigo-100/60 hover:text-indigo-100 disabled:opacity-30"
                            >
                              Select Visible
                            </button>
                            <button
                              type="button"
                              disabled={availableCheckpointLaneCount(checkpoint)
                                <= matchingCheckpointLanes(checkpoint).length}
                              onClick={() => {
                                const visibleIds = new Set(
                                  matchingCheckpointLanes(checkpoint).map((lane) => lane.trackId),
                                );
                                setCheckpointMultiLaneSelections((selections) => ({
                                  ...selections,
                                  [checkpoint.id]: Array.from(new Set([
                                    ...(selections[checkpoint.id] ?? []),
                                    ...checkpoint.state.lanes
                                      .filter((savedLane) =>
                                        lanes.some((lane) =>
                                          lane.trackId === savedLane.trackId)
                                        && !visibleIds.has(savedLane.trackId))
                                      .map((lane) => lane.trackId),
                                  ])),
                                }));
                              }}
                              className="rounded border border-indigo-300/15 px-2 py-1 text-[8px] text-indigo-100/60 hover:text-indigo-100 disabled:opacity-30"
                            >
                              Select Hidden
                            </button>
                            <button
                              type="button"
                              disabled={!matchingCheckpointLanes(checkpoint).length}
                              onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                ...selections,
                                [checkpoint.id]: matchingCheckpointLanes(checkpoint)
                                  .map((lane) => lane.trackId),
                              }))}
                              className="rounded border border-indigo-300/15 bg-indigo-300/5 px-2 py-1 text-[8px] font-black text-indigo-100/70 hover:bg-indigo-300/10 disabled:opacity-30"
                            >
                              Only Visible
                            </button>
                            <button
                              type="button"
                              disabled={availableCheckpointLaneCount(checkpoint)
                                <= matchingCheckpointLanes(checkpoint).length}
                              onClick={() => {
                                const visibleIds = new Set(
                                  matchingCheckpointLanes(checkpoint).map((lane) => lane.trackId),
                                );
                                setCheckpointMultiLaneSelections((selections) => ({
                                  ...selections,
                                  [checkpoint.id]: checkpoint.state.lanes
                                    .filter((savedLane) =>
                                      lanes.some((lane) =>
                                        lane.trackId === savedLane.trackId)
                                      && !visibleIds.has(savedLane.trackId))
                                    .map((lane) => lane.trackId),
                                }));
                              }}
                              className="rounded border border-indigo-300/15 bg-indigo-300/5 px-2 py-1 text-[8px] font-black text-indigo-100/70 hover:bg-indigo-300/10 disabled:opacity-30"
                            >
                              Only Hidden
                            </button>
                            <button
                              type="button"
                              disabled={!matchingCheckpointLanes(checkpoint).some((lane) =>
                                checkpointMultiLaneSelections[checkpoint.id]?.includes(lane.trackId))}
                              onClick={() => {
                                const visibleIds = new Set(
                                  matchingCheckpointLanes(checkpoint).map((lane) => lane.trackId),
                                );
                                setCheckpointMultiLaneSelections((selections) => ({
                                  ...selections,
                                  [checkpoint.id]: (selections[checkpoint.id] ?? [])
                                    .filter((id) => !visibleIds.has(id)),
                                }));
                              }}
                              className="rounded border border-white/10 px-2 py-1 text-[8px] text-white/50 hover:text-white/80 disabled:opacity-30"
                            >
                              Deselect Visible
                            </button>
                            <button
                              type="button"
                              disabled={!(checkpointMultiLaneSelections[checkpoint.id] ?? [])
                                .some((trackId) => !matchingCheckpointLanes(checkpoint)
                                  .some((lane) => lane.trackId === trackId))}
                              onClick={() => {
                                const visibleIds = new Set(
                                  matchingCheckpointLanes(checkpoint).map((lane) => lane.trackId),
                                );
                                setCheckpointMultiLaneSelections((selections) => ({
                                  ...selections,
                                  [checkpoint.id]: (selections[checkpoint.id] ?? [])
                                    .filter((trackId) => visibleIds.has(trackId)),
                                }));
                              }}
                              className="rounded border border-white/10 px-2 py-1 text-[8px] text-white/50 hover:text-white/80 disabled:opacity-30"
                            >
                              Deselect Hidden
                            </button>
                            <button
                              type="button"
                              disabled={!selectedUnavailableCheckpointLaneCount(checkpoint)}
                              onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                ...selections,
                                [checkpoint.id]: (selections[checkpoint.id] ?? [])
                                  .filter((trackId) =>
                                    lanes.some((lane) => lane.trackId === trackId)),
                              }))}
                              className="rounded border border-rose-300/15 px-2 py-1 text-[8px] text-rose-100/60 hover:text-rose-100 disabled:opacity-30"
                            >
                              Remove Unavailable
                            </button>
                            <button
                              type="button"
                              disabled={!matchingCheckpointLanes(checkpoint).length}
                              onClick={() => {
                                const visibleLanes = matchingCheckpointLanes(checkpoint);
                                const visibleIds = new Set(visibleLanes.map((lane) => lane.trackId));
                                setCheckpointMultiLaneSelections((selections) => {
                                  const current = selections[checkpoint.id] ?? [];
                                  const selectedIds = new Set(current);
                                  return {
                                    ...selections,
                                    [checkpoint.id]: [
                                      ...current.filter((id) => !visibleIds.has(id)),
                                      ...visibleLanes
                                        .filter((lane) => !selectedIds.has(lane.trackId))
                                        .map((lane) => lane.trackId),
                                    ],
                                  };
                                });
                              }}
                              className="rounded border border-cyan-300/15 px-2 py-1 text-[8px] text-cyan-100/60 hover:text-cyan-100 disabled:opacity-30"
                            >
                              Invert Visible
                            </button>
                            <button
                              type="button"
                              disabled={availableCheckpointLaneCount(checkpoint)
                                <= matchingCheckpointLanes(checkpoint).length}
                              onClick={() => {
                                const visibleIds = new Set(
                                  matchingCheckpointLanes(checkpoint).map((lane) => lane.trackId),
                                );
                                const hiddenLanes = checkpoint.state.lanes.filter((savedLane) =>
                                  lanes.some((lane) => lane.trackId === savedLane.trackId)
                                  && !visibleIds.has(savedLane.trackId));
                                const hiddenIds = new Set(
                                  hiddenLanes.map((lane) => lane.trackId),
                                );
                                setCheckpointMultiLaneSelections((selections) => {
                                  const current = selections[checkpoint.id] ?? [];
                                  const selectedIds = new Set(current);
                                  return {
                                    ...selections,
                                    [checkpoint.id]: [
                                      ...current.filter((id) => !hiddenIds.has(id)),
                                      ...hiddenLanes
                                        .filter((lane) => !selectedIds.has(lane.trackId))
                                        .map((lane) => lane.trackId),
                                    ],
                                  };
                                });
                              }}
                              className="rounded border border-cyan-300/15 px-2 py-1 text-[8px] text-cyan-100/60 hover:text-cyan-100 disabled:opacity-30"
                            >
                              Invert Hidden
                            </button>
                            <button
                              type="button"
                              disabled={!changedMatchingCheckpointLaneIds(
                                checkpoint,
                                checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                              ).length}
                              onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                ...selections,
                                [checkpoint.id]: Array.from(new Set([
                                  ...(selections[checkpoint.id] ?? []),
                                  ...changedMatchingCheckpointLaneIds(
                                    checkpoint,
                                    checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                                  ),
                                ])),
                              }))}
                              className="rounded border border-amber-300/15 px-2 py-1 text-[8px] text-amber-100/60 hover:text-amber-100 disabled:opacity-30"
                            >
                              Select Changed Visible
                            </button>
                            <button
                              type="button"
                              disabled={!changedMatchingCheckpointLaneIds(
                                checkpoint,
                                checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                              ).length}
                              onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                ...selections,
                                [checkpoint.id]: changedMatchingCheckpointLaneIds(
                                  checkpoint,
                                  checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                                ),
                              }))}
                              className="rounded border border-amber-300/15 bg-amber-300/5 px-2 py-1 text-[8px] font-black text-amber-100/70 hover:bg-amber-300/10 disabled:opacity-30"
                            >
                              Only Changed Visible
                            </button>
                            <button
                              type="button"
                              disabled={!changedMatchingCheckpointLaneIds(
                                checkpoint,
                                checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                              ).some((trackId) =>
                                checkpointMultiLaneSelections[checkpoint.id]?.includes(trackId))}
                              onClick={() => {
                                const changedVisibleIds = new Set(
                                  changedMatchingCheckpointLaneIds(
                                    checkpoint,
                                    checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                                  ),
                                );
                                setCheckpointMultiLaneSelections((selections) => ({
                                  ...selections,
                                  [checkpoint.id]: (selections[checkpoint.id] ?? [])
                                    .filter((trackId) => !changedVisibleIds.has(trackId)),
                                }));
                              }}
                              className="rounded border border-amber-300/15 px-2 py-1 text-[8px] text-amber-100/60 hover:text-amber-100 disabled:opacity-30"
                            >
                              Deselect Changed Visible
                            </button>
                            <button
                              type="button"
                              disabled={!unchangedMatchingCheckpointLaneIds(
                                checkpoint,
                                checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                              ).length}
                              onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                ...selections,
                                [checkpoint.id]: Array.from(new Set([
                                  ...(selections[checkpoint.id] ?? []),
                                  ...unchangedMatchingCheckpointLaneIds(
                                    checkpoint,
                                    checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                                  ),
                                ])),
                              }))}
                              className="rounded border border-emerald-300/15 px-2 py-1 text-[8px] text-emerald-100/60 hover:text-emerald-100 disabled:opacity-30"
                            >
                              Select Unchanged Visible
                            </button>
                            <button
                              type="button"
                              disabled={!unchangedMatchingCheckpointLaneIds(
                                checkpoint,
                                checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                              ).length}
                              onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                ...selections,
                                [checkpoint.id]: unchangedMatchingCheckpointLaneIds(
                                  checkpoint,
                                  checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                                ),
                              }))}
                              className="rounded border border-emerald-300/15 bg-emerald-300/5 px-2 py-1 text-[8px] font-black text-emerald-100/70 hover:bg-emerald-300/10 disabled:opacity-30"
                            >
                              Only Unchanged Visible
                            </button>
                            <button
                              type="button"
                              disabled={!unchangedMatchingCheckpointLaneIds(
                                checkpoint,
                                checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                              ).some((trackId) =>
                                checkpointMultiLaneSelections[checkpoint.id]?.includes(trackId))}
                              onClick={() => {
                                const unchangedVisibleIds = new Set(
                                  unchangedMatchingCheckpointLaneIds(
                                    checkpoint,
                                    checkpointChangeSectionFilters[checkpoint.id] ?? "all",
                                  ),
                                );
                                setCheckpointMultiLaneSelections((selections) => ({
                                  ...selections,
                                  [checkpoint.id]: (selections[checkpoint.id] ?? [])
                                    .filter((trackId) => !unchangedVisibleIds.has(trackId)),
                                }));
                              }}
                              className="rounded border border-emerald-300/15 px-2 py-1 text-[8px] text-emerald-100/60 hover:text-emerald-100 disabled:opacity-30"
                            >
                              Deselect Unchanged Visible
                            </button>
                            {([
                              ["all", "Changed"],
                              ["mix", "Level"],
                              ["routing", "Sends"],
                              ["effects", "FX"],
                            ] as const).map(([section, label]) => (
                              <button
                                key={section}
                                type="button"
                                onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                  ...selections,
                                  [checkpoint.id]: changedCheckpointLaneIds(
                                    checkpoint.state,
                                    section,
                                  ),
                                }))}
                                className="rounded border border-amber-300/15 px-2 py-1 text-[8px] text-amber-100/60 hover:text-amber-100"
                              >
                                {label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setCheckpointMultiLaneSelections((selections) => ({
                                ...selections,
                                [checkpoint.id]: [],
                              }))}
                              className="rounded border border-white/10 px-2 py-1 text-[8px] text-white/35 hover:text-white/70"
                            >
                              Clear
                            </button>
                          </div>
                          <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto">
                            {matchingCheckpointLanes(checkpoint)
                              .map((savedLane) => {
                                const selected =
                                  checkpointMultiLaneSelections[checkpoint.id]?.includes(
                                    savedLane.trackId,
                                  ) ?? false;
                                return (
                                  <label
                                    key={savedLane.trackId}
                                    className={`flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-[8px] ${
                                      selected
                                        ? "border-indigo-300/30 bg-indigo-300/10 text-indigo-100"
                                        : "border-white/10 text-white/40"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => setCheckpointMultiLaneSelections((selections) => {
                                        const current = selections[checkpoint.id] ?? [];
                                        return {
                                          ...selections,
                                          [checkpoint.id]: current.includes(savedLane.trackId)
                                            ? current.filter((id) => id !== savedLane.trackId)
                                            : [...current, savedLane.trackId],
                                        };
                                      })}
                                      className="accent-indigo-300"
                                    />
                                    {trackById.get(savedLane.trackId)?.title ?? savedLane.trackId}
                                  </label>
                                );
                              })}
                          </div>
                          {!matchingCheckpointLanes(checkpoint).length ? (
                            <div className="flex items-center justify-center gap-2 py-1">
                              <span className="text-[8px] text-white/25">
                                No checkpoint lanes match this view
                              </span>
                              <button
                                type="button"
                                onClick={() => resetCheckpointLaneView(checkpoint.id)}
                                className="rounded border border-cyan-300/15 px-2 py-1 text-[8px] font-black text-cyan-100/60 hover:text-cyan-100"
                              >
                                Reset Lane View
                              </button>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-1 border-t border-white/5 pt-2">
                          {(["lanes", "master", "buses"] as const).map((section) => (
                            <button
                              key={section}
                              type="button"
                              disabled={
                                Boolean(comparedMixerCheckpointId)
                                || comparingSnapshot
                                || !mixerCheckpointSectionHasChanges(checkpoint, section)
                              }
                              onClick={() => recallMixerCheckpointSection(checkpoint, section)}
                              className="rounded border border-cyan-300/15 px-2 py-1 text-[8px] font-black capitalize text-cyan-100/70 hover:bg-cyan-300/10 disabled:opacity-30"
                            >
                              Recall {section}
                            </button>
                          ))}
                          <span className="ml-auto self-center text-[8px] text-white/25">
                            Selective recall is undoable
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mb-2 flex items-center justify-between text-[9px] text-white/30">
            <span>{filteredMixerHistory.length} matching changes</span>
            <span>Restore a point or pin it as a protected checkpoint</span>
          </div>
          <div className="grid max-h-40 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {[...filteredMixerHistory].reverse().map(({ entry, index }) => (
              <div
                key={`${entry.createdAt}:${index}`}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-left hover:border-indigo-300/30 hover:bg-indigo-300/[0.06]"
              >
                <button
                  type="button"
                  disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                  onClick={() => jumpToMixerHistory(index)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-30"
                >
                  <span className="rounded bg-indigo-300/10 px-1.5 py-1 font-mono text-[8px] text-indigo-200">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[9px] font-black text-white/65">
                    {entry.label}
                  </span>
                </button>
                <span className="font-mono text-[8px] text-white/25">
                  {new Date(entry.createdAt).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                <button
                  type="button"
                  disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                  onClick={() => pinMixerHistory(entry)}
                  className="rounded px-1.5 py-1 text-[10px] text-amber-200/50 hover:bg-amber-300/10 hover:text-amber-100 disabled:opacity-30"
                  aria-label={`Pin ${entry.label}`}
                  title="Pin checkpoint"
                >
                  ☆
                </button>
              </div>
            ))}
          </div>
          {!filteredMixerHistory.length ? (
            <p className="py-3 text-center text-[10px] text-white/30">
              No mixer changes match “{mixerHistorySearch}”.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-b border-emerald-300/10 bg-emerald-300/[0.025] px-5 py-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200/70">
          Mix Snapshots
        </span>
        <input
          value={snapshotName}
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          onChange={(event) => setSnapshotName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") saveMixSnapshot();
          }}
          placeholder={`Mix ${mixSnapshots.length + 1}`}
          className="w-32 rounded border border-emerald-300/15 bg-black px-2 py-1.5 text-[10px] text-white outline-none placeholder:text-white/25 disabled:opacity-30"
          aria-label="Mix snapshot name"
        />
        <button
          type="button"
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          onClick={saveMixSnapshot}
          className="rounded bg-emerald-300 px-3 py-1.5 text-[10px] font-black text-black disabled:opacity-30"
        >
          Save Current
        </button>
        <select
          value={selectedSnapshotId}
          onChange={(event) => {
            if (comparingSnapshot && snapshotCompareRef.current) {
              mixerApplyingHistoryRef.current = true;
              applyMixState(snapshotCompareRef.current);
              snapshotCompareRef.current = null;
              setComparingSnapshot(false);
            }
            setSelectedSnapshotId(event.target.value);
          }}
          className="max-w-44 rounded border border-white/10 bg-black px-3 py-1.5 text-[10px] font-black text-emerald-100"
          aria-label="Saved mix snapshot"
        >
          <option value="">Choose snapshot</option>
          {mixSnapshots.map((snapshot) => (
            <option key={snapshot.id} value={snapshot.id}>{snapshot.name}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={
            !selectedMixSnapshot
            || comparingSnapshot
            || Boolean(comparedMixerCheckpointId)
            || summarizeSnapshotDifference(selectedMixSnapshot) === "Matches current mixer"
          }
          onClick={recallMixSnapshot}
          className="rounded border border-emerald-300/20 px-3 py-1.5 text-[10px] font-black text-emerald-100 disabled:opacity-30"
        >
          Recall
        </button>
        <button
          type="button"
          disabled={
            !selectedMixSnapshot
            || Boolean(comparedMixerCheckpointId)
            || (
              !comparingSnapshot
              && summarizeSnapshotDifference(selectedMixSnapshot) === "Matches current mixer"
            )
          }
          onClick={toggleSnapshotComparison}
          className={`rounded px-3 py-1.5 text-[10px] font-black disabled:opacity-30 ${
            comparingSnapshot ? "bg-amber-300 text-black" : "border border-amber-300/20 text-amber-100"
          }`}
        >
          {comparingSnapshot ? "Return to Current" : "Compare"}
        </button>
        <button
          type="button"
          disabled={
            !selectedMixSnapshot
            || comparingSnapshot
            || Boolean(comparedMixerCheckpointId)
          }
          onClick={duplicateMixSnapshot}
          className="rounded border border-cyan-300/15 px-2 py-1.5 text-[9px] font-black text-cyan-100 disabled:opacity-30"
        >
          Duplicate
        </button>
        <button
          type="button"
          disabled={
            !selectedMixSnapshot
            || comparingSnapshot
            || Boolean(comparedMixerCheckpointId)
          }
          onClick={deleteMixSnapshot}
          className="rounded border border-rose-300/15 px-2 py-1.5 text-[9px] font-black text-rose-200 disabled:opacity-30"
        >
          Delete
        </button>
        <button
          type="button"
          disabled={!mixSnapshots.length}
          onClick={exportMixSnapshots}
          className="rounded border border-sky-300/15 px-2 py-1.5 text-[9px] font-black text-sky-100 disabled:opacity-30"
        >
          Export
        </button>
        <button
          type="button"
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          onClick={() => snapshotFileRef.current?.click()}
          className="rounded border border-violet-300/15 px-2 py-1.5 text-[9px] font-black text-violet-100 disabled:opacity-30"
        >
          Import
        </button>
        <input
          ref={snapshotFileRef}
          type="file"
          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importMixSnapshots(file);
          }}
          aria-label="Import mix snapshot file"
        />
        <span className="ml-auto text-[9px] text-white/30">
          {snapshotTransferStatus ? `${snapshotTransferStatus} · ` : ""}
          {mixSnapshots.length}/12 saved
        </span>
      </div>

      {selectedMixSnapshot ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-emerald-300/10 bg-emerald-300/[0.015] px-5 py-2">
          <input
            value={snapshotEditName}
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onChange={(event) => setSnapshotEditName(event.target.value)}
            className="w-36 rounded border border-white/10 bg-black px-2 py-1.5 text-[10px] text-white disabled:opacity-30"
            aria-label="Rename selected mix snapshot"
          />
          <input
            value={snapshotNotes}
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onChange={(event) => setSnapshotNotes(event.target.value)}
            placeholder="Mix notes"
            className="min-w-48 flex-1 rounded border border-white/10 bg-black px-2 py-1.5 text-[10px] text-white placeholder:text-white/25 disabled:opacity-30"
            aria-label="Selected mix snapshot notes"
          />
          <button
            type="button"
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onClick={updateSnapshotDetails}
            className="rounded bg-white/10 px-3 py-1.5 text-[9px] font-black text-white/70 disabled:opacity-30"
          >
            Save Details
          </button>
          <span className={`font-mono text-[9px] ${
            summarizeSnapshotDifference(selectedMixSnapshot) === "Matches current mixer"
              ? "text-emerald-200"
              : "text-amber-200"
          }`}>
            {summarizeSnapshotDifference(selectedMixSnapshot)}
          </span>
        </div>
      ) : null}

      <div className="flex min-h-10 flex-wrap items-center gap-2 border-b border-rose-300/10 bg-rose-300/[0.025] px-5 py-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-rose-200/65">
          Overload History
        </span>
        {masterOverloads.length ? masterOverloads.slice(-6).map((entry) => (
          <span
            key={entry.id}
            className="rounded border border-rose-300/20 bg-rose-300/10 px-2 py-1 font-mono text-[9px] text-rose-100"
            title={`Limiter input reached ${entry.peakDb.toFixed(1)} dB at ${clock(entry.seconds)}`}
          >
            {clock(entry.seconds)} · {entry.peakDb.toFixed(1)} dB
          </span>
        )) : (
          <span className="text-[10px] text-white/30">No ceiling crossings recorded</span>
        )}
        {masterOverloads.length ? (
          <button
            type="button"
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onClick={clearMasterOverloads}
            className="ml-auto rounded border border-white/10 px-2 py-1 text-[9px] font-black text-white/45 disabled:opacity-30"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-cyan-300/15 bg-cyan-300/[0.035] px-5 py-3">
        <span className="text-xs font-black uppercase tracking-wider text-cyan-200/75">Aux Returns</span>
        <label className="flex items-center gap-2 text-[10px] font-black text-white/45">
          A · REVERB
          <input type="range" min={0} max={1} step={0.01} value={reverbReturn}
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onChange={(event) => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setReverbReturn(Number(event.target.value));
            }}
            className="w-32 accent-cyan-300 disabled:opacity-30" />
          {Math.round(reverbReturn * 100)}%
        </label>
        <label className="flex items-center gap-2 text-[10px] font-black text-white/45">
          B · DELAY
          <input type="range" min={0} max={1} step={0.01} value={delayReturn}
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onChange={(event) => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setDelayReturn(Number(event.target.value));
            }}
            className="w-32 accent-violet-300 disabled:opacity-30" />
          {Math.round(delayReturn * 100)}%
        </label>
        <span className="ml-auto text-[10px] text-white/30">Shared post-fader buses</span>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-emerald-300/15 bg-emerald-300/[0.035] px-5 py-3">
        <span className="text-xs font-black uppercase tracking-wider text-emerald-200/75">Groups</span>
        {(["vocals", "music", "drums"] as const).map((groupId) => (
          <div key={groupId} className="flex items-center gap-2">
            <span className="w-12 text-[10px] font-black uppercase text-white/45">{groupId}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={groupBuses[groupId].volume}
              disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
              onChange={(event) => {
                if (comparingSnapshot || comparedMixerCheckpointId) return;
                setGroupBuses((current) => ({
                  ...current,
                  [groupId]: { ...current[groupId], volume: Number(event.target.value) },
                }));
              }}
              className="w-20 accent-emerald-300 disabled:opacity-30"
              aria-label={`${groupId} group volume`}
            />
            <span className="w-7 font-mono text-[9px] text-white/40">
              {Math.round(groupBuses[groupId].volume * 100)}
            </span>
            <button
              type="button"
              aria-pressed={groupBuses[groupId].muted}
              disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
              onClick={() => {
                if (comparingSnapshot || comparedMixerCheckpointId) return;
                setGroupBuses((current) => ({
                  ...current,
                  [groupId]: { ...current[groupId], muted: !current[groupId].muted },
                }));
              }}
              className={`rounded px-2 py-1 text-[9px] font-black disabled:opacity-30 ${
                groupBuses[groupId].muted ? "bg-amber-300 text-black" : "bg-white/10"
              }`}
            >
              M
            </button>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-white/30">Shared subgroup gain and mute</span>
      </div>

      {selectedEffect ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-violet-300/15 bg-violet-300/[0.05] px-5 py-3">
          <span className="text-xs font-black uppercase tracking-wider text-violet-200">
            {selectedEffect.effect.kind === "compressor" ? "Compressor" : selectedEffect.effect.kind} Editor
          </span>
          <span className="max-w-36 truncate text-[10px] text-white/40">
            {trackById.get(selectedEffect.lane.trackId)?.title || selectedEffect.lane.trackId}
          </span>
          <select
            value={selectedEffect.effect.preset}
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onChange={(event) => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setLanes((value) => updateTimelineLaneEffect(
                value,
                selectedEffect.lane.trackId,
                selectedEffect.effect.id,
                { preset: event.target.value },
              ));
            }}
            className="rounded-lg border border-white/15 bg-black px-3 py-2 text-xs font-black text-violet-100 disabled:opacity-30"
            aria-label="Effect preset"
          >
            {effectPresets[selectedEffect.effect.kind].map((preset) => (
              <option key={preset} value={preset}>{preset}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-[10px] font-black text-white/45">
            AMOUNT
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={selectedEffect.effect.amount}
              disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
              onChange={(event) => {
                if (comparingSnapshot || comparedMixerCheckpointId) return;
                setLanes((value) => updateTimelineLaneEffect(
                  value,
                  selectedEffect.lane.trackId,
                  selectedEffect.effect.id,
                  { amount: Number(event.target.value) },
                ));
              }}
              className="w-28 accent-violet-300 disabled:opacity-30"
            />
            {Math.round(selectedEffect.effect.amount * 100)}%
          </label>
          <label className="flex items-center gap-2 text-[10px] font-black text-white/45">
            MIX
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={selectedEffect.effect.mix}
              disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
              onChange={(event) => {
                if (comparingSnapshot || comparedMixerCheckpointId) return;
                setLanes((value) => updateTimelineLaneEffect(
                  value,
                  selectedEffect.lane.trackId,
                  selectedEffect.effect.id,
                  { mix: Number(event.target.value) },
                ));
              }}
              className="w-28 accent-cyan-300 disabled:opacity-30"
            />
            {Math.round(selectedEffect.effect.mix * 100)}%
          </label>
          <button
            type="button"
            disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
            onClick={() => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setLanes((value) => toggleTimelineLaneEffectBypass(
                value,
                selectedEffect.lane.trackId,
                selectedEffect.effect.id,
              ));
            }}
            className={`rounded-lg px-3 py-2 text-xs font-black disabled:opacity-30 ${
              selectedEffect.effect.bypassed
                ? "bg-amber-300 text-black"
                : "border border-white/15 text-white/65"
            }`}
          >
            {selectedEffect.effect.bypassed ? "Bypassed" : "Active"}
          </button>
          <button
            type="button"
            disabled={
              selectedEffect.lane.effects[0]?.id === selectedEffect.effect.id
              || comparingSnapshot
              || Boolean(comparedMixerCheckpointId)
            }
            onClick={() => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setLanes((value) => moveTimelineLaneEffect(
                value, selectedEffect.lane.trackId, selectedEffect.effect.id, -1,
              ));
            }}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-25"
          >Move Left</button>
          <button
            type="button"
            disabled={
              selectedEffect.lane.effects.at(-1)?.id === selectedEffect.effect.id
              || comparingSnapshot
              || Boolean(comparedMixerCheckpointId)
            }
            onClick={() => {
              if (comparingSnapshot || comparedMixerCheckpointId) return;
              setLanes((value) => moveTimelineLaneEffect(
                value, selectedEffect.lane.trackId, selectedEffect.effect.id, 1,
              ));
            }}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-25"
          >Move Right</button>
          <button
            type="button"
            onClick={() => setEffectClipboard(
              selectedEffect.lane.effects.map((effect) => ({ ...effect })),
            )}
            className="rounded-lg border border-cyan-300/25 px-3 py-2 text-xs font-black text-cyan-100"
          >Copy Rack</button>
          <button type="button" onClick={() => setSelectedEffectId(null)}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-black">Close</button>
        </div>
      ) : null}

      <div className="grid grid-cols-[220px_minmax(0,1fr)]">
        <div className="border-r border-white/10 bg-[#0a0a0a]">
          <div className="h-12 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-white/35">Tracks</div>
          {lanes.map((lane, index) => {
            const track = trackById.get(lane.trackId);
            const groupBus = lane.groupId === "none" ? null : groupBuses[lane.groupId];
            const automatedValue = timelineAutomationValueAt(
              automation,
              lane.trackId,
              automationParameter,
              elapsed,
            );
            const audible = !lane.muted && !groupBus?.muted && (!anySoloed || lane.soloed);
            const meterLevel = timelineLaneMeterLevel(
              lane.trackId,
              elapsed,
              lane.volume * (groupBus?.volume ?? 1),
              audible,
            );
            return (
              <div key={lane.trackId} className={`relative h-56 border-b border-white/10 p-3 pr-6 ${lane.selected ? "bg-cyan-300/10" : ""}`}>
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
                  <button type="button" aria-pressed={lane.muted}
                    disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                    onClick={() => updateLane(lane.trackId, { muted: !lane.muted })}
                    className={`rounded px-2 py-1 text-[10px] font-black disabled:opacity-30 ${lane.muted ? "bg-amber-300 text-black" : "bg-white/10"}`}>M</button>
                  <button type="button" aria-pressed={lane.soloed}
                    disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                    onClick={() => updateLane(lane.trackId, { soloed: !lane.soloed })}
                    className={`rounded px-2 py-1 text-[10px] font-black disabled:opacity-30 ${lane.soloed ? "bg-emerald-300 text-black" : "bg-white/10"}`}>S</button>
                  <button type="button"
                    disabled={
                      index === 0
                      || comparingSnapshot
                      || Boolean(comparedMixerCheckpointId)
                    }
                    onClick={() => {
                      if (comparingSnapshot || comparedMixerCheckpointId) return;
                      setLanes((value) => moveTimelineLane(value, lane.trackId, -1));
                    }}
                    className="ml-auto rounded bg-white/10 px-2 py-1 text-[10px] font-black disabled:opacity-25" aria-label={`Move ${track?.title || lane.trackId} up`}>↑</button>
                  <button type="button"
                    disabled={
                      index === lanes.length - 1
                      || comparingSnapshot
                      || Boolean(comparedMixerCheckpointId)
                    }
                    onClick={() => {
                      if (comparingSnapshot || comparedMixerCheckpointId) return;
                      setLanes((value) => moveTimelineLane(value, lane.trackId, 1));
                    }}
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
                    disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                    onChange={(event) => updateLane(lane.trackId, { volume: Number(event.target.value) })}
                    className="w-16 accent-cyan-300 disabled:opacity-30"
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
                    disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                    onChange={(event) => updateLane(lane.trackId, { pan: Number(event.target.value) })}
                    className="w-12 accent-violet-300 disabled:opacity-30"
                    aria-label={`${track?.title || lane.trackId} mixer pan`}
                  />
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="font-mono text-[9px] text-cyan-200/60">A</span>
                  <input type="range" min={0} max={1} step={0.01} value={lane.reverbSend}
                    disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                    onChange={(event) => updateLane(lane.trackId, { reverbSend: Number(event.target.value) })}
                    className="w-14 accent-cyan-300 disabled:opacity-30"
                    aria-label={`${track?.title || lane.trackId} reverb send`} />
                  <span className="w-5 font-mono text-[9px] text-white/35">{Math.round(lane.reverbSend * 100)}</span>
                  <span className="font-mono text-[9px] text-violet-200/60">B</span>
                  <input type="range" min={0} max={1} step={0.01} value={lane.delaySend}
                    disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                    onChange={(event) => updateLane(lane.trackId, { delaySend: Number(event.target.value) })}
                    className="w-14 accent-violet-300 disabled:opacity-30"
                    aria-label={`${track?.title || lane.trackId} delay send`} />
                  <span className="font-mono text-[9px] text-white/35">{Math.round(lane.delaySend * 100)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[9px] text-emerald-200/60">GROUP</span>
                  <select
                    value={lane.groupId}
                    disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                    onChange={(event) => updateLane(lane.trackId, {
                      groupId: event.target.value as TimelineDawGroupId,
                    })}
                    className="min-w-0 flex-1 rounded border border-emerald-300/15 bg-black px-1 py-1 text-[9px] font-black uppercase text-emerald-100 disabled:opacity-30"
                    aria-label={`${track?.title || lane.trackId} group`}
                  >
                    <option value="none">None</option>
                    <option value="vocals">Vocals</option>
                    <option value="music">Music</option>
                    <option value="drums">Drums</option>
                  </select>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <select
                    defaultValue=""
                    disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                    onChange={(event) => {
                      if (comparingSnapshot || comparedMixerCheckpointId) return;
                      const kind = event.target.value as TimelineDawEffectKind;
                      if (kind) setLanes((value) => addTimelineLaneEffect(value, lane.trackId, kind));
                      event.currentTarget.value = "";
                    }}
                    className="w-20 rounded border border-white/10 bg-black px-1 py-1 text-[9px] font-black text-violet-100 disabled:opacity-30"
                    aria-label={`Add effect to ${track?.title || lane.trackId}`}
                  >
                    <option value="">+ FX</option>
                    <option value="eq">EQ</option>
                    <option value="compressor">Comp</option>
                    <option value="reverb">Reverb</option>
                    <option value="delay">Delay</option>
                  </select>
                  <span className="truncate text-[9px] text-white/35">{lane.effects.length} slots</span>
                  {effectClipboard.length ? (
                    <button
                      type="button"
                      disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                      onClick={() => {
                        if (comparingSnapshot || comparedMixerCheckpointId) return;
                        setLanes((value) => replaceTimelineLaneEffects(
                          value, lane.trackId, effectClipboard,
                        ));
                        setSelectedEffectId(null);
                      }}
                      className="rounded bg-cyan-300/15 px-1.5 py-1 text-[9px] font-black text-cyan-100 disabled:opacity-30"
                    >Paste</button>
                  ) : null}
                </div>
                <div className="mt-1 flex max-h-8 flex-wrap gap-1 overflow-y-auto">
                  {lane.effects.map((effect) => (
                    <span key={effect.id} className={`inline-flex rounded border text-[9px] font-black ${
                      effect.bypassed
                        ? "border-white/10 bg-white/5 text-white/30"
                        : "border-violet-300/35 bg-violet-300/15 text-violet-100"
                    }`}>
                      <button
                        type="button"
                        onClick={() => setSelectedEffectId(effect.id)}
                        className="px-1.5 py-0.5 uppercase"
                        aria-pressed={selectedEffectId === effect.id}
                        title={`Edit ${effect.kind}: ${effect.preset}`}
                      >
                        {effect.kind === "compressor" ? "COMP" : effect.kind}
                      </button>
                      <button
                        type="button"
                        disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                        onClick={() => {
                          if (comparingSnapshot || comparedMixerCheckpointId) return;
                          setLanes((value) =>
                            toggleTimelineLaneEffectBypass(value, lane.trackId, effect.id));
                        }}
                        className="border-l border-white/10 px-1 disabled:opacity-30"
                        aria-label={`${effect.bypassed ? "Enable" : "Bypass"} ${effect.kind}`}
                      >B</button>
                      <button
                        type="button"
                        disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                        onClick={() => {
                          if (comparingSnapshot || comparedMixerCheckpointId) return;
                          setLanes((value) =>
                            removeTimelineLaneEffect(value, lane.trackId, effect.id));
                        }}
                        className="border-l border-white/10 px-1 text-rose-200/70 disabled:opacity-30"
                        aria-label={`Remove ${effect.kind}`}
                      >×</button>
                    </span>
                  ))}
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
              const groupBus = lane.groupId === "none" ? null : groupBuses[lane.groupId];
              const audible = !lane.muted && !groupBus?.muted && (!anySoloed || lane.soloed);
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
                <div key={lane.trackId} className={`relative h-56 border-b border-white/10 ${lane.selected ? "bg-cyan-300/[0.04]" : "bg-white/[0.02]"}`}>
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
                          disabled={comparingSnapshot || Boolean(comparedMixerCheckpointId)}
                          onPointerDown={(event) => startAutomationDrag(event, point)}
                          onPointerMove={continueAutomationDrag}
                          onPointerUp={finishAutomationDrag}
                          onPointerCancel={finishAutomationDrag}
                          className={`absolute z-[12] h-3 w-3 touch-none -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border disabled:cursor-not-allowed disabled:opacity-40 ${
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
