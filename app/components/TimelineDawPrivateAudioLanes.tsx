"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DAW_RECORDED_SOURCE_EVENT, type DawRecordedSourceEventDetail } from "@/lib/timeline/TimelineDawRecordedSourceEvent";
import {
  addDawPrivateAudioLane,
  arrangeDawPrivateAudioLane,
  duplicateDawPrivateAudioLane,
  loadDawPrivateAudioLanes,
  removeDawPrivateAudioLane,
  updateDawPrivateAudioLaneMix,
  updateDawPrivateAudioLaneFade,
  type DawPrivateAudioLane,
} from "@/app/workspace/projects/[id]/projectDawApi";
import { resolveTimelineDawPrivateLaneAudibility } from "@/lib/timeline/TimelineDawPrivateLaneMixerPolicy";
import { TimelineDawPrivateLaneMonitorGraph, type TimelineDawPrivateLaneMeter } from "@/lib/timeline/TimelineDawPrivateLaneMonitorGraph";
import { detectTimelineDawPrivateLaneCrossfades } from "@/lib/timeline/TimelineDawPrivateLaneFadePolicy";

const button = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:opacity-40";

export default function TimelineDawPrivateAudioLanes({ sessionId }: { sessionId: string }) {
  const [lanes, setLanes] = useState<DawPrivateAudioLane[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [meters, setMeters] = useState<Record<string, TimelineDawPrivateLaneMeter>>({});
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const graphRefs = useRef(new Map<string, TimelineDawPrivateLaneMonitorGraph>());
  const contextRefs = useRef(new Map<string, AudioContext>());
  const saveTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const audioCallbacksRef = useRef(new Map<string, (element: HTMLAudioElement | null) => void>());
  const playheadRef = useRef(0);
  const transportStateRef = useRef<"playing" | "paused" | "stopped">("stopped");
  const audibility = useMemo(() => resolveTimelineDawPrivateLaneAudibility(lanes.map((lane) => ({ id: lane.id, muted: lane.mix.muted, soloed: lane.mix.soloed }))), [lanes]);
  const crossfades = useMemo(() => detectTimelineDawPrivateLaneCrossfades(lanes), [lanes]);
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
      const arrangedDuration = lane.sourceOutSeconds - lane.sourceInSeconds;
      const active = localSeconds >= 0 && localSeconds < arrangedDuration;
      const fade = effectiveFades.get(lane.id) ?? lane.fade;
      graphRefs.current.get(lane.id)?.applyEnvelope(lane.mix, audibility.get(lane.id) ?? false, localSeconds, arrangedDuration, fade.inSeconds, fade.outSeconds);
      if (!active || !playing) {
        audio.pause();
        if (localSeconds < 0) audio.currentTime = lane.sourceInSeconds;
        continue;
      }
      const sourceSeconds = lane.sourceInSeconds + localSeconds;
      if (Math.abs(audio.currentTime - sourceSeconds) > 0.08) audio.currentTime = sourceSeconds;
      void graphRefs.current.get(lane.id)?.resume();
      if (audio.paused) void audio.play().catch(() => setError(`Playback could not start for ${lane.name}.`));
    }
  }, [audibility, effectiveFades, lanes]);

  useEffect(() => {
    for (const lane of lanes) {
      const duration = lane.sourceOutSeconds - lane.sourceInSeconds;
      const fade = effectiveFades.get(lane.id) ?? lane.fade;
      graphRefs.current.get(lane.id)?.applyEnvelope(lane.mix, audibility.get(lane.id) ?? false, playheadRef.current - lane.timelineStartSeconds, duration, fade.inSeconds, fade.outSeconds);
    }
  }, [audibility, effectiveFades, lanes]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      const next: Record<string, TimelineDawPrivateLaneMeter> = {};
      graphRefs.current.forEach((graph, id) => { next[id] = graph.meter(); });
      setMeters(next);
    }, 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    void loadDawPrivateAudioLanes(sessionId)
      .then(({ lanes: stored }) => { if (active) setLanes(stored); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Private audio lanes could not be loaded."); });
    return () => { active = false; audioRefs.current.forEach((audio) => audio.pause()); graphRefs.current.forEach((graph) => graph.dispose()); contextRefs.current.forEach((context) => void context.close()); saveTimersRef.current.forEach((timer) => clearTimeout(timer)); };
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
          const context = new AudioContext();
          const graph = new TimelineDawPrivateLaneMonitorGraph(context, element);
          graph.apply(lane.mix, audibility.get(lane.id) ?? false);
          contextRefs.current.set(lane.id, context);
          graphRefs.current.set(lane.id, graph);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : `Monitoring graph could not be created for ${lane.name}.`);
        }
      } else {
        audioRefs.current.delete(lane.id);
        graphRefs.current.get(lane.id)?.dispose();
        graphRefs.current.delete(lane.id);
        const context = contextRefs.current.get(lane.id);
        if (context) void context.close();
        contextRefs.current.delete(lane.id);
        audioCallbacksRef.current.delete(lane.id);
      }
    };
    audioCallbacksRef.current.set(lane.id, callback);
    return callback;
  }

  function queueMix(lane: DawPrivateAudioLane, patch: Partial<DawPrivateAudioLane["mix"]>) {
    const mix = { ...lane.mix, ...patch };
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
      synchronize(playheadRef.current, transportStateRef.current === "playing");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lane arrangement could not be saved.");
    } finally { setBusy(false); }
  }

  async function duplicate(lane: DawPrivateAudioLane) {
    setBusy(true);
    setError(undefined);
    try {
      const { lane: copy } = await duplicateDawPrivateAudioLane(sessionId, lane.id);
      setLanes((current) => [...current, copy].sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds));
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
      const context = contextRefs.current.get(lane.id);
      if (context) void context.close();
      contextRefs.current.delete(lane.id);
      setLanes((current) => current.filter((candidate) => candidate.id !== lane.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Private audio lane could not be removed.");
    } finally { setBusy(false); }
  }

  return (
    <section className="rounded-3xl border border-violet-300/20 bg-[#080808] p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">Private source lanes</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">Recorded and promoted audio</h2><p className="mt-1 text-sm text-white/55">New sources enter at the current playhead and follow the session transport. Removing a lane never deletes its private master.</p></div><span className="text-sm font-black text-violet-200">{lanes.length} lane{lanes.length === 1 ? "" : "s"}</span></div>
      {error ? <p role="alert" className="mt-3 text-sm text-red-200">{error}</p> : null}
      {crossfades.length ? <div className="mt-3 rounded-xl border border-violet-300/20 bg-violet-300/10 p-3 text-xs text-violet-100"><p className="font-black">Automatic equal-power transitions</p>{crossfades.map((crossfade) => { const outgoing = lanes.find((lane) => lane.id === crossfade.outgoingLaneId); const incoming = lanes.find((lane) => lane.id === crossfade.incomingLaneId); return <p key={`${crossfade.outgoingLaneId}:${crossfade.incomingLaneId}`} className="mt-1">{outgoing?.name} to {incoming?.name}: {crossfade.startSeconds.toFixed(2)}–{crossfade.endSeconds.toFixed(2)}s ({crossfade.durationSeconds.toFixed(2)}s)</p>; })}</div> : null}
      {lanes.length ? (
        <ol className="mt-4 grid gap-2">
          {lanes.map((lane) => {
            const meter = meters[lane.id] ?? { peakAmplitude: 0, peakDbfs: -96, clipped: false };
            return (
              <li key={lane.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="font-black">{lane.name}</p><p className="text-xs text-white/45">{lane.timelineStartSeconds.toFixed(2)}s → {(lane.timelineStartSeconds + lane.sourceOutSeconds - lane.sourceInSeconds).toFixed(2)}s · {lane.audio.channelCount}ch · {lane.audio.sampleRate.toLocaleString()} Hz{lane.provenance ? ` · comp ${lane.provenance.compId}` : " · recording"}</p></div>
                  <button type="button" className={button} disabled={busy} onClick={() => void remove(lane)}>Remove Lane</button>
                </div>
                <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/50 p-3 sm:grid-cols-3">
                  <label className="text-xs font-black text-white/55">Timeline start (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={86400} step={0.001} value={lane.timelineStartSeconds} onChange={(event) => editArrangement(lane.id, { timelineStartSeconds: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Source in (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.audio.durationSeconds} step={1 / lane.audio.sampleRate} value={lane.sourceInSeconds} onChange={(event) => editArrangement(lane.id, { sourceInSeconds: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Source out (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.audio.durationSeconds} step={1 / lane.audio.sampleRate} value={lane.sourceOutSeconds} onChange={(event) => editArrangement(lane.id, { sourceOutSeconds: Number(event.target.value) })} /></label>
                  <div className="flex flex-wrap gap-2 sm:col-span-3"><button type="button" className={button} disabled={busy} onClick={() => void saveArrangement(lane)}>Save Arrangement</button><button type="button" className={button} disabled={busy} onClick={() => void saveArrangement(lane, true)}>Reset Full Source</button><button type="button" className={button} disabled={busy} onClick={() => void duplicate(lane)}>Duplicate Lane</button></div>
                </div>
                <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="text-xs font-black text-white/55">Fade in (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.sourceOutSeconds - lane.sourceInSeconds} step={1 / lane.audio.sampleRate} value={lane.fade.inSeconds} onChange={(event) => editFade(lane.id, { inSeconds: Number(event.target.value) })} /></label>
                  <label className="text-xs font-black text-white/55">Fade out (s)<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={lane.sourceOutSeconds - lane.sourceInSeconds} step={1 / lane.audio.sampleRate} value={lane.fade.outSeconds} onChange={(event) => editFade(lane.id, { outSeconds: Number(event.target.value) })} /></label>
                  <button type="button" className={`${button} self-end`} disabled={busy} onClick={() => void saveFade(lane)}>Save Fades</button>
                </div>
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
