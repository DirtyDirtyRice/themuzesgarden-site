"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DAW_RECORDED_SOURCE_EVENT, type DawRecordedSourceEventDetail } from "@/lib/timeline/TimelineDawRecordedSourceEvent";
import {
  addDawPrivateAudioLane,
  assignDawPrivateLaneBus,
  deleteDawPrivateBus,
  arrangeDawPrivateAudioLane,
  duplicateDawPrivateAudioLane,
  editDawPrivateLaneGroup,
  loadDawPrivateAudioLanes,
  loadDawPrivateBuses,
  loadDawPrivateBusProcessing,
  saveDawPrivateSend,
  saveDawPrivateInsert,
  loadDawPrivateLaneWaveform,
  loadDawPrivateFreezes,
  removeDawPrivateAudioLane,
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
} from "@/app/workspace/projects/[id]/projectDawApi";
import { resolveTimelineDawPrivateRoutingAudibility } from "@/lib/timeline/TimelineDawPrivateBusPolicy";
import { TimelineDawPrivateLaneMonitorGraph, type TimelineDawPrivateLaneMeter } from "@/lib/timeline/TimelineDawPrivateLaneMonitorGraph";
import { detectTimelineDawPrivateLaneCrossfades } from "@/lib/timeline/TimelineDawPrivateLaneFadePolicy";
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

const button = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:opacity-40";

export default function TimelineDawPrivateAudioLanes({ sessionId }: { sessionId: string }) {
  const [lanes, setLanes] = useState<DawPrivateAudioLane[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [meters, setMeters] = useState<Record<string, TimelineDawPrivateLaneMeter>>({});
  const [waveforms, setWaveforms] = useState<Record<string, DawPrivateLaneWaveform>>({});
  const [historyRevision, setHistoryRevision] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [buses, setBuses] = useState<DawPrivateBus[]>([]);
  const [busMeters, setBusMeters] = useState<Record<string, TimelineDawPrivateLaneMeter>>({});
  const [sends, setSends] = useState<DawPrivateSend[]>([]);
  const [inserts, setInserts] = useState<DawPrivateInsert[]>([]);
  const [freezes, setFreezes] = useState<DawPrivateFreeze[]>([]);
  const [automation, setAutomation] = useState<DawPrivateAutomationEnvelope[]>([]);
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const freezeAudioRefs = useRef(new Map<string, HTMLAudioElement>());
  const graphRefs = useRef(new Map<string, TimelineDawPrivateLaneMonitorGraph>());
  const contextRef = useRef<AudioContext | null>(null);
  const busGraphRefs = useRef(new Map<string, TimelineDawPrivateBusGraph>());
  const saveTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
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
  const timelineExtentSeconds = useMemo(() => Math.max(60, ...lanes.map((lane) => lane.timelineStartSeconds + lane.sourceOutSeconds - lane.sourceInSeconds)), [lanes]);
  const waveformSourceKey = useMemo(() => [...new Set(lanes.map((lane) => lane.source.checksum))].sort().join("|"), [lanes]);
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
      const arrangedDuration = (lane.sourceOutSeconds - lane.sourceInSeconds) * (lane.transform.bypassed ? 1 : lane.transform.stretchRatio);
      audio.preservesPitch = lane.transform.algorithm === "preserve-pitch"; audio.playbackRate = lane.transform.bypassed ? 1 : lane.transform.algorithm === "resample" ? (2 ** (lane.transform.pitchSemitones / 12)) / lane.transform.stretchRatio : 1 / lane.transform.stretchRatio;
      const active = localSeconds >= 0 && localSeconds < arrangedDuration;
      const fade = effectiveFades.get(lane.id) ?? lane.fade;
      const samplePosition=Math.max(0,Math.round(elapsed*lane.audio.sampleRate)),gain=timelineDawPrivateAutomationValue(automation.find((item)=>item.sourceKind==="lane"&&item.sourceId===lane.id&&item.parameter==="gain"),samplePosition,lane.mix.gain),pan=timelineDawPrivateAutomationValue(automation.find((item)=>item.sourceKind==="lane"&&item.sourceId===lane.id&&item.parameter==="pan"),samplePosition,lane.mix.pan);
      graphRefs.current.get(lane.id)?.applyEnvelope({...lane.mix,gain,pan}, audibility.get(lane.id) ?? false, localSeconds, arrangedDuration, fade.inSeconds, fade.outSeconds);
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
      if (Math.abs(audio.currentTime - elapsed) > 0.08) audio.currentTime = elapsed; if (audio.paused) void audio.play().catch(() => setError("Frozen playback could not start."));
    }
    for(const bus of buses){const sampleRate=lanes[0]?.audio.sampleRate??48000,samplePosition=Math.max(0,Math.round(elapsed*sampleRate)),gain=timelineDawPrivateAutomationValue(automation.find((item)=>item.sourceKind==="bus"&&item.sourceId===bus.id&&item.parameter==="gain"),samplePosition,bus.mix.gain),pan=timelineDawPrivateAutomationValue(automation.find((item)=>item.sourceKind==="bus"&&item.sourceId===bus.id&&item.parameter==="pan"),samplePosition,bus.mix.pan);busGraphRefs.current.get(bus.id)?.apply({...bus.mix,gain,pan},!buses.some((candidate)=>candidate.mix.soloed)||bus.mix.soloed);}
  }, [audibility, automation, buses, effectiveFades, freezes, lanes]);

  useEffect(() => {
    for (const lane of lanes) {
      const duration = lane.sourceOutSeconds - lane.sourceInSeconds;
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
    return () => { active = false; audioRefs.current.forEach((audio) => audio.pause()); freezeAudioRefs.current.forEach((audio) => audio.pause()); graphRefs.current.forEach((graph) => graph.dispose()); busGraphRefs.current.forEach((graph) => graph.dispose()); if (contextRef.current) void contextRef.current.close(); saveTimersRef.current.forEach((timer) => clearTimeout(timer)); };
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
    window.addEventListener("muzes:daw-playhead", receivePlayhead);
    window.addEventListener("muzes:daw-transport-state", receiveTransport);
    return () => {
      window.removeEventListener(DAW_RECORDED_SOURCE_EVENT, receiveSource);
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

  function editFade(laneId: string, patch: Partial<DawPrivateAudioLane["fade"]>) {
    setLanes((current) => current.map((lane) => lane.id === laneId ? { ...lane, fade: { ...lane.fade, ...patch } } : lane));
  }

  async function saveFade(lane: DawPrivateAudioLane) {
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
    setLanes((current) => current.map((lane) => lane.id === laneId ? { ...lane, ...patch } : lane));
  }

  async function saveArrangement(lane: DawPrivateAudioLane, reset = false) {
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
    setError(undefined);
    try { const saved = await assignDawPrivateLaneBus(sessionId, lane.id, busId); setLanes((current) => current.map((item) => item.id === lane.id ? { ...item, busId: saved.busId, updatedAt: saved.updatedAt } : item)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Lane routing could not be saved."); }
  }

  async function persistSend(input: Omit<DawPrivateSend, "id"> & { id?: string }) { setError(undefined); try { const { send } = await saveDawPrivateSend(sessionId, input); setSends((current) => [...current.filter((item) => item.id !== send.id && !(item.sourceKind === send.sourceKind && item.sourceId === send.sourceId && item.destinationBusId === send.destinationBusId)), send]); } catch (cause) { setError(cause instanceof Error ? cause.message : "Private send could not be saved."); } }
  async function persistInsert(input: Omit<DawPrivateInsert, "id"> & { id?: string }) { setError(undefined); try { const { insert } = await saveDawPrivateInsert(sessionId, input); setInserts((current) => [...current.filter((item) => item.id !== insert.id && !(item.sourceKind === insert.sourceKind && item.sourceId === insert.sourceId && item.slot === insert.slot)), insert]); } catch (cause) { setError(cause instanceof Error ? cause.message : "Private insert could not be saved."); } }
  async function applyGroupEdit(edit: PrivateLaneGroupEditInput) {
    setBusy(true); setError(undefined);
    try {
      const { lanes: saved } = await editDawPrivateLaneGroup({ sessionId, laneIds: [...selectedIds], ...edit });
      setLanes(saved.sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setHistoryRevision((current) => current + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Selected regions could not be edited."); }
    finally { setBusy(false); }
  }

  async function splitAtPlayhead(lane: DawPrivateAudioLane) {
    setBusy(true);
    setError(undefined);
    try {
      const { lanes: regions } = await splitDawPrivateAudioLane(sessionId, lane.id, playheadRef.current);
      setLanes((current) => current.flatMap((candidate) => candidate.id === lane.id ? regions : [candidate])
        .sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setHistoryRevision((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lane could not be split at the playhead.");
    } finally { setBusy(false); }
  }

  async function duplicate(lane: DawPrivateAudioLane) {
    setBusy(true);
    setError(undefined);
    try {
      const { lane: copy } = await duplicateDawPrivateAudioLane(sessionId, lane.id);
      setLanes((current) => [...current, copy].sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
      setHistoryRevision((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lane could not be duplicated.");
    } finally { setBusy(false); }
  }

  async function remove(lane: DawPrivateAudioLane) {
    if (!window.confirm(`Remove ${lane.name} from this timeline? The private WAV master will be preserved.`)) return;
    setBusy(true);
    setError(undefined);
    try {
      await removeDawPrivateAudioLane(sessionId, lane.id);
      audioRefs.current.get(lane.id)?.pause();
      audioRefs.current.delete(lane.id);
      graphRefs.current.get(lane.id)?.dispose();
      graphRefs.current.delete(lane.id);
      setLanes((current) => current.filter((candidate) => candidate.id !== lane.id));
      setHistoryRevision((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Private audio lane could not be removed.");
    } finally { setBusy(false); }
  }

  return (
    <section className="rounded-3xl border border-violet-300/20 bg-[#080808] p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">Private source lanes</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">Recorded and promoted audio</h2><p className="mt-1 text-sm text-white/55">New sources enter at the current playhead and follow the session transport. Removing a lane never deletes its private master.</p></div><span className="text-sm font-black text-violet-200">{lanes.length} lane{lanes.length === 1 ? "" : "s"}</span></div>
      {error ? <p role="alert" className="mt-3 text-sm text-red-200">{error}</p> : null}
      <TimelineDawPrivateLaneHistory sessionId={sessionId} revision={historyRevision} onRestore={(restored) => setLanes(restored.sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds))} />
      <TimelineDawPrivateBusMixer buses={buses} sends={sends} inserts={inserts} meters={busMeters} busy={busy} onSave={(bus) => void saveBus(bus)} onDelete={(bus) => void deleteBus(bus)} onSend={(send) => void persistSend(send)} onInsert={(insert) => void persistInsert(insert)} />
      <TimelineDawPrivateFreezePanel sessionId={sessionId} lanes={lanes} buses={buses} freezes={freezes} onChange={setFreezes} />
      <TimelineDawPrivateAutomationEditor sessionId={sessionId} sources={[...lanes.map((lane)=>({id:lane.id,kind:"lane" as const,name:lane.name,sampleRate:lane.audio.sampleRate,baseGain:lane.mix.gain,basePan:lane.mix.pan})),...buses.map((bus)=>({id:bus.id,kind:"bus" as const,name:bus.name,sampleRate:lanes[0]?.audio.sampleRate??48000,baseGain:bus.mix.gain,basePan:bus.mix.pan}))]} envelopes={automation} onChange={setAutomation} />
      <TimelineDawPrivateLaneGroupEditor lanes={lanes} selectedIds={selectedIds} busy={busy} onSelection={setSelectedIds} onApply={(edit) => void applyGroupEdit(edit)} />
      {crossfades.length ? <div className="mt-3 rounded-xl border border-violet-300/20 bg-violet-300/10 p-3 text-xs text-violet-100"><p className="font-black">Automatic equal-power transitions</p>{crossfades.map((crossfade) => { const outgoing = lanes.find((lane) => lane.id === crossfade.outgoingLaneId); const incoming = lanes.find((lane) => lane.id === crossfade.incomingLaneId); return <p key={`${crossfade.outgoingLaneId}:${crossfade.incomingLaneId}`} className="mt-1">{outgoing?.name} to {incoming?.name}: {crossfade.startSeconds.toFixed(2)}–{crossfade.endSeconds.toFixed(2)}s ({crossfade.durationSeconds.toFixed(2)}s)</p>; })}</div> : null}
{freezes.filter((freeze) => freeze.active).map((freeze) => <audio key={freeze.id} ref={(element) => { if (element) freezeAudioRefs.current.set(freeze.id, element); else freezeAudioRefs.current.delete(freeze.id); }} src={freeze.artifact.playbackUrl} crossOrigin="anonymous" preload="metadata" />)}
            {lanes.length ? (
        <ol className="mt-4 grid gap-2">
          {lanes.map((lane) => {
            const meter = meters[lane.id] ?? { peakAmplitude: 0, peakDbfs: -96, clipped: false };
            return (
              <li key={lane.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-start gap-2"><input type="checkbox" aria-label={`Select ${lane.name}`} checked={selectedIds.has(lane.id)} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(lane.id); else next.delete(lane.id); return next; })} /><div><p className="font-black">{lane.name}</p><p className="text-xs text-white/45">{lane.timelineStartSeconds.toFixed(2)}s → {(lane.timelineStartSeconds + lane.sourceOutSeconds - lane.sourceInSeconds).toFixed(2)}s · {lane.audio.channelCount}ch · {lane.audio.sampleRate.toLocaleString()} Hz{lane.provenance ? ` · comp ${lane.provenance.compId}` : " · recording"}</p><button type="button" className="mt-1 text-xs font-black text-cyan-200" onClick={() => setSelectedIds(new Set([lane.id]))}>Select only</button></div></div>
                  <button type="button" className={button} disabled={busy} onClick={() => void remove(lane)}>Remove Lane</button>
                </div>
                <TimelineDawPrivateLaneWaveform lane={lane} waveform={waveforms[lane.source.checksum]} timelineExtentSeconds={timelineExtentSeconds} onEdit={(patch) => editArrangement(lane.id, patch)} />
                <label className="mt-3 block text-xs font-black text-white/55">Output routing<select className="ml-2 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" value={lane.busId ?? ""} onChange={(event) => void assignBus(lane, event.target.value || null)}><option value="">Master</option>{buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.name}</option>)}</select></label><label className="ml-3 text-xs font-black text-white/55">Parallel send<select aria-label={`${lane.name} parallel send`} className="ml-2 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" defaultValue="" onChange={(event) => { if (event.target.value) void persistSend({ sourceKind: "lane", sourceId: lane.id, destinationBusId: event.target.value, level: 0.5, preFader: false, muted: false }); event.currentTarget.value = ""; }}><option value="">Add send…</option>{buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.name}</option>)}</select></label>
                <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/50 p-3 sm:grid-cols-3">
                  <label className="text-xs font-black text-white/55">Timeline start (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={86400} step={0.001} value={lane.timelineStartSeconds} onChange={(event) => editArrangement(lane.id, { timelineStartSeconds: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Source in (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.audio.durationSeconds} step={1 / lane.audio.sampleRate} value={lane.sourceInSeconds} onChange={(event) => editArrangement(lane.id, { sourceInSeconds: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Source out (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.audio.durationSeconds} step={1 / lane.audio.sampleRate} value={lane.sourceOutSeconds} onChange={(event) => editArrangement(lane.id, { sourceOutSeconds: Number(event.target.value) })} /></label>
                  <div className="flex flex-wrap gap-2 sm:col-span-3"><button type="button" className={button} disabled={busy} onClick={() => void saveArrangement(lane)}>Save Arrangement</button><button type="button" className={button} disabled={busy} onClick={() => void saveArrangement(lane, true)}>Reset Full Source</button><button type="button" className={button} disabled={busy} onClick={() => void duplicate(lane)}>Duplicate Lane</button><button type="button" className={button} disabled={busy} onClick={() => void splitAtPlayhead(lane)}>Split at Playhead</button></div>
                </div>
                <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="text-xs font-black text-white/55">Fade in (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.sourceOutSeconds - lane.sourceInSeconds} step={1 / lane.audio.sampleRate} value={lane.fade.inSeconds} onChange={(event) => editFade(lane.id, { inSeconds: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Fade out (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.sourceOutSeconds - lane.sourceInSeconds} step={1 / lane.audio.sampleRate} value={lane.fade.outSeconds} onChange={(event) => editFade(lane.id, { outSeconds: Number(event.target.value) })} /></label>
                  <button type="button" className={`${button} self-end`} disabled={busy} onClick={() => void saveFade(lane)}>Save Fades</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-white/10 p-3"><label className="text-xs">Stretch<input className="ml-1 w-20 bg-black" type="number" min={0.25} max={4} step={0.01} value={lane.transform.stretchRatio} onChange={(e)=>setLanes(x=>x.map(y=>y.id===lane.id?{...y,transform:{...y.transform,stretchRatio:Number(e.target.value)}}:y))}/></label><label className="text-xs">Pitch<input className="ml-1 w-20 bg-black" type="number" min={-24} max={24} step={0.1} value={lane.transform.pitchSemitones} onChange={(e)=>setLanes(x=>x.map(y=>y.id===lane.id?{...y,transform:{...y.transform,pitchSemitones:Number(e.target.value)}}:y))}/></label><select className="bg-black" value={lane.transform.algorithm} onChange={(e)=>setLanes(x=>x.map(y=>y.id===lane.id?{...y,transform:{...y.transform,algorithm:(e.target.value === "resample" ? "resample" : "preserve-pitch")}}:y))}><option value="preserve-pitch">Preserve pitch</option><option value="resample">Resample</option></select><button className={button} onClick={()=>void updateDawPrivateAudioLaneTransform(sessionId,lane.id,lane.transform).then(({lane:saved})=>{setLanes(x=>x.map(y=>y.id===saved.id?saved:y));setHistoryRevision(x=>x+1)})}>Save Transform</button><button className={button} onClick={()=>void updateDawPrivateAudioLaneTransform(sessionId,lane.id,{stretchRatio:1,pitchSemitones:0,algorithm:"preserve-pitch",bypassed:false}).then(({lane:saved})=>setLanes(x=>x.map(y=>y.id===saved.id?saved:y)))}>Reset</button></div>
                <div className="mt-3 grid gap-3 md:grid-cols-[auto_auto_1fr_1fr]">
                  <button type="button" aria-pressed={lane.mix.muted} className={`${button} ${lane.mix.muted ? "!bg-red-300" : ""}`} onClick={() => queueMix(lane, { muted: !lane.mix.muted })}>{lane.mix.muted ? "Muted" : "Mute"}</button>
                  <button type="button" aria-pressed={lane.mix.soloed} className={`${button} ${lane.mix.soloed ? "!bg-amber-300" : ""}`} onClick={() => queueMix(lane, { soloed: !lane.mix.soloed })}>{lane.mix.soloed ? "Soloed" : "Solo"}</button>
                  <label className="text-xs font-black text-white/55">Gain {lane.mix.gain.toFixed(2)}×<input className="mt-1 block w-full accent-violet-300" type="range" min={0} max={2} step={0.01} value={lane.mix.gain} onChange={(event) => queueMix(lane, { gain: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Pan {lane.mix.pan === 0 ? "C" : lane.mix.pan < 0 ? `L${Math.round(Math.abs(lane.mix.pan) * 100)}` : `R${Math.round(lane.mix.pan * 100)}`}<input className="mt-1 block w-full accent-violet-300" type="range" min={-1} max={1} step={0.01} value={lane.mix.pan} onChange={(event) => queueMix(lane, { pan: Number(event.target.value) })} /></label>
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
