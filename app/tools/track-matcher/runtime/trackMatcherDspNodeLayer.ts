import type { TrackMatcherProPitchDspPlan } from "../trackMatcherAudioEngine";
import type { TrackMatcherProPitchDspNodeLayerState } from "./trackMatcherRuntimeState";

export function createTrackMatcherProPitchDspNodeLayer(
  audioContext: AudioContext,
  plan: TrackMatcherProPitchDspPlan | null,
): TrackMatcherProPitchDspNodeLayerState {
  const inputNode = audioContext.createGain();
  const outputNode = audioContext.createGain();
  const latencyMs = plan?.latencyMs ?? 0;

  inputNode.gain.value = 1;
  outputNode.gain.value = 1;
  inputNode.connect(outputNode);

  return {
    mode: "passthrough",
    inputNode,
    outputNode,
    latencyMs,
    isInserted: true,
    label: "DSP insert slot active",
    detail:
      "Audio is routed through a dedicated DSP node slot before final gain output. The slot can host the granular pitch engine or stay in safe passthrough mode.",
    warning: "",
  };
}

export function getTrackMatcherProPitchDspNodeLayerLabel(
  dspNodeLayer: TrackMatcherProPitchDspNodeLayerState,
) {
  return dspNodeLayer.label;
}

export function getTrackMatcherProPitchDspNodeLayerDetail(
  dspNodeLayer: TrackMatcherProPitchDspNodeLayerState,
) {
  if (!dspNodeLayer.isInserted) {
    return dspNodeLayer.detail;
  }

  return `${dspNodeLayer.detail} Latency target: ${dspNodeLayer.latencyMs} ms.`;
}
