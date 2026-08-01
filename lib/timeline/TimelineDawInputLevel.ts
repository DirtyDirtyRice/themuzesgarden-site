export type TimelineDawInputLevel = {
  peakAmplitude: number;
  peakDbfs: number;
  clipped: boolean;
};

export function analyzeTimelineDawInputLevel(channels: Float32Array[]): TimelineDawInputLevel {
  if (!channels.length || channels.length > 32) throw new Error("Input meter channel count is invalid.");
  const frameCount = channels[0]?.length ?? 0;
  if (!frameCount || channels.some((channel) => channel.length !== frameCount)) {
    throw new Error("Input meter channels must have matching non-zero frame counts.");
  }
  let peakAmplitude = 0;
  for (const channel of channels) {
    for (const sample of channel) {
      if (!Number.isFinite(sample)) throw new Error("Input meter sample is invalid.");
      peakAmplitude = Math.max(peakAmplitude, Math.abs(sample));
    }
  }
  return {
    peakAmplitude,
    peakDbfs: peakAmplitude > 0 ? Math.max(-96, 20 * Math.log10(peakAmplitude)) : -96,
    clipped: peakAmplitude >= 0.999,
  };
}
