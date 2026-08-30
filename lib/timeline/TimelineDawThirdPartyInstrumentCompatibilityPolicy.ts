import { assessTimelineDawPluginCompatibility, type TimelineDawPluginExecutionPath } from "./TimelineDawPluginCompatibilityPolicy";
import type { TimelinePluginFormat } from "./TimelinePluginProcessingHostEngine";

export type TimelineDawThirdPartyInstrumentCompatibilityReport = ReturnType<typeof assessTimelineDawThirdPartyInstrumentCompatibility>;
export type TimelineDawUnsupportedInstrumentRecoveryAction = "keep-placeholder" | "choose-qualified-replacement" | "use-verified-render" | "remove-instrument-slot";

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
    routingPreserved: true as const,
    midiEventsRemainEditable: true as const,
    instrumentReferencePreserved: status === "held",
    outputBehavior: status === "held" ? "silent-no-generated-audio" as const : input.executionPath === "rendered-exchange" ? "verified-render-only" as const : "qualified-live-output" as const,
    recoveryActions: status === "held" ? [
      { action: "keep-placeholder" as const, label: "Keep silent placeholder", result: "Retain the instrument identity, preset reference, routing, and editable MIDI without generating audio." },
      { action: "choose-qualified-replacement" as const, label: "Choose qualified replacement", result: "Map the preserved MIDI to a separately qualified instrument after musician review." },
      { action: "use-verified-render" as const, label: "Use verified render", result: "Audition a fingerprint-verified offline render while keeping the MIDI source editable." },
      { action: "remove-instrument-slot" as const, label: "Remove instrument slot", result: "Remove only the unsupported slot after confirmation; keep MIDI, routing history, and source material." },
    ] : [],
    safeMode: status === "held" ? "silent-placeholder" as const : input.executionPath === "rendered-exchange" ? "verified-render" as const : "active" as const,
    warning: status === "held"
      ? "Instrument activation is blocked. Keep a silent placeholder, preserve the MIDI clip and instrument reference, and continue with a qualified replacement or verified render."
      : input.executionPath === "rendered-exchange"
        ? "This is verified offline rendered audio; the editable MIDI source remains preserved."
        : "This instrument path has the required compatibility and MIDI-performance evidence.",
  };
}

export function createTimelineDawUnsupportedInstrumentRecoveryPlan(input: {
  report: TimelineDawThirdPartyInstrumentCompatibilityReport;
  action: TimelineDawUnsupportedInstrumentRecoveryAction;
  musicianConfirmed: boolean;
}) {
  if (input.report.status !== "held") throw new Error("Recovery choices apply only to a held instrument.");
  const choice = input.report.recoveryActions.find((item) => item.action === input.action);
  if (!choice) throw new Error("Choose a supported instrument recovery action.");
  if (input.action === "remove-instrument-slot" && !input.musicianConfirmed) throw new Error("Confirm removal of the instrument slot. MIDI and source material will remain preserved.");
  return { ...choice, status: "held-for-musician-review" as const, activationAllowed: false as const, sourceMidiPreserved: true as const, sourceAudioPreserved: true as const, routingPreserved: true as const };
}
