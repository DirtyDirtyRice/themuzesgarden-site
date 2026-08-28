export type TimelineDawBrowserTimingReport = {
  status: "pass" | "review";
  sampleCount: number;
  averageJitterMs: number;
  p95JitterMs: number;
  worstJitterMs: number;
  summary: string;
};

function roundHundredths(value: number) {
  return Math.round(value * 100) / 100;
}

export function assessTimelineDawBrowserTiming(
  samples: number[],
): TimelineDawBrowserTimingReport {
  if (samples.length < 10) {
    throw new Error("At least 10 timing samples are required.");
  }
  if (samples.some((sample) => !Number.isFinite(sample) || sample < 0)) {
    throw new Error("Timing samples must be finite non-negative numbers.");
  }

  const ordered = [...samples].sort((left, right) => left - right);
  const averageJitterMs = roundHundredths(
    ordered.reduce((total, sample) => total + sample, 0) / ordered.length,
  );
  const p95Index = Math.min(ordered.length - 1, Math.ceil(ordered.length * 0.95) - 1);
  const p95JitterMs = roundHundredths(ordered[p95Index]);
  const worstJitterMs = roundHundredths(ordered.at(-1) ?? 0);
  const status = p95JitterMs <= 12 && worstJitterMs <= 25 ? "pass" : "review";

  return {
    status,
    sampleCount: ordered.length,
    averageJitterMs,
    p95JitterMs,
    worstJitterMs,
    summary: status === "pass"
      ? "Browser scheduling stayed inside the DAW timing self-test limits."
      : "Browser scheduling exceeded the DAW timing self-test limits; close competing work and test again.",
  };
}

export async function sampleTimelineDawBrowserTiming({
  sampleCount = 20,
  intervalMs = 25,
}: {
  sampleCount?: number;
  intervalMs?: number;
} = {}) {
  if (!Number.isInteger(sampleCount) || sampleCount < 10 || sampleCount > 100) {
    throw new Error("Timing sample count must be between 10 and 100.");
  }
  if (!Number.isFinite(intervalMs) || intervalMs < 10 || intervalMs > 1_000) {
    throw new Error("Timing interval must be between 10 and 1000 milliseconds.");
  }

  const samples: number[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const startedAt = performance.now();
    await new Promise<void>((resolve) => window.setTimeout(resolve, intervalMs));
    samples.push(Math.max(0, performance.now() - startedAt - intervalMs));
  }
  return assessTimelineDawBrowserTiming(samples);
}
