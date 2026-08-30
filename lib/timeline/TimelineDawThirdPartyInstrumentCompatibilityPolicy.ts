import { assessTimelineDawPluginCompatibility, type TimelineDawPluginExecutionPath } from "./TimelineDawPluginCompatibilityPolicy";
import type { TimelinePluginFormat } from "./TimelinePluginProcessingHostEngine";

export type TimelineDawThirdPartyInstrumentCompatibilityReport = ReturnType<typeof assessTimelineDawThirdPartyInstrumentCompatibility>;

export function assessTimelineDawThirdPartyInstrumentCompatibility(input: {
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
  midiNoteResponsePassed: boolean;
  velocityAndChannelPassed: boolean;
  presetAndProgramRecallPassed: boolean;
  automationPassed: boolean;
  polyphonyPassed: boolean;
}) {
  const plugin = assessTimelineDawPluginCompatibility(input);
  const instrumentRequirements = input.executionPath === "rendered-exchange" ? [] : [
    !input.midiNoteResponsePassed ? "Verify real MIDI note-on and note-off response." : null,
    !input.velocityAndChannelPassed ? "Verify velocity and MIDI-channel handling." : null,
    !input.presetAndProgramRecallPassed ? "Verify preset and program-change recall after reopen." : null,
    !input.automationPassed ? "Verify instrument automation writes, reads, and recalls." : null,
    !input.polyphonyPassed ? "Verify polyphony and voice release at the intended production load." : null,
  ].filter((value): value is string => Boolean(value));
  const requirements = [...plugin.requirements, ...instrumentRequirements];
  const status = plugin.issues.length || requirements.length ? "held" as const : "qualified" as const;
  const activationAllowed = plugin.activationAllowed && status === "qualified";
  return {
    status,
    capability: plugin.capability,
    issues: plugin.issues,
    requirements,
    activationAllowed,
    directBinaryLoadAllowed: plugin.directBinaryLoadAllowed && activationAllowed,
    sourceMidiPreserved: true as const,
    sourceAudioPreserved: true as const,
    safeMode: status === "held" ? "silent-placeholder" as const : input.executionPath === "rendered-exchange" ? "verified-render" as const : "active" as const,
    warning: status === "held"
      ? "Instrument activation is blocked. Keep a silent placeholder, preserve the MIDI clip and instrument reference, and continue with a qualified replacement or verified render."
      : input.executionPath === "rendered-exchange"
        ? "This is verified offline rendered audio; the editable MIDI source remains preserved."
        : "This instrument path has the required compatibility and MIDI-performance evidence.",
  };
}
