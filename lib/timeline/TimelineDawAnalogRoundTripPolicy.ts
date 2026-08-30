export type TimelineDawAnalogRoundTripAssessment = {
  status: "ready" | "held";
  sampleRate: 44_100 | 48_000 | 88_200 | 96_000 | 192_000;
  measurementCount: number;
  medianRoundTripMs: number;
  spreadMs: number;
  compensationSamples: number;
  placementOffsetSamples: number;
  compensationApprovedByHuman: boolean;
  applyAllowed: boolean;
  reasons: readonly string[];
  sourceAudioMutationAllowed: false;
  automaticApplyAllowed: false;
  persistenceAllowed: false;
};

const RATES = [44_100, 48_000, 88_200, 96_000, 192_000] as const;

export function assessTimelineDawAnalogRoundTrip(input: { measurementsMs: unknown; sampleRate: unknown; compensationApprovedByHuman: unknown }): TimelineDawAnalogRoundTripAssessment {
  const sampleRate = Number(input.sampleRate) as TimelineDawAnalogRoundTripAssessment["sampleRate"];
  if (!RATES.includes(sampleRate)) throw new Error("Choose a supported session sample rate.");
  if (!Array.isArray(input.measurementsMs)) throw new Error("Provide three to nine measured round-trip times.");
  const measurements = input.measurementsMs.map(Number);
  if (measurements.length < 3 || measurements.length > 9) throw new Error("Provide three to nine measured round-trip times.");
  if (measurements.some((value) => !Number.isFinite(value) || value <= 0 || value > 500)) throw new Error("Each round-trip measurement must be greater than 0 and no more than 500 ms.");
  const sorted = [...measurements].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianRoundTripMs = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const spreadMs = sorted.at(-1)! - sorted[0];
  const compensationSamples = Math.round(medianRoundTripMs * sampleRate / 1000);
  const stable = spreadMs <= 2;
  const approved = input.compensationApprovedByHuman === true;
  const reasons = [
    ...(stable ? [] : [`Measurements vary by ${spreadMs.toFixed(2)} ms. Check the loopback route and measure again.`]),
    ...(approved ? [] : ["Review and approve the measured compensation before applying it."]),
  ];
  return {
    status: stable && approved ? "ready" : "held",
    sampleRate,
    measurementCount: measurements.length,
    medianRoundTripMs,
    spreadMs,
    compensationSamples,
    placementOffsetSamples: -compensationSamples,
    compensationApprovedByHuman: approved,
    applyAllowed: stable && approved,
    reasons,
    sourceAudioMutationAllowed: false,
    automaticApplyAllowed: false,
    persistenceAllowed: false,
  };
}
