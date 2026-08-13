import type { TimelineDecodedAudioBuffer } from "./TimelineAudioDecodeEngine";
import type { TimelineDawExperimentRecipe } from "./TimelineDawSongExperimentPolicy";

export function renderTimelineDawSongExperiment(recipe: TimelineDawExperimentRecipe, sources: ReadonlyMap<string, TimelineDecodedAudioBuffer>) {
  const first = sources.get(recipe.segments[0].versionId);
  if (!first) throw new Error("Experiment source is unavailable.");
  const sampleRate = first.sampleRate, channelCount = first.channelCount;
  for (const source of sources.values()) if (source.sampleRate !== sampleRate || source.channelCount !== channelCount) throw new Error("Experiment sources must use the same sample rate and channel count.");
  const parts = recipe.segments.flatMap(segment => {
    const source = sources.get(segment.versionId); if (!source) throw new Error(`Experiment source ${segment.versionId} is unavailable.`);
    const start = Math.round(segment.startSeconds * sampleRate), end = Math.round(segment.endSeconds * sampleRate), length = end - start, gain = 10 ** (segment.gainDb / 20), fadeIn = Math.round(segment.fadeInSeconds * sampleRate), fadeOut = Math.round(segment.fadeOutSeconds * sampleRate);
    return Array.from({ length: segment.repeats }, () => {
      const channels = source.channels.map(channel => {
        const output = channel.slice(start, end);
        let state = 0, alpha = segment.effect.kind === "lowpass" ? 1 - Math.exp(-2 * Math.PI * (segment.effect.cutoffHz as number) / sampleRate) : 1;
        for (let frame = 0; frame < length; frame += 1) {
          state += alpha * (output[frame] - state);
          const fadeGain = frame < fadeIn ? frame / Math.max(1, fadeIn) : frame >= length - fadeOut ? (length - frame - 1) / Math.max(1, fadeOut) : 1;
          output[frame] = Math.max(-1, Math.min(1, (segment.effect.kind === "lowpass" ? state : output[frame]) * gain * Math.max(0, fadeGain)));
        }
        return output;
      });
      return { channels, frameCount: length };
    });
  });
  const frameCount = parts.reduce((sum, part) => sum + part.frameCount, 0), channels = Array.from({ length: channelCount }, () => new Float32Array(frameCount));
  let offset = 0; for (const part of parts) { for (let channel = 0; channel < channelCount; channel += 1) channels[channel].set(part.channels[channel], offset); offset += part.frameCount; }
  return { channels, sampleRate, channelCount, frameCount, durationSeconds: frameCount / sampleRate };
}