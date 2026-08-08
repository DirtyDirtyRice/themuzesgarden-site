import type { TimelineDecodedAudioBuffer } from "./TimelineAudioDecodeEngine";
import type { TimelineDawTakeCompRegion } from "./TimelineDawTakeCompPolicy";

export type TimelineDawRenderedCompPcm = {
  channels: Float32Array[];
  sampleRate: number;
  channelCount: number;
  frameCount: number;
  durationSeconds: number;
  crossfadeFrames: number[];
};

type CompSource = TimelineDecodedAudioBuffer & { takeId: string };

export class TimelineDawTakeCompRenderer {
  render(
    regions: TimelineDawTakeCompRegion[],
    sources: ReadonlyMap<string, CompSource>,
    crossfadeMilliseconds = 10,
  ): TimelineDawRenderedCompPcm {
    if (regions.length < 2) throw new Error("A rendered comp requires at least two regions.");
    if (!Number.isFinite(crossfadeMilliseconds) || crossfadeMilliseconds < 0 || crossfadeMilliseconds > 100) {
      throw new Error("Comp crossfade must be from 0 to 100 milliseconds.");
    }
    const slices = regions.map((region, index) => {
      const source = sources.get(region.takeId);
      if (!source) throw new Error(`Comp region ${index + 1} source is unavailable.`);
      const startFrame = Math.round(region.startSeconds * source.sampleRate);
      const endFrame = Math.round(region.endSeconds * source.sampleRate);
      if (startFrame < 0 || endFrame <= startFrame || endFrame > source.frameCount) {
        throw new Error(`Comp region ${index + 1} is outside its source frames.`);
      }
      return { source, startFrame, frameCount: endFrame - startFrame };
    });
    const { sampleRate, channelCount } = slices[0].source;
    for (const { source } of slices) {
      if (source.sampleRate !== sampleRate) throw new Error("Comp sources must use the same sample rate.");
      if (source.channelCount !== channelCount) throw new Error("Comp sources must use the same channel count.");
    }

    const requestedCrossfade = Math.round(sampleRate * crossfadeMilliseconds / 1_000);
    const crossfadeFrames = slices.slice(1).map((slice, index) => Math.min(
      requestedCrossfade,
      Math.floor(slices[index].frameCount / 2),
      Math.floor(slice.frameCount / 2),
    ));
    const frameCount = slices.reduce((total, slice) => total + slice.frameCount, 0)
      - crossfadeFrames.reduce((total, frames) => total + frames, 0);
    const channels = Array.from({ length: channelCount }, () => new Float32Array(frameCount));
    let outputOffset = 0;
    slices.forEach((slice, sliceIndex) => {
      const overlap = sliceIndex === 0 ? 0 : crossfadeFrames[sliceIndex - 1];
      const writeOffset = outputOffset - overlap;
      for (let channel = 0; channel < channelCount; channel += 1) {
        const source = slice.source.channels[channel];
        for (let frame = 0; frame < slice.frameCount; frame += 1) {
          const sample = source[slice.startFrame + frame];
          if (frame < overlap) {
            const progress = overlap === 1 ? 1 : frame / (overlap - 1);
            const outgoingGain = Math.cos(progress * Math.PI / 2);
            const incomingGain = Math.sin(progress * Math.PI / 2);
            channels[channel][writeOffset + frame] = Math.max(-1, Math.min(1,
              channels[channel][writeOffset + frame] * outgoingGain + sample * incomingGain,
            ));
          } else {
            channels[channel][writeOffset + frame] = sample;
          }
        }
      }
      outputOffset = writeOffset + slice.frameCount;
    });
    return { channels, sampleRate, channelCount, frameCount, durationSeconds: frameCount / sampleRate, crossfadeFrames };
  }
}
