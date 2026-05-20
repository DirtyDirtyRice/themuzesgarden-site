export type GranularPitchWindowShape =
  | "linear"
  | "equal-power"
  | "hann"
  | "cosine";

const MIN_ENVELOPE_DURATION_SECONDS = 0.001;
const MIN_SMOOTHING_SECONDS = 0.001;
const DEFAULT_CURVE_RESOLUTION = 256;
const MIN_CURVE_RESOLUTION = 32;
const MAX_CURVE_RESOLUTION = 2048;
const CURVE_FLOOR = 0;
const CURVE_CEILING = 1;
const CURVE_EDGE_ZERO_SAMPLES = 2;

type GranularPitchEnvelopeCurveProfile = {
  windowShape: GranularPitchWindowShape;
  resolution: number;
  peak: number;
  average: number;
  attackBias: number;
  releaseBias: number;
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function getSafeTime(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, value);
}

function getSafeWindowShape(
  windowShape: GranularPitchWindowShape | undefined,
): GranularPitchWindowShape {
  if (
    windowShape === "linear" ||
    windowShape === "equal-power" ||
    windowShape === "hann" ||
    windowShape === "cosine"
  ) {
    return windowShape;
  }

  return "equal-power";
}

function getSafeCurveResolution(resolution: number | undefined) {
  return Math.round(
    clampNumber(
      Number.isFinite(resolution) ? Number(resolution) : DEFAULT_CURVE_RESOLUTION,
      MIN_CURVE_RESOLUTION,
      MAX_CURVE_RESOLUTION,
    ),
  );
}

function getCurvePosition(index: number, resolution: number) {
  if (resolution <= 1) {
    return 0;
  }

  return index / (resolution - 1);
}

function clampCurveValue(value: number) {
  return clampNumber(value, CURVE_FLOOR, CURVE_CEILING);
}

function getLinearWindowValue(position: number) {
  return position <= 0.5 ? position * 2 : (1 - position) * 2;
}

function getHannWindowValue(position: number) {
  return 0.5 * (1 - Math.cos(2 * Math.PI * position));
}

function getCosineWindowValue(position: number) {
  return Math.sin(position * Math.PI);
}

function getEqualPowerWindowValue(position: number) {
  const sine = Math.sin(position * Math.PI);

  return Math.sqrt(Math.max(0, sine));
}

function getWindowValue(
  windowShape: GranularPitchWindowShape,
  position: number,
) {
  if (windowShape === "linear") {
    return getLinearWindowValue(position);
  }

  if (windowShape === "hann") {
    return getHannWindowValue(position);
  }

  if (windowShape === "cosine") {
    return getCosineWindowValue(position);
  }

  return getEqualPowerWindowValue(position);
}

function forceSilentCurveEdges(curve: Float32Array) {
  if (curve.length === 0) {
    return curve;
  }

  const edgeSampleCount = Math.min(CURVE_EDGE_ZERO_SAMPLES, curve.length);

  for (let index = 0; index < edgeSampleCount; index += 1) {
    curve[index] = 0;
    curve[curve.length - 1 - index] = 0;
  }

  return curve;
}

function normalizeCurvePeak(curve: Float32Array) {
  let peak = 0;

  for (let index = 0; index < curve.length; index += 1) {
    peak = Math.max(peak, curve[index]);
  }

  if (peak <= 0) {
    return curve;
  }

  for (let index = 0; index < curve.length; index += 1) {
    curve[index] = clampCurveValue(curve[index] / peak);
  }

  return curve;
}

function softenCurveCenter(curve: Float32Array, windowShape: GranularPitchWindowShape) {
  if (windowShape !== "equal-power") {
    return curve;
  }

  for (let index = 0; index < curve.length; index += 1) {
    const value = curve[index];
    curve[index] = clampCurveValue(value * 0.96 + value * value * 0.04);
  }

  return curve;
}

export function createWindowCurve(
  windowShape: GranularPitchWindowShape,
  resolution = DEFAULT_CURVE_RESOLUTION,
) {
  const safeWindowShape = getSafeWindowShape(windowShape);
  const curveResolution = getSafeCurveResolution(resolution);
  const curve = new Float32Array(curveResolution);

  for (let index = 0; index < curveResolution; index += 1) {
    const position = getCurvePosition(index, curveResolution);
    curve[index] = clampCurveValue(getWindowValue(safeWindowShape, position));
  }

  softenCurveCenter(curve, safeWindowShape);
  normalizeCurvePeak(curve);
  forceSilentCurveEdges(curve);

  return curve;
}

export function inspectWindowCurve(
  windowShape: GranularPitchWindowShape,
  resolution = DEFAULT_CURVE_RESOLUTION,
): GranularPitchEnvelopeCurveProfile {
  const safeWindowShape = getSafeWindowShape(windowShape);
  const curve = createWindowCurve(safeWindowShape, resolution);

  let peak = 0;
  let total = 0;
  let attackTotal = 0;
  let releaseTotal = 0;
  const midpoint = Math.floor(curve.length / 2);

  for (let index = 0; index < curve.length; index += 1) {
    const value = curve[index];

    peak = Math.max(peak, value);
    total += value;

    if (index <= midpoint) {
      attackTotal += value;
    } else {
      releaseTotal += value;
    }
  }

  return {
    windowShape: safeWindowShape,
    resolution: curve.length,
    peak,
    average: curve.length > 0 ? total / curve.length : 0,
    attackBias: midpoint > 0 ? attackTotal / midpoint : 0,
    releaseBias:
      curve.length - midpoint > 0 ? releaseTotal / (curve.length - midpoint) : 0,
  };
}

function getSafeEnvelopeTimes({
  audioContext,
  when,
  grainDurationSeconds,
  smoothingSeconds,
}: {
  audioContext: AudioContext;
  when: number;
  grainDurationSeconds: number;
  smoothingSeconds: number;
}) {
  const safeWhen = Math.max(
    audioContext.currentTime,
    getSafeTime(when, audioContext.currentTime),
  );
  const safeDuration = Math.max(
    MIN_ENVELOPE_DURATION_SECONDS,
    getSafeTime(grainDurationSeconds, MIN_ENVELOPE_DURATION_SECONDS),
  );
  const safeSmoothing = Math.min(
    Math.max(MIN_SMOOTHING_SECONDS, getSafeTime(smoothingSeconds, MIN_SMOOTHING_SECONDS)),
    safeDuration / 2,
  );

  return {
    safeWhen,
    safeDuration,
    safeSmoothing,
    attackEnd: safeWhen + safeSmoothing,
    releaseStart: Math.max(
      safeWhen + safeSmoothing,
      safeWhen + safeDuration - safeSmoothing,
    ),
    releaseEnd: safeWhen + safeDuration,
  };
}

function applyLinearEnvelope({
  gain,
  safeWhen,
  attackEnd,
  releaseStart,
  releaseEnd,
}: {
  gain: AudioParam;
  safeWhen: number;
  attackEnd: number;
  releaseStart: number;
  releaseEnd: number;
}) {
  gain.setValueAtTime(0, safeWhen);
  gain.linearRampToValueAtTime(1, attackEnd);
  gain.setValueAtTime(1, releaseStart);
  gain.linearRampToValueAtTime(0, releaseEnd);
}

function applyCurveEnvelope({
  gain,
  safeWhen,
  safeDuration,
  windowShape,
}: {
  gain: AudioParam;
  safeWhen: number;
  safeDuration: number;
  windowShape: GranularPitchWindowShape;
}) {
  const curve = createWindowCurve(windowShape);

  gain.setValueAtTime(0, safeWhen);
  gain.setValueCurveAtTime(curve, safeWhen, safeDuration);
  gain.setValueAtTime(0, safeWhen + safeDuration);
}

export function createEnvelopeGain(
  audioContext: AudioContext,
  when: number,
  grainDurationSeconds: number,
  smoothingSeconds: number,
  windowShape: GranularPitchWindowShape = "equal-power",
) {
  const envelopeGain = audioContext.createGain();
  const safeWindowShape = getSafeWindowShape(windowShape);
  const {
    safeWhen,
    safeDuration,
    safeSmoothing,
    attackEnd,
    releaseStart,
    releaseEnd,
  } = getSafeEnvelopeTimes({
    audioContext,
    when,
    grainDurationSeconds,
    smoothingSeconds,
  });

  envelopeGain.gain.cancelScheduledValues(safeWhen);
  envelopeGain.gain.setValueAtTime(0, safeWhen);

  if (safeWindowShape === "linear") {
    applyLinearEnvelope({
      gain: envelopeGain.gain,
      safeWhen,
      attackEnd,
      releaseStart,
      releaseEnd,
    });

    return envelopeGain;
  }

  applyCurveEnvelope({
    gain: envelopeGain.gain,
    safeWhen,
    safeDuration,
    windowShape: safeWindowShape,
  });

  return envelopeGain;
}

export function silenceEnvelopeGain(
  envelopeGain: GainNode,
  audioContext: AudioContext,
  fadeSeconds = 0.012,
) {
  const now = audioContext.currentTime;
  const safeFadeSeconds = clampNumber(fadeSeconds, 0.001, 0.08);

  try {
    envelopeGain.gain.cancelScheduledValues(now);
    envelopeGain.gain.setValueAtTime(envelopeGain.gain.value, now);
    envelopeGain.gain.linearRampToValueAtTime(0, now + safeFadeSeconds);
  } catch {
    try {
      envelopeGain.gain.value = 0;
    } catch {
      // Ignore already-disconnected gain nodes.
    }
  }
}

export function getRecommendedEnvelopeSmoothingSeconds({
  grainDurationSeconds,
  windowShape = "equal-power",
}: {
  grainDurationSeconds: number;
  windowShape?: GranularPitchWindowShape;
}) {
  const safeDuration = Math.max(
    MIN_ENVELOPE_DURATION_SECONDS,
    getSafeTime(grainDurationSeconds, MIN_ENVELOPE_DURATION_SECONDS),
  );
  const safeWindowShape = getSafeWindowShape(windowShape);

  if (safeWindowShape === "linear") {
    return clampNumber(safeDuration * 0.18, MIN_SMOOTHING_SECONDS, safeDuration / 2);
  }

  if (safeWindowShape === "hann") {
    return clampNumber(safeDuration * 0.32, MIN_SMOOTHING_SECONDS, safeDuration / 2);
  }

  if (safeWindowShape === "cosine") {
    return clampNumber(safeDuration * 0.28, MIN_SMOOTHING_SECONDS, safeDuration / 2);
  }

  return clampNumber(safeDuration * 0.3, MIN_SMOOTHING_SECONDS, safeDuration / 2);
}