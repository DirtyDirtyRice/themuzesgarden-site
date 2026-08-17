export type TimelineDawRecordedSignalHealth = {
  state: "healthy" | "very-low" | "silent";
  peakDbfs: number;
  warning: string | null;
};

export function assessTimelineDawRecordedSignalHealth(peakDbfs: number): TimelineDawRecordedSignalHealth {
  const peak = Number.isFinite(peakDbfs) ? Math.max(-96, Math.min(0, peakDbfs)) : -96;
  if (peak <= -80) {
    return {
      state: "silent",
      peakDbfs: peak,
      warning: "This take contains no useful microphone signal. The WAV was preserved, but check the interface input, hardware mute, cable, and gain before recording again.",
    };
  }
  if (peak < -50) {
    return {
      state: "very-low",
      peakDbfs: peak,
      warning: "This take's microphone signal is extremely quiet. The WAV was preserved; test the input level and raise the interface gain before the next take.",
    };
  }
  return { state: "healthy", peakDbfs: peak, warning: null };
}
