import { applyWindow, type WindowShape } from "./granularPitchWindow";
import type {
  GranularGrain,
  TrackMatcherGranularPitchEngineConfig,
} from "./granularPitchTypes";

type CreateGranularGrainInput = {
  id: number;
  context: AudioContext;
  buffer: AudioBuffer;
  output: AudioNode;
  config: TrackMatcherGranularPitchEngineConfig;
  startTime: number;
  offset: number;
  duration: number;
  windowShape?: WindowShape;
  onEnded?: (id: number) => void;
};

export function createGranularGrain({
  id,
  context,
  buffer,
  output,
  config,
  startTime,
  offset,
  duration,
  windowShape = "hann",
  onEnded,
}: CreateGranularGrainInput): GranularGrain {
  const source = context.createBufferSource();
  const gain = context.createGain();

  source.buffer = buffer;
  source.playbackRate.value = config.pitchRatio;

  source.connect(gain);
  gain.connect(output);

  const fade = Math.min(config.crossfadeMs / 1000, duration / 2);

  applyWindow(gain, startTime, duration, fade, windowShape);

  source.onended = () => {
    onEnded?.(id);
  };

  source.start(startTime, offset, duration);

  return {
    id,
    source,
    gain,
    startTime,
    offset,
    duration,
  };
}

export function stopGranularGrain(grain: GranularGrain) {
  try {
    grain.source.stop();
  } catch {
    // AudioBufferSourceNode can only be stopped once.
  }
}

export function disconnectGranularGrain(grain: GranularGrain) {
  try {
    grain.source.disconnect();
  } catch {
    // The browser may have already disconnected the source.
  }

  try {
    grain.gain.disconnect();
  } catch {
    // The browser may have already disconnected the gain node.
  }
}

export function cleanupGranularGrain(grain: GranularGrain) {
  stopGranularGrain(grain);
  disconnectGranularGrain(grain);
}