export type TimelineDawMusicianTrackMix = {
  muted: boolean;
  soloed: boolean;
  gain: number;
  pan: number;
};

export function resetTimelineDawMusicianTrackMix(
  mix: TimelineDawMusicianTrackMix,
  control: "volume" | "pan" | "both",
): TimelineDawMusicianTrackMix {
  return {
    ...mix,
    gain: control === "pan" ? mix.gain : 1,
    pan: control === "volume" ? mix.pan : 0,
  };
}
