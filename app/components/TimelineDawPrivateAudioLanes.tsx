"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DAW_RECORDED_SOURCE_EVENT, type DawRecordedSourceEventDetail } from "@/lib/timeline/TimelineDawRecordedSourceEvent";
import {
  addDawPrivateAudioLane,
  loadDawPrivateAudioLanes,
  removeDawPrivateAudioLane,
  type DawPrivateAudioLane,
} from "@/app/workspace/projects/[id]/projectDawApi";

const button = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:opacity-40";

export default function TimelineDawPrivateAudioLanes({ sessionId }: { sessionId: string }) {
  const [lanes, setLanes] = useState<DawPrivateAudioLane[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const playheadRef = useRef(0);
  const transportStateRef = useRef<"playing" | "paused" | "stopped">("stopped");

  const synchronize = useCallback((elapsed: number, playing: boolean) => {
    for (const lane of lanes) {
      const audio = audioRefs.current.get(lane.id);
      if (!audio) continue;
      const localSeconds = elapsed - lane.timelineStartSeconds;
      const active = localSeconds >= 0 && localSeconds < lane.audio.durationSeconds;
      if (!active || !playing) {
        audio.pause();
        if (localSeconds < 0) audio.currentTime = 0;
        continue;
      }
      if (Math.abs(audio.currentTime - localSeconds) > 0.08) audio.currentTime = localSeconds;
      if (audio.paused) void audio.play().catch(() => setError(`Playback could not start for ${lane.name}.`));
    }
  }, [lanes]);

  useEffect(() => {
    let active = true;
    void loadDawPrivateAudioLanes(sessionId)
      .then(({ lanes: stored }) => { if (active) setLanes(stored); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Private audio lanes could not be loaded."); });
    return () => { active = false; audioRefs.current.forEach((audio) => audio.pause()); };
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

  async function remove(lane: DawPrivateAudioLane) {
    if (!window.confirm(`Remove ${lane.name} from this timeline? The private WAV master will be preserved.`)) return;
    setBusy(true);
    setError(undefined);
    try {
      await removeDawPrivateAudioLane(sessionId, lane.id);
      audioRefs.current.get(lane.id)?.pause();
      audioRefs.current.delete(lane.id);
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
      {lanes.length ? <ol className="mt-4 grid gap-2">{lanes.map((lane) => <li key={lane.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{lane.name}</p><p className="text-xs text-white/45">{lane.timelineStartSeconds.toFixed(2)}s → {(lane.timelineStartSeconds + lane.audio.durationSeconds).toFixed(2)}s · {lane.audio.channelCount}ch · {lane.audio.sampleRate.toLocaleString()} Hz{lane.provenance ? ` · comp ${lane.provenance.compId}` : " · recording"}</p></div><button type="button" className={button} disabled={busy} onClick={() => void remove(lane)}>Remove Lane</button></div><audio ref={(element) => { if (element) { element.volume = 0.8; audioRefs.current.set(lane.id, element); } else audioRefs.current.delete(lane.id); }} src={lane.playbackUrl} preload="metadata" /></li>)}</ol> : <p className="mt-4 text-sm text-white/45">Record a take or promote a rendered comp to create the first private lane.</p>}
    </section>
  );
}
