"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DawPrivateAudioLane, DawPrivateLaneWaveform } from "@/app/workspace/projects/[id]/projectDawApi";
import { cutTimelineDawHybridRiffClip, duplicateTimelineDawHybridRiffClip, findTimelineDawRiffMatches, moveTimelineDawHybridRiffClip, pasteTimelineDawHybridRiffClip, type TimelineDawHybridRiffClip, type TimelineDawRiffMatch } from "@/lib/timeline/TimelineDawMusicianRiffMatch";
import { projectTimelineDawPrivateLaneWaveform } from "@/lib/timeline/TimelineDawPrivateLaneWaveformPolicy";

export default function TimelineDawMusicianRiffMatch({ lanes, selectedIds, waveforms, onAudition, onAuditionFamily, auditionActive, auditionPaused, auditionProgress, onPauseAudition, onResumeAudition, onPreviousAudition, onReplayAudition, onSkipAudition, onStopAudition }: {
  lanes: DawPrivateAudioLane[];
  selectedIds: Set<string>;
  waveforms: Record<string, DawPrivateLaneWaveform>;
  onAudition?: (laneId: string, startSeconds: number, endSeconds: number) => void;
  onAuditionFamily?: (regions: Array<{ laneId: string; startSeconds: number; endSeconds: number }>, repeatCount?: number) => void;
  auditionActive?: boolean;
  auditionPaused?: boolean;
  auditionProgress?: { trackName: string; trackNumber: number; trackCount: number; passNumber: number; passCount: number; canGoPrevious?: boolean };
  onPreviousAudition?: () => void;
  onReplayAudition?: () => void;
  onPauseAudition?: () => void;
  onResumeAudition?: () => void;
  onSkipAudition?: () => void;
  onStopAudition?: () => void;
}) {
  const [matches, setMatches] = useState<TimelineDawRiffMatch[] | null>(null);
  const [hybridClips, setHybridClips] = useState<TimelineDawHybridRiffClip[]>([]);
  const loadedHybridKeyRef = useRef<string | null>(null);
  const hybridStorageKey = `muzes:daw-hybrid-riffs:v1:${lanes.map((lane) => lane.id).sort().join(":")}`;
  const selected = useMemo(() => lanes.filter((lane) => selectedIds.has(lane.id)), [lanes, selectedIds]);
  const ready = selected.length >= 2 && selected.every((lane) => Boolean(waveforms[lane.source.checksum]));
  const analyze = () => setMatches(findTimelineDawRiffMatches(selected.map((lane) => ({
    laneId: lane.id,
    name: lane.name,
    durationSeconds: Math.max(0.001, lane.sourceOutSeconds - lane.sourceInSeconds),
    peaks: projectTimelineDawPrivateLaneWaveform(waveforms[lane.source.checksum], Math.round(lane.sourceInSeconds * lane.audio.sampleRate), Math.round(lane.sourceOutSeconds * lane.audio.sampleRate)),
  })), { threshold: 0.9 }));

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = JSON.parse(localStorage.getItem(hybridStorageKey) ?? "[]") as TimelineDawHybridRiffClip[];
        setHybridClips(Array.isArray(saved) ? saved.filter((clip) => clip && typeof clip.id === "string" && typeof clip.laneId === "string" && Number.isFinite(clip.startSeconds) && Number.isFinite(clip.endSeconds) && clip.endSeconds > clip.startSeconds) : []);
      } catch {
        setHybridClips([]);
      }
      loadedHybridKeyRef.current = hybridStorageKey;
    });
    return () => { cancelled = true; };
  }, [hybridStorageKey]);

  useEffect(() => {
    if (loadedHybridKeyRef.current === hybridStorageKey) localStorage.setItem(hybridStorageKey, JSON.stringify(hybridClips));
  }, [hybridClips, hybridStorageKey]);

  const copyToHybrid = (match: TimelineDawRiffMatch, lane: DawPrivateAudioLane) => {
    const region = match.regions.find((candidate) => candidate.laneId === lane.id);
    if (!region) return;
    setHybridClips((clips) => pasteTimelineDawHybridRiffClip(clips, {
      riffId: match.id,
      color: match.color,
      laneId: lane.id,
      laneName: lane.name,
      startSeconds: region.startSeconds,
      endSeconds: region.endSeconds,
    }));
  };

  return <section className="mt-3 rounded-xl border border-cyan-300/25 bg-cyan-300/5 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black text-cyan-100">Find Matching Riffs in Selected Tracks</h3><p className="text-xs text-white/55">Compares real waveform and attack shapes. Only regions matching 90% or better across every selected track are colored. This first pass compares sound patterns; exact note transcription comes later.</p></div><div className="flex flex-wrap gap-2"><button type="button" className="rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:opacity-40" disabled={!ready} onClick={analyze}>Analyze Selected Tracks</button>{auditionActive && auditionProgress?.canGoPrevious && onPreviousAudition ? <button type="button" className="rounded-xl border border-cyan-700 bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-950" onClick={onPreviousAudition}>Previous Riff Track</button> : null}{auditionActive && auditionProgress && auditionProgress.trackCount > 1 && onReplayAudition ? <button type="button" className="rounded-xl border border-cyan-700 bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-950" onClick={onReplayAudition}>Replay Current Riff</button> : null}{auditionActive && auditionProgress && auditionProgress.trackCount > 1 && onSkipAudition ? <button type="button" className="rounded-xl border border-cyan-700 bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-950" onClick={onSkipAudition}>Skip to Next Track</button> : null}{auditionActive && auditionProgress && auditionProgress.trackCount > 1 && (auditionPaused ? onResumeAudition : onPauseAudition) ? <button type="button" className="rounded-xl border border-amber-700 bg-amber-50 px-3 py-2 text-sm font-black text-amber-950" onClick={auditionPaused ? onResumeAudition : onPauseAudition}>{auditionPaused ? "Resume Riff Comparison" : "Pause Riff Comparison"}</button> : null}{auditionActive ? <button type="button" className="rounded-xl border border-red-600 bg-red-100 px-3 py-2 text-sm font-black text-red-950" onClick={onStopAudition}>Stop Riff Comparison</button> : null}</div></div>
    {auditionActive && auditionProgress ? <p className="mt-2 rounded-lg border border-cyan-500/40 bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-950" role="status" aria-live="polite">{auditionPaused ? "Paused on" : "Now hearing"}: {auditionProgress.trackName} · Track {auditionProgress.trackNumber} of {auditionProgress.trackCount} · Pass {auditionProgress.passNumber} of {auditionProgress.passCount}</p> : null}
    {!ready ? <p className="mt-2 text-xs text-amber-200">Select at least 2 tracks and wait for their waveforms to finish preparing.</p> : null}
    {matches?.length ? <div className="mt-3 rounded-xl border border-cyan-300/25 bg-black/30 p-3"><p className="text-sm font-black text-cyan-100">Play every matching riff in one song</p><p className="mt-1 text-xs text-white/60">Choose a song once. It plays riff 1, then automatically advances through every other colored matching riff in that same version.</p><div className="mt-2 flex flex-wrap gap-2">{selected.map((lane) => <button type="button" key={`all-riffs:${lane.id}`} className="rounded-lg border border-cyan-300/50 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-950" onClick={() => onAuditionFamily?.(matches.flatMap((match) => match.regions.filter((region) => region.laneId === lane.id).map((region) => ({ laneId: region.laneId, startSeconds: region.startSeconds, endSeconds: region.endSeconds }))), 1)}>Play All Matching Riffs · {lane.name}</button>)}</div></div> : null}
    {matches?.length ? <div className="mt-3 rounded-xl border-2 border-fuchsia-300/40 bg-fuchsia-300/[0.07] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-black text-fuchsia-100">Track 4 — Hybrid Edit</p><p className="text-xs text-white/60">Copy colored riffs here, put them in any order, and play the complete edit. Your three original songs are always preserved.</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={!hybridClips.length} className="rounded-lg bg-fuchsia-100 px-3 py-2 text-xs font-black text-fuchsia-950 disabled:opacity-40" onClick={() => onAuditionFamily?.(hybridClips.map((clip) => ({ laneId: clip.laneId, startSeconds: clip.startSeconds, endSeconds: clip.endSeconds })), 1)}>Play Hybrid Edit</button><button type="button" disabled={!hybridClips.length} className="rounded-lg border border-white/25 px-3 py-2 text-xs font-black disabled:opacity-40" onClick={() => setHybridClips([])}>Clear Hybrid Track</button></div></div><div className="mt-3 flex flex-wrap gap-2">{matches.flatMap((match) => selected.map((lane) => <button type="button" key={`copy:${match.id}:${lane.id}`} className="rounded-lg border bg-black/50 px-2 py-1 text-xs font-black" style={{ borderColor: match.color }} onClick={() => copyToHybrid(match, lane)}>Copy {match.id.replace("riff-", "Riff ")} from {lane.name}</button>))}</div>{hybridClips.length ? <ol className="mt-3 grid gap-2">{hybridClips.map((clip, index) => <li key={clip.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-black/35 p-2 text-xs" style={{ borderColor: clip.color }}><span className="rounded px-2 py-1 font-black text-black" style={{ backgroundColor: clip.color }}>{index + 1}</span><button type="button" className="font-black underline decoration-white/30" onClick={() => onAudition?.(clip.laneId, clip.startSeconds, clip.endSeconds)}>{clip.riffId.replace("riff-", "Riff ")} · {clip.laneName} · {clip.startSeconds.toFixed(1)}s</button><div className="ml-auto flex flex-wrap gap-1"><button type="button" disabled={index === 0} className="rounded bg-white/10 px-2 py-1 disabled:opacity-30" onClick={() => setHybridClips((clips) => moveTimelineDawHybridRiffClip(clips, clip.id, -1))}>Move Earlier</button><button type="button" disabled={index === hybridClips.length - 1} className="rounded bg-white/10 px-2 py-1 disabled:opacity-30" onClick={() => setHybridClips((clips) => moveTimelineDawHybridRiffClip(clips, clip.id, 1))}>Move Later</button><button type="button" className="rounded bg-white/10 px-2 py-1" onClick={() => setHybridClips((clips) => duplicateTimelineDawHybridRiffClip(clips, clip.id))}>Duplicate</button><button type="button" className="rounded bg-rose-200 px-2 py-1 font-black text-rose-950" onClick={() => setHybridClips((clips) => cutTimelineDawHybridRiffClip(clips, clip.id))}>Cut from Hybrid</button></div></li>)}</ol> : <p className="mt-3 rounded-lg border border-dashed border-fuchsia-200/30 p-3 text-xs text-fuchsia-100/70">Empty track. Press a Copy button above to paste a riff into Track 4.</p>}</div> : null}
    {matches !== null ? <div className="mt-3">{matches.length ? <><p className="text-sm font-black">Found {matches.length} matching riff {matches.length === 1 ? "family" : "families"}.</p><div className="mt-2 grid gap-3">{selected.map((lane) => <div key={lane.id}><p className="text-xs font-black">{lane.name}</p><div className="relative mt-1 h-8 overflow-hidden rounded-lg border border-white/15 bg-black/50">{matches.flatMap((match) => match.regions.filter((region) => region.laneId === lane.id).map((region) => <button type="button" aria-label={`Hear ${match.id} in ${lane.name}`} key={`${match.id}:${lane.id}`} className="absolute inset-y-0 cursor-pointer border-x border-white/60 hover:brightness-125 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-cyan-300" title={`Click to hear ${match.id}: ${Math.round(region.similarity * 100)}% match, ${region.startSeconds.toFixed(1)}–${region.endSeconds.toFixed(1)} seconds`} style={{ backgroundColor: match.color, left: `${100 * region.startSeconds / Math.max(0.001, lane.sourceOutSeconds - lane.sourceInSeconds)}%`, width: `${100 * (region.endSeconds - region.startSeconds) / Math.max(0.001, lane.sourceOutSeconds - lane.sourceInSeconds)}%` }} onClick={() => onAudition?.(lane.id, region.startSeconds, region.endSeconds)} />))}</div><div className="mt-1 flex flex-wrap gap-1">{matches.flatMap((match) => match.regions.filter((region) => region.laneId === lane.id).map((region) => <button type="button" key={`hear:${match.id}:${lane.id}`} className="rounded-lg border px-2 py-1 text-xs font-black" style={{ borderColor: match.color }} onClick={() => onAudition?.(lane.id, region.startSeconds, region.endSeconds)}>Hear {match.id.replace("riff-", "riff ")} · {region.startSeconds.toFixed(1)}s</button>))}</div></div>)}</div><p className="mt-2 text-xs text-white/55">Click a colored region or its Hear button to audition only that match. Playback stops automatically at the end.</p><ul className="mt-3 grid gap-2">{matches.map((match) => { const regions = match.regions.map((region) => ({ laneId: region.laneId, startSeconds: region.startSeconds, endSeconds: region.endSeconds })); return <li key={match.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/15 px-2 py-2 text-xs font-black" style={{ borderColor: match.color }}><span>{match.id.replace("riff-", "Riff family ")} · {Math.round(match.similarity * 100)}%</span><div className="flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-white/30 bg-white px-2 py-1 text-black" onClick={() => onAuditionFamily?.(regions, 1)}>Hear Across All Selected Tracks</button><button type="button" className="rounded-lg border border-white/30 bg-white px-2 py-1 text-black" onClick={() => onAuditionFamily?.(regions, 3)}>Repeat Comparison 3 Times</button></div></li>; })}</ul></> : <p className="text-sm text-amber-100">No regions reached the 90% match requirement across all selected tracks.</p>}</div> : null}
  </section>;
}
