"use client";

import { useMemo, useState } from "react";
import type { DawPrivateAudioLane } from "@/app/workspace/projects/[id]/projectDawApi";
import { createTimelineDawMusicianTempoKeyMatch } from "@/lib/timeline/TimelineDawMusicianTempoKeyMatch";

type Source = { bpm: string; key: string };
const input = "mt-1 w-full rounded-lg border border-white/20 bg-black px-2 py-2 text-white";
const button = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:opacity-40";

export default function TimelineDawMusicianSelectedTempoKeyMatch({ lanes, selectedIds, busy, onApply }: {
  lanes: DawPrivateAudioLane[];
  selectedIds: Set<string>;
  busy: boolean;
  onApply: (transformById: Record<string, DawPrivateAudioLane["transform"]>, description: string) => Promise<void>;
}) {
  const [sources, setSources] = useState<Record<string, Source>>({});
  const [targetBpm, setTargetBpm] = useState("");
  const [targetKey, setTargetKey] = useState("");
  const [error, setError] = useState<string>();
  const selected = lanes.filter((lane) => selectedIds.has(lane.id));
  const plans = useMemo(() => {
    if (selected.length < 2 || !targetBpm || !targetKey) return undefined;
    try {
      return Object.fromEntries(selected.map((lane) => {
        const source = sources[lane.id];
        if (!source?.bpm || !source.key) throw new Error("Enter the current BPM and key for every selected track.");
        return [lane.id, createTimelineDawMusicianTempoKeyMatch({ current: lane.transform, sourceBpm: Number(source.bpm), targetBpm: Number(targetBpm), sourceKey: source.key, targetKey })];
      }));
    } catch { return undefined; }
  }, [selected, sources, targetBpm, targetKey]);

  function update(id: string, field: keyof Source, value: string) {
    setSources((current) => ({ ...current, [id]: { bpm: current[id]?.bpm ?? "", key: current[id]?.key ?? "", [field]: value } }));
  }

  async function apply() {
    try {
      if (!plans) throw new Error("Enter a valid current BPM and key for every selected track, plus the shared target.");
      setError(undefined);
      await onApply(plans, `${selected.length} tracks matched to ${targetBpm} BPM in ${targetKey.trim()}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Selected tracks could not be matched."); }
  }

  return <details className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.06] p-3">
    <summary className="cursor-pointer text-sm font-black text-emerald-100">Match Selected Tracks to One BPM and Key</summary>
    <p className="mt-2 text-xs text-white/60">Select at least two layered tracks. Enter what each one is now, then choose the BPM and key they should all share.</p>
    {selected.length < 2 ? <p className="mt-3 text-xs font-bold text-amber-200">Select two or more tracks below first.</p> : <>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-black text-white/65">Shared desired BPM<input className={input} type="number" min={20} max={400} step={0.01} value={targetBpm} onChange={(event) => setTargetBpm(event.target.value)} placeholder="Example: 120" /></label>
        <label className="text-xs font-black text-white/65">Shared desired key<input className={input} value={targetKey} onChange={(event) => setTargetKey(event.target.value)} placeholder="Example: A" /></label>
      </div>
      <div className="mt-3 space-y-2">{selected.map((lane) => <div key={lane.id} className="grid gap-2 rounded-lg border border-white/10 p-2 sm:grid-cols-[1fr_10rem_10rem]">
        <p className="self-center text-sm font-black">{lane.name}</p>
        <label className="text-xs font-black text-white/65">Current BPM<input aria-label={`${lane.name} selected current BPM`} className={input} type="number" min={20} max={400} step={0.01} value={sources[lane.id]?.bpm ?? ""} onChange={(event) => update(lane.id, "bpm", event.target.value)} /></label>
        <label className="text-xs font-black text-white/65">Current key<input aria-label={`${lane.name} selected current key`} className={input} value={sources[lane.id]?.key ?? ""} onChange={(event) => update(lane.id, "key", event.target.value)} /></label>
        {plans?.[lane.id] ? <p className="text-xs text-emerald-100 sm:col-span-3">Preview: {plans[lane.id].stretchRatio.toFixed(4)}× time · {plans[lane.id].pitchSemitones > 0 ? "+" : ""}{plans[lane.id].pitchSemitones} semitones</p> : null}
      </div>)}</div>
      <button type="button" className={`${button} mt-3`} disabled={busy || !plans} onClick={() => void apply()}>Match All Selected Tracks</button>
    </>}
    {error ? <p role="alert" className="mt-2 text-xs font-bold text-red-200">{error}</p> : null}
  </details>;
}
