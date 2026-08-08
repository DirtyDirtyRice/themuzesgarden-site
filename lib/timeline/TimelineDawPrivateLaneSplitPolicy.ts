export type TimelineDawPrivateLaneSplit = {
  timelineSplitSeconds: number;
  sourceSplitSeconds: number;
  leftFrameCount: number;
  rightFrameCount: number;
};

export function parseTimelineDawPrivateLaneSplit(
  value: unknown,
  sampleRate: number,
  timelineStartSeconds: number,
  sourceInSeconds: number,
  sourceOutSeconds: number,
  fadeInSeconds: number,
  fadeOutSeconds: number,
): TimelineDawPrivateLaneSplit {
  if (!value || typeof value !== "object") throw new Error("Private lane split position is required.");
  if (!Number.isInteger(sampleRate) || sampleRate <= 0) throw new Error("Private lane source geometry is invalid.");
  const requested = Number((value as Record<string, unknown>).timelineSplitSeconds);
  if (!Number.isFinite(requested)) throw new Error("Lane split position must be finite.");
  const sourceInFrame = Math.round(sourceInSeconds * sampleRate);
  const sourceOutFrame = Math.round(sourceOutSeconds * sampleRate);
  const localFrame = Math.round((requested - timelineStartSeconds) * sampleRate);
  const durationFrames = sourceOutFrame - sourceInFrame;
  if (localFrame <= 0 || localFrame >= durationFrames) {
    throw new Error("Lane split must leave at least one source frame on each side.");
  }
  const leftFrameCount = localFrame;
  const rightFrameCount = durationFrames - localFrame;
  if (Math.round(fadeInSeconds * sampleRate) > leftFrameCount || Math.round(fadeOutSeconds * sampleRate) > rightFrameCount) {
    throw new Error("Lane split must be outside the existing edge fades.");
  }
  return {
    timelineSplitSeconds: timelineStartSeconds + localFrame / sampleRate,
    sourceSplitSeconds: (sourceInFrame + localFrame) / sampleRate,
    leftFrameCount,
    rightFrameCount,
  };
}
