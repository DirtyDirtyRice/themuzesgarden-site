export type TimelineDawDeviceDiagnosticInput = {
  supported: boolean;
  secureContext: boolean;
  permission: "unknown" | "granted" | "denied";
  inputDevices: number;
  outputDevices: number;
  labeledDevices: number;
  sampleRate: number | null;
  baseLatencyMs: number | null;
  outputLatencyMs: number | null;
};

export type TimelineDawDeviceDiagnosticReport = TimelineDawDeviceDiagnosticInput & {
  status: "ready" | "held";
  issues: string[];
  recommendations: string[];
  roundTripEstimateMs: number | null;
};

export function assessTimelineDawDevices(
  input: TimelineDawDeviceDiagnosticInput,
): TimelineDawDeviceDiagnosticReport {
  const issues: string[] = [];
  const recommendations: string[] = [];
  if (!input.supported) issues.push("This browser does not expose audio device diagnostics.");
  if (!input.secureContext) issues.push("Audio input requires a secure HTTPS or localhost context.");
  if (input.permission === "denied") {
    issues.push("Microphone permission is denied.");
    recommendations.push("Enable microphone access in browser site settings, then test again.");
  }
  if (input.inputDevices < 1) {
    issues.push("No audio input device is available.");
    recommendations.push("Connect an interface or microphone and rescan devices.");
  }
  if (input.outputDevices < 1) {
    recommendations.push("No distinct audio output device was reported by this browser.");
  }
  if (input.permission === "unknown" && input.labeledDevices < 1) {
    recommendations.push("Run the microphone test to reveal device labels and validate input access.");
  }
  if (input.sampleRate !== null && ![44_100, 48_000, 88_200, 96_000, 192_000].includes(input.sampleRate)) {
    recommendations.push(`The active device sample rate is ${input.sampleRate.toLocaleString()} Hz; confirm project compatibility.`);
  }
  const roundTripEstimateMs = input.baseLatencyMs === null && input.outputLatencyMs === null
    ? null
    : Math.round(((input.baseLatencyMs ?? 0) + (input.outputLatencyMs ?? 0)) * 100) / 100;
  if (roundTripEstimateMs !== null && roundTripEstimateMs > 40) {
    issues.push(`Estimated audio latency is high at ${roundTripEstimateMs} ms.`);
    recommendations.push("Use a smaller interface buffer, close competing audio apps, or enable direct monitoring.");
  } else if (roundTripEstimateMs !== null && roundTripEstimateMs > 20) {
    recommendations.push(`Estimated audio latency is ${roundTripEstimateMs} ms; direct monitoring may improve recording feel.`);
  }
  return {
    ...input,
    status: issues.length ? "held" : "ready",
    issues,
    recommendations: [...new Set(recommendations)],
    roundTripEstimateMs,
  };
}
