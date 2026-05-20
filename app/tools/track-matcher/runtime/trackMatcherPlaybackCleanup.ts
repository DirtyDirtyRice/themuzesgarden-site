import type {
  TrackMatcherProPitchDspNodeLayerState,
  TrackMatcherProPitchGranularLayerState,
  TrackMatcherProPitchPlaybackState,
} from "./trackMatcherRuntimeState";

export function stopTrackMatcherProPitchSourceNode(
  sourceNode: AudioBufferSourceNode | null,
) {
  if (!sourceNode) return;

  try {
    sourceNode.stop();
  } catch {}

  try {
    sourceNode.disconnect();
  } catch {}
}

export function disconnectTrackMatcherGainNode(gainNode: GainNode | null) {
  if (!gainNode) return;

  try {
    gainNode.disconnect();
  } catch {}
}

export function disconnectTrackMatcherProPitchDspNodeLayer(
  dspNodeLayer: TrackMatcherProPitchDspNodeLayerState,
) {
  if (dspNodeLayer.inputNode) {
    disconnectTrackMatcherGainNode(dspNodeLayer.inputNode);
  }

  if (dspNodeLayer.outputNode) {
    disconnectTrackMatcherGainNode(dspNodeLayer.outputNode);
  }
}

export function stopTrackMatcherProPitchGranularLayer(
  granularLayer: TrackMatcherProPitchGranularLayerState,
) {
  if (!granularLayer.engine) return;

  try {
    granularLayer.engine.stop();
  } catch {}
}

export function cleanupTrackMatcherProPitchPlayback(
  playback: TrackMatcherProPitchPlaybackState,
) {
  stopTrackMatcherProPitchGranularLayer(playback.granularLayer);
  stopTrackMatcherProPitchSourceNode(playback.sourceNode);
  disconnectTrackMatcherProPitchDspNodeLayer(playback.dspNodeLayer);
  disconnectTrackMatcherGainNode(playback.gainNode);
}
