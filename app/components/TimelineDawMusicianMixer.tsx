"use client";

import { useState } from "react";
import type {
  DawPrivateAudioLane,
  DawPrivateBus,
  DawPrivateInsert,
  DawPrivateSend,
} from "@/app/workspace/projects/[id]/projectDawApi";
import type { TimelineDawPrivateLaneMeter } from "@/lib/timeline/TimelineDawPrivateLaneMonitorGraph";
import {
  createTimelineDawMusicianPreset,
  summarizeTimelineDawMusicianMixHealth,
  type TimelineDawMusicianMixPreset,
} from "@/lib/timeline/TimelineDawMusicianMixPolicy";

type Props = {
  lanes: DawPrivateAudioLane[];
  buses: DawPrivateBus[];
  inserts: DawPrivateInsert[];
  sends: DawPrivateSend[];
  meters: Record<string, TimelineDawPrivateLaneMeter>;
  busy: boolean;
  onMix: (lane: DawPrivateAudioLane, patch: Partial<DawPrivateAudioLane["mix"]>) => void;
  onRoute: (lane: DawPrivateAudioLane, busId: string | null) => void;
  onInsert: (insert: Omit<DawPrivateInsert, "id"> & { id?: string }) => void;
  onSend: (send: Omit<DawPrivateSend, "id"> & { id?: string }) => void;
};

const button = "rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-black disabled:opacity-40";
const presets: TimelineDawMusicianMixPreset[] = ["clean", "vocal", "punch", "warm"];

export default function TimelineDawMusicianMixer({ lanes, buses, inserts, sends, meters, busy, onMix, onRoute, onInsert, onSend }: Props) {
  const [bypassedLanes, setBypassedLanes] = useState(new Set<string>());

  function laneInserts(laneId: string) {
    return inserts.filter((insert) => insert.sourceKind === "lane" && insert.sourceId === laneId).sort((left, right) => left.slot - right.slot);
  }

  function applyPreset(lane: DawPrivateAudioLane, preset: TimelineDawMusicianMixPreset) {
    const current = laneInserts(lane.id);
    current.forEach((insert) => onInsert({ ...insert, bypassed: true }));
    createTimelineDawMusicianPreset(preset).forEach((effect) => {
      const existing = current.find((insert) => insert.slot === effect.slot);
      onInsert({
        ...(existing ? { id: existing.id } : {}),
        sourceKind: "lane",
        sourceId: lane.id,
        ...effect,
        latencySamples: existing?.latencySamples ?? 0,
        sidechain: existing?.sidechain ?? null,
      });
    });
    setBypassedLanes((value) => { const next = new Set(value); next.delete(lane.id); return next; });
  }

  function toggleEffects(lane: DawPrivateAudioLane) {
    const nextBypassed = !bypassedLanes.has(lane.id);
    laneInserts(lane.id).forEach((insert) => onInsert({ ...insert, bypassed: nextBypassed }));
    setBypassedLanes((value) => {
      const next = new Set(value);
      if (nextBypassed) next.add(lane.id); else next.delete(lane.id);
      return next;
    });
  }

  return <section id="musician-quick-mix" className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.05] p-4">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Step 2 · Shape the sound</p>
    <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
      <div><h3 className="text-xl font-black">Quick Mix</h3><p className="text-sm text-white/55">Changes are immediately auditionable and saved through the protected mixer engines.</p></div>
      <span className="text-xs text-white/45">A/B bypass compares effects without changing source audio.</span>
    </div>
    {lanes.length ? <div className="mt-4 grid gap-3">{lanes.map((lane) => {
      const meter = meters[lane.id] ?? { peakAmplitude: 0, peakDbfs: -96, clipped: false };
      const activeInserts = laneInserts(lane.id).filter((insert) => !insert.bypassed);
      const latencySamples = activeInserts.reduce((total, insert) => total + Math.max(0, insert.latencySamples ?? 0), 0);
      const health = summarizeTimelineDawMusicianMixHealth({ peakDbfs: meter.peakDbfs, clipped: meter.clipped, activeInsertCount: activeInserts.length, latencySamples, sampleRate: lane.audio.sampleRate });
      const laneSends = sends.filter((send) => send.sourceKind === "lane" && send.sourceId === lane.id);
      return <article key={lane.id} className="rounded-xl border border-white/10 bg-black/55 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h4 className="font-black">{lane.name}</h4><p className={`text-xs font-bold ${health.status === "clip" ? "text-red-300" : health.status === "hot" ? "text-amber-200" : "text-emerald-200"}`}>{health.status.toUpperCase()} · {meter.peakDbfs.toFixed(1)} dBFS · {health.latencyMs.toFixed(1)} ms effects latency · {health.processingLoad} processing load</p></div>
          <span className="text-xs text-white/45">{health.recommendation}</span>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[auto_auto_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(9rem,auto)]">
          <button type="button" className={`${button} ${lane.mix.muted ? "border-red-300 bg-red-300 text-black" : ""}`} aria-pressed={lane.mix.muted} onClick={() => onMix(lane, { muted: !lane.mix.muted })}>{lane.mix.muted ? "Muted" : "Mute"}</button>
          <button type="button" className={`${button} ${lane.mix.soloed ? "border-amber-300 bg-amber-300 text-black" : ""}`} aria-pressed={lane.mix.soloed} onClick={() => onMix(lane, { soloed: !lane.mix.soloed })}>{lane.mix.soloed ? "Soloed" : "Solo"}</button>
          <label className="text-xs font-black text-white/55">Gain {lane.mix.gain.toFixed(2)}×<input className="mt-1 block w-full accent-emerald-300" type="range" min={0} max={2} step={0.01} value={lane.mix.gain} onChange={(event) => onMix(lane, { gain: Number(event.target.value) })} /></label>
          <label className="text-xs font-black text-white/55">Pan {lane.mix.pan === 0 ? "Center" : lane.mix.pan < 0 ? `Left ${Math.round(-lane.mix.pan * 100)}` : `Right ${Math.round(lane.mix.pan * 100)}`}<input className="mt-1 block w-full accent-emerald-300" type="range" min={-1} max={1} step={0.01} value={lane.mix.pan} onChange={(event) => onMix(lane, { pan: Number(event.target.value) })} /></label>
          <label className="text-xs font-black text-white/55">Output<select className="mt-1 block w-full rounded bg-black p-1.5 text-white" value={lane.busId ?? ""} onChange={(event) => onRoute(lane, event.target.value || null)}><option value="">Master</option>{buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.name}</option>)}</select></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-white/45">Sound:</span>
          {presets.map((preset) => <button key={preset} type="button" className={button} disabled={busy} onClick={() => applyPreset(lane, preset)}>{preset[0].toUpperCase() + preset.slice(1)}</button>)}
          <button type="button" className={`${button} border-cyan-300/40 text-cyan-100`} disabled={!laneInserts(lane.id).length} aria-pressed={bypassedLanes.has(lane.id)} onClick={() => toggleEffects(lane)}>A/B Effects {bypassedLanes.has(lane.id) ? "Off" : "On"}</button>
          <select aria-label={`${lane.name} parallel send`} className="rounded-lg border border-white/15 bg-black p-1.5 text-xs" defaultValue="" onChange={(event) => { if (event.target.value) onSend({ sourceKind: "lane", sourceId: lane.id, destinationBusId: event.target.value, level: 0.5, preFader: false, muted: false }); event.currentTarget.value = ""; }}><option value="">Add parallel send…</option>{buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.name}</option>)}</select>
          {laneSends.map((send) => <label key={send.id} className="flex items-center gap-1 rounded border border-white/10 p-1 text-xs">To {buses.find((bus) => bus.id === send.destinationBusId)?.name ?? "bus"}<input className="w-20" type="range" min={0} max={2} step={0.01} value={send.level} onChange={(event) => onSend({ ...send, level: Number(event.target.value) })} /><button type="button" onClick={() => onSend({ ...send, muted: !send.muted })}>{send.muted ? "Off" : "On"}</button></label>)}
        </div>
      </article>;
    })}</div> : <p className="mt-3 text-sm text-white/45">Import a full song or stems to open the quick mixer.</p>}
  </section>;
}
