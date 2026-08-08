export type TimelineDawPrivateLaneArrangement = {
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  sourceInFrame: number;
  sourceOutFrame: number;
};

export function parseTimelineDawPrivateLaneArrangement(
  value: unknown,
  sampleRate: number,
  frameCount: number,
): TimelineDawPrivateLaneArrangement {
  if (!value || typeof value !== "object") throw new Error("Private lane arrangement is required.");
  if (!Number.isInteger(sampleRate) || sampleRate <= 0 || !Number.isInteger(frameCount) || frameCount <= 0) {
    throw new Error("Private lane source geometry is invalid.");
  }
  const input = value as Record<string, unknown>;
  const timelineStartSeconds = Number(input.timelineStartSeconds);
  if (!Number.isFinite(timelineStartSeconds) || timelineStartSeconds < 0 || timelineStartSeconds > 86_400) {
    throw new Error("Lane timeline position must be from 0 to 86400 seconds.");
  }
  const sourceIn = Number(input.sourceInSeconds);
  const sourceOut = Number(input.sourceOutSeconds);
  if (!Number.isFinite(sourceIn) || !Number.isFinite(sourceOut)) throw new Error("Lane source boundaries must be finite.");
  const sourceInFrame = Math.round(sourceIn * sampleRate);
  const sourceOutFrame = Math.round(sourceOut * sampleRate);
  if (sourceInFrame < 0 || sourceOutFrame <= sourceInFrame || sourceOutFrame > frameCount) {
    throw new Error("Lane source boundaries must contain at least one frame within the private master.");
  }
  return {
    timelineStartSeconds: Math.round(timelineStartSeconds * 1_000) / 1_000,
    sourceInSeconds: sourceInFrame / sampleRate,
    sourceOutSeconds: sourceOutFrame / sampleRate,
    sourceInFrame,
    sourceOutFrame,
  };
}
