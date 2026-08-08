"use client";

import { useState } from "react";
import type { DawPrivateAudioLane } from "@/app/workspace/projects/[id]/projectDawApi";

const button = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:opacity-40";

export type PrivateLaneGroupEditInput =
  | { groupAction: "move"; deltaSeconds: number }
  | { groupAction: "mix"; muted: boolean; gain: number; pan: number }
  | { groupAction: "fade"; fadeInSeconds: number; fadeOutSeconds: number };

export default function TimelineDawPrivateLaneGroupEditor({ lanes, selectedIds, busy, onSelection, onApply }: {
  lanes: DawPrivateAudioLane[];
  selectedIds: Set<string>;
  busy: boolean;
  onSelection: (ids: Set<string>) => void;
  onApply: (edit: PrivateLaneGroupEditInput) => void;
}) {
  const [deltaSeconds, setDeltaSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [gain, setGain] = useState(1);
  const [pan, setPan] = useState(0);
  const [fadeInSeconds, setFadeInSeconds] = useState(0);
  const [fadeOutSeconds, setFadeOutSeconds] = useState(0);
  const selected = lanes.filter((lane) => selectedIds.has(lane.id));
  const ready = selected.length >= 2;
  const shortestDuration = selected.length ? Math.min(...selected.map((lane) => lane.sourceOutSeconds - lane.sourceInSeconds)) : 0;
  return (
    <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-black text-cyan-100">Selected regions: {selected.length}</p><p className="text-xs text-white/50">{selected.length ? selected.map((lane) => lane.name).join(", ") : "Choose regions below for additive group editing."}</p></div><div className="flex gap-2"><button type="button" className={button} disabled={!lanes.length || busy} onClick={() => onSelection(new Set(lanes.map((lane) => lane.id)))}>Select All</button><button type="button" className={button} disabled={!selected.length || busy} onClick={() => onSelection(new Set())}>Clear</button></div></div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <fieldset className="rounded-lg border border-white/10 p-2"><legend className="px-1 text-xs font-black">Move together</legend><label className="text-xs text-white/55">Delta seconds<input className="mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" step={0.001} value={deltaSeconds} onChange={(event) => setDeltaSeconds(Number(event.target.value))} /></label><button type="button" className={`${button} mt-2`} disabled={!ready || busy || deltaSeconds === 0} onClick={() => onApply({ groupAction: "move", deltaSeconds })}>Apply Move</button></fieldset>
        <fieldset className="rounded-lg border border-white/10 p-2"><legend className="px-1 text-xs font-black">Common mixer</legend><label className="text-xs text-white/55"><input type="checkbox" checked={muted} onChange={(event) => setMuted(event.target.checked)} /> Muted</label><label className="mt-1 block text-xs text-white/55">Gain {gain.toFixed(2)}×<input className="block w-full accent-cyan-300" type="range" min={0} max={2} step={0.01} value={gain} onChange={(event) => setGain(Number(event.target.value))} /></label><label className="mt-1 block text-xs text-white/55">Pan {pan.toFixed(2)}<input className="block w-full accent-cyan-300" type="range" min={-1} max={1} step={0.01} value={pan} onChange={(event) => setPan(Number(event.target.value))} /></label><button type="button" className={`${button} mt-2`} disabled={!ready || busy} onClick={() => onApply({ groupAction: "mix", muted, gain, pan })}>Apply Mixer</button></fieldset>
        <fieldset className="rounded-lg border border-white/10 p-2"><legend className="px-1 text-xs font-black">Common fades</legend><p className="text-xs text-white/45">Maximum combined length: {shortestDuration.toFixed(3)}s</p><label className="mt-1 block text-xs text-white/55">Fade in<input className="block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={shortestDuration} step={0.001} value={fadeInSeconds} onChange={(event) => setFadeInSeconds(Number(event.target.value))} /></label><label className="mt-1 block text-xs text-white/55">Fade out<input className="block w-full rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={shortestDuration} step={0.001} value={fadeOutSeconds} onChange={(event) => setFadeOutSeconds(Number(event.target.value))} /></label><button type="button" className={`${button} mt-2`} disabled={!ready || busy || fadeInSeconds + fadeOutSeconds > shortestDuration} onClick={() => onApply({ groupAction: "fade", fadeInSeconds, fadeOutSeconds })}>Apply Fades</button></fieldset>
      </div>
      {!ready && selected.length ? <p className="mt-2 text-xs text-amber-200">Select at least two distinct regions to enable grouped actions.</p> : null}
    </div>
  );
}
