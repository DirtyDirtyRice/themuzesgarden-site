"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DAW_RECORDED_SOURCE_EVENT, type DawRecordedSourceEventDetail } from "@/lib/timeline/TimelineDawRecordedSourceEvent";
import { createTimelineDawElasticPlan, timelineDawPrivateLanePlaybackRate } from "@/lib/timeline/TimelineDawPrivateLaneTransformPolicy";
import {
  addDawPrivateAudioLane,
  assignDawPrivateLaneBus,
  assignDawPrivateFolderBus,
  deleteDawPrivateBus,
  arrangeDawPrivateAudioLane,
  duplicateDawPrivateAudioLane,
  repeatDawPrivateAudioLane,
  editDawPrivateLaneGroup,
  loadDawPrivateAudioLanes,
  loadDawPrivateBuses,
  loadDawPrivateBusProcessing,
  saveDawPrivateSend,
  saveDawPrivateInsert,
  loadDawPrivateLaneWaveform,
  loadDawPrivateFreezes,
  removeDawPrivateAudioLane,
  renameDawPrivateAudioLane,
  saveDawPrivateBus,
  splitDawPrivateAudioLane,
  updateDawPrivateAudioLaneMix,
  updateDawPrivateAudioLaneFade,
  updateDawPrivateAudioLaneTransform,
  type DawPrivateAudioLane,
  type DawPrivateBus,
  type DawPrivateSend,
  type DawPrivateInsert,
  type DawPrivateFreeze,
  type DawPrivateLaneWaveform,
  type DawPrivateClipRepair,
} from "@/app/workspace/projects/[id]/projectDawApi";
import { resolveTimelineDawPrivateRoutingAudibility } from "@/lib/timeline/TimelineDawPrivateBusPolicy";
import { TimelineDawPrivateLaneMonitorGraph, type TimelineDawPrivateLaneMeter } from "@/lib/timeline/TimelineDawPrivateLaneMonitorGraph";
import { detectTimelineDawPrivateLaneCrossfades } from "@/lib/timeline/TimelineDawPrivateLaneFadePolicy";
import { resolveTimelineDawMusicianTrackFade } from "@/lib/timeline/TimelineDawMusicianTrackFade";
import { createTimelineDawMusicianTrackRemovalMessage } from "@/lib/timeline/TimelineDawMusicianTrackRemoval";
import { resolveTimelineDawMusicianTrackEndPlacement } from "@/lib/timeline/TimelineDawMusicianTrackEndPlacement";
import { resetTimelineDawMusicianTrackMix } from "@/lib/timeline/TimelineDawMusicianTrackMixReset";
import TimelineDawTransientEditor from "@/app/components/TimelineDawTransientEditor";
import TimelineDawWarpEditor from "@/app/components/TimelineDawWarpEditor";
import TimelineDawPrivateMasterBus from "@/app/components/TimelineDawPrivateMasterBus";
import TimelineDawPrivateBounceQueue from "@/app/components/TimelineDawPrivateBounceQueue";
import TimelineDawPrivateTemplates from "@/app/components/TimelineDawPrivateTemplates";
import TimelineDawPrivateCollaboration from "@/app/components/TimelineDawPrivateCollaboration";
import TimelineDawPrivateReviews from "@/app/components/TimelineDawPrivateReviews";
import TimelineDawPrivateSnapshots from "@/app/components/TimelineDawPrivateSnapshots";
import TimelineDawPrivateLaneWaveform from "@/app/components/TimelineDawPrivateLaneWaveform";
import TimelineDawPrivateLaneHistory from "@/app/components/TimelineDawPrivateLaneHistory";
import TimelineDawPrivateLaneGroupEditor, { type PrivateLaneGroupEditInput } from "@/app/components/TimelineDawPrivateLaneGroupEditor";
import TimelineDawPrivateBusMixer from "@/app/components/TimelineDawPrivateBusMixer";
import TimelineDawPrivateFreezePanel from "@/app/components/TimelineDawPrivateFreezePanel";
import TimelineDawPrivateAutomationEditor from "@/app/components/TimelineDawPrivateAutomationEditor";
import { loadDawPrivateAutomation, type DawPrivateAutomationEnvelope } from "@/app/components/timelineDawPrivateAutomationApi";
import { timelineDawPrivateAutomationValue } from "@/lib/timeline/TimelineDawPrivateAutomationPolicy";
import { dispatchTimelineDawPrivateMixChange } from "@/lib/timeline/TimelineDawPrivateAutomationEvents";
import { TimelineDawPrivateBusGraph } from "@/lib/timeline/TimelineDawPrivateBusGraph";
import TimelineDawPrivateClipRepairEditor from "@/app/components/TimelineDawPrivateClipRepairEditor";
import TimelineDawAudioFamilyIntake from "@/app/components/TimelineDawAudioFamilyIntake";
import TimelineDawMusicianImport from "@/app/components/TimelineDawMusicianImport";
import TimelineDawMusicianTempoKeyMatch from "@/app/components/TimelineDawMusicianTempoKeyMatch";
import TimelineDawMusicianSelectedTempoKeyMatch from "@/app/components/TimelineDawMusicianSelectedTempoKeyMatch";
import TimelineDawMusicianRiffMatch from "@/app/components/TimelineDawMusicianRiffMatch";
import { createTimelineDawRiffAudition, createTimelineDawRiffAuditionNextIndex, createTimelineDawRiffAuditionPreviousIndex, createTimelineDawRiffAuditionProgress, createTimelineDawRiffAuditionRemainingMilliseconds, createTimelineDawRiffAuditionReplayIndex, createTimelineDawRiffAuditionSequence, isTimelineDawRiffAuditionCurrent } from "@/lib/timeline/TimelineDawMusicianRiffMatch";
import TimelineDawMusicianMixer from "@/app/components/TimelineDawMusicianMixer";
import TimelineDawPrivateMidiSequencer from "@/app/components/TimelineDawPrivateMidiSequencer";
import TimelineDawSessionView from "@/app/components/TimelineDawSessionView";
import { timelineDawPrivateClipGainAtFrame } from "@/lib/timeline/TimelineDawPrivateClipRepairPolicy";
import { resolveTimelineDawMusicianTrackMove } from "@/lib/timeline/TimelineDawMusicianTrackMove";
import { resolveTimelineDawMusicianGroupMove, type TimelineDawMusicianGroupMoveMode } from "@/lib/timeline/TimelineDawMusicianGroupMove";
import { adjustTimelineDawMusicianSpeedPitch, type TimelineDawMusicianSpeedPitchAction } from "@/lib/timeline/TimelineDawMusicianSpeedPitch";
import { resolveTimelineDawMusicianTrackPlacement, type TimelineDawMusicianTrackPlacementMode } from "@/lib/timeline/TimelineDawMusicianTrackPlacement";
import { resolveTimelineDawMusicianTrackTrim } from "@/lib/timeline/TimelineDawMusicianTrackTrim";
import { parseTimelineDawMusicianTrackName } from "@/lib/timeline/TimelineDawMusicianTrackName";
import { createTimelineDawMusicianTrackPreview } from "@/lib/timeline/TimelineDawMusicianTrackPreview";
import { resolveTimelineDawMusicianTrackTiming } from "@/lib/timeline/TimelineDawMusicianTrackTiming";
import { parseTimelineDawTrackLocks, serializeTimelineDawTrackLocks, toggleTimelineDawTrackLock } from "@/lib/timeline/TimelineDawTrackLockPolicy";
import { parseTimelineDawTrackColors, setTimelineDawTrackColor, TIMELINE_DAW_TRACK_COLORS, type TimelineDawTrackColorName, type TimelineDawTrackColors } from "@/lib/timeline/TimelineDawTrackColorPolicy";
import { resolveTimelineDawTrackShortcut } from "@/lib/timeline/TimelineDawTrackShortcutPolicy";
import { addTimelineDawTrackRegionLabel, createTimelineDawTrackRegionLoopNextIndex, createTimelineDawTrackRegionSequence, parseTimelineDawTrackRegionLabels, removeTimelineDawTrackRegionLabel, timelineDawTrackLocalSeconds, updateTimelineDawTrackRegionLabel, type TimelineDawTrackRegionLabels } from "@/lib/timeline/TimelineDawTrackRegionLabelPolicy";
import { createTimelineDawTrackFolder, parseTimelineDawTrackFolders, removeTimelineDawTrackFolder, renameTimelineDawTrackFolder, resolveTimelineDawTrackFolderPlayback, toggleTimelineDawTrackFolder, updateTimelineDawTrackFolderMix, type TimelineDawTrackFolders } from "@/lib/timeline/TimelineDawTrackFolderPolicy";
import { parseTimelineDawTrackFolderSend } from "@/lib/timeline/TimelineDawTrackFolderRoutingPolicy";
import { createTimelineDawSessionSceneLaunch, type TimelineDawSessionScene } from "@/lib/timeline/TimelineDawSessionViewPolicy";

const button = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:opacity-40";

export default function TimelineDawPrivateAudioLanes({ sessionId, projectId }: { sessionId: string; projectId: string }) {
  const [lanes, setLanes] = useState<DawPrivateAudioLane[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [movementNotice, setMovementNotice] = useState<string>();
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [placementTargets, setPlacementTargets] = useState<Record<string, string>>({});
  const [previewLaneId, setPreviewLaneId] = useState<string>();
  const [riffAuditionActive, setRiffAuditionActive] = useState(false);
  const [riffAuditionPaused, setRiffAuditionPaused] = useState(false);
  const [riffAuditionProgress, setRiffAuditionProgress] = useState<{ trackName: string; trackNumber: number; trackCount: number; passNumber: number; passCount: number; canGoPrevious?: boolean }>();
  const [activeSessionSceneId, setActiveSessionSceneId] = useState<string>();
  const [meters, setMeters] = useState<Record<string, TimelineDawPrivateLaneMeter>>({});
  const [waveforms, setWaveforms] = useState<Record<string, DawPrivateLaneWaveform>>({});
  const [historyRevision, setHistoryRevision] = useState(0);
  const [warpMaps,setWarpMaps]=useState<Record<string,Array<{sourceFrame:number;destinationFrame:number;protected:boolean}>>>({});
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [lockedIds, setLockedIds] = useState(new Set<string>());
  const loadedTrackLocksRef = useRef<string | null>(null);
  const [trackColors, setTrackColors] = useState<TimelineDawTrackColors>({});
  const loadedTrackColorsRef = useRef<string | null>(null);
  const [regionLabels, setRegionLabels] = useState<TimelineDawTrackRegionLabels>({});
  const [regionNameDrafts, setRegionNameDrafts] = useState<Record<string, string>>({});
  const [regionRenameDrafts, setRegionRenameDrafts] = useState<Record<string, string>>({});
  const [loopingRegionId, setLoopingRegionId] = useState<string>();
  const [regionStarts, setRegionStarts] = useState<Record<string, number>>({});
  const loadedRegionLabelsRef = useRef<string | null>(null);
  const [trackFolders, setTrackFolders] = useState<TimelineDawTrackFolders>({});
  const [folderNameDraft, setFolderNameDraft] = useState("");
  const [folderRenameDrafts, setFolderRenameDrafts] = useState<Record<string, string>>({});
  const [folderBusTargets, setFolderBusTargets] = useState<Record<string, string>>({});
  const [folderSendTargets, setFolderSendTargets] = useState<Record<string, string>>({});
  const loadedTrackFoldersRef = useRef<string | null>(null);
  const [buses, setBuses] = useState<DawPrivateBus[]>([]);
  const [busMeters, setBusMeters] = useState<Record<string, TimelineDawPrivateLaneMeter>>({});
  const [sends, setSends] = useState<DawPrivateSend[]>([]);
  const [inserts, setInserts] = useState<DawPrivateInsert[]>([]);
  const [freezes, setFreezes] = useState<DawPrivateFreeze[]>([]);
  const [automation, setAutomation] = useState<DawPrivateAutomationEnvelope[]>([]);
  const [clipRepairs, setClipRepairs] = useState<Record<string, DawPrivateClipRepair>>({});
  const [master,setMaster]=useState({gain:1,muted:false,revision:0});
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const freezeAudioRefs = useRef(new Map<string, HTMLAudioElement>());
  const graphRefs = useRef(new Map<string, TimelineDawPrivateLaneMonitorGraph>());
  const contextRef = useRef<AudioContext | null>(null);
  const busGraphRefs = useRef(new Map<string, TimelineDawPrivateBusGraph>());
  const saveTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const riffAuditionGenerationRef = useRef(0);
  const riffAuditionSkipRef = useRef<(() => void) | null>(null);
  const riffAuditionPreviousRef = useRef<(() => void) | null>(null);
  const riffAuditionReplayRef = useRef<(() => void) | null>(null);
  const riffAuditionPauseRef = useRef<(() => void) | null>(null);
  const riffAuditionResumeRef = useRef<(() => void) | null>(null);
  const audioCallbacksRef = useRef(new Map<string, (element: HTMLAudioElement | null) => void>());
  const playheadRef = useRef(0);
  const transportStateRef = useRef<"playing" | "paused" | "stopped">("stopped");
  const audibility = useMemo(() => {
    const result = new Map(resolveTimelineDawPrivateRoutingAudibility(lanes.map((lane) => ({ id: lane.id, busId: lane.busId, muted: lane.mix.muted, soloed: lane.mix.soloed })), buses.map((bus) => ({ id: bus.id, muted: bus.mix.muted, soloed: bus.mix.soloed }))));
    const active = freezes.filter((freeze) => freeze.active);
    for (const lane of lanes) if (active.some((freeze) => freeze.sourceKind === "lane" ? freeze.sourceId === lane.id : freeze.sourceId === lane.busId)) result.set(lane.id, false);
    return result;
  }, [buses, freezes, lanes]);
  const crossfades = useMemo(() => detectTimelineDawPrivateLaneCrossfades(lanes), [lanes]);
  const timelineExtentSeconds = useMemo(() => Math.max(60, ...lanes.map((lane) => resolveTimelineDawMusicianTrackTiming({
    timelineStartSeconds: lane.timelineStartSeconds, sourceInSeconds: lane.sourceInSeconds, sourceOutSeconds: lane.sourceOutSeconds,
    stretchRatio: lane.transform.stretchRatio, transformBypassed: lane.transform.bypassed,
  }).audibleEndSeconds)), [lanes]);
  const waveformSourceKey = useMemo(() => [...new Set(lanes.map((lane) => lane.source.checksum))].sort().join("|"), [lanes]);
  const laneIdentityKey = useMemo(() => lanes.map((lane) => lane.id).sort().join("|"), [lanes]);
  const trackLockStorageKey = `muzes:daw-track-locks:v1:${sessionId}`;
  const trackLockLoadKey = `${trackLockStorageKey}:${laneIdentityKey}`;
  const trackColorStorageKey = `muzes:daw-track-colors:v1:${sessionId}`;
  const trackColorLoadKey = `${trackColorStorageKey}:${laneIdentityKey}`;
  const regionLabelStorageKey = `muzes:daw-region-labels:v1:${sessionId}`;
  const regionLabelLaneBounds = useMemo(() => Object.fromEntries(lanes.map((lane) => [lane.id, lane.sourceOutSeconds - lane.sourceInSeconds])), [lanes]);
  const regionLabelLoadKey = `${regionLabelStorageKey}:${laneIdentityKey}:${JSON.stringify(regionLabelLaneBounds)}`;
  const trackFolderStorageKey = `muzes:daw-track-folders:v1:${sessionId}`;
  const trackFolderLoadKey = `${trackFolderStorageKey}:${laneIdentityKey}`;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLockedIds(parseTimelineDawTrackLocks(localStorage.getItem(trackLockStorageKey), laneIdentityKey ? laneIdentityKey.split("|") : []));
      loadedTrackLocksRef.current = trackLockLoadKey;
    });
    return () => { cancelled = true; };
  }, [laneIdentityKey, trackLockLoadKey, trackLockStorageKey]);

  useEffect(() => {
    if (loadedTrackLocksRef.current === trackLockLoadKey) localStorage.setItem(trackLockStorageKey, serializeTimelineDawTrackLocks(lockedIds));
  }, [lockedIds, trackLockLoadKey, trackLockStorageKey]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setTrackColors(parseTimelineDawTrackColors(localStorage.getItem(trackColorStorageKey), laneIdentityKey ? laneIdentityKey.split("|") : []));
      loadedTrackColorsRef.current = trackColorLoadKey;
    });
    return () => { cancelled = true; };
  }, [laneIdentityKey, trackColorLoadKey, trackColorStorageKey]);

  useEffect(() => {
    if (loadedTrackColorsRef.current === trackColorLoadKey) localStorage.setItem(trackColorStorageKey, JSON.stringify(trackColors));
  }, [trackColorLoadKey, trackColorStorageKey, trackColors]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setRegionLabels(parseTimelineDawTrackRegionLabels(localStorage.getItem(regionLabelStorageKey), regionLabelLaneBounds));
      loadedRegionLabelsRef.current = regionLabelLoadKey;
    });
    return () => { cancelled = true; };
  }, [regionLabelLaneBounds, regionLabelLoadKey, regionLabelStorageKey]);

  useEffect(() => {
    if (loadedRegionLabelsRef.current === regionLabelLoadKey) localStorage.setItem(regionLabelStorageKey, JSON.stringify(regionLabels));
  }, [regionLabelLoadKey, regionLabelStorageKey, regionLabels]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setTrackFolders(parseTimelineDawTrackFolders(localStorage.getItem(trackFolderStorageKey), laneIdentityKey ? laneIdentityKey.split("|") : []));
      loadedTrackFoldersRef.current = trackFolderLoadKey;
    });
    return () => { cancelled = true; };
  }, [laneIdentityKey, trackFolderLoadKey, trackFolderStorageKey]);

  useEffect(() => {
    if (loadedTrackFoldersRef.current === trackFolderLoadKey) localStorage.setItem(trackFolderStorageKey, JSON.stringify(trackFolders));
  }, [trackFolderLoadKey, trackFolderStorageKey, trackFolders]);

  useEffect(() => {
    const handleTrackShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const action = resolveTimelineDawTrackShortcut({
        key: event.key,
        selectedCount: selectedIds.size,
        editableTarget: Boolean(target?.closest("input, textarea, select, [contenteditable='true']")),
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
      });
      if (!action) return;
      const lane = lanes.find((candidate) => selectedIds.has(candidate.id));
      if (!lane) return;
      event.preventDefault();
      if (action === "toggle-lock") {
        const locked = lockedIds.has(lane.id);
        setLockedIds((current) => toggleTimelineDawTrackLock(current, lane.id));
        setMovementNotice(`${lane.name} is now ${locked ? "unlocked and editable" : "locked against accidental edits"}.`);
      } else if (previewLaneId === lane.id) stopTrackPreview(lane);
      else void previewTrack(lane);
    };
    document.addEventListener("keydown", handleTrackShortcut);
    return () => document.removeEventListener("keydown", handleTrackShortcut);
  }, [lanes, lockedIds, previewLaneId, selectedIds]);
  const effectiveFades = useMemo(() => {
    const result = new Map(lanes.map((lane) => [lane.id, { ...lane.fade }]));
    for (const crossfade of crossfades) {
      const outgoing = result.get(crossfade.outgoingLaneId);
      const incoming = result.get(crossfade.incomingLaneId);
      if (outgoing) outgoing.outSeconds = Math.max(outgoing.outSeconds, crossfade.durationSeconds);
      if (incoming) incoming.inSeconds = Math.max(incoming.inSeconds, crossfade.durationSeconds);
    }
    return result;
  }, [crossfades, lanes]);

  const synchronize = useCallback((elapsed: number, playing: boolean) => {
    for (const lane of lanes) {
      const audio = audioRefs.current.get(lane.id);
      if (!audio) continue;
      const localSeconds = elapsed - lane.timelineStartSeconds;
      const sourceFrames=Math.max(1,Math.round((lane.sourceOutSeconds-lane.sourceInSeconds)*48000)),arrangedDuration=createTimelineDawElasticPlan(sourceFrames,48000,lane.transform,[],warpMaps[lane.id]??[]).outputFrames/48000;
      audio.preservesPitch = lane.transform.algorithm === "preserve-pitch"; audio.playbackRate = timelineDawPrivateLanePlaybackRate(lane.transform);
      const active = localSeconds >= 0 && localSeconds < arrangedDuration;
      const fade = effectiveFades.get(lane.id) ?? lane.fade;
      const samplePosition=Math.max(0,Math.round(elapsed*lane.audio.sampleRate)),clipFrame=Math.max(0,Math.round(localSeconds/(lane.transform.bypassed?1:lane.transform.stretchRatio)*lane.audio.sampleRate)),clipRepair=clipRepairs[lane.id],clipGain=clipRepair&&!clipRepair.bypassed?timelineDawPrivateClipGainAtFrame(clipRepair.gainPoints,clipFrame):1,gain=timelineDawPrivateAutomationValue(automation.find((item)=>item.sourceKind==="lane"&&item.sourceId===lane.id&&item.parameter==="gain"),samplePosition,lane.mix.gain)*clipGain,pan=timelineDawPrivateAutomationValue(automation.find((item)=>item.sourceKind==="lane"&&item.sourceId===lane.id&&item.parameter==="pan"),samplePosition,lane.mix.pan);
      const folderPlayback = resolveTimelineDawTrackFolderPlayback(trackFolders, lane.id);
      graphRefs.current.get(lane.id)?.applyEnvelope({...lane.mix,gain:gain*folderPlayback.gain*(master.muted?0:master.gain),pan}, (audibility.get(lane.id) ?? false) && folderPlayback.audible, localSeconds, arrangedDuration, fade.inSeconds, fade.outSeconds);
      if (!active || !playing) {
        audio.pause();
        if (localSeconds < 0) audio.currentTime = lane.sourceInSeconds;
        continue;
      }
      const sourceSeconds = lane.sourceInSeconds + localSeconds / (lane.transform.bypassed ? 1 : lane.transform.stretchRatio);
      if (Math.abs(audio.currentTime - sourceSeconds) > 0.08) audio.currentTime = sourceSeconds;
      void graphRefs.current.get(lane.id)?.resume();
      if (audio.paused) void audio.play().catch(() => setError(`Playback could not start for ${lane.name}.`));
    }
    for (const freeze of freezes.filter((item) => item.active)) {
      const audio = freezeAudioRefs.current.get(freeze.id); if (!audio) continue; const duration = freeze.artifact.frameCount / freeze.artifact.sampleRate;
      if (!playing || elapsed < 0 || elapsed >= duration) { audio.pause(); if (elapsed < 0) audio.currentTime = 0; continue; }
      audio.volume=master.muted?0:Math.min(1,master.gain); if (Math.abs(audio.currentTime - elapsed) > 0.08) audio.currentTime = elapsed; if (audio.paused) void audio.play().catch(() => setError("Frozen playback could not start."));
    }
    for(const bus of buses){const sampleRate=lanes[0]?.audio.sampleRate??48000,samplePosition=Math.max(0,Math.round(elapsed*sampleRate)),gain=timelineDawPrivateAutomationValue(automation.find((item)=>item.sourceKind==="bus"&&item.sourceId===bus.id&&item.parameter==="gain"),samplePosition,bus.mix.gain),pan=timelineDawPrivateAutomationValue(automation.find((item)=>item.sourceKind==="bus"&&item.sourceId===bus.id&&item.parameter==="pan"),samplePosition,bus.mix.pan);busGraphRefs.current.get(bus.id)?.apply({...bus.mix,gain,pan},!buses.some((candidate)=>candidate.mix.soloed)||bus.mix.soloed);}
  }, [audibility, automation, buses, clipRepairs, effectiveFades, freezes, lanes, master, trackFolders, warpMaps]);

  useEffect(() => {
    for (const lane of lanes) {
      const duration = resolveTimelineDawMusicianTrackTiming({ timelineStartSeconds: lane.timelineStartSeconds, sourceInSeconds: lane.sourceInSeconds, sourceOutSeconds: lane.sourceOutSeconds, stretchRatio: lane.transform.stretchRatio, transformBypassed: lane.transform.bypassed }).audibleDurationSeconds;
      const fade = effectiveFades.get(lane.id) ?? lane.fade;
      graphRefs.current.get(lane.id)?.applyEnvelope(lane.mix, audibility.get(lane.id) ?? false, playheadRef.current - lane.timelineStartSeconds, duration, fade.inSeconds, fade.outSeconds);
    }
  }, [audibility, effectiveFades, freezes, lanes]);
  useEffect(() => {
    if (!contextRef.current && (lanes.length || buses.length)) contextRef.current = new AudioContext();
    const context = contextRef.current;
    if (!context) return;
    for (const bus of buses) {
      let graph = busGraphRefs.current.get(bus.id);
      if (!graph) { graph = new TimelineDawPrivateBusGraph(context); busGraphRefs.current.set(bus.id, graph); }
      graph.apply(bus.mix, !buses.some((candidate) => candidate.mix.soloed) || bus.mix.soloed);
    }
    busGraphRefs.current.forEach((graph, id) => { if (!buses.some((bus) => bus.id === id)) { graph.dispose(); busGraphRefs.current.delete(id); } });
    for (const lane of lanes) graphRefs.current.get(lane.id)?.connect(lane.busId ? busGraphRefs.current.get(lane.busId)?.input ?? context.destination : context.destination);
    const routed = (sourceKind: "lane" | "bus", sourceId: string) => sends.filter((send) => send.sourceKind === sourceKind && send.sourceId === sourceId).flatMap((send) => { const output = busGraphRefs.current.get(send.destinationBusId)?.input; return output ? [{ ...send, output }] : []; });
    for (const bus of buses) busGraphRefs.current.get(bus.id)?.applyProcessing(inserts.filter((item) => item.sourceKind === "bus" && item.sourceId === bus.id).sort((a, b) => a.slot - b.slot), routed("bus", bus.id));
    for (const lane of lanes) graphRefs.current.get(lane.id)?.applyProcessing(inserts.filter((item) => item.sourceKind === "lane" && item.sourceId === lane.id).sort((a, b) => a.slot - b.slot), routed("lane", lane.id));
  }, [buses, inserts, lanes, sends]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const next: Record<string, TimelineDawPrivateLaneMeter> = {};
      graphRefs.current.forEach((graph, id) => { next[id] = graph.meter(); });
      setMeters(next);
      const nextBuses: Record<string, TimelineDawPrivateLaneMeter> = {}; busGraphRefs.current.forEach((graph, id) => { nextBuses[id] = graph.meter(); }); setBusMeters(nextBuses);
    }, 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    const sources = [...new Map(lanes.map((lane) => [lane.source.checksum, lane])).values()];
    void Promise.all(sources.map(async (lane) => {
      const { waveform } = await loadDawPrivateLaneWaveform(sessionId, lane.id);
      return [lane.source.checksum, waveform] as const;
    })).then((loaded) => { if (active) setWaveforms((current) => ({ ...current, ...Object.fromEntries(loaded) })); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Private waveforms could not be prepared."); });
    return () => { active = false; };
  }, [sessionId, waveformSourceKey]);

  useEffect(() => {
    let active = true;
    void loadDawPrivateAudioLanes(sessionId)
      .then(({ lanes: stored }) => { if (active) setLanes(stored); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Private audio lanes could not be loaded."); });
    void loadDawPrivateBuses(sessionId)
      .then(({ buses: stored }) => { if (active) setBuses(stored); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Private buses could not be loaded."); });
    void loadDawPrivateBusProcessing(sessionId)
      .then((stored) => { if (active) { setSends(stored.sends); setInserts(stored.inserts); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Private bus processing could not be loaded."); });
    void loadDawPrivateFreezes(sessionId)
      .then(({ freezes: stored }) => { if (active) setFreezes(stored); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Private freezes could not be loaded."); });
    void loadDawPrivateAutomation(sessionId).then(({envelopes})=>{if(active)setAutomation(envelopes);})
      .catch((cause)=>{if(active)setError(cause instanceof Error?cause.message:"Private automation could not be loaded.");});
    return () => { active = false; audioRefs.current.forEach((audio) => audio.pause()); freezeAudioRefs.current.forEach((audio) => audio.pause()); graphRefs.current.forEach((graph) => graph.dispose()); busGraphRefs.current.forEach((graph) => graph.dispose()); if (contextRef.current) void contextRef.current.close(); saveTimersRef.current.forEach((timer) => clearTimeout(timer)); if (previewTimerRef.current) clearTimeout(previewTimerRef.current); };
  }, [sessionId]);

  useEffect(() => {
    const receiveSource = (event: Event) => {
      const detail = (event as CustomEvent<DawRecordedSourceEventDetail>).detail;
      if (!detail?.source?.uri) return;
      setBusy(true);
      setError(undefined);
      void addDawPrivateAudioLane({
        sessionId,
        name: detail.source.name.replace(/\.wav$/i, ""),
        sourceId: detail.source.id,
        sourceUri: detail.source.uri,
        sourceChecksum: detail.source.checksum,
        sampleRate: detail.audio.sampleRate,
        channelCount: detail.audio.channelCount,
        frameCount: detail.audio.frameCount,
        durationSeconds: detail.audio.durationSeconds,
        timelineStartSeconds: playheadRef.current,
        compId: detail.provenance?.compId,
        compRenderChecksum: detail.provenance?.renderChecksum,
      }).then(({ lane }) => setLanes((current) => [...current, lane].sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds)))
        .catch((cause) => setError(cause instanceof Error ? cause.message : "Private audio lane could not be added."))
        .finally(() => setBusy(false));
    };
    const receiveFamilyLanes = (event: Event) => { const detail=(event as CustomEvent<{sessionId?:string}>).detail;if(detail?.sessionId!==sessionId)return;void loadDawPrivateAudioLanes(sessionId).then(result=>setLanes(result.lanes)).catch(cause=>setError(cause instanceof Error?cause.message:"Family lanes could not be loaded.")); };
    const receivePlayhead = (event: Event) => {
      const detail = (event as CustomEvent<{ sessionId?: string; elapsed?: number }>).detail;
      if (detail?.sessionId !== sessionId || !Number.isFinite(detail.elapsed)) return;
      playheadRef.current = Number(detail.elapsed);
      synchronize(playheadRef.current, transportStateRef.current === "playing");
    };
    const receiveTransport = (event: Event) => {
      const detail = (event as CustomEvent<{ sessionId?: string; state?: "playing" | "paused" | "stopped"; elapsed?: number }>).detail;
      if (detail?.sessionId !== sessionId || !detail.state) return;
      transportStateRef.current = detail.state;
      if (Number.isFinite(detail.elapsed)) playheadRef.current = Number(detail.elapsed);
      synchronize(playheadRef.current, detail.state === "playing");
    };
    window.addEventListener(DAW_RECORDED_SOURCE_EVENT, receiveSource);
    window.addEventListener("muzes:daw-family-lanes", receiveFamilyLanes);
    window.addEventListener("muzes:daw-playhead", receivePlayhead);
    window.addEventListener("muzes:daw-transport-state", receiveTransport);
    return () => {
      window.removeEventListener(DAW_RECORDED_SOURCE_EVENT, receiveSource);
      window.removeEventListener("muzes:daw-family-lanes", receiveFamilyLanes);
      window.removeEventListener("muzes:daw-playhead", receivePlayhead);
      window.removeEventListener("muzes:daw-transport-state", receiveTransport);
    };
  }, [sessionId, synchronize]);

  function audioRefFor(lane: DawPrivateAudioLane) {
    const existing = audioCallbacksRef.current.get(lane.id);
    if (existing) return existing;
    const callback = (element: HTMLAudioElement | null) => {
      if (element) {
        audioRefs.current.set(lane.id, element);
        try {
          const context = contextRef.current ?? new AudioContext(); contextRef.current = context;
          const output = lane.busId ? busGraphRefs.current.get(lane.busId)?.input ?? context.destination : context.destination;
          const graph = new TimelineDawPrivateLaneMonitorGraph(context, element, output);
          graph.apply(lane.mix, audibility.get(lane.id) ?? false);
          graphRefs.current.set(lane.id, graph);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : `Monitoring graph could not be created for ${lane.name}.`);
        }
      } else {
        audioRefs.current.delete(lane.id);
        graphRefs.current.get(lane.id)?.dispose();
        graphRefs.current.delete(lane.id);
        audioCallbacksRef.current.delete(lane.id);
      }
    };
    audioCallbacksRef.current.set(lane.id, callback);
    return callback;
  }

  function queueMix(lane: DawPrivateAudioLane, patch: Partial<DawPrivateAudioLane["mix"]>) {
    if (editingLocked(lane.id)) return;
    const mix = { ...lane.mix, ...patch };
    if (patch.gain !== undefined) dispatchTimelineDawPrivateMixChange({ sourceKind: "lane", sourceId: lane.id, parameter: "gain", value: patch.gain });
    if (patch.pan !== undefined) dispatchTimelineDawPrivateMixChange({ sourceKind: "lane", sourceId: lane.id, parameter: "pan", value: patch.pan });
    setLanes((current) => current.map((candidate) => candidate.id === lane.id ? { ...candidate, mix } : candidate));
    const pending = saveTimersRef.current.get(lane.id);
    if (pending) clearTimeout(pending);
    saveTimersRef.current.set(lane.id, setTimeout(() => {
      void updateDawPrivateAudioLaneMix(sessionId, lane.id, mix)
        .then(({ lane: saved }) => setLanes((current) => current.map((candidate) => candidate.id === saved.id
          ? { ...candidate, mix: saved.mix, updatedAt: saved.updatedAt }
          : candidate)))
        .catch((cause) => setError(cause instanceof Error ? cause.message : "Lane mixer settings could not be saved."))
        .finally(() => saveTimersRef.current.delete(lane.id));
    }, 250));
  }

  function editingLocked(laneId: string) {
    if (!lockedIds.has(laneId)) return false;
    setMovementNotice("This track is locked. Unlock it before changing its arrangement or sound.");
    return true;
  }

  function editFade(laneId: string, patch: Partial<DawPrivateAudioLane["fade"]>) {
    if (editingLocked(laneId)) return;
    setLanes((current) => current.map((lane) => lane.id === laneId ? { ...lane, fade: { ...lane.fade, ...patch } } : lane));
  }

  async function saveFade(lane: DawPrivateAudioLane) {
    if (editingLocked(lane.id)) return;
    setBusy(true);
    setError(undefined);
    try {
      const { lane: saved } = await updateDawPrivateAudioLaneFade(sessionId, lane.id, lane.fade);
      setLanes((current) => current.map((candidate) => candidate.id === saved.id ? saved : candidate));
      setHistoryRevision((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lane fades could not be saved.");
    } finally { setBusy(false); }
  }

  function editArrangement(laneId: string, patch: Partial<Pick<DawPrivateAudioLane, "timelineStartSeconds" | "sourceInSeconds" | "sourceOutSeconds">>) {
    if (editingLocked(laneId)) return;
    setLanes((current) => current.map((lane) => lane.id === laneId ? { ...lane, ...patch } : lane));
  }

  async function saveArrangement(lane: DawPrivateAudioLane, reset = false) {
    if (editingLocked(lane.id)) return;
    setBusy(true);
    setError(undefined);
    try {
      const { lane: saved } = await arrangeDawPrivateAudioLane(sessionId, lane.id, {
        timelineStartSeconds: lane.timelineStartSeconds,
        sourceInSeconds: reset ? 0 : lane.sourceInSeconds,
        sourceOutSeconds: reset ? lane.audio.durationSeconds : lane.sourceOutSeconds,
      });
      setLanes((current) => current.map((candidate) => candidate.id === saved.id ? saved : candidate)
        .sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setHistoryRevision((current) => current + 1);
      synchronize(playheadRef.current, transportStateRef.current === "playing");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lane arrangement could not be saved.");
    } finally { setBusy(false); }
  }

  async function resetTrackMix(lane: DawPrivateAudioLane, control: "volume" | "pan" | "both") {
    if (editingLocked(lane.id)) return;
    const pending = saveTimersRef.current.get(lane.id);
    if (pending) clearTimeout(pending);
    saveTimersRef.current.delete(lane.id);
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      const mix = resetTimelineDawMusicianTrackMix(lane.mix, control);
      const { lane: saved } = await updateDawPrivateAudioLaneMix(sessionId, lane.id, mix);
      setLanes((current) => current.map((candidate) => candidate.id === saved.id ? saved : candidate));
      if (control !== "pan") dispatchTimelineDawPrivateMixChange({ sourceKind: "lane", sourceId: lane.id, parameter: "gain", value: saved.mix.gain });
      if (control !== "volume") dispatchTimelineDawPrivateMixChange({ sourceKind: "lane", sourceId: lane.id, parameter: "pan", value: saved.mix.pan });
      setMovementNotice(`${saved.name} ${control === "volume" ? "volume is back to normal" : control === "pan" ? "is centered" : "volume is normal and pan is centered"}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track volume and pan could not be reset.");
    } finally { setBusy(false); }
  }

  async function fadeAtPlayPosition(lane: DawPrivateAudioLane, edge: "in" | "out") {
    if (editingLocked(lane.id)) return;
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      const fade = resolveTimelineDawMusicianTrackFade({
        timelineStartSeconds: lane.timelineStartSeconds,
        sourceInSeconds: lane.sourceInSeconds,
        sourceOutSeconds: lane.sourceOutSeconds,
        stretchRatio: lane.transform.stretchRatio,
        transformBypassed: lane.transform.bypassed,
        playPositionSeconds: playheadRef.current,
        edge,
        currentFadeInSeconds: lane.fade.inSeconds,
        currentFadeOutSeconds: lane.fade.outSeconds,
      });
      const { lane: saved } = await updateDawPrivateAudioLaneFade(sessionId, lane.id, fade);
      setLanes((current) => current.map((candidate) => candidate.id === saved.id ? saved : candidate));
      setHistoryRevision((current) => current + 1);
      setMovementNotice(`${saved.name} fade ${edge === "in" ? "in finishes" : "out begins"} at the play position.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track fade could not be saved.");
    } finally { setBusy(false); }
  }

  async function moveTrack(lane: DawPrivateAudioLane, destinationSeconds: number) {
    if (editingLocked(lane.id)) return false;
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      const timelineStartSeconds = resolveTimelineDawMusicianTrackMove({
        currentStartSeconds: lane.timelineStartSeconds,
        destinationSeconds,
      });
      const { lane: saved } = await arrangeDawPrivateAudioLane(sessionId, lane.id, {
        timelineStartSeconds,
        sourceInSeconds: lane.sourceInSeconds,
        sourceOutSeconds: lane.sourceOutSeconds,
      });
      setLanes((current) => current.map((candidate) => candidate.id === saved.id ? saved : candidate)
        .sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setHistoryRevision((current) => current + 1);
      setMovementNotice(`${saved.name} moved to ${saved.timelineStartSeconds.toFixed(2)} seconds.`);
      synchronize(playheadRef.current, transportStateRef.current === "playing");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track could not be moved.");
      return false;
    } finally { setBusy(false); }
  }

  async function placeTrackByAnother(lane: DawPrivateAudioLane, mode: TimelineDawMusicianTrackPlacementMode) {
    const target = lanes.find((item) => item.id === placementTargets[lane.id]);
    if (!target) {
      setError("Choose another track first.");
      return;
    }
    try {
      const destination = resolveTimelineDawMusicianTrackPlacement({
        movingTrackId: lane.id,
        targetTrack: {
          id: target.id,
          timelineStartSeconds: target.timelineStartSeconds,
          sourceInSeconds: target.sourceInSeconds,
          sourceOutSeconds: target.sourceOutSeconds,
          stretchRatio: target.transform.stretchRatio,
          transformBypassed: target.transform.bypassed,
        },
        mode,
      });
      const moved = await moveTrack(lane, destination);
      if (moved) setMovementNotice(`${lane.name} moved ${mode === "same-start" ? `to start with ${target.name}` : `immediately after ${target.name}`}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track could not be placed by the chosen track.");
    }
  }

  async function moveTrackEndToPlayPosition(lane: DawPrivateAudioLane) {
    try {
      const destination = resolveTimelineDawMusicianTrackEndPlacement({
        playPositionSeconds: playheadRef.current,
        sourceInSeconds: lane.sourceInSeconds,
        sourceOutSeconds: lane.sourceOutSeconds,
        stretchRatio: lane.transform.stretchRatio,
        transformBypassed: lane.transform.bypassed,
      });
      const moved = await moveTrack(lane, destination);
      if (moved) setMovementNotice(`${lane.name} now ends at the play position.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track ending could not be placed at the play position.");
    }
  }

  async function trimTrackToPlayPosition(lane: DawPrivateAudioLane, edge: "beginning" | "end") {
    if (editingLocked(lane.id)) return;
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      const arrangement = resolveTimelineDawMusicianTrackTrim({
        edge,
        playPositionSeconds: playheadRef.current,
        timelineStartSeconds: lane.timelineStartSeconds,
        sourceInSeconds: lane.sourceInSeconds,
        sourceOutSeconds: lane.sourceOutSeconds,
        sampleRate: lane.audio.sampleRate,
        stretchRatio: lane.transform.stretchRatio,
        transformBypassed: lane.transform.bypassed,
      });
      const { lane: saved } = await arrangeDawPrivateAudioLane(sessionId, lane.id, arrangement);
      setLanes((current) => current.map((candidate) => candidate.id === saved.id ? saved : candidate)
        .sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setHistoryRevision((current) => current + 1);
      setMovementNotice(`${saved.name} ${edge} trimmed to the play position.`);
      synchronize(playheadRef.current, transportStateRef.current === "playing");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track could not be trimmed.");
    } finally { setBusy(false); }
  }

  async function saveTrackName(lane: DawPrivateAudioLane) {
    if (editingLocked(lane.id)) return;
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      const name = parseTimelineDawMusicianTrackName(nameDrafts[lane.id] ?? lane.name);
      const { lane: saved } = await renameDawPrivateAudioLane(sessionId, lane.id, name);
      setLanes((current) => current.map((candidate) => candidate.id === saved.id ? saved : candidate));
      setNameDrafts((current) => { const next = { ...current }; delete next[lane.id]; return next; });
      setMovementNotice(`Track renamed ${saved.name}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track name could not be saved.");
    } finally { setBusy(false); }
  }

  function stopTrackPreview(lane?: DawPrivateAudioLane, preserveLoopIndicator = false) {
    riffAuditionGenerationRef.current += 1;
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = null;
    riffAuditionSkipRef.current = null;
    riffAuditionPreviousRef.current = null;
    riffAuditionReplayRef.current = null;
    riffAuditionPauseRef.current = null;
    riffAuditionResumeRef.current = null;
    audioRefs.current.forEach((audio) => audio.pause());
    if (lane) {
      const audio = audioRefs.current.get(lane.id);
      if (audio) audio.currentTime = lane.sourceInSeconds;
    }
    setPreviewLaneId(undefined);
    setRiffAuditionActive(false);
    setRiffAuditionPaused(false);
    setRiffAuditionProgress(undefined);
    setActiveSessionSceneId(undefined);
    if (!preserveLoopIndicator) setLoopingRegionId(undefined);
    synchronize(playheadRef.current, false);
  }

  async function previewTrack(lane: DawPrivateAudioLane) {
    setError(undefined);
    stopTrackPreview();
    const audio = audioRefs.current.get(lane.id);
    const graph = graphRefs.current.get(lane.id);
    if (!audio || !graph) { setError(`${lane.name} is not ready to preview yet.`); return; }
    try {
      const plan = createTimelineDawMusicianTrackPreview({
        sourceInSeconds: lane.sourceInSeconds,
        sourceOutSeconds: lane.sourceOutSeconds,
        stretchRatio: lane.transform.stretchRatio,
        transformBypassed: lane.transform.bypassed,
        playbackRate: timelineDawPrivateLanePlaybackRate(lane.transform),
      });
      const fade = effectiveFades.get(lane.id) ?? lane.fade;
      audio.preservesPitch = lane.transform.algorithm === "preserve-pitch";
      audio.playbackRate = plan.playbackRate;
      audio.currentTime = plan.sourceStartSeconds;
      graph.applyEnvelope({ ...lane.mix, muted: false, soloed: false, gain: lane.mix.gain * (master.muted ? 0 : master.gain) }, true, 0, plan.durationSeconds, fade.inSeconds, fade.outSeconds);
      await graph.resume();
      await audio.play();
      setPreviewLaneId(lane.id);
      previewTimerRef.current = setTimeout(() => stopTrackPreview(lane), plan.stopAfterMilliseconds);
    } catch (cause) {
      stopTrackPreview(lane);
      setError(cause instanceof Error ? cause.message : `${lane.name} could not be previewed.`);
    }
  }

  function currentTrackLocalSeconds(lane: DawPrivateAudioLane) {
    return timelineDawTrackLocalSeconds({
      playheadSeconds: playheadRef.current,
      timelineStartSeconds: lane.timelineStartSeconds,
      sourceDurationSeconds: lane.sourceOutSeconds - lane.sourceInSeconds,
      stretchRatio: lane.transform.stretchRatio,
      transformBypassed: lane.transform.bypassed,
    });
  }

  function saveRegionLabel(lane: DawPrivateAudioLane) {
    const startSeconds = regionStarts[lane.id];
    const endSeconds = currentTrackLocalSeconds(lane);
    const name = (regionNameDrafts[lane.id] ?? "").trim();
    if (!Number.isFinite(startSeconds)) { setError("Set the region start first."); return; }
    if (!name) { setError("Name this region before saving it."); return; }
    if (endSeconds <= startSeconds) { setError("Move the play position after the region start, then save the end."); return; }
    setRegionLabels((current) => addTimelineDawTrackRegionLabel(current, {
      id: crypto.randomUUID(), laneId: lane.id, name, startSeconds, endSeconds,
      color: trackColors[lane.id] ?? "cyan",
    }));
    setRegionStarts((current) => { const next = { ...current }; delete next[lane.id]; return next; });
    setRegionNameDrafts((current) => ({ ...current, [lane.id]: "" }));
    setError(undefined);
    setMovementNotice(`${name} saved on ${lane.name}.`);
  }

  async function previewRiff(laneId: string, regionStartSeconds: number, regionEndSeconds: number) {
    const lane = lanes.find((candidate) => candidate.id === laneId);
    if (!lane) return;
    setError(undefined);
    stopTrackPreview();
    const generation = riffAuditionGenerationRef.current;
    const audio = audioRefs.current.get(lane.id);
    const graph = graphRefs.current.get(lane.id);
    if (!audio || !graph) { setError(`${lane.name} is not ready to preview yet.`); return; }
    try {
      const plan = createTimelineDawRiffAudition({
        sourceInSeconds: lane.sourceInSeconds,
        regionStartSeconds,
        regionEndSeconds,
        stretchRatio: lane.transform.stretchRatio,
        transformBypassed: lane.transform.bypassed,
        playbackRate: timelineDawPrivateLanePlaybackRate(lane.transform),
      });
      audio.preservesPitch = lane.transform.algorithm === "preserve-pitch";
      audio.playbackRate = plan.playbackRate;
      audio.currentTime = plan.sourceStartSeconds;
      graph.applyEnvelope({ ...lane.mix, muted: false, soloed: false, gain: lane.mix.gain * (master.muted ? 0 : master.gain) }, true, 0, plan.durationSeconds, 0, 0);
      await graph.resume();
      await audio.play();
      if (!isTimelineDawRiffAuditionCurrent(generation, riffAuditionGenerationRef.current)) { audio.pause(); return; }
      setPreviewLaneId(lane.id);
      setRiffAuditionActive(true);
      setRiffAuditionProgress({ trackName: lane.name, trackNumber: 1, trackCount: 1, passNumber: 1, passCount: 1 });
      previewTimerRef.current = setTimeout(() => stopTrackPreview(lane), plan.stopAfterMilliseconds);
    } catch (cause) {
      stopTrackPreview(lane);
      setError(cause instanceof Error ? cause.message : `${lane.name} riff could not be previewed.`);
    }
  }

  async function previewSessionScene(scene: TimelineDawSessionScene) {
    setError(undefined);
    stopTrackPreview();
    const generation = riffAuditionGenerationRef.current;
    try {
      const launches = createTimelineDawSessionSceneLaunch(scene);
      const prepared = launches.map((launch) => {
        const lane = lanes.find((candidate) => candidate.id === launch.laneId);
        const audio = audioRefs.current.get(launch.laneId);
        const graph = graphRefs.current.get(launch.laneId);
        if (!lane || !audio || !graph) throw new Error("One Session View clip is not ready to play yet.");
        const plan = createTimelineDawRiffAudition({
          sourceInSeconds: lane.sourceInSeconds,
          regionStartSeconds: launch.startSeconds,
          regionEndSeconds: launch.endSeconds,
          stretchRatio: lane.transform.stretchRatio,
          transformBypassed: lane.transform.bypassed,
          playbackRate: timelineDawPrivateLanePlaybackRate(lane.transform),
        });
        return { lane, audio, graph, plan };
      });
      for (const { lane, audio, graph, plan } of prepared) {
        audio.preservesPitch = lane.transform.algorithm === "preserve-pitch";
        audio.playbackRate = plan.playbackRate;
        audio.currentTime = plan.sourceStartSeconds;
        graph.applyEnvelope({ ...lane.mix, muted: false, soloed: false, gain: lane.mix.gain * (master.muted ? 0 : master.gain) }, true, 0, plan.durationSeconds, 0, 0);
      }
      await Promise.all(prepared.map(({ graph }) => graph.resume()));
      await Promise.all(prepared.map(({ audio }) => audio.play()));
      if (!isTimelineDawRiffAuditionCurrent(generation, riffAuditionGenerationRef.current)) {
        prepared.forEach(({ audio }) => audio.pause());
        return;
      }
      setActiveSessionSceneId(scene.id);
      setRiffAuditionActive(true);
      setRiffAuditionProgress({ trackName: `${scene.name} scene`, trackNumber: 1, trackCount: prepared.length, passNumber: 1, passCount: 1 });
      previewTimerRef.current = setTimeout(() => stopTrackPreview(), Math.max(...prepared.map(({ plan }) => plan.stopAfterMilliseconds)));
    } catch (cause) {
      stopTrackPreview();
      setError(cause instanceof Error ? cause.message : `${scene.name} scene could not be launched.`);
    }
  }

  function previewRiffFamily(regions: Array<{ laneId: string; startSeconds: number; endSeconds: number }>, repeatCount = 1, loopForever = false) {
    stopTrackPreview(undefined, loopForever);
    const generation = riffAuditionGenerationRef.current;
    const plans = createTimelineDawRiffAuditionSequence(regions.flatMap((region) => {
      const lane = lanes.find((candidate) => candidate.id === region.laneId);
      return lane ? [{
        laneId: lane.id,
        sourceInSeconds: lane.sourceInSeconds,
        regionStartSeconds: region.startSeconds,
        regionEndSeconds: region.endSeconds,
        stretchRatio: lane.transform.stretchRatio,
        transformBypassed: lane.transform.bypassed,
        playbackRate: timelineDawPrivateLanePlaybackRate(lane.transform),
      }] : [];
    }), repeatCount);
    const playNext = async (index: number) => {
      if (!isTimelineDawRiffAuditionCurrent(generation, riffAuditionGenerationRef.current)) return;
      const plan = plans[index];
      if (!plan) { stopTrackPreview(); return; }
      const lane = lanes.find((candidate) => candidate.id === plan.laneId);
      const audio = audioRefs.current.get(plan.laneId);
      const graph = graphRefs.current.get(plan.laneId);
      if (!lane || !audio || !graph) { setError("One matching track is not ready to preview yet."); stopTrackPreview(); return; }
      try {
        audioRefs.current.forEach((candidate) => candidate.pause());
        audio.preservesPitch = lane.transform.algorithm === "preserve-pitch";
        audio.playbackRate = plan.playbackRate;
        audio.currentTime = plan.sourceStartSeconds;
        graph.applyEnvelope({ ...lane.mix, muted: false, soloed: false, gain: lane.mix.gain * (master.muted ? 0 : master.gain) }, true, 0, plan.durationSeconds, 0, 0);
        await graph.resume();
        await audio.play();
        if (!isTimelineDawRiffAuditionCurrent(generation, riffAuditionGenerationRef.current)) { audio.pause(); return; }
        setPreviewLaneId(lane.id);
        setRiffAuditionActive(true);
        setRiffAuditionPaused(false);
        setRiffAuditionProgress({ trackName: lane.name, ...createTimelineDawRiffAuditionProgress(index, regions.length, repeatCount), canGoPrevious: index > 0 });
        const moveTo = (nextIndex: number | null) => {
          if (!isTimelineDawRiffAuditionCurrent(generation, riffAuditionGenerationRef.current)) return;
          if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
          previewTimerRef.current = null;
          riffAuditionSkipRef.current = null;
          riffAuditionPreviousRef.current = null;
          riffAuditionReplayRef.current = null;
          riffAuditionPauseRef.current = null;
          riffAuditionResumeRef.current = null;
          audio.pause();
          if (nextIndex === null) stopTrackPreview(); else void playNext(nextIndex);
        };
        const advance = () => moveTo(loopForever ? createTimelineDawTrackRegionLoopNextIndex(index, plans.length, true) : createTimelineDawRiffAuditionNextIndex(index, plans.length));
        riffAuditionSkipRef.current = advance;
        riffAuditionPreviousRef.current = () => moveTo(createTimelineDawRiffAuditionPreviousIndex(index));
        riffAuditionReplayRef.current = () => moveTo(createTimelineDawRiffAuditionReplayIndex(index, plans.length));
        let remainingMilliseconds = plan.stopAfterMilliseconds;
        let startedAt = Date.now();
        const scheduleAdvance = () => {
          startedAt = Date.now();
          previewTimerRef.current = setTimeout(advance, remainingMilliseconds);
        };
        riffAuditionPauseRef.current = () => {
          if (riffAuditionPaused || !isTimelineDawRiffAuditionCurrent(generation, riffAuditionGenerationRef.current)) return;
          if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
          previewTimerRef.current = null;
          remainingMilliseconds = createTimelineDawRiffAuditionRemainingMilliseconds(remainingMilliseconds, Date.now() - startedAt);
          audio.pause();
          setRiffAuditionPaused(true);
        };
        riffAuditionResumeRef.current = () => {
          if (!isTimelineDawRiffAuditionCurrent(generation, riffAuditionGenerationRef.current)) return;
          void audio.play().then(() => {
            if (!isTimelineDawRiffAuditionCurrent(generation, riffAuditionGenerationRef.current)) { audio.pause(); return; }
            setRiffAuditionPaused(false);
            scheduleAdvance();
          }).catch(() => { setError("The paused riff comparison could not resume."); stopTrackPreview(); });
        };
        scheduleAdvance();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Matching riffs could not be compared.");
        stopTrackPreview(lane);
      }
    };
    void playNext(0);
  }

  async function saveBus(input: { busId?: string; name: string; muted: boolean; soloed: boolean; gain: number; pan: number }) {
    setBusy(true); setError(undefined);
    try { const { bus } = await saveDawPrivateBus(sessionId, input); setBuses((current) => [...current.filter((item) => item.id !== bus.id), bus]); dispatchTimelineDawPrivateMixChange({ sourceKind: "bus", sourceId: bus.id, parameter: "gain", value: bus.mix.gain }); dispatchTimelineDawPrivateMixChange({ sourceKind: "bus", sourceId: bus.id, parameter: "pan", value: bus.mix.pan }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Private bus could not be saved."); }
    finally { setBusy(false); }
  }
  async function deleteBus(bus: DawPrivateBus) {
    setBusy(true); setError(undefined);
    try { await deleteDawPrivateBus(sessionId, bus.id); setBuses((current) => current.filter((item) => item.id !== bus.id)); setLanes((current) => current.map((lane) => lane.busId === bus.id ? { ...lane, busId: null } : lane)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Private bus could not be deleted."); }
    finally { setBusy(false); }
  }
  async function assignBus(lane: DawPrivateAudioLane, busId: string | null) {
    if (editingLocked(lane.id)) return;
    setError(undefined);
    try { const saved = await assignDawPrivateLaneBus(sessionId, lane.id, busId); setLanes((current) => current.map((item) => item.id === lane.id ? { ...item, busId: saved.busId, updatedAt: saved.updatedAt } : item)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Lane routing could not be saved."); }
  }

  async function persistSend(input: Omit<DawPrivateSend, "id"> & { id?: string }) { setError(undefined); try { const { send } = await saveDawPrivateSend(sessionId, input); setSends((current) => [...current.filter((item) => item.id !== send.id && !(item.sourceKind === send.sourceKind && item.sourceId === send.sourceId && item.destinationBusId === send.destinationBusId)), send]); } catch (cause) { setError(cause instanceof Error ? cause.message : "Private send could not be saved."); } }
  async function persistInsert(input: Omit<DawPrivateInsert, "id"> & { id?: string }) { setError(undefined); try { const { insert } = await saveDawPrivateInsert(sessionId, input); setInserts((current) => [...current.filter((item) => item.id !== insert.id && !(item.sourceKind === insert.sourceKind && item.sourceId === insert.sourceId && item.slot === insert.slot)), insert]); } catch (cause) { setError(cause instanceof Error ? cause.message : "Private insert could not be saved."); } }
  async function applyGroupEdit(edit: PrivateLaneGroupEditInput, successMessage?: string) {
    if ([...selectedIds].some((laneId) => lockedIds.has(laneId))) {
      setMovementNotice("One or more selected tracks are locked. Unlock them before changing the group.");
      return;
    }
    setBusy(true); setError(undefined); setMovementNotice(undefined);
    try {
      const { lanes: saved } = await editDawPrivateLaneGroup({ sessionId, laneIds: [...selectedIds], ...edit });
      setLanes(saved.sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setHistoryRevision((current) => current + 1);
      if (successMessage) setMovementNotice(successMessage);
      synchronize(playheadRef.current, transportStateRef.current === "playing");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Selected regions could not be edited."); }
    finally { setBusy(false); }
  }

  function currentFolderBusId(folderId: string) {
    const folder = trackFolders[folderId];
    if (!folder) return null;
    const ids = [...new Set(folder.laneIds.map((laneId) => lanes.find((lane) => lane.id === laneId)?.busId ?? null))];
    return ids.length === 1 ? ids[0] : null;
  }

  async function routeFolderToBus(folderId: string, busId: string | null) {
    const folder = trackFolders[folderId];
    if (!folder) return;
    setBusy(true); setError(undefined);
    try {
      const saved = await assignDawPrivateFolderBus(sessionId, folder.laneIds, busId);
      const byId = new Map(saved.lanes.map((item) => [item.laneId, item]));
      setLanes((current) => current.map((lane) => { const update = byId.get(lane.id); return update ? { ...lane, busId: update.busId, updatedAt: update.updatedAt } : lane; }));
      setMovementNotice(`${folder.name} now shares ${busId ? `${buses.find((bus) => bus.id === busId)?.name ?? "the selected bus"} inserts and sends` : "the master output"}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Folder bus routing could not be saved."); }
    finally { setBusy(false); }
  }

  async function moveSelectedTracks(mode: TimelineDawMusicianGroupMoveMode) {
    const selectedTracks = lanes.filter((lane) => selectedIds.has(lane.id));
    try {
      const deltaSeconds = resolveTimelineDawMusicianGroupMove({
        tracks: selectedTracks,
        mode,
        playPositionSeconds: playheadRef.current,
      });
      const direction = mode === "hundredth-second-earlier"
        ? "one hundredth of a second earlier"
        : mode === "hundredth-second-later"
          ? "one hundredth of a second later"
          : mode === "tenth-second-earlier"
            ? "one tenth of a second earlier"
        : mode === "tenth-second-later"
          ? "one tenth of a second later"
          : mode === "one-second-earlier"
            ? "one second earlier"
            : mode === "one-second-later"
              ? "one second later"
              : "to the play position";
      await applyGroupEdit(
        { groupAction: "move", deltaSeconds },
        `${selectedTracks.length} selected tracks moved ${direction}. Their spacing stayed the same.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Selected tracks could not be moved.");
    }
  }

  async function changeTrackSpeedOrPitch(lane: DawPrivateAudioLane, action: TimelineDawMusicianSpeedPitchAction) {
    if (editingLocked(lane.id)) return;
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      const transform = adjustTimelineDawMusicianSpeedPitch(lane.transform, action);
      const { lane: saved } = await updateDawPrivateAudioLaneTransform(sessionId, lane.id, transform);
      setLanes((current) => current.map((item) => item.id === saved.id ? saved : item));
      setHistoryRevision((current) => current + 1);
      synchronize(playheadRef.current, transportStateRef.current === "playing");
      const result = action === "slower" ? "slowed down" : action === "faster" ? "sped up" : action === "lower" ? "lowered one semitone" : action === "raise" ? "raised one semitone" : "returned to original speed and pitch";
      setMovementNotice(`${saved.name} ${result}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track speed or pitch could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function applyExactTempoAndKey(
    lane: DawPrivateAudioLane,
    transform: DawPrivateAudioLane["transform"],
    description: string,
  ) {
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      const { lane: saved } = await updateDawPrivateAudioLaneTransform(sessionId, lane.id, transform);
      setLanes((current) => current.map((item) => item.id === saved.id ? saved : item));
      setHistoryRevision((current) => current + 1);
      synchronize(playheadRef.current, transportStateRef.current === "playing");
      setMovementNotice(`${saved.name}: ${description}. Original audio was preserved.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Exact BPM and key could not be saved.");
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  async function restoreAllTrackSound(mode: "solo" | "mute" | "both") {
    if (!lanes.length) return;
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      const { lanes: saved } = await editDawPrivateLaneGroup({
        sessionId,
        laneIds: lanes.map((lane) => lane.id),
        groupAction: "audibility",
        clearSolo: mode !== "mute",
        unmute: mode !== "solo",
      });
      setLanes(saved.sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setHistoryRevision((current) => current + 1);
      setMovementNotice(mode === "solo" ? "All Solo buttons are off. Every unmuted track can play again." : mode === "mute" ? "All tracks are unmuted." : "All Solo and Mute buttons are cleared. Every track can play again.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track sound could not be restored.");
    } finally { setBusy(false); }
  }

  async function splitAtPlayhead(lane: DawPrivateAudioLane) {
    if (editingLocked(lane.id)) return;
    setBusy(true);
    setError(undefined);
    try {
      const { lanes: regions } = await splitDawPrivateAudioLane(sessionId, lane.id, playheadRef.current);
      setLanes((current) => current.flatMap((candidate) => candidate.id === lane.id ? regions : [candidate])
        .sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setHistoryRevision((current) => current + 1);
      setMovementNotice(`${lane.name} was cut into two editable tracks at ${regions[1].timelineStartSeconds.toFixed(2)} seconds.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lane could not be split at the playhead.");
    } finally { setBusy(false); }
  }

  async function duplicate(lane: DawPrivateAudioLane, atPlayPosition = false) {
    if (editingLocked(lane.id)) return;
    setBusy(true);
    setError(undefined);
    try {
      const { lane: copy } = await duplicateDawPrivateAudioLane(
        sessionId,
        lane.id,
        atPlayPosition ? playheadRef.current : undefined,
      );
      const [processing, copiedAutomation] = await Promise.all([loadDawPrivateBusProcessing(sessionId), loadDawPrivateAutomation(sessionId)]);
      setLanes((current) => [...current, copy].sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setSends(processing.sends);
      setInserts(processing.inserts);
      setAutomation(copiedAutomation.envelopes);
      setHistoryRevision((current) => current + 1);
      setMovementNotice(atPlayPosition
        ? `${copy.name} was copied to the play position.`
        : `${lane.name} now repeats immediately after it finishes.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lane could not be duplicated.");
    } finally { setBusy(false); }
  }

  async function repeatSeveral(lane: DawPrivateAudioLane, repeatCount: 2 | 4) {
    if (editingLocked(lane.id)) return;
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      const { lanes: repeats } = await repeatDawPrivateAudioLane(sessionId, lane.id, repeatCount);
      const [processing, copiedAutomation] = await Promise.all([loadDawPrivateBusProcessing(sessionId), loadDawPrivateAutomation(sessionId)]);
      setLanes((current) => [...current, ...repeats].sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setSends(processing.sends);
      setInserts(processing.inserts);
      setAutomation(copiedAutomation.envelopes);
      setHistoryRevision((current) => current + 1);
      setMovementNotice(`${lane.name} now repeats ${repeatCount} times in a row.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track repeats could not be created.");
    } finally { setBusy(false); }
  }

  async function remove(lane: DawPrivateAudioLane) {
    if (editingLocked(lane.id)) return;
    const message = createTimelineDawMusicianTrackRemovalMessage(lane.name);
    if (!window.confirm(message.confirmation)) return;
    setBusy(true);
    setError(undefined);
    setMovementNotice(undefined);
    try {
      await removeDawPrivateAudioLane(sessionId, lane.id);
      audioRefs.current.get(lane.id)?.pause();
      audioRefs.current.delete(lane.id);
      graphRefs.current.get(lane.id)?.dispose();
      graphRefs.current.delete(lane.id);
      setLanes((current) => current.filter((candidate) => candidate.id !== lane.id));
      setHistoryRevision((current) => current + 1);
      setMovementNotice(message.success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Track could not be removed from this song.");
    } finally { setBusy(false); }
  }

  return (
    <section className="rounded-3xl border border-violet-300/20 bg-[#080808] p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">Private source lanes</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">Recorded and promoted audio</h2><p className="mt-1 text-sm text-white/55">New sources enter at the current playhead and follow the session transport. Removing a lane never deletes its private master.</p></div><span className="text-sm font-black text-violet-200">{lanes.length} lane{lanes.length === 1 ? "" : "s"}</span></div>
      {error ? <p role="alert" className="mt-3 text-sm text-red-200">{error}</p> : null}
      {movementNotice ? <p role="status" className="mt-3 text-sm font-bold text-emerald-200">{movementNotice}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-3"><span className="text-xs font-black text-white/70">If tracks seem missing:</span><button type="button" className={button} disabled={busy || !lanes.some((lane) => lane.mix.soloed)} onClick={() => void restoreAllTrackSound("solo")}>Turn Off All Solo</button><button type="button" className={button} disabled={busy || !lanes.some((lane) => lane.mix.muted)} onClick={() => void restoreAllTrackSound("mute")}>Unmute All Tracks</button><button type="button" className={button} disabled={busy || !lanes.some((lane) => lane.mix.soloed || lane.mix.muted)} onClick={() => void restoreAllTrackSound("both")}>Hear All Tracks Again</button></div>
      <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-cyan-100">Move tracks together: {selectedIds.size} selected</span>
          <button type="button" className={button} disabled={busy || !lanes.length || selectedIds.size === lanes.length} onClick={() => setSelectedIds(new Set(lanes.map((lane) => lane.id)))}>Select All Tracks</button>
          <button type="button" className={button} disabled={busy || !selectedIds.size} onClick={() => setSelectedIds(new Set())}>Clear Selection</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void moveSelectedTracks("hundredth-second-earlier")}>Move Selected 0.01 Second Earlier</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void moveSelectedTracks("hundredth-second-later")}>Move Selected 0.01 Second Later</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void moveSelectedTracks("tenth-second-earlier")}>Move Selected 0.1 Second Earlier</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void moveSelectedTracks("tenth-second-later")}>Move Selected 0.1 Second Later</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void moveSelectedTracks("one-second-earlier")}>Move Selected 1 Second Earlier</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void moveSelectedTracks("one-second-later")}>Move Selected 1 Second Later</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void moveSelectedTracks("play-position")}>Move Selected to Play Position</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void applyGroupEdit({ groupAction: "align-start" }, `${selectedIds.size} selected tracks now start together.`)}>Align Selected Starts</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void applyGroupEdit({ groupAction: "align-end" }, `${selectedIds.size} selected tracks now end together.`)}>Align Selected Endings</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void applyGroupEdit({ groupAction: "sequence" }, `${selectedIds.size} selected tracks now play one after another.`)}>Place Selected One After Another</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void applyGroupEdit({ groupAction: "sequence", sequenceGapSeconds: 0.1 }, `${selectedIds.size} selected tracks now have a 0.1-second space between them.`)}>Place Selected with 0.1 Second Gaps</button>
          <button type="button" className={button} disabled={busy || selectedIds.size < 2} onClick={() => void applyGroupEdit({ groupAction: "sequence", sequenceGapSeconds: 1 }, `${selectedIds.size} selected tracks now have a 1-second space between them.`)}>Place Selected with 1 Second Gaps</button>
        </div>
        <p className="mt-2 text-xs text-white/55">Check two or more tracks below. Move keeps their spacing. Align layers their starts or endings. Place makes a continuous sequence—or adds a short or full-second pause—in their current order.</p>
        <p className="mt-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/65"><strong>Selected-track keyboard:</strong> L locks or unlocks one selected track · H hears or stops one selected track. Shortcuts stay off while typing in any field or menu.</p>
      </div>
      <TimelineDawPrivateMasterBus sessionId={sessionId} onChange={setMaster} />
      <TimelineDawMusicianImport sessionId={sessionId} projectId={projectId} />
      <TimelineDawSessionView
        lanes={lanes.map((lane) => ({ id: lane.id, name: lane.name }))}
        labels={regionLabels}
        activeSceneId={activeSessionSceneId}
        onLaunchClip={(clip) => { setMovementNotice(`Launching ${clip.name} in Session View. The arrangement is unchanged.`); void previewRiff(clip.laneId, clip.startSeconds, clip.endSeconds); }}
        onLaunchScene={(scene) => { setMovementNotice(`Launching ${scene.name} across ${scene.slots.length} tracks. The arrangement is unchanged.`); void previewSessionScene(scene); }}
        onStop={() => stopTrackPreview()}
      />
      <TimelineDawMusicianMixer lanes={lanes} buses={buses} inserts={inserts} sends={sends} meters={meters} busy={busy} onMix={queueMix} onRoute={(lane, busId) => void assignBus(lane, busId)} onInsert={(insert) => void persistInsert(insert)} onSend={(send) => void persistSend(send)} />
      <TimelineDawPrivateLaneHistory sessionId={sessionId} revision={historyRevision} onRestore={(restored) => setLanes(restored.sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds))} />
      <details className="mt-3 rounded-xl border border-white/10 p-3">
        <summary className="cursor-pointer text-sm font-black text-white/60">Advanced version-family tools</summary>
        <TimelineDawAudioFamilyIntake sessionId={sessionId} />
      </details>
      <details className="mt-3 rounded-xl border border-white/10 p-3">
        <summary className="cursor-pointer text-sm font-black text-white/60">Advanced mixing, automation, collaboration, and recovery</summary>
      <TimelineDawPrivateMidiSequencer sessionId={sessionId} />
      <TimelineDawPrivateSnapshots sessionId={sessionId} currentMaster={master} onAudition={setMaster} onRestored={()=>window.location.reload()} />
      <TimelineDawPrivateReviews sessionId={sessionId} sampleRate={lanes[0]?.audio.sampleRate??48000} targets={[...lanes.map(l=>({id:l.id,kind:"lane" as const,name:l.name,timelineStartSeconds:l.timelineStartSeconds,sourceInSeconds:l.sourceInSeconds})),...buses.map(b=>({id:b.id,kind:"bus" as const,name:b.name}))]} onNavigate={(seconds)=>{playheadRef.current=seconds;synchronize(seconds,false)}} onAudition={(start,end)=>{playheadRef.current=start;synchronize(start,true);window.setTimeout(()=>synchronize(end??start+2,false),Math.max(100,((end??start+2)-start)*1000))}} />
      <TimelineDawPrivateCollaboration sessionId={sessionId} targets={[...lanes.map(l=>({id:l.id,kind:"lane" as const,name:l.name})),...buses.map(b=>({id:b.id,kind:"bus" as const,name:b.name}))]} />
      <TimelineDawPrivateTemplates sessionId={sessionId} onApplied={()=>window.location.reload()} />
      <TimelineDawPrivateBounceQueue sessionId={sessionId} targets={[...lanes.map(lane=>({id:lane.id,kind:"lane" as const,name:lane.name})),...buses.map(bus=>({id:bus.id,kind:"bus" as const,name:bus.name}))]} />
      <TimelineDawPrivateBusMixer detectorSources={[...lanes.map(l=>({id:l.id,kind:"lane" as const,name:l.name})),...buses.map(b=>({id:b.id,kind:"bus" as const,name:b.name}))]} buses={buses} sends={sends} inserts={inserts} meters={busMeters} busy={busy} onSave={(bus) => void saveBus(bus)} onDelete={(bus) => void deleteBus(bus)} onSend={(send) => void persistSend(send)} onInsert={(insert) => void persistInsert(insert)} />
      <TimelineDawPrivateFreezePanel sessionId={sessionId} lanes={lanes} buses={buses} freezes={freezes} onChange={setFreezes} />
      <TimelineDawPrivateAutomationEditor sessionId={sessionId} sources={[...lanes.map((lane)=>({id:lane.id,kind:"lane" as const,name:lane.name,sampleRate:lane.audio.sampleRate,baseGain:lane.mix.gain,basePan:lane.mix.pan})),...buses.map((bus)=>({id:bus.id,kind:"bus" as const,name:bus.name,sampleRate:lanes[0]?.audio.sampleRate??48000,baseGain:bus.mix.gain,basePan:bus.mix.pan}))]} envelopes={automation} onChange={setAutomation} />
      <TimelineDawPrivateLaneGroupEditor lanes={lanes} selectedIds={selectedIds} busy={busy} onSelection={setSelectedIds} onApply={(edit) => void applyGroupEdit(edit)} />
      <section className="mt-4 rounded-xl border border-violet-300/25 bg-violet-300/[0.06] p-3" aria-label="Track folders">
        <div className="flex flex-wrap items-end gap-2"><label className="min-w-52 flex-1 text-xs font-black text-violet-100">New folder name<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={folderNameDraft} maxLength={80} placeholder="Vocals, Guitars, Drums…" onChange={(event) => setFolderNameDraft(event.target.value)} /></label><button type="button" className={button} disabled={selectedIds.size < 2 || !folderNameDraft.trim() || [...selectedIds].some((laneId) => Object.values(trackFolders).some((folder) => folder.laneIds.includes(laneId)))} onClick={() => { const name = folderNameDraft.trim(); const id = crypto.randomUUID(); setTrackFolders((current) => createTimelineDawTrackFolder(current, { id, name, laneIds: [...selectedIds], collapsed: false, gain: 1, muted: false, soloed: false })); setFolderNameDraft(""); setSelectedIds(new Set()); setMovementNotice(`${name} folder created. Its tracks are unchanged.`); }}>Create Folder from Selected Tracks</button><span className="text-xs text-white/45">Select at least two ungrouped tracks. Removing a folder never removes its tracks.</span></div>
        {Object.values(trackFolders).length ? <ol className="mt-3 grid gap-2">{Object.values(trackFolders).map((folder) => <li key={folder.id} className="rounded-lg border border-violet-300/20 bg-black/40 p-2"><div className="flex flex-wrap items-end gap-2"><label className="min-w-44 flex-1 text-xs font-black text-white/70">Folder name<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={folderRenameDrafts[folder.id] ?? folder.name} maxLength={80} onChange={(event) => setFolderRenameDrafts((current) => ({ ...current, [folder.id]: event.target.value }))} /></label><button type="button" className={button} disabled={!(folderRenameDrafts[folder.id] ?? folder.name).trim() || (folderRenameDrafts[folder.id] ?? folder.name).trim() === folder.name} onClick={() => { const name = (folderRenameDrafts[folder.id] ?? folder.name).trim(); setTrackFolders((current) => renameTimelineDawTrackFolder(current, folder.id, name)); setFolderRenameDrafts((current) => { const next = { ...current }; delete next[folder.id]; return next; }); setMovementNotice(`${folder.name} folder renamed ${name}.`); }}>Save Folder Name</button><button type="button" className={button} aria-expanded={!folder.collapsed} onClick={() => setTrackFolders((current) => toggleTimelineDawTrackFolder(current, folder.id))}>{folder.collapsed ? `Expand ${folder.laneIds.length} Tracks` : `Collapse ${folder.laneIds.length} Tracks`}</button><button type="button" className={button} onClick={() => { setTrackFolders((current) => removeTimelineDawTrackFolder(current, folder.id)); setMovementNotice(`${folder.name} folder removed. All ${folder.laneIds.length} tracks remain in the song.`); }}>Remove Folder Only</button></div><div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-violet-300/15 p-2"><label className="min-w-52 flex-1 text-xs font-black text-violet-100">Folder volume {Math.round(folder.gain * 100)}%<input className="block w-full accent-violet-300" type="range" min={0} max={2} step={0.01} value={folder.gain} onChange={(event) => setTrackFolders((current) => updateTimelineDawTrackFolderMix(current, folder.id, { gain: Number(event.target.value) }))} /></label><button type="button" className={folder.muted ? "rounded-xl border border-amber-300 bg-amber-200 px-3 py-2 text-sm font-black text-amber-950" : button} aria-pressed={folder.muted} onClick={() => setTrackFolders((current) => updateTimelineDawTrackFolderMix(current, folder.id, { muted: !folder.muted }))}>{folder.muted ? "Unmute Folder" : "Mute Folder"}</button><button type="button" className={folder.soloed ? "rounded-xl border border-cyan-300 bg-cyan-200 px-3 py-2 text-sm font-black text-cyan-950" : button} aria-pressed={folder.soloed} onClick={() => setTrackFolders((current) => updateTimelineDawTrackFolderMix(current, folder.id, { soloed: !folder.soloed }))}>{folder.soloed ? "Unsolo Folder" : "Solo Folder"}</button><span className="text-xs text-white/45">Shared playback control; individual track settings stay intact.</span></div><p className="mt-1 text-xs text-white/50">{folder.laneIds.map((laneId) => lanes.find((lane) => lane.id === laneId)?.name).filter(Boolean).join(", ")}</p></li>)}</ol> : <p className="mt-2 text-xs text-white/45">No track folders yet.</p>}
        {Object.values(trackFolders).length ? <div className="mt-3 grid gap-2">{Object.values(trackFolders).map((folder) => { const sharedBusId = currentFolderBusId(folder.id); const sharedBus = buses.find((bus) => bus.id === sharedBusId); const insertCount = inserts.filter((item) => item.sourceKind === "bus" && item.sourceId === sharedBusId && !item.bypassed).length; const sendCount = sends.filter((item) => item.sourceKind === "bus" && item.sourceId === sharedBusId && !item.muted).length; return <div key={`${folder.id}-routing`} className="rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/[0.05] p-2"><p className="text-xs font-black text-fuchsia-100">{folder.name} shared effects and sends</p><div className="mt-2 flex flex-wrap items-center gap-2"><select aria-label={`${folder.name} shared effects bus`} className="min-w-48 rounded-lg border border-white/20 bg-black px-2 py-2 text-xs text-white" value={folderBusTargets[folder.id] ?? sharedBusId ?? ""} onChange={(event) => setFolderBusTargets((current) => ({ ...current, [folder.id]: event.target.value }))}><option value="">Master output (no shared bus)</option>{buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.name}</option>)}</select><button type="button" className={button} disabled={busy || (folderBusTargets[folder.id] ?? sharedBusId ?? "") === (sharedBusId ?? "")} onClick={() => void routeFolderToBus(folder.id, folderBusTargets[folder.id] || null)}>Route Folder to Shared Bus</button>{sharedBus ? <><span className="text-xs text-white/55">{sharedBus.name}: {insertCount} active inserts · {sendCount} active sends</span><select aria-label={`${folder.name} new parallel send`} className="rounded-lg border border-white/20 bg-black px-2 py-2 text-xs text-white" value={folderSendTargets[folder.id] ?? ""} onChange={(event) => setFolderSendTargets((current) => ({ ...current, [folder.id]: event.target.value }))}><option value="">Choose parallel send destination</option>{buses.filter((bus) => bus.id !== sharedBus.id).map((bus) => <option key={bus.id} value={bus.id}>{bus.name}</option>)}</select><button type="button" className={button} disabled={!folderSendTargets[folder.id]} onClick={() => { const destination = folderSendTargets[folder.id]; if (!destination) return; void persistSend(parseTimelineDawTrackFolderSend(sharedBus.id, destination)); setFolderSendTargets((current) => ({ ...current, [folder.id]: "" })); setMovementNotice(`${folder.name} now sends in parallel from ${sharedBus.name} to ${buses.find((bus) => bus.id === destination)?.name ?? "the selected bus"}.`); }}>Add Shared Send</button></> : <span className="text-xs text-white/45">Choose an existing bus to share its Gain, Filter, Compressor, Gate, sidechain, and sends. Create or edit buses in the Bus Mixer above.</span>}</div></div>; })}</div> : null}
      </section>
      <TimelineDawMusicianSelectedTempoKeyMatch
        lanes={lanes}
        selectedIds={selectedIds}
        busy={busy}
        onApply={(transformById, description) => applyGroupEdit({ groupAction: "transform", transformById }, `${description}. All originals were preserved.`)}
      />
      <TimelineDawMusicianRiffMatch lanes={lanes} selectedIds={selectedIds} waveforms={waveforms} onAudition={(laneId, startSeconds, endSeconds) => void previewRiff(laneId, startSeconds, endSeconds)} onAuditionFamily={previewRiffFamily} auditionActive={riffAuditionActive} auditionPaused={riffAuditionPaused} auditionProgress={riffAuditionProgress} onPauseAudition={() => riffAuditionPauseRef.current?.()} onResumeAudition={() => riffAuditionResumeRef.current?.()} onPreviousAudition={() => riffAuditionPreviousRef.current?.()} onReplayAudition={() => riffAuditionReplayRef.current?.()} onSkipAudition={() => riffAuditionSkipRef.current?.()} onStopAudition={() => stopTrackPreview()} />
      </details>
      {crossfades.length ? <div className="mt-3 rounded-xl border border-violet-300/20 bg-violet-300/10 p-3 text-xs text-violet-100"><p className="font-black">Automatic smooth transitions</p>{crossfades.map((crossfade) => { const outgoing = lanes.find((lane) => lane.id === crossfade.outgoingLaneId); const incoming = lanes.find((lane) => lane.id === crossfade.incomingLaneId); return <p key={`${crossfade.outgoingLaneId}:${crossfade.incomingLaneId}`} className="mt-1">{outgoing?.name} into {incoming?.name}: {crossfade.startSeconds.toFixed(2)} to {crossfade.endSeconds.toFixed(2)} seconds ({crossfade.durationSeconds.toFixed(2)}-second transition)</p>; })}</div> : null}
{freezes.filter((freeze) => freeze.active).map((freeze) => <audio key={freeze.id} ref={(element) => { if (element) freezeAudioRefs.current.set(freeze.id, element); else freezeAudioRefs.current.delete(freeze.id); }} src={freeze.artifact.playbackUrl} crossOrigin="anonymous" preload="metadata" />)}
            {lanes.length ? (
        <ol className="mt-4 grid gap-2">
          {lanes.filter((lane) => !Object.values(trackFolders).some((folder) => folder.collapsed && folder.laneIds.includes(lane.id))).map((lane) => {
            const meter = meters[lane.id] ?? { peakAmplitude: 0, peakDbfs: -96, clipped: false };
            const locked = lockedIds.has(lane.id);
            const trackColorName = trackColors[lane.id] ?? "cyan";
            const trackColor = TIMELINE_DAW_TRACK_COLORS[trackColorName];
            return (
              <li key={lane.id} className="rounded-xl border bg-white/[0.04] p-3" style={{ borderColor: trackColor }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-start gap-2"><input type="checkbox" aria-label={`Select ${lane.name}`} checked={selectedIds.has(lane.id)} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(lane.id); else next.delete(lane.id); return next; })} /><div><p className="font-black">{lane.name}</p><p className="text-xs text-white/45">Start {lane.timelineStartSeconds.toFixed(2)}s · End {resolveTimelineDawMusicianTrackTiming({ timelineStartSeconds: lane.timelineStartSeconds, sourceInSeconds: lane.sourceInSeconds, sourceOutSeconds: lane.sourceOutSeconds, stretchRatio: lane.transform.stretchRatio, transformBypassed: lane.transform.bypassed }).audibleEndSeconds.toFixed(2)}s · Length {resolveTimelineDawMusicianTrackTiming({ timelineStartSeconds: lane.timelineStartSeconds, sourceInSeconds: lane.sourceInSeconds, sourceOutSeconds: lane.sourceOutSeconds, stretchRatio: lane.transform.stretchRatio, transformBypassed: lane.transform.bypassed }).audibleDurationSeconds.toFixed(2)}s · {lane.audio.channelCount}ch · {lane.audio.sampleRate.toLocaleString()} Hz{lane.provenance ? ` · comp ${lane.provenance.compId}` : " · recording"}</p><button type="button" className="mt-1 text-xs font-black text-cyan-200" onClick={() => setSelectedIds(new Set([lane.id]))}>Select only</button></div></div>
                  <div className="flex flex-wrap gap-2"><label className="rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-black">Track Color <select className="ml-2 bg-black" value={trackColorName} onChange={(event) => setTrackColors((current) => setTimelineDawTrackColor(current, lane.id, event.target.value as TimelineDawTrackColorName))}>{Object.keys(TIMELINE_DAW_TRACK_COLORS).map((color) => <option key={color} value={color}>{color[0].toUpperCase() + color.slice(1)}</option>)}</select></label><button type="button" className={locked ? "rounded-xl border border-amber-300 bg-amber-200 px-3 py-2 text-sm font-black text-amber-950" : button} aria-pressed={locked} onClick={() => { setLockedIds((current) => toggleTimelineDawTrackLock(current, lane.id)); setMovementNotice(`${lane.name} is now ${locked ? "unlocked and editable" : "locked against accidental edits"}.`); }}>{locked ? "Unlock Track" : "Lock Track"}</button><button type="button" className={button} disabled={busy || locked} onClick={() => void remove(lane)}>Remove Track from Song</button></div>
                </div>
                {locked ? <p role="status" className="mt-2 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100">Locked: listening is available, but arrangement and sound edits are blocked.</p> : null}
                <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={() => previewLaneId === lane.id ? stopTrackPreview(lane) : void previewTrack(lane)}>{previewLaneId === lane.id ? "Stop Track Preview" : "Hear This Track Alone"}</button><span className="self-center text-xs text-white/45">Temporary preview only—your Solo, Mute, and mix settings are not changed.</span></div>
                <section className="mt-3 rounded-xl border border-white/10 bg-black/50 p-3" aria-label={`${lane.name} labeled regions`}>
                  <p className="text-sm font-black" style={{ color: trackColor }}>Named Regions</p>
                  <p className="mt-1 text-xs text-white/55">Place the play position, set the start, move it forward, then save the end. Labels are safe to add even while this track is locked.</p>
                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <label className="min-w-48 flex-1 text-xs font-black text-white/70">Region name<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={regionNameDrafts[lane.id] ?? ""} maxLength={80} placeholder="Verse, Chorus, Solo…" onChange={(event) => setRegionNameDrafts((current) => ({ ...current, [lane.id]: event.target.value }))} /></label>
                    <button type="button" className={button} onClick={() => { const seconds = currentTrackLocalSeconds(lane); setRegionStarts((current) => ({ ...current, [lane.id]: seconds })); setMovementNotice(`Region start set at ${seconds.toFixed(2)} seconds on ${lane.name}.`); }}>Set Region Start</button>
                    <button type="button" className={button} disabled={!Number.isFinite(regionStarts[lane.id]) || !(regionNameDrafts[lane.id] ?? "").trim()} onClick={() => saveRegionLabel(lane)}>Save Region End</button>
                    {Number.isFinite(regionStarts[lane.id]) ? <span className="self-center text-xs font-black text-cyan-100">Start: {regionStarts[lane.id].toFixed(2)}s</span> : null}
                  </div>
                  {(regionLabels[lane.id] ?? []).length > 1 ? <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-2"><button type="button" className={button} onClick={() => previewRiffFamily(createTimelineDawTrackRegionSequence(regionLabels[lane.id] ?? []))}>Play All Regions</button><button type="button" className={button} onClick={() => previewRiffFamily(createTimelineDawTrackRegionSequence(regionLabels[lane.id] ?? []), 3)}>Repeat All Regions 3 Times</button>{riffAuditionActive && previewLaneId === lane.id && riffAuditionProgress && riffAuditionProgress.trackCount > 1 ? <><button type="button" className={button} disabled={!riffAuditionProgress.canGoPrevious} onClick={() => riffAuditionPreviousRef.current?.()}>Previous Region</button><button type="button" className={button} onClick={() => riffAuditionReplayRef.current?.()}>Replay Region</button>{riffAuditionPaused ? <button type="button" className={button} onClick={() => riffAuditionResumeRef.current?.()}>Resume Regions</button> : <button type="button" className={button} onClick={() => riffAuditionPauseRef.current?.()}>Pause Regions</button>}<button type="button" className={button} onClick={() => riffAuditionSkipRef.current?.()}>Next Region</button><button type="button" className={button} onClick={() => stopTrackPreview()}>Stop Regions</button><span role="status" className="text-xs font-black text-cyan-100">Region {riffAuditionProgress.trackNumber} of {riffAuditionProgress.trackCount} · pass {riffAuditionProgress.passNumber} of {riffAuditionProgress.passCount}</span></> : <span className="text-xs text-white/45">Plays from the earliest labeled section to the latest and advances automatically.</span>}</div> : null}
                  {(regionLabels[lane.id] ?? []).length ? <ol className="mt-3 grid gap-2">{(regionLabels[lane.id] ?? []).map((label) => <li key={label.id} className="rounded-lg border bg-white/[0.04] px-3 py-2" style={{ borderColor: TIMELINE_DAW_TRACK_COLORS[label.color] }}><div className="flex flex-wrap items-end gap-2"><label className="min-w-44 flex-1 text-xs font-black text-white/70">Saved region name<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={regionRenameDrafts[label.id] ?? label.name} maxLength={80} onChange={(event) => setRegionRenameDrafts((current) => ({ ...current, [label.id]: event.target.value }))} /></label><button type="button" className={button} disabled={!(regionRenameDrafts[label.id] ?? label.name).trim() || (regionRenameDrafts[label.id] ?? label.name).trim() === label.name} onClick={() => { const name = (regionRenameDrafts[label.id] ?? label.name).trim(); setRegionLabels((current) => updateTimelineDawTrackRegionLabel(current, lane.id, label.id, { name }, lane.sourceOutSeconds - lane.sourceInSeconds)); setRegionRenameDrafts((current) => { const next = { ...current }; delete next[label.id]; return next; }); setMovementNotice(`${label.name} renamed to ${name}.`); }}>Save Region Name</button><span className="text-sm font-black">{label.startSeconds.toFixed(2)}–{label.endSeconds.toFixed(2)}s</span></div><div className="mt-2 flex flex-wrap gap-2"><button type="button" className={button} onClick={() => void previewRiff(lane.id, label.startSeconds, label.endSeconds)}>Hear Region</button>{loopingRegionId === label.id ? <button type="button" className="rounded-xl border border-amber-300 bg-amber-200 px-3 py-2 text-sm font-black text-amber-950" onClick={() => stopTrackPreview()}>Stop Loop</button> : <button type="button" className={button} onClick={() => { setLoopingRegionId(label.id); previewRiffFamily([{ laneId: lane.id, startSeconds: label.startSeconds, endSeconds: label.endSeconds }], 1, true); }}>Loop Region</button>}<button type="button" className={button} onClick={() => { const seconds = currentTrackLocalSeconds(lane); if (seconds >= label.endSeconds) { setError("The new region start must be before its saved end."); return; } setRegionLabels((current) => updateTimelineDawTrackRegionLabel(current, lane.id, label.id, { startSeconds: seconds }, lane.sourceOutSeconds - lane.sourceInSeconds)); setError(undefined); setMovementNotice(`${label.name} now starts at ${seconds.toFixed(2)} seconds.`); }}>Move Start Here</button><button type="button" className={button} onClick={() => { const seconds = currentTrackLocalSeconds(lane); if (seconds <= label.startSeconds) { setError("The new region end must be after its saved start."); return; } setRegionLabels((current) => updateTimelineDawTrackRegionLabel(current, lane.id, label.id, { endSeconds: seconds }, lane.sourceOutSeconds - lane.sourceInSeconds)); setError(undefined); setMovementNotice(`${label.name} now ends at ${seconds.toFixed(2)} seconds.`); }}>Move End Here</button><button type="button" className={button} onClick={() => { setRegionLabels((current) => removeTimelineDawTrackRegionLabel(current, lane.id, label.id)); setMovementNotice(`${label.name} label removed from ${lane.name}.`); }}>Remove Label</button></div>{loopingRegionId === label.id ? <p role="status" className="mt-2 text-xs font-black text-amber-100">Looping {label.name} continuously until you press Stop Loop.</p> : null}</li>)}</ol> : <p className="mt-2 text-xs text-white/45">No named regions saved on this track yet.</p>}
                </section>
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-black/50 p-3"><label className="min-w-52 flex-1 text-xs font-black text-white/70">Track name<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white disabled:opacity-40" disabled={locked} value={nameDrafts[lane.id] ?? lane.name} maxLength={120} onChange={(event) => setNameDrafts((current) => ({ ...current, [lane.id]: event.target.value }))} /></label><button type="button" className={button} disabled={busy || locked || (nameDrafts[lane.id] ?? lane.name).trim() === lane.name} onClick={() => void saveTrackName(lane)}>Save Track Name</button></div>
                {!locked ? <TimelineDawPrivateLaneWaveform lane={lane} waveform={waveforms[lane.source.checksum]} timelineExtentSeconds={timelineExtentSeconds} onEdit={(patch) => editArrangement(lane.id, patch)} /> : null}
                {!locked ? <TimelineDawPrivateClipRepairEditor sessionId={sessionId} lane={lane} onChange={(repair) => setClipRepairs((current) => current[repair.laneId]?.checksum === repair.checksum ? current : { ...current, [repair.laneId]: repair })} /> : null}
                {!locked ? <TimelineDawTransientEditor sessionId={sessionId} laneId={lane.id} sampleRate={lane.audio.sampleRate} onNavigate={(seconds) => { const audio=audioRefs.current.get(lane.id); if(audio) audio.currentTime=seconds; }} onAudition={(seconds)=>{const audio=audioRefs.current.get(lane.id);if(audio){audio.currentTime=seconds;void audio.play()}}} /> : null}
                {!locked ? <TimelineDawWarpEditor sessionId={sessionId} laneId={lane.id} frameCount={lane.audio.frameCount} sampleRate={lane.audio.sampleRate} onChange={(markers)=>setWarpMaps(x=>({...x,[lane.id]:markers}))} /> : null}
                <label className="mt-3 block text-xs font-black text-white/55">Output routing<select className="ml-2 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" value={lane.busId ?? ""} onChange={(event) => void assignBus(lane, event.target.value || null)}><option value="">Master</option>{buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.name}</option>)}</select></label><label className="ml-3 text-xs font-black text-white/55">Parallel send<select aria-label={`${lane.name} parallel send`} className="ml-2 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" defaultValue="" onChange={(event) => { if (event.target.value) void persistSend({ sourceKind: "lane", sourceId: lane.id, destinationBusId: event.target.value, level: 0.5, preFader: false, muted: false }); event.currentTarget.value = ""; }}><option value="">Add sendâ€¦</option>{buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.name}</option>)}</select></label>
                <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/50 p-3 sm:grid-cols-3">
                  <div className="flex flex-wrap items-center gap-2 sm:col-span-3"><span className="text-xs font-black text-white/70">Move this track:</span><button type="button" className={button} disabled={busy} onClick={() => void moveTrack(lane, resolveTimelineDawMusicianTrackMove({ currentStartSeconds: lane.timelineStartSeconds, changeSeconds: -0.01 }))}>0.01 Second Earlier</button><button type="button" className={button} disabled={busy} onClick={() => void moveTrack(lane, resolveTimelineDawMusicianTrackMove({ currentStartSeconds: lane.timelineStartSeconds, changeSeconds: 0.01 }))}>0.01 Second Later</button><button type="button" className={button} disabled={busy} onClick={() => void moveTrack(lane, resolveTimelineDawMusicianTrackMove({ currentStartSeconds: lane.timelineStartSeconds, changeSeconds: -0.1 }))}>0.1 Second Earlier</button><button type="button" className={button} disabled={busy} onClick={() => void moveTrack(lane, resolveTimelineDawMusicianTrackMove({ currentStartSeconds: lane.timelineStartSeconds, changeSeconds: 0.1 }))}>0.1 Second Later</button><button type="button" className={button} disabled={busy} onClick={() => void moveTrack(lane, resolveTimelineDawMusicianTrackMove({ currentStartSeconds: lane.timelineStartSeconds, changeSeconds: -1 }))}>1 Second Earlier</button><button type="button" className={button} disabled={busy} onClick={() => void moveTrack(lane, resolveTimelineDawMusicianTrackMove({ currentStartSeconds: lane.timelineStartSeconds, changeSeconds: 1 }))}>1 Second Later</button><button type="button" className={button} disabled={busy} onClick={() => void moveTrack(lane, playheadRef.current)}>Start at Play Position</button><button type="button" className={button} disabled={busy} onClick={() => void moveTrackEndToPlayPosition(lane)}>End at Play Position</button></div>
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-2 sm:col-span-3">
                    <span className="text-xs font-black text-cyan-100">Move by another track:</span>
                    <select aria-label={`Placement guide for ${lane.name}`} className="min-w-48 rounded-lg border border-white/20 bg-black px-2 py-2 text-xs text-white" value={placementTargets[lane.id] ?? ""} onChange={(event) => setPlacementTargets((current) => ({ ...current, [lane.id]: event.target.value }))} disabled={busy || lanes.length < 2}>
                      <option value="">Choose another track</option>
                      {lanes.filter((candidate) => candidate.id !== lane.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                    </select>
                    <button type="button" className={button} disabled={busy || !placementTargets[lane.id]} onClick={() => void placeTrackByAnother(lane, "same-start")}>Start with Chosen Track</button>
                    <button type="button" className={button} disabled={busy || !placementTargets[lane.id]} onClick={() => void placeTrackByAnother(lane, "after-track")}>Place After Chosen Track</button>
                    <span className="text-xs text-white/45">Lines up the starts or places this track after the other track finishes.</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:col-span-3"><span className="text-xs font-black text-white/70">Trim at play position:</span><button type="button" className={button} disabled={busy} onClick={() => void trimTrackToPlayPosition(lane, "beginning")}>Trim Beginning to Play Position</button><button type="button" className={button} disabled={busy} onClick={() => void trimTrackToPlayPosition(lane, "end")}>Trim End to Play Position</button><span className="text-xs text-white/45">Reset Full Source restores the complete recording.</span></div>
                  <label className="text-xs font-black text-white/55">Timeline start (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={86400} step={0.001} value={lane.timelineStartSeconds} onChange={(event) => editArrangement(lane.id, { timelineStartSeconds: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Source in (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.audio.durationSeconds} step={1 / lane.audio.sampleRate} value={lane.sourceInSeconds} onChange={(event) => editArrangement(lane.id, { sourceInSeconds: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Source out (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.audio.durationSeconds} step={1 / lane.audio.sampleRate} value={lane.sourceOutSeconds} onChange={(event) => editArrangement(lane.id, { sourceOutSeconds: Number(event.target.value) })} /></label>
                  <div className="flex flex-wrap gap-2 sm:col-span-3"><button type="button" className={button} disabled={busy} onClick={() => void saveArrangement(lane)}>Save Arrangement</button><button type="button" className={button} disabled={busy} onClick={() => void saveArrangement(lane, true)}>Reset Full Source</button><button type="button" className={button} disabled={busy} onClick={() => void duplicate(lane)}>Repeat Once</button><button type="button" className={button} disabled={busy} onClick={() => void repeatSeveral(lane, 2)}>Repeat 2 Times</button><button type="button" className={button} disabled={busy} onClick={() => void repeatSeveral(lane, 4)}>Repeat 4 Times</button><button type="button" className={button} disabled={busy} onClick={() => void duplicate(lane, true)}>Make Copy at Play Position</button><button type="button" className={button} disabled={busy} onClick={() => void splitAtPlayhead(lane)}>Cut into Two at Play Position</button></div>
                </div>
                <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="flex flex-wrap items-center gap-2 sm:col-span-3"><span className="text-xs font-black text-white/70">Fade at play position:</span><button type="button" className={button} disabled={busy} onClick={() => void fadeAtPlayPosition(lane, "in")}>Fade In Until Play Position</button><button type="button" className={button} disabled={busy} onClick={() => void fadeAtPlayPosition(lane, "out")}>Fade Out From Play Position</button></div>
                  <label className="text-xs font-black text-white/55">Fade in (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.sourceOutSeconds - lane.sourceInSeconds} step={1 / lane.audio.sampleRate} value={lane.fade.inSeconds} onChange={(event) => editFade(lane.id, { inSeconds: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Fade out (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.sourceOutSeconds - lane.sourceInSeconds} step={1 / lane.audio.sampleRate} value={lane.fade.outSeconds} onChange={(event) => editFade(lane.id, { outSeconds: Number(event.target.value) })} /></label>
                  <button type="button" className={`${button} self-end`} disabled={busy} onClick={() => void saveFade(lane)}>Save Fades</button>
                </div>
                <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-3">
                  <p className="text-sm font-black text-cyan-100">Change speed or pitch</p>
                  <p className="mt-1 text-xs text-white/55">Each button saves immediately. Your private recording stays unchanged.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className={button} disabled={busy || lane.transform.stretchRatio >= 4} onClick={() => void changeTrackSpeedOrPitch(lane, "slower")}>Slow Down 10%</button>
                    <button type="button" className={button} disabled={busy || lane.transform.stretchRatio <= 0.25} onClick={() => void changeTrackSpeedOrPitch(lane, "faster")}>Speed Up 10%</button>
                    <button type="button" className={button} disabled={busy || lane.transform.pitchSemitones <= -24} onClick={() => void changeTrackSpeedOrPitch(lane, "lower")}>Lower 1 Semitone</button>
                    <button type="button" className={button} disabled={busy || lane.transform.pitchSemitones >= 24} onClick={() => void changeTrackSpeedOrPitch(lane, "raise")}>Raise 1 Semitone</button>
                    <button type="button" className={button} disabled={busy || (lane.transform.stretchRatio === 1 && lane.transform.pitchSemitones === 0 && !lane.transform.bypassed)} onClick={() => void changeTrackSpeedOrPitch(lane, "reset")}>Original Speed and Pitch</button>
                  </div>
                  <p className="mt-2 text-xs text-white/55">Current: {lane.transform.stretchRatio === 1 ? "original speed" : `${lane.transform.stretchRatio.toFixed(2)}× time`} · {lane.transform.pitchSemitones === 0 ? "original pitch" : `${lane.transform.pitchSemitones > 0 ? "+" : ""}${lane.transform.pitchSemitones.toFixed(1)} semitones`}</p>
                </div>
                <TimelineDawMusicianTempoKeyMatch
                  trackName={lane.name}
                  current={lane.transform}
                  busy={busy}
                  onApply={(transform, description) => applyExactTempoAndKey(lane, transform, description)}
                />
                <details className="mt-3 rounded-xl border border-white/10 p-3"><summary className="cursor-pointer text-xs font-black text-white/55">Advanced speed and pitch settings</summary><div className="mt-3 flex flex-wrap gap-2"><label className="text-xs">Stretch<input className="ml-1 w-20 bg-black" type="number" min={0.25} max={4} step={0.01} value={lane.transform.stretchRatio} onChange={(e)=>setLanes(x=>x.map(y=>y.id===lane.id?{...y,transform:{...y.transform,stretchRatio:Number(e.target.value)}}:y))}/></label><label className="text-xs">Pitch<input className="ml-1 w-20 bg-black" type="number" min={-24} max={24} step={0.1} value={lane.transform.pitchSemitones} onChange={(e)=>setLanes(x=>x.map(y=>y.id===lane.id?{...y,transform:{...y.transform,pitchSemitones:Number(e.target.value)}}:y))}/></label><select className="bg-black" value={lane.transform.algorithm} onChange={(e)=>setLanes(x=>x.map(y=>y.id===lane.id?{...y,transform:{...y.transform,algorithm:(e.target.value === "resample" ? "resample" : "preserve-pitch")}}:y))}><option value="preserve-pitch">Preserve pitch</option><option value="resample">Resample</option></select><select className="bg-black" aria-label="Elastic quality" value={lane.transform.quality} onChange={(e)=>setLanes(x=>x.map(y=>y.id===lane.id?{...y,transform:{...y.transform,quality:(e.target.value === "draft"||e.target.value === "high"?e.target.value:"balanced")}}:y))}><option value="draft">Draft</option><option value="balanced">Balanced</option><option value="high">High</option></select><button className={button} disabled={busy} onClick={()=>void updateDawPrivateAudioLaneTransform(sessionId,lane.id,lane.transform).then(({lane:saved})=>{setLanes(x=>x.map(y=>y.id===saved.id?saved:y));setHistoryRevision(x=>x+1)})}>Save Advanced Settings</button></div></details>
                <div className="mt-3 grid gap-3 md:grid-cols-[auto_auto_1fr_1fr]">
                  <button type="button" aria-pressed={lane.mix.muted} className={`${button} ${lane.mix.muted ? "!bg-red-300" : ""}`} onClick={() => queueMix(lane, { muted: !lane.mix.muted })}>{lane.mix.muted ? "Muted" : "Mute"}</button>
                  <button type="button" aria-pressed={lane.mix.soloed} className={`${button} ${lane.mix.soloed ? "!bg-amber-300" : ""}`} onClick={() => queueMix(lane, { soloed: !lane.mix.soloed })}>{lane.mix.soloed ? "Soloed" : "Solo"}</button>
                  <label className="text-xs font-black text-white/55">Gain {lane.mix.gain.toFixed(2)}Ã—<input className="mt-1 block w-full accent-violet-300" type="range" min={0} max={2} step={0.01} value={lane.mix.gain} onChange={(event) => queueMix(lane, { gain: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Pan {lane.mix.pan === 0 ? "C" : lane.mix.pan < 0 ? `L${Math.round(Math.abs(lane.mix.pan) * 100)}` : `R${Math.round(lane.mix.pan * 100)}`}<input className="mt-1 block w-full accent-violet-300" type="range" min={-1} max={1} step={0.01} value={lane.mix.pan} onChange={(event) => queueMix(lane, { pan: Number(event.target.value) })} /></label>
                  <div className="flex flex-wrap gap-2 md:col-span-4"><button type="button" className={button} disabled={busy || lane.mix.gain === 1} onClick={() => void resetTrackMix(lane, "volume")}>Return Volume to Normal</button><button type="button" className={button} disabled={busy || lane.mix.pan === 0} onClick={() => void resetTrackMix(lane, "pan")}>Center Left / Right</button><button type="button" className={button} disabled={busy || (lane.mix.gain === 1 && lane.mix.pan === 0)} onClick={() => void resetTrackMix(lane, "both")}>Reset Volume and Center</button></div>
                </div>
                <div className="mt-3"><div className="flex justify-between text-xs font-black"><span>Peak</span><span className={meter.clipped ? "text-red-300" : "text-emerald-200"}>{meter.clipped ? "CLIP" : `${meter.peakDbfs.toFixed(1)} dBFS`}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-black"><div className={`h-full transition-[width] duration-100 ${meter.clipped ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${Math.max(0, Math.min(100, ((meter.peakDbfs + 60) / 60) * 100))}%` }} /></div></div>
                <audio ref={audioRefFor(lane)} src={lane.playbackUrl} crossOrigin="anonymous" preload="metadata" />
              </li>
            );
          })}
        </ol>
      ) : <p className="mt-4 text-sm text-white/45">Record a take or promote a rendered comp to create the first private lane.</p>}    </section>
  );
}
