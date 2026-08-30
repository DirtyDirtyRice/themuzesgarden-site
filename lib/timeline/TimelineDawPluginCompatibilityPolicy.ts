import type { TimelinePluginFormat } from "./TimelinePluginProcessingHostEngine";

export type TimelineDawPluginExecutionPath = "browser-native" | "desktop-bridge" | "rendered-exchange";
export type TimelineDawPluginCompatibilityReport = {
  status: "qualified" | "held";
  capability: "live-browser-processing" | "live-bridged-processing" | "offline-rendered-audio" | "unsupported";
  issues: string[];
  requirements: string[];
  directBinaryLoadAllowed: boolean;
  sourceMutationAllowed: false;
};

export function assessTimelineDawPluginCompatibility(input: {
  format: TimelinePluginFormat;
  executionPath: TimelineDawPluginExecutionPath;
  fingerprintVerified: boolean;
  vendorVerified: boolean;
  sampleRateSupported: boolean;
  channelLayoutSupported: boolean;
  latencyMeasured: boolean;
  stateRecallPassed: boolean;
  bypassRecoveryPassed: boolean;
  renderedAudioVerified: boolean;
}): TimelineDawPluginCompatibilityReport {
  const browserNativeFormat = input.format === "wasm" || input.format === "built-in";
  const desktopFormat = ["vst3", "au", "aax", "clap"].includes(input.format);
  const issues: string[] = [];
  const requirements: string[] = [];
  let capability: TimelineDawPluginCompatibilityReport["capability"] = "unsupported";

  if (input.executionPath === "browser-native") {
    if (!browserNativeFormat) issues.push(`${input.format.toUpperCase()} binaries cannot load directly inside Chrome.`);
    else capability = "live-browser-processing";
  } else if (input.executionPath === "desktop-bridge") {
    if (!desktopFormat) issues.push("The desktop bridge is only needed for desktop plug-in formats.");
    else capability = "live-bridged-processing";
  } else {
    capability = "offline-rendered-audio";
    if (!input.renderedAudioVerified) issues.push("The returned rendered audio has not passed fingerprint and playback verification.");
  }

  if (input.executionPath !== "rendered-exchange") {
    if (!input.fingerprintVerified) requirements.push("Verify the exact plug-in binary fingerprint.");
    if (!input.vendorVerified) requirements.push("Verify the vendor and version.");
    if (!input.sampleRateSupported) requirements.push("Confirm the session sample rate is supported.");
    if (!input.channelLayoutSupported) requirements.push("Confirm the track channel layout is supported.");
    if (!input.latencyMeasured) requirements.push("Measure and compensate reported processing latency.");
    if (!input.stateRecallPassed) requirements.push("Save, close, reopen, and verify plug-in state recall.");
    if (!input.bypassRecoveryPassed) requirements.push("Verify bypass and crash recovery preserve dry audio.");
  }
  const status = issues.length || requirements.length ? "held" : "qualified";
  return { status, capability: status === "qualified" ? capability : capability, issues, requirements, directBinaryLoadAllowed: input.executionPath === "browser-native" && browserNativeFormat && status === "qualified", sourceMutationAllowed: false };
}
