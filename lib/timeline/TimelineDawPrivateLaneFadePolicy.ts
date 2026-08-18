export type TimelineDawPrivateLaneFade = {
  inSeconds: number;
  outSeconds: number;
  inFrames: number;
  outFrames: number;
};

export type TimelineDawPrivateLaneCrossfade = {
  outgoingLaneId: string;
  incomingLaneId: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
};

type CrossfadeLane = {
  id: string;
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  transform?: { stretchRatio: number; bypassed: boolean };
  audio: { sampleRate: number; channelCount: number };
};

export function parseTimelineDawPrivateLaneFade(
  value: unknown,
  sampleRate: number,
  durationFrames: number,
): TimelineDawPrivateLaneFade {
  if (!value || typeof value !== "object") throw new Error("Private lane fade settings are required.");
  if (!Number.isInteger(sampleRate) || sampleRate <= 0 || !Number.isInteger(durationFrames) || durationFrames <= 0) {
    throw new Error("Private lane source geometry is invalid.");
  }
  const input = value as Record<string, unknown>;
  const inSeconds = Number(input.fadeInSeconds);
  const outSeconds = Number(input.fadeOutSeconds);
  if (!Number.isFinite(inSeconds) || !Number.isFinite(outSeconds)) throw new Error("Lane fades must be finite.");
  const inFrames = Math.round(inSeconds * sampleRate);
  const outFrames = Math.round(outSeconds * sampleRate);
  if (inFrames < 0 || outFrames < 0 || inFrames + outFrames > durationFrames) {
    throw new Error("Lane fades must be non-negative and fit within the arranged source duration.");
  }
  return { inSeconds: inFrames / sampleRate, outSeconds: outFrames / sampleRate, inFrames, outFrames };
}

export function timelineDawEqualPowerEnvelope(
  localSeconds: number,
  durationSeconds: number,
  fadeInSeconds: number,
  fadeOutSeconds: number,
): number {
  if (localSeconds < 0 || localSeconds >= durationSeconds) return 0;
  let gain = 1;
  if (fadeInSeconds > 0 && localSeconds < fadeInSeconds) {
    gain = Math.min(gain, Math.sin((localSeconds / fadeInSeconds) * Math.PI / 2));
  }
  const fadeOutStart = durationSeconds - fadeOutSeconds;
  if (fadeOutSeconds > 0 && localSeconds > fadeOutStart) {
    gain = Math.min(gain, Math.cos(((localSeconds - fadeOutStart) / fadeOutSeconds) * Math.PI / 2));
  }
  return Math.max(0, Math.min(1, gain));
}

export function detectTimelineDawPrivateLaneCrossfades(lanes: CrossfadeLane[]): TimelineDawPrivateLaneCrossfade[] {
  const ordered = [...lanes].sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds || a.id.localeCompare(b.id));
  const transitions: TimelineDawPrivateLaneCrossfade[] = [];
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const outgoing = ordered[index];
    const incoming = ordered[index + 1];
    const outgoingEnd = resolveTimelineDawMusicianTrackTiming({
      timelineStartSeconds: outgoing.timelineStartSeconds, sourceInSeconds: outgoing.sourceInSeconds, sourceOutSeconds: outgoing.sourceOutSeconds,
      stretchRatio: outgoing.transform?.stretchRatio ?? 1, transformBypassed: outgoing.transform?.bypassed ?? false,
    }).audibleEndSeconds;
    const incomingEnd = resolveTimelineDawMusicianTrackTiming({
      timelineStartSeconds: incoming.timelineStartSeconds, sourceInSeconds: incoming.sourceInSeconds, sourceOutSeconds: incoming.sourceOutSeconds,
      stretchRatio: incoming.transform?.stretchRatio ?? 1, transformBypassed: incoming.transform?.bypassed ?? false,
    }).audibleEndSeconds;
    const compatible = outgoing.audio.sampleRate === incoming.audio.sampleRate
      && outgoing.audio.channelCount === incoming.audio.channelCount;
    if (!compatible || incoming.timelineStartSeconds >= outgoingEnd || incomingEnd <= outgoingEnd) continue;
    transitions.push({
      outgoingLaneId: outgoing.id,
      incomingLaneId: incoming.id,
      startSeconds: incoming.timelineStartSeconds,
      endSeconds: outgoingEnd,
      durationSeconds: outgoingEnd - incoming.timelineStartSeconds,
    });
  }
  return transitions;
}
import { resolveTimelineDawMusicianTrackTiming } from "./TimelineDawMusicianTrackTiming";
