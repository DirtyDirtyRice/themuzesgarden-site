import {
  createEnvelopeGain,
  type GranularPitchWindowShape,
} from "./granularPitchEnvelope";

const MIN_GRAIN_SPACING_SECONDS = 0.008;
const MIN_GRAIN_DURATION_SECONDS = 0.001;
const BUFFER_EDGE_PADDING_SECONDS = 0.001;
const MAX_REASONABLE_GRAIN_SECONDS = 1.25;
const MIN_PLAYBACK_RATE = 0.125;
const MAX_PLAYBACK_RATE = 8;
const DEFAULT_WINDOW_SHAPE: GranularPitchWindowShape = "equal-power";

export type GranularPitchScheduledGrain = {
  sourceNode: AudioBufferSourceNode;
  envelopeGain: GainNode;
  scheduledAt: number;
  startsAt: number;
  bufferOffset: number;
  duration: number;
  pitchRatio: number;
  windowShape: GranularPitchWindowShape;
  didStart: boolean;
};

export type GranularPitchScheduleGrainInput = {
  audioContext: AudioContext;
  audioBuffer: AudioBuffer;
  when: number;
  bufferTime: number;
  grainSize: number;
  pitchRatio: number;
  smoothing: number;
  masterGain: GainNode;
  windowShape?: GranularPitchWindowShape;
};

export type GranularPitchSchedulePreview = {
  canSchedule: boolean;
  when: number;
  bufferOffset: number;
  duration: number;
  pitchRatio: number;
  smoothing: number;
  windowShape: GranularPitchWindowShape;
  reason: string;
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getFiniteOrFallback(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

function getSafeWindowShape(
  windowShape: GranularPitchWindowShape | undefined,
): GranularPitchWindowShape {
  return windowShape ?? DEFAULT_WINDOW_SHAPE;
}

function getSafePitchRatio(pitchRatio: number) {
  return clamp(pitchRatio, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE);
}

function getSafeSmoothingSeconds({
  smoothing,
  grainDuration,
}: {
  smoothing: number;
  grainDuration: number;
}) {
  const safeSmoothing = clamp(smoothing, 0, Math.max(0, grainDuration / 2));

  if (grainDuration <= MIN_GRAIN_DURATION_SECONDS) {
    return 0;
  }

  return safeSmoothing;
}

function getSafeStartTime({
  requestedWhen,
  currentTime,
}: {
  requestedWhen: number;
  currentTime: number;
}) {
  const safeWhen = getFiniteOrFallback(requestedWhen, currentTime);

  return Math.max(currentTime, safeWhen);
}

export function getGrainSpacingSeconds(
  grainSizeSeconds: number,
  overlapRatio: number,
) {
  const safeGrainSize = clamp(
    grainSizeSeconds,
    MIN_GRAIN_DURATION_SECONDS,
    MAX_REASONABLE_GRAIN_SECONDS,
  );
  const safeOverlap = clamp(overlapRatio, 0, 0.96);
  const spacing = safeGrainSize * (1 - safeOverlap);

  return Math.max(MIN_GRAIN_SPACING_SECONDS, spacing);
}

export function getLoopedBufferTime(time: number, durationSeconds: number) {
  if (!Number.isFinite(time) || !Number.isFinite(durationSeconds)) {
    return 0;
  }

  if (durationSeconds <= 0) {
    return 0;
  }

  const looped = time % durationSeconds;

  if (looped < 0) {
    return looped + durationSeconds;
  }

  return looped;
}

function snapTimeToGrid(time: number, spacing: number) {
  if (!Number.isFinite(time)) {
    return 0;
  }

  if (!Number.isFinite(spacing) || spacing <= 0) {
    return time;
  }

  return Math.round(time / spacing) * spacing;
}

function clampScheduleLead(
  nextTime: number,
  currentTime: number,
  maxLead: number,
) {
  const safeCurrentTime = getFiniteOrFallback(currentTime, 0);
  const safeMaxLead = Math.max(0, getFiniteOrFallback(maxLead, 0));

  if (!Number.isFinite(nextTime)) {
    return safeCurrentTime;
  }

  if (nextTime < safeCurrentTime) {
    return safeCurrentTime;
  }

  if (nextTime > safeCurrentTime + safeMaxLead) {
    return safeCurrentTime + safeMaxLead;
  }

  return nextTime;
}

function getSafeBufferOffset({
  bufferTime,
  durationSeconds,
}: {
  bufferTime: number;
  durationSeconds: number;
}) {
  if (!Number.isFinite(bufferTime) || durationSeconds <= 0) {
    return 0;
  }

  const safeUpperBound = Math.max(0, durationSeconds - BUFFER_EDGE_PADDING_SECONDS);

  return clamp(bufferTime, 0, safeUpperBound);
}

function getSafeGrainDuration({
  audioBuffer,
  safeOffset,
  requestedGrainSize,
}: {
  audioBuffer: AudioBuffer;
  safeOffset: number;
  requestedGrainSize: number;
}) {
  const availableDuration = Math.max(
    MIN_GRAIN_DURATION_SECONDS,
    audioBuffer.duration - safeOffset,
  );
  const safeRequestedGrainSize = clamp(
    requestedGrainSize,
    MIN_GRAIN_DURATION_SECONDS,
    MAX_REASONABLE_GRAIN_SECONDS,
  );

  return Math.min(safeRequestedGrainSize, availableDuration);
}

function getWrappedGrainDuration({
  audioBuffer,
  safeOffset,
  requestedGrainSize,
}: {
  audioBuffer: AudioBuffer;
  safeOffset: number;
  requestedGrainSize: number;
}) {
  const duration = getSafeGrainDuration({
    audioBuffer,
    safeOffset,
    requestedGrainSize,
  });

  if (duration >= MIN_GRAIN_DURATION_SECONDS) {
    return duration;
  }

  return Math.min(
    Math.max(MIN_GRAIN_DURATION_SECONDS, requestedGrainSize),
    Math.max(MIN_GRAIN_DURATION_SECONDS, audioBuffer.duration),
  );
}

function createSilentFallbackGrain({
  audioContext,
  masterGain,
  when,
  duration,
  pitchRatio,
  bufferOffset,
  windowShape,
}: {
  audioContext: AudioContext;
  masterGain: GainNode;
  when: number;
  duration: number;
  pitchRatio: number;
  bufferOffset: number;
  windowShape: GranularPitchWindowShape;
}): GranularPitchScheduledGrain {
  const sourceNode = audioContext.createBufferSource();
  const envelopeGain = audioContext.createGain();

  envelopeGain.gain.setValueAtTime(0, Math.max(audioContext.currentTime, when));
  envelopeGain.connect(masterGain);

  return {
    sourceNode,
    envelopeGain,
    scheduledAt: audioContext.currentTime,
    startsAt: when,
    bufferOffset,
    duration,
    pitchRatio,
    windowShape,
    didStart: false,
  };
}

export function previewScheduledGrain({
  audioContext,
  audioBuffer,
  when,
  bufferTime,
  grainSize,
  pitchRatio,
  smoothing,
  windowShape = DEFAULT_WINDOW_SHAPE,
}: Omit<GranularPitchScheduleGrainInput, "masterGain">): GranularPitchSchedulePreview {
  if (!audioBuffer || audioBuffer.duration <= 0 || audioBuffer.length <= 0) {
    return {
      canSchedule: false,
      when: audioContext.currentTime,
      bufferOffset: 0,
      duration: 0,
      pitchRatio: getSafePitchRatio(pitchRatio),
      smoothing: 0,
      windowShape: getSafeWindowShape(windowShape),
      reason: "Audio buffer is empty.",
    };
  }

  const safeOffset = getSafeBufferOffset({
    bufferTime,
    durationSeconds: audioBuffer.duration,
  });
  const duration = getWrappedGrainDuration({
    audioBuffer,
    safeOffset,
    requestedGrainSize: grainSize,
  });
  const safeWhen = getSafeStartTime({
    requestedWhen: when,
    currentTime: audioContext.currentTime,
  });
  const safePitchRatio = getSafePitchRatio(pitchRatio);
  const safeSmoothing = getSafeSmoothingSeconds({
    smoothing,
    grainDuration: duration,
  });

  return {
    canSchedule: duration > 0,
    when: safeWhen,
    bufferOffset: safeOffset,
    duration,
    pitchRatio: safePitchRatio,
    smoothing: safeSmoothing,
    windowShape: getSafeWindowShape(windowShape),
    reason: duration > 0 ? "Ready." : "Grain duration is not schedulable.",
  };
}

export function scheduleGrain({
  audioContext,
  audioBuffer,
  when,
  bufferTime,
  grainSize,
  pitchRatio,
  smoothing,
  masterGain,
  windowShape = DEFAULT_WINDOW_SHAPE,
}: GranularPitchScheduleGrainInput): GranularPitchScheduledGrain {
  const preview = previewScheduledGrain({
    audioContext,
    audioBuffer,
    when,
    bufferTime,
    grainSize,
    pitchRatio,
    smoothing,
    windowShape,
  });

  if (!preview.canSchedule) {
    return createSilentFallbackGrain({
      audioContext,
      masterGain,
      when: preview.when,
      duration: preview.duration,
      pitchRatio: preview.pitchRatio,
      bufferOffset: preview.bufferOffset,
      windowShape: preview.windowShape,
    });
  }

  const sourceNode = audioContext.createBufferSource();
  const envelopeGain = createEnvelopeGain(
    audioContext,
    preview.when,
    preview.duration,
    preview.smoothing,
    preview.windowShape,
  );

  sourceNode.buffer = audioBuffer;
  sourceNode.playbackRate.setValueAtTime(
    preview.pitchRatio,
    Math.max(audioContext.currentTime, preview.when),
  );

  sourceNode.connect(envelopeGain);
  envelopeGain.connect(masterGain);

  let didStart = false;

  try {
    sourceNode.start(preview.when, preview.bufferOffset, preview.duration);
    didStart = true;
  } catch {
    try {
      sourceNode.disconnect();
    } catch {}

    try {
      envelopeGain.disconnect();
    } catch {}

    return createSilentFallbackGrain({
      audioContext,
      masterGain,
      when: preview.when,
      duration: preview.duration,
      pitchRatio: preview.pitchRatio,
      bufferOffset: preview.bufferOffset,
      windowShape: preview.windowShape,
    });
  }

  return {
    sourceNode,
    envelopeGain,
    scheduledAt: audioContext.currentTime,
    startsAt: preview.when,
    bufferOffset: preview.bufferOffset,
    duration: preview.duration,
    pitchRatio: preview.pitchRatio,
    windowShape: preview.windowShape,
    didStart,
  };
}

export function stopScheduledGrain(
  grain: GranularPitchScheduledGrain,
  audioContext?: AudioContext,
) {
  if (!grain.didStart) {
    return;
  }

  try {
    const stopAt = audioContext
      ? Math.max(audioContext.currentTime, grain.startsAt)
      : undefined;

    if (typeof stopAt === "number") {
      grain.sourceNode.stop(stopAt);
    } else {
      grain.sourceNode.stop();
    }
  } catch {
    // Ignore source nodes that already stopped.
  }
}

export function disconnectScheduledGrain(grain: GranularPitchScheduledGrain) {
  try {
    grain.sourceNode.disconnect();
  } catch {}

  try {
    grain.envelopeGain.disconnect();
  } catch {}
}

export function stabilizeNextGrainTime({
  nextTime,
  currentTime,
  spacing,
}: {
  nextTime: number;
  currentTime: number;
  spacing: number;
}) {
  const safeSpacing = Math.max(MIN_GRAIN_SPACING_SECONDS, spacing);
  let stabilized = snapTimeToGrid(nextTime, safeSpacing);

  stabilized = clampScheduleLead(stabilized, currentTime, safeSpacing * 4);

  return stabilized;
}

export function getSafeGranularPitchScheduleLead({
  currentTime,
  targetTime,
  scheduleAheadSeconds,
}: {
  currentTime: number;
  targetTime: number;
  scheduleAheadSeconds: number;
}) {
  return clampScheduleLead(
    targetTime,
    currentTime,
    Math.max(MIN_GRAIN_SPACING_SECONDS, scheduleAheadSeconds),
  );
}

export function getGrainEndTime(grain: GranularPitchScheduledGrain) {
  return grain.startsAt + grain.duration;
}

export function isScheduledGrainExpired({
  grain,
  currentTime,
  cleanupPaddingSeconds = 0.08,
}: {
  grain: GranularPitchScheduledGrain;
  currentTime: number;
  cleanupPaddingSeconds?: number;
}) {
  return currentTime >= getGrainEndTime(grain) + cleanupPaddingSeconds;
}

export function getScheduledGrainDebugLabel(grain: GranularPitchScheduledGrain) {
  const offset = grain.bufferOffset.toFixed(3);
  const duration = grain.duration.toFixed(3);
  const ratio = grain.pitchRatio.toFixed(3);
  const start = grain.startsAt.toFixed(3);

  return `grain start=${start}s offset=${offset}s duration=${duration}s ratio=${ratio}`;
}