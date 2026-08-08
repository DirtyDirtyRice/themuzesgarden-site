import type { TimelineDecodedAudioBuffer } from "./TimelineAudioDecodeEngine";

export type TimelineDawPrivateLaneWaveform = {
  binCount: number;
  frameCount: number;
  peaks: number[];
};

export function deriveTimelineDawPrivateLaneWaveform(
  audio: Pick<TimelineDecodedAudioBuffer, "channels" | "channelCount" | "frameCount">,
  binCount = 256,
): TimelineDawPrivateLaneWaveform {
  if (!Number.isInteger(binCount) || binCount < 32 || binCount > 512) throw new Error("Waveform bin count must be from 32 to 512.");
  if (!Number.isInteger(audio.frameCount) || audio.frameCount <= 0 || audio.channels.length !== audio.channelCount) {
    throw new Error("Waveform audio geometry is invalid.");
  }
  const boundedBins = Math.min(binCount, audio.frameCount);
  const peaks = Array.from({ length: boundedBins }, (_, bin) => {
    const start = Math.floor(bin * audio.frameCount / boundedBins);
    const end = Math.max(start + 1, Math.floor((bin + 1) * audio.frameCount / boundedBins));
    let peak = 0;
    for (const channel of audio.channels) {
      for (let frame = start; frame < end; frame += 1) peak = Math.max(peak, Math.abs(channel[frame] ?? 0));
    }
    return Math.round(peak * 10_000) / 10_000;
  });
  return { binCount: boundedBins, frameCount: audio.frameCount, peaks };
}

export function projectTimelineDawPrivateLaneWaveform(
  waveform: TimelineDawPrivateLaneWaveform,
  sourceInFrame: number,
  sourceOutFrame: number,
  outputBins = 96,
): number[] {
  if (sourceInFrame < 0 || sourceOutFrame <= sourceInFrame || sourceOutFrame > waveform.frameCount) {
    throw new Error("Waveform source window is invalid.");
  }
  const first = Math.floor(sourceInFrame * waveform.binCount / waveform.frameCount);
  const last = Math.max(first + 1, Math.ceil(sourceOutFrame * waveform.binCount / waveform.frameCount));
  const source = waveform.peaks.slice(first, last);
  const count = Math.min(outputBins, source.length);
  return Array.from({ length: count }, (_, bin) => {
    const start = Math.floor(bin * source.length / count);
    const end = Math.max(start + 1, Math.floor((bin + 1) * source.length / count));
    return Math.max(...source.slice(start, end));
  });
}
