"use client";

import type { DawPrivateAudioLane, DawPrivateLaneWaveform } from "@/app/workspace/projects/[id]/projectDawApi";
import { projectTimelineDawPrivateLaneWaveform } from "@/lib/timeline/TimelineDawPrivateLaneWaveformPolicy";
import { resolveTimelineDawMusicianTrackTiming } from "@/lib/timeline/TimelineDawMusicianTrackTiming";

export default function TimelineDawPrivateLaneWaveform({
  lane,
  waveform,
  timelineExtentSeconds,
  onEdit,
}: {
  lane: DawPrivateAudioLane;
  waveform?: DawPrivateLaneWaveform;
  timelineExtentSeconds: number;
  onEdit: (patch: Partial<Pick<DawPrivateAudioLane, "timelineStartSeconds" | "sourceInSeconds" | "sourceOutSeconds">>) => void;
}) {
  const timing = resolveTimelineDawMusicianTrackTiming({
    timelineStartSeconds: lane.timelineStartSeconds, sourceInSeconds: lane.sourceInSeconds, sourceOutSeconds: lane.sourceOutSeconds,
    stretchRatio: lane.transform.stretchRatio, transformBypassed: lane.transform.bypassed,
  });
  const duration = timing.audibleDurationSeconds;
  const sampleStep = 1 / lane.audio.sampleRate;
  const peaks = waveform ? projectTimelineDawPrivateLaneWaveform(
    waveform,
    Math.round(lane.sourceInSeconds * lane.audio.sampleRate),
    Math.round(lane.sourceOutSeconds * lane.audio.sampleRate),
  ) : [];
  const left = 100 * lane.timelineStartSeconds / timelineExtentSeconds;
  const width = 100 * timing.audibleDurationSeconds / timelineExtentSeconds;

  return (
    <div className="mt-3 rounded-xl border border-violet-300/20 bg-black/60 p-3">
      <div className="relative h-20 overflow-hidden rounded-lg bg-white/[0.04]" aria-label={`${lane.name} timeline region`}>
        <div className="absolute inset-y-1 rounded-md border-2 border-violet-300 bg-violet-400/10" style={{ left: `${left}%`, width: `${width}%` }}>
          {peaks.length ? <svg viewBox={`0 0 ${peaks.length} 64`} preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={`${lane.name} waveform`}>
            {peaks.map((peak, index) => <rect key={index} x={index} y={32 - peak * 30} width={0.72} height={Math.max(1, peak * 60)} fill="rgb(196 181 253)" />)}
          </svg> : <span className="flex h-full items-center justify-center text-xs text-white/45">Preparing private waveform…</span>}
          {lane.fade.inSeconds > 0 ? <span className="absolute inset-y-0 left-0 border-r border-amber-300/80 bg-amber-300/10" style={{ width: `${100 * lane.fade.inSeconds / duration}%` }} title={`Fade in ${lane.fade.inSeconds.toFixed(3)} seconds`} /> : null}
          {lane.fade.outSeconds > 0 ? <span className="absolute inset-y-0 right-0 border-l border-amber-300/80 bg-amber-300/10" style={{ width: `${100 * lane.fade.outSeconds / duration}%` }} title={`Fade out ${lane.fade.outSeconds.toFixed(3)} seconds`} /> : null}
        </div>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <label className="text-xs font-black text-white/55">Move region<input aria-label={`Move ${lane.name}`} className="mt-1 block w-full accent-violet-300" type="range" min={0} max={Math.max(60, timelineExtentSeconds)} step={0.001} value={lane.timelineStartSeconds} onChange={(event) => onEdit({ timelineStartSeconds: Number(event.target.value) })} /></label>
        <label className="text-xs font-black text-white/55">Trim left<input aria-label={`Trim left edge of ${lane.name}`} className="mt-1 block w-full accent-violet-300" type="range" min={0} max={Math.max(0, lane.sourceOutSeconds - sampleStep)} step={sampleStep} value={lane.sourceInSeconds} onChange={(event) => onEdit({ sourceInSeconds: Number(event.target.value) })} /></label>
        <label className="text-xs font-black text-white/55">Trim right<input aria-label={`Trim right edge of ${lane.name}`} className="mt-1 block w-full accent-violet-300" type="range" min={Math.min(lane.audio.durationSeconds, lane.sourceInSeconds + sampleStep)} max={lane.audio.durationSeconds} step={sampleStep} value={lane.sourceOutSeconds} onChange={(event) => onEdit({ sourceOutSeconds: Number(event.target.value) })} /></label>
      </div>
    </div>
  );
}
