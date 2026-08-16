export type TimelineDawCountInBeat = {
  index: number;
  bar: number;
  beat: number;
  accent: boolean;
  delayMs: number;
};

export function createTimelineDawCountIn(input: { bars: number; beatsPerBar: number; bpm: number }): TimelineDawCountInBeat[] {
  const bars = Math.round(input.bars), beats = Math.round(input.beatsPerBar), bpm = Number(input.bpm);
  if (bars < 0 || bars > 8) throw new Error("Count-in must be between 0 and 8 bars.");
  if (beats < 1 || beats > 32) throw new Error("Meter must be between 1 and 32 beats per bar.");
  if (!Number.isFinite(bpm) || bpm < 20 || bpm > 400) throw new Error("Tempo must be between 20 and 400 BPM.");
  const delayMs = 60_000 / bpm;
  return Array.from({ length: bars * beats }, (_, index) => ({
    index, bar: Math.floor(index / beats) + 1, beat: index % beats + 1,
    accent: index % beats === 0, delayMs,
  }));
}
