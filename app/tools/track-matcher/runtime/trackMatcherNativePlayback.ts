import {
  clampNumber,
  MIN_PRO_PITCH_PLAYBACK_RATE,
  MAX_PRO_PITCH_PLAYBACK_RATE,
} from "./trackMatcherRuntimeUtils";

export function startNativePlayback({
  audioContext,
  audioBuffer,
  gainNode,
  dspNodeLayer,
  safeSourcePlaybackRate,
  safeStartAt,
}: {
  audioContext: AudioContext;
  audioBuffer: AudioBuffer;
  gainNode: GainNode;
  dspNodeLayer: {
    inputNode: GainNode | null;
    outputNode: GainNode | null;
  };
  safeSourcePlaybackRate: number;
  safeStartAt: number;
}): AudioBufferSourceNode {
  const sourceNode = audioContext.createBufferSource();

  sourceNode.buffer = audioBuffer;

  sourceNode.playbackRate.value = clampNumber(
    safeSourcePlaybackRate,
    MIN_PRO_PITCH_PLAYBACK_RATE,
    MAX_PRO_PITCH_PLAYBACK_RATE,
  );

  if (dspNodeLayer.inputNode && dspNodeLayer.outputNode) {
    sourceNode.connect(dspNodeLayer.inputNode);
    dspNodeLayer.outputNode.connect(gainNode);
  } else {
    sourceNode.connect(gainNode);
  }

  sourceNode.start(0, safeStartAt);

  return sourceNode;
}
