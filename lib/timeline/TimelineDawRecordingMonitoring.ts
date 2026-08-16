export type TimelineDawMonitoringMode = "off" | "direct" | "browser";

export function assessTimelineDawRecordingMonitoring(input: {
  mode: TimelineDawMonitoringMode;
  latencyMs: number | null;
  headphonesConfirmed: boolean;
}): { ready: boolean; browserGain: 0 | 1; recommendation: string } {
  if (input.mode === "off") return { ready: true, browserGain: 0, recommendation: "Input monitoring is off. Recording capture remains active and silent." };
  if (input.mode === "direct") return { ready: true, browserGain: 0, recommendation: "Use the interface's direct-monitor control; browser monitoring stays muted to prevent doubling." };
  if (!input.headphonesConfirmed) return { ready: false, browserGain: 0, recommendation: "Connect headphones and confirm them before enabling browser monitoring." };
  if (input.latencyMs === null) return { ready: false, browserGain: 0, recommendation: "Run Input Level Test first so browser-monitoring latency can be checked." };
  if (input.latencyMs > 20) return { ready: false, browserGain: 0, recommendation: `Measured browser latency is ${input.latencyMs.toFixed(1)} ms. Use hardware/direct monitoring for tighter timing.` };
  return { ready: true, browserGain: 1, recommendation: `Browser monitoring is ready at ${input.latencyMs.toFixed(1)} ms. Keep headphones on to prevent feedback.` };
}
