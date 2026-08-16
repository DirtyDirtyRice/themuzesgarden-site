export function parseTimelineDawMusicianTrialTrim(input: { startSeconds: number; endSeconds: number; durationSeconds: number; sampleRate: number }) {
  const duration = Number(input.durationSeconds), sampleRate = Math.round(Number(input.sampleRate));
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isInteger(sampleRate) || sampleRate < 8_000) throw new Error("Trial audio timing is invalid.");
  const start = Math.max(0, Math.min(duration, Number(input.startSeconds)));
  const end = Math.max(0, Math.min(duration, Number(input.endSeconds)));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 0.05) throw new Error("Keep at least 0.05 seconds in the edited take.");
  return { startFrame: Math.floor(start * sampleRate), endFrame: Math.ceil(end * sampleRate), startSeconds: start, endSeconds: end };
}
