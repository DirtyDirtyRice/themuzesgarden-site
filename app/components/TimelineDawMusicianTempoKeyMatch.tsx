"use client";

import { useMemo, useState } from "react";
import { createTimelineDawMusicianTempoKeyMatch } from "@/lib/timeline/TimelineDawMusicianTempoKeyMatch";
import type { TimelineDawMusicianSpeedPitchTransform } from "@/lib/timeline/TimelineDawMusicianSpeedPitch";

const field = "mt-1 block w-full rounded-lg border border-white/20 bg-black px-2 py-2 text-white";
const button = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:opacity-40";

export default function TimelineDawMusicianTempoKeyMatch({ trackName, current, busy, onApply }: {
  trackName: string;
  current: TimelineDawMusicianSpeedPitchTransform;
  busy: boolean;
  onApply: (transform: TimelineDawMusicianSpeedPitchTransform, description: string) => Promise<void>;
}) {
  const [sourceBpm, setSourceBpm] = useState(""), [targetBpm, setTargetBpm] = useState("");
  const [sourceKey, setSourceKey] = useState(""), [targetKey, setTargetKey] = useState(""), [error, setError] = useState<string>();
  const plan = useMemo(() => {
    if (!sourceBpm || !targetBpm || !sourceKey || !targetKey) return undefined;
    try { return createTimelineDawMusicianTempoKeyMatch({ current, sourceBpm: Number(sourceBpm), targetBpm: Number(targetBpm), sourceKey, targetKey }); } catch { return undefined; }
  }, [current, sourceBpm, sourceKey, targetBpm, targetKey]);
  async function apply() {
    try {
      const transform = createTimelineDawMusicianTempoKeyMatch({ current, sourceBpm: Number(sourceBpm), targetBpm: Number(targetBpm), sourceKey, targetKey });
      setError(undefined);
      await onApply(transform, `${sourceBpm} BPM in ${sourceKey.trim()} matched to ${targetBpm} BPM in ${targetKey.trim()}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "BPM and key could not be matched."); }
  }
  return <details className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.06] p-3">
    <summary className="cursor-pointer text-sm font-black text-emerald-100">Match Exact BPM and Key</summary>
    <p className="mt-2 text-xs text-white/60">Enter what this track is now and what you want it to match. The DAW calculates the exact change and preserves the original recording.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-black text-white/65">Current BPM<input aria-label={`${trackName} current BPM`} className={field} type="number" min={20} max={400} step={0.01} value={sourceBpm} onChange={(event) => setSourceBpm(event.target.value)} placeholder="Example: 118" /></label>
      <label className="text-xs font-black text-white/65">Desired BPM<input aria-label={`${trackName} desired BPM`} className={field} type="number" min={20} max={400} step={0.01} value={targetBpm} onChange={(event) => setTargetBpm(event.target.value)} placeholder="Example: 120" /></label>
      <label className="text-xs font-black text-white/65">Current key<input aria-label={`${trackName} current key`} className={field} value={sourceKey} onChange={(event) => setSourceKey(event.target.value)} placeholder="Example: G" /></label>
      <label className="text-xs font-black text-white/65">Desired key<input aria-label={`${trackName} desired key`} className={field} value={targetKey} onChange={(event) => setTargetKey(event.target.value)} placeholder="Example: A" /></label>
    </div>
    {plan ? <p className="mt-2 text-xs font-bold text-emerald-100">Before saving: exact time change {plan.stretchRatio.toFixed(4)}× · pitch {plan.pitchSemitones > 0 ? "+" : ""}{plan.pitchSemitones} semitones</p> : null}
    <button type="button" className={`${button} mt-3`} disabled={busy || !plan} onClick={() => void apply()}>Apply Exact BPM and Key</button>
    {error ? <p role="alert" className="mt-2 text-xs font-bold text-red-200">{error}</p> : null}
  </details>;
}
